#!/usr/bin/env python
'''Generic dimension metadata generator script to be used in the pipeline when
no customization is needed.

Dimension metadata are constant values that should always be associated with a
dimension (like FacilityLat, FacilityLon) and should be repeated with each row
in the Druid so that they are available during querying. Metadata values can
come from a canonical source (like lat/lon being stored in the
facility_mapped.csv canonical mapping file) or they can be provided by a
pipeline source.

If metadata is provided by a canonical source, it can use the
--canonical_mapping argument to directly merge metadata values in.

If metadata is provided by a pipeline source, it will first need to go through
dimension matching before it can be merged in. In this case, you can use the
--input_metadata_files argument which allows passing of the metadata file and
the result csv from dimension mapping. A common example of this is the usage of
a Master Facility Registry (MFR) to provide lat/lon and facility type metadata
for each Facility that a site has. The MFR's facilities must still be matched
with our canonical list to standardize the hierarchy and overcome errors in the
source.

The metadata columns for each file will be inferred from the header and list of
possible dimensions for the current site. They do not need to be specified on
the command line.

Example usage (see flag help below for full definition):
  ./generate_metadata.py \
    --canonical_mapping \
        "RegionName:${path_to_region_mapping_csv}" \
        "ZoneName:${path_to_zone_mapping_csv}" \
    --input_metadata_files \
        "FacilityName:${path_to_facility_metadata}:${path_to_mapped_locations}"
    --output_metadata_path="${PIPELINE_OUT_DIR}/metadata_mapped.csv"
'''
import sys

from pylib.base.flags import Flags

from config.aggregation import DIMENSION_ID_MAP
from config.datatypes import DimensionFactoryType
from config.druid import DIMENSIONS
from data.pipeline.datatypes.generate_metadata import (
    HierarchicalDimensionMetadataGenerator,
)
from log import LOG
from util.file.unicode_csv import UnicodeDictReader


def _split_argument(argument_str):
    '''Split a colon separated argument string into its pieces. The first
    argument should always be a valid dimension
    '''
    num_pieces = argument_str.count(':')
    assert num_pieces, 'Malformed argument. Argument must contain ":" separator: %s' % (
        argument_str
    )
    pieces = [p.strip() for p in argument_str.split(':')]
    dimension = pieces[0]
    assert dimension in DimensionFactoryType.matched_dimensions, (
        'Invalid dimension specified. Argument: %s\tDimension: %s'
        % (argument_str, dimension)
    )
    return pieces


def deduce_metadata_dimensions(filename):
    '''Determine the metadata dimensions this file stores by comparing the CSV
    header fields to the possible dimensions for this site.
    '''
    output = []
    with open(filename) as input_file:
        reader = UnicodeDictReader(input_file)
        for field in reader.fieldnames:
            if (
                field in DIMENSIONS
                and field not in DimensionFactoryType.matched_dimensions
            ):
                output.append(field)
    return output


def parse_canonical_mapping_arg(canonical_mapping_arg):
    '''Unpack the canonical mapping argument into the dimension, file, and list
    of metadata columns. The output will be ordered from least to most granular
    dimension to ensure dimension IDs are generated in a logical order.
    '''
    dimension_data = {}
    for arg in canonical_mapping_arg:
        (dimension, canonical_filename) = _split_argument(arg)

        assert dimension not in dimension_data, (
            'Dimension specified twice: %s' % dimension
        )

        # It is ok for the canonical file to not store metadata. Eventually,
        # canonical files will not store metadata so this will be unnecessary.
        metadata_dimensions = deduce_metadata_dimensions(canonical_filename)
        dimension_data[dimension] = (canonical_filename, metadata_dimensions)

    # Order the output list from least granular dimension to most granular.
    output = []
    for dimension in DimensionFactoryType.hierarchical_dimensions:
        assert dimension in dimension_data, (
            'Missing canonical mapping data for dimension: %s' % dimension
        )
        (canonical_filename, metadata_dimensions) = dimension_data[dimension]
        output.append((dimension, canonical_filename, metadata_dimensions))
    return output


