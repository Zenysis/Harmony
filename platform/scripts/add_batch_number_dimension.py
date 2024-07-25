#!/usr/bin/env python
'''
This script takes in the directory containing the processed rows of the
deduplicated zero dose children and creates batches for each vaccinator
using the CHW latitude and longitude. It produces a csv file of each
patient id mapped to a batch number.
'''

import csv
import json
import math
import sys
import time
from itertools import groupby
from typing import Any, Dict, List, Tuple
from pylib.base.flags import Flags

from log import LOG
from util.file.compression.pigz import PigzReader
from util.file.file_config import FilePattern
from util.file.shard import ShardReader


BATCH_SIZE = 20

# Nearby Community Health Worker distance threshold in kilometers
NEARBY_CHW_DISTANCE_THRESHOLD = 1

# Earth's radius in kilometers
EARTH_RADIUS = 6371


def haversine_dist(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    '''Calculates the distance(in km) between two coordinates(lat, lon) using
    the haversine formula.

    a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
    c = 2 ⋅ atan2( √a, √(1−a) )
    d = R ⋅ c
    where 	φ is latitude, λ is longitude, R is earth’s radius (mean radius = 6,371km);
    note that angles need to be in radians to pass to trig functions!
    '''
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    lon_diff = lon1 - lon2
    lat_diff = lat1 - lat2
    a = (
        math.sin(lat_diff / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(lon_diff / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS * c


def get_nearby_chws(
    chw_coords: Tuple[str, str], chw_coordinates: List[Tuple[str, str]]
):
    '''
    Takes the coordinates of a CHW and a list of other CHW coordinates
    and returns a filtered list of nearby CHWs.
    '''

    results = []
    lat, lon = chw_coords
    for coord in chw_coordinates:
        lat1, lon1 = coord
        if lat and lon and lat1 and lon1:
            if (
                haversine_dist(float(lat), float(lon), float(lat1), float(lon1))
                <= NEARBY_CHW_DISTANCE_THRESHOLD
            ):
                results.append(coord)
    return results


def batch_extra_patients(extra_patients: Dict[Any, Any], batch_count: int) -> List[Any]:
    '''Takes groups of extra patients for different CHWs that are smaller than
    and batches them with those in nearby CHWs with the same vaccinator
    '''
    result = []
    combined_nearby_chws_batches_count = 0
    incomplete_batches_count = 0
    chw_coords = list(extra_patients.keys())
    for coord in chw_coords:
        if not coord in extra_patients:
            continue

        new_patients = extra_patients.pop(coord)
        if not new_patients:
            continue
        patients_count = len(new_patients)
        nearest_chws = get_nearby_chws(coord, list(extra_patients.keys()))
        counter = 0
        while patients_count < BATCH_SIZE and counter < len(nearest_chws):
            space_in_batch = BATCH_SIZE - patients_count
            nearest_chw = nearest_chws[counter]
            nearest_chw_patients = extra_patients.pop(nearest_chw, [])
            new_patients.extend(nearest_chw_patients[:space_in_batch])
            combined_nearby_chws_batches_count += 1

            counter += 1
            patients_count = len(new_patients)
            if nearest_chw_patients[space_in_batch:]:
                extra_patients[nearest_chw] = nearest_chw_patients[space_in_batch:]
        batch_count += 1
        batched_patients = add_batch_number(new_patients, batch_count)
        result.extend(batched_patients)

        if len(batched_patients) < BATCH_SIZE:
            incomplete_batches_count += 1

    return result, combined_nearby_chws_batches_count, incomplete_batches_count


def add_batch_number(patients: List[Any], batch_count: int) -> List[Any]:
    new_patients = []
    for patient in patients:
        new_patients.append(
            {
                'PatientID': patient['PatientID'],
                'BatchNumber': f'Batch {batch_count}',
            }
        )
    return new_patients


def patient_chunks(lst: List[Any], size: int):
    """Yield successive n-sized chunks from list."""
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


def main():
    '''Group patient ids in a given CHW or near CHWs into batches and assign them
    a batch number.

    To run:
        scripts/add_batch_number_dimension.py
          --input_file_pattern {SOME_DIR}/processed_rows.#.json.gz
          --output_file {SOME_OUTPUT_FILE}
          --campaigns '14 SNID Jun-21', '15 SNID Aug-21'
    '''
    Flags.PARSER.add_argument(
        '-f',
        '--input_file_pattern',
        type=str,
        required=True,
        help='Input file pattern of zipped json files',
    )
    Flags.PARSER.add_argument(
        '-f',
        '--output_file',
        type=str,
        required=True,
        help='The output csv file to write output to',
    )

    Flags.PARSER.add_argument(
        '-t',
        '--campaigns',
        type=str,
        nargs='*',
        required=False,
        help='A list of campaigns to produce batches for e.g 14 SNID Jun-21, 15 SNID Aug-21',
    )

    Flags.InitArgs()
    output_file = Flags.ARGS.output_file
    campaigns = Flags.ARGS.campaigns

    LOG.info('Reading patients from input file')
    start_time = time.time()

    all_batched_patients = []

    input_file_pattern = FilePattern(Flags.ARGS.input_file_pattern)
    with ShardReader(input_file_pattern, PigzReader) as data_file:

        if campaigns:
            all_patients = []
            for line in data_file:
                patient_record = json.loads(line)
                if (
                    patient_record['Campaign'] in campaigns
                    and patient_record['ZDStatus'] == 'Not Covered'
                ):
                    all_patients.append(patient_record)
            LOG.info(
                'Finished reading patients: Found %s patients for the campaigns %s',
                len(all_patients),
                campaigns,
            )
        else:
            all_patients = [json.loads(line) for line in data_file]
            LOG.info('Finished reading patients: %s found', len(all_patients))

        sorted_patients = sorted(
            all_patients,
            key=lambda x: (
                x['ZDVaccinatorName'],
                x['CommunityHealthWorkerLat'],
                x['CommunityHealthWorkerLon'],
            ),
        )

        LOG.info('Grouping patients per vaccinator per (chw lat/lon)')
        for vaccinator, patients_for_vaccinator in groupby(
            sorted_patients, key=lambda item: item['ZDVaccinatorName'].strip()
        ):
            patients_for_vaccinator = list(patients_for_vaccinator)
            batch_count = 0
            batch_count_with_in_similar_chw = 0

            # group patients by CHW lat and lon
            extra_patients = {}
            for coord, group in groupby(
                patients_for_vaccinator,
                key=lambda x: (
                    x['CommunityHealthWorkerLat'],
                    x['CommunityHealthWorkerLon'],
                ),
            ):
                for patient_batch in patient_chunks(list(group), BATCH_SIZE):
                    if len(patient_batch) == BATCH_SIZE:
                        # NOTE: We split the patients for a CHW into batches of 20.
                        # Any left over get added to extra_patients to be grouped
                        # with nearby CHWs
                        batch_count_with_in_similar_chw += 1
                        batch_count += 1
                        batched_patients = add_batch_number(patient_batch, batch_count)
                        all_batched_patients.extend(batched_patients)
                    else:
                        extra_patients[coord] = list(patient_batch)
            (
                batched_extra_patients,
                combined_nearby_chws_batches_count,
                incomplete_batches_count,
            ) = batch_extra_patients(extra_patients, batch_count)
            all_batched_patients.extend(batched_extra_patients)

            LOG.info(
                'Produced %s batch(es) for vaccinator %s with the same CHWs',
                batch_count_with_in_similar_chw,
                vaccinator,
            )
            LOG.info(
                'Produced %s batch(es) for vaccinator %s using nearby CHWs',
                combined_nearby_chws_batches_count,
                vaccinator,
            )
            LOG.info(
                'Produced %s batch(es) for vaccinator %s with less than %s patients\n',
                incomplete_batches_count,
                vaccinator,
                BATCH_SIZE,
            )

        processed_rows_count = len(sorted_patients)
        output_rows_count = len(all_batched_patients)
        assert processed_rows_count == output_rows_count, (
            'Expecting the number of processed rows: %s'
            ' to equal number of output rows: %s'
            % (processed_rows_count, output_rows_count)
        )

        with open(output_file, 'w+') as out:
            csv_writer = csv.DictWriter(out, ['PatientID', 'BatchNumber'])
            csv_writer.writeheader()
            csv_writer.writerows(all_batched_patients)

        execution_time = time.time() - start_time
        LOG.info(
            'Batched %d rows in %s seconds', output_rows_count, str(execution_time)
        )
        LOG.info('Finished batching entities successfully')


if __name__ == '__main__':
    sys.exit(main())
