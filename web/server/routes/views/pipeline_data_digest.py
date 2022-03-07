import csv
from collections import defaultdict
from typing import Dict, DefaultDict

from util.connections.connection_manager import ConnectionManager


def get_digest_object_list(directory: str = ''):
    '''Get the data digest bucket object list for the current deployment
    Args:
        directory [str]: specify a sub-directory of the digest directory
    '''
    digest_prefix = 'digest/'
    conn = ConnectionManager()
    return conn.get_object_list_for_bucket(digest_prefix + directory)


def get_bucket_tree(digest_prefix: str = 'digest/'):
    '''Get the data digest bucket sub folders for the current deployment
    Args:
        directory [str]: specify a sub-directory of the digest directory
    '''
    conn = ConnectionManager()
    folders = conn.get_folder_list_for_bucket(digest_prefix).get('CommonPrefixes', [])
    # {datasource1: {date_1: [{file1: path1, file2: path2}], date2: [{file1: path1, file2: path2}]}}
    tree: DefaultDict[str, DefaultDict[str, DefaultDict[str, str]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(str))
    )
    for folder in folders:
        prefix = folder['Prefix']
        datasource_name = prefix.replace(digest_prefix, '').replace('/', '')
        object_list_response = conn.get_object_list_for_bucket(prefix)
        keys = filter(
            lambda x: len(x) == 4,
            [
                object_response['Key'].split('/')
                for object_response in object_list_response
            ],
        )
        for key in keys:
            if datasource_name != 'mappings':
                _, datasource, date, filename = key
                tree[datasource][date][filename] = '/'.join(key)
    return tree


def get_mapping_files() -> Dict[str, str]:
    '''Get canonical mapping files

    Returns a map of file names: file paths
    '''
    mappings_directory = 'mappings/'
    object_list_response = get_digest_object_list(mappings_directory)
    mappings_files = {}
    for conn_object in object_list_response:
        filename = conn_object['Key'].split('/')[-1]
        file_extension = filename.split('.')[-1]
        if file_extension == 'csv':
            mappings_files[filename] = conn_object['Key']
    return mappings_files


def get_object(file_key):
    conn = ConnectionManager()
    output = conn.get_file_content_from_key(file_key).decode('utf-8').split('\n')

    return list(csv.reader(output))
