from flask_potion import fields

SOURCE_ID_PATTERN = r'^[a-z0-9_]+$'
SOURCE_ID_SCHEMA = fields.String(pattern=SOURCE_ID_PATTERN)

FILE_SUMMARY_SCHEMA = fields.Object(
    {
        'sourceId': fields.String(),
        'columnMapping': fields.Any(),
        'filePath': fields.String(),
        'filePreview': fields.Array(fields.Any()),
    }
)

DATAPREP_UPLOAD_SCHEMA = fields.Object(
    {
        'missingHeaders': fields.List(fields.String()),
        'extraHeaders': fields.List(fields.String()),
        'orderCorrect': fields.Boolean(),
        'filePath': fields.String(),
    }
)

DATAPREP_INPUT_FILE_SCHEMA = fields.Object(
    {
        'lastModified': fields.String(),
        'userFileName': fields.String(),
    }
)

DATAPREP_SETUP_SCHEMA = fields.Object(
    {
        'dataprepExpectedColumns': fields.Array(fields.String()),
        'isFlowParameterized': fields.Boolean(),
        'uploadedFiles': fields.Array(DATAPREP_INPUT_FILE_SCHEMA),
    }
)
