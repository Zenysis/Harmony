import csv
import json
from datetime import datetime


DATE_FORMAT = '%Y%m%d.%H%M%S'


def backup_query_models(
    transaction, query_model_name_mapping, csv_field_name_mapping, backup_file=None
):
    date = datetime.now().strftime(DATE_FORMAT)
    for name, model in query_model_name_mapping.items():
        # Backup current state of relevant query models to input backup file if
        # specified by user, otherewise default to
        # `scripts/data_catalog/backup_csv/`.
        backup_filepath = (
            backup_file or f'scripts/data_catalog/backup_csv/{name}/{name}_{date}.csv'
        )
        db_objects = transaction.find_all_by_fields(model, {})
        with open(backup_filepath, 'w') as field_file:
            csv_field_names = csv_field_name_mapping[name]
            writer = csv.DictWriter(field_file, fieldnames=csv_field_names)
            writer.writeheader()
            for obj in db_objects:
                fields_dict = obj.__dict__
                row = {
                    field_name: json.dumps(fields_dict[field_name], sort_keys=True)
                    if isinstance(field_name, dict)
                    else fields_dict[field_name]
                    for field_name in csv_field_names
                }
                writer.writerow(row)
