from data.pipeline.datatypes.matching_row import MatchingRow


def build_mapped_locations(mapped_reader, debug_class):
    '''For each canonical match, store the canonical row mapped to the
    original location ID.

    Takes in a DictReader and a debug class.

    DictReader: The mapped_locations information.
    debug_class: A class that contains the appropriate mapping fields.
    '''
    mapped_locations = {}
    for row in mapped_reader:
        matching_row = MatchingRow.create_from_dict(row, debug_class)
        original_id = matching_row.get_original_row().mapping_id
        # TODO(stephen): Figure out how to handle locations that never had a
        # canonical match created (like regional facilities).
        # assert original_id not in mapped_locations, \
        if original_id in mapped_locations:
            match_id = matching_row.get_matched_row().mapping_id
            stored_row = mapped_locations[original_id]
            stored_match_id = stored_row.get_matched_row().mapping_id
            assert match_id == stored_match_id, (
                'Unable to reconcile different matching rows. '
                'Stored row:\n%s\nNew row:%s' % (stored_row, matching_row)
            )
            continue
        mapped_locations[original_id] = matching_row
    return mapped_locations
