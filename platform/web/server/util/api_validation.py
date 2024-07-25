from flask_potion.exceptions import ValidationError
from jsonschema import ValidationError as JsonSchemaValidationError


class GenericValidationError(ValidationError):
    def __init__(self, errors_dict):
        json_schema_errors = []
        for field, message in errors_dict.items():
            json_schema_error = JsonSchemaValidationError(
                message=message,
                validator=field,
                validator_value=message,
                schema_path=(field,),
            )
            json_schema_errors.append(json_schema_error)

        super().__init__(errors=json_schema_errors)
