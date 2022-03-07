from config.aggregation import DIMENSION_ID_MAP
from data.pipeline.datatypes.matching_row import MatchingRow


def build_canonical_mapping(rows, base_row):
    output = {}
    for row in rows:
        mapping_row = MatchingRow.create_from_dict(row, base_row)
        mapping_id = mapping_row.get_original_row().mapping_id
        row_data = mapping_row.get_matched_row().key

        # Copy over additional metadata, like location IDs, that aren't
        # part of the matching row
        # TODO(stephen): When we are able to join dimension IDs to their
        # metadata post-query, this should be changed to only store
        # dimension IDs
        for key in DIMENSION_ID_MAP.values():
            dimension_id = row.get(key)
            if dimension_id and not row_data[key]:
                row_data[key] = dimension_id
        output[mapping_id] = row_data
    return output
