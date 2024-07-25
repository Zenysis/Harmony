# A common SQL practice for storing a hierarchy of common entities is to
# store each entity once in a table and include a reference key to its
# parent. This helps with data integrity in the DB, but makes it annoying
# to denormalize the table and have the full hierarchy on a single line
def flatten_self_referential_table(
    rows, id_field, type_field, parent_id_field, data_field, allow_overwriting=False
):
    data = {}
    output = {}
    for row in rows:
        data[row[id_field]] = row

    for row_id, row in data.items():
        merged = {}
        cur_row = row
        # Traverse upward using parent_id and set the parent values
        # in the base row along the way
        while cur_row:
            row_type = cur_row[type_field]
            assert row_type not in merged or allow_overwriting, (
                'Parent type has already been seen for this row! '
                'Current type: %s\tRow: %s' % (row_type, row)
            )
            merged[row_type] = cur_row[data_field].strip()
            cur_row = data.get(cur_row[parent_id_field])

        output[row_id] = merged
    return output
