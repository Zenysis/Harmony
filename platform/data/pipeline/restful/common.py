'''Common functions and constants for the restful module'''
import json
from datetime import datetime
from typing import Dict, List
from urllib.parse import urlparse, parse_qsl

DEFAULT_MAX_CONCURRENT_REQUESTS = 5
DEFAULT_TIMEOUT = 60

DATE_FORMAT = "%Y-%m-%d"

ENCODING = "utf-8"


def split_list(input_list: List[str], items_per_sublist: int) -> List[List[str]]:
    '''Slip list in to sublists of a given size'''
    return [
        input_list[i : i + items_per_sublist]
        for i in range(0, len(input_list), items_per_sublist)
    ]


def load_last_updated_timestamps(last_updated_path: str) -> Dict:
    '''Load last updated timestamps from a file'''
    try:
        with open(last_updated_path, "rt", encoding=ENCODING) as input_file:
            return json.load(input_file)
    except FileNotFoundError:
        return {}


def update_last_updated_timestamps(
    response, last_updated_timestamps: dict, request_key: str
):
    '''Update last updated timestamps from a response'''
    dataset = dict(parse_qsl(urlparse(str(response.request.url)).query)).get(
        request_key
    )
    if dataset:
        last_updated_timestamps[dataset] = datetime.now().strftime(DATE_FORMAT)


def save_last_updated_timestamps(
    last_updated_path: str, last_updated_timestamps: Dict[str, str]
):
    '''Save last updated timestamps to a file'''
    with open(last_updated_path, "wt", encoding=ENCODING) as output_file:
        json.dump(last_updated_timestamps, output_file, indent=4)
