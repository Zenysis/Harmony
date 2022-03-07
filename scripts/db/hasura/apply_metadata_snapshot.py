#!/usr/bin/env python
from glob import glob
import os
import sys
import yaml

import requests

from pylib.base.flags import Flags
from pylib.file.file_utils import FileUtils

from log import LOG

METADATA_FOLDER = FileUtils.GetAbsPathForFile('graphql/hasura/metadata/versions/latest')


def build_metadata_dict():
    '''Convert the YAML metadata files exported using the hasura command line tools
    (how we export it in development) into a dictionary. This dictionary matches the
    format required by the Hasura metadata API endpoints.
    '''
    output = {}

    # Loop over each metadata file and add it to the combined output dictionary.
    for metadata_file in sorted(glob(f'{METADATA_FOLDER}/*.yaml')):
        with open(metadata_file) as input_file:
            data = yaml.load(input_file, Loader=yaml.Loader)

            # If the data is a dict, then we should merge it with the output object
            # directly. The keys in the data dictionary should be top level keys in the
            # output dict.
            if isinstance(data, dict):
                output.update(data)
                continue

            # All other types should be assigned to the output dictionary using the
            # filename (without the .yaml suffix) as the key.
            key = os.path.splitext(os.path.basename(metadata_file))[0]
            output[key] = data
    return output


def main():
    Flags.PARSER.add_argument(
        '--hasura_host', type=str, required=True, help='Hasura host'
    )
    Flags.PARSER.add_argument(
        '--hasura_admin_secret', type=str, required=False, help='Hasura host'
    )
    Flags.InitArgs()

    LOG.info('Starting hasura metadata processing.')

    hasura_host = Flags.ARGS.hasura_host
    hasura_metadata_api_endpoint = f'{hasura_host}/v1/query'
    hasura_admin_secret = Flags.ARGS.hasura_admin_secret
    headers = {}
    if hasura_admin_secret:
        headers.update({'X-Hasura-Admin-Secret': hasura_admin_secret})

    data = build_metadata_dict()
    try:
        res = requests.post(
            hasura_metadata_api_endpoint,
            headers=headers,
            json={'type': 'replace_metadata', 'args': data},
        )
        if res.status_code != 200:
            # pylint: disable=line-too-long
            LOG.error(
                'Failed to apply metadata to %s with status code: %s',
                hasura_metadata_api_endpoint,
                res.status_code,
            )
        else:
            LOG.info(
                'Successfully applied metadata to %s', hasura_metadata_api_endpoint
            )
    except requests.exceptions.ConnectionError:
        LOG.error(
            'Could not connect to the hasura host: %s', hasura_metadata_api_endpoint
        )
    except (requests.exceptions.InvalidSchema, requests.exceptions.InvalidURL) as error:
        LOG.error('Could not apply metadata due to %s', error.__str__())

    LOG.info('Done!')


if __name__ == '__main__':
    sys.exit(main())