def parse_metadata_arg(metadata_arg):
    '''Unpack the metadata argument into the dimension, metadata file, and
    metadata's canonical mapping file for each argument. Since the metadata file
    is generated before matching, the metadata source's mapped_locations.csv
    must always be provided to ensure canonical dimensions can be found for each
    metadata row. The output will follow the order of the arguments as they are
    passed in.
    '''
    output = []
    for arg in metadata_arg:
        (dimension, metadata_filename, mapping_filename) = _split_argument(arg)

        # Todo (Kenneth) this assertion is already done in `_split_argument`
        assert dimension in DimensionFactoryType.hierarchical_dimensions, (
            'Cannot add metadata for dimension that does not go through '
            'matching: %s' % dimension
        )

        # Unlike canonical mapping files, metadata files must *always* store at
        # least one metadata dimension.
        metadata_dimensions = deduce_metadata_dimensions(metadata_filename)
        assert (
            metadata_dimensions
        ), 'No metadata dimensions found in file header: %s' % (metadata_filename)

        row = (dimension, metadata_filename, mapping_filename, metadata_dimensions)
        output.append(row)
    return output


def main():
    Flags.PARSER.add_argument(
        '--canonical_mapping',
        nargs='*',
        type=str,
        required=True,
        help='List of dimensions and canonical mapping files to use. Colon '
        'separated, the pattern is: Dimension:mapping_csv_path',
    )
    Flags.PARSER.add_argument(
        '--metadata_files',
        nargs='*',
        type=str,
        required=False,
        default=[],
        help='List of metadata files to ingest. Each file can only provide '
        'metadata at a single dimension level. The argument is colon '
        'separated, and the pattern is: '
        'Dimension:metadata_csv_path:mapped_locations_for_metadata_source',
    )
    Flags.PARSER.add_argument(
        '--output_metadata_map',
        type=str,
        required=True,
        help='Location of outputted metadata mapping',
    )
    Flags.InitArgs()

    LOG.info('Beginning metadata generation')
    metadata_generator = HierarchicalDimensionMetadataGenerator(
        DimensionFactoryType.hierarchical_dimensions, DIMENSION_ID_MAP
    )

    # Load metadata from canonical files first. This will establish all possible
    # canonical values in the metadata generator, attach dimension IDs for each
    # combination, and insert any metadata that is stored in the canonical
    # file (not required).
    canonical_data = parse_canonical_mapping_arg(Flags.ARGS.canonical_mapping)
    for (dimension, canonical_file, metadata_dimensions) in canonical_data:
        LOG.info(
            'Processing canonical metadata. Dimension: %s\t'
            'Metadata dimensions: %s\tCanonical file: %s',
            dimension,
            canonical_file,
            metadata_dimensions,
        )
        metadata_generator.process_file(
            canonical_file, dimension, metadata_columns=metadata_dimensions
        )

    # Load custom metadata last. Overwrite any metadata found for a given
    # canonical location since the metadata files are considered to be higher
    # quality than the canonical files.
    additional_metadata = parse_metadata_arg(Flags.ARGS.metadata_files)
    for row in additional_metadata:
        (dimension, metadata_file, mapping_file, metadata_dimensions) = row
        LOG.info(
            'Processing metadata. Dimension: %s\tMetadata dimensions: %s\t'
            'Metadata file: %s',
            dimension,
            metadata_dimensions,
            metadata_file,
        )
        collector = DimensionFactoryType.create_metadata_collector(
            mapped_locations_filename=mapping_file
        )
        metadata_generator.process_file(
            metadata_file,
            dimension,
            canonical_collector=collector,
            allow_overwrite=True,
            metadata_columns=metadata_dimensions,
        )

    LOG.info('Writing generated metadata')
    metadata_generator.write_metadata(Flags.ARGS.output_metadata_map)
    LOG.info('Finished metadata generation')
    return 0


if __name__ == '__main__':
    sys.exit(main())
