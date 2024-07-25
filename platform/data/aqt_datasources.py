def build_data_source(source_id, source_name, source_groups):
    return {
        'id': f'aqt_generated_group__{source_id}',
        'name': source_name,
        'groups': source_groups,
    }
