from pylib.base.flags import Flags

COMPRESSION_MAP = {
    '.gz': {'compress': 'gzip -f', 'cat': 'gunzip -c'},
    '.lz4': {'compress': 'lz4 -f --rm', 'cat': 'lz4cat'},
}

CSV_DATA_FORMAT = ".csv"
JSON_DATA_FORMAT = ".json"


def setup_common_flags():
    # Adding this here because of pylint error. Can be improved.
    Flags.PARSER.add_argument(
        "--api_config_filepath",
        type=str,
        required=True,
        help="Location of api config file.",
    )
