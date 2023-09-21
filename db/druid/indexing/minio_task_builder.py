import fnmatch
import os
from typing import List

from util.connections.connection_manager import ConnectionManager


class MinioObject:
    ETag: str = ''
    Key: str = ''
    LastModified: str = ''
    Size: str = ''
    StorageClass: str = ''

    def __init__(self, bucket_name: str, **kwargs):
        self.bucket_name = bucket_name
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def from_list(cls, bucket_name: str, items: List[dict]):
        return [cls(bucket_name, **item) for item in items]

    @property
    def uri(self):
        return f"s3://{self.bucket_name}/{self.Key}"

    @property
    def folder(self):
        folder_name = self.Key.split('/', maxsplit=1)[0]
        return f"s3://{self.bucket_name}/{folder_name}"


def build_files_to_index(input_paths: str, deployment_name: str) -> List[MinioObject]:
    object_list = []
    for input_path in input_paths:
        path_comps = input_path.split('/')
        bucket_name = path_comps[1]
        prefix = path_comps[2]
        pattern = '/'.join(path_comps[2:])
        bucket = ConnectionManager(
            host='s3', deployment_name=deployment_name, bucket_name=bucket_name
        )
        objects = MinioObject.from_list(
            bucket_name, bucket.get_object_list_for_bucket(prefix)
        )
        object_list += [
            _object for _object in objects if fnmatch.fnmatch(_object.Key, pattern)
        ]

    return object_list


def store_task_hash(
    files_to_index: List[MinioObject],
    datasource_name: str,
    datasource_version: str,
    directory: str,
):
    hash_file_name = os.path.join(
        directory, f'{datasource_name}_{datasource_version}.hash'
    )
    with open(hash_file_name, 'w') as hash_file:

        hash_file.write('\n'.join(sorted(f.ETag for f in files_to_index)))
