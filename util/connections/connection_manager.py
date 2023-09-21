from enum import Enum
import gzip
import json
import os
from typing import Any, Dict, List, Optional, Tuple

import boto3
from config.general import DEPLOYMENT_NAME, OBJECT_STORAGE_ALIAS

from log import LOG

DEFAULT_MINIO_CONFIG_FILEPATH = os.path.expanduser('~/.mc/config.json')

FILE_EXPIRATION_TAG_KEY = 'LifecycleExpires'


class FileExpiration(Enum):
    ONE_DAY = 0
    SEVEN_DAYS = 1


def get_connection_values(host: str = OBJECT_STORAGE_ALIAS) -> Tuple[str, str, str]:
    '''Gets endpoint_url, access_key, and secret_access_key from appropriate
    config file. Returns a tuple as (endpoint_url, access_key,
    secret_access_key).
    '''
    with open(DEFAULT_MINIO_CONFIG_FILEPATH, 'r') as minio_config_file:
        whole_minio_config = json.load(minio_config_file)
        version = whole_minio_config['version']
        config_hosts_key = 'aliases' if version == '10' else 'hosts'
        minio_config = whole_minio_config[config_hosts_key][host]
        return (
            minio_config['url'],
            minio_config['accessKey'],
            minio_config['secretKey'],
        )


def get_bucket_name(host: str, deployment_name: str) -> str:
    '''This function returns the bucket name given a deployment name

    Args
    ----
        host (str): remote host containing bucket
        deployment_name (str): The name of the deployment
    returns
    -------
        str: The bucket name
    '''
    return f"zenysis-{deployment_name.replace('_', '-')}"


class ConnectionManager:
    '''Class that handles connections with our Minio and S3 instances. Creates
    a cached boto3 connection.

    Currently, only a handful of functions are implemented.

    See https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Client
    for documentation on response types for boto3 client methods.
    '''

    # TODO: Add error handling

    def __init__(
        self,
        host: Optional[str] = None,
        deployment_name: Optional[str] = None,
        bucket_name: Optional[str] = None,
    ) -> None:
        '''Sets internal connection client.

        If this code is run on the server, none of the values are necessary, and the default value
        for the deployment from the current app will be used to derive the other values.

        Otherwise, either the deployment_name must be passed in, or both the host and the
        bucket_name must be passed in.
        '''
        # If either the host or the bucket_name has not been specified, then we need
        # the deployment name in order to get those values.
        if deployment_name is None and (host is None or bucket_name is None):
            self.deployment_name = DEPLOYMENT_NAME
        else:
            self.deployment_name = deployment_name

        self.host = host or OBJECT_STORAGE_ALIAS

        (endpoint_url, access_key, secret_access_key) = get_connection_values(self.host)
        # pylint: disable=C0103
        self.client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_access_key,
        )
        self.bucket_name = bucket_name or get_bucket_name(
            self.host, self.deployment_name
        )

    def get_most_recent_date_for_prefix(self, prefix: str) -> str:
        date_list = self.client.list_objects_v2(
            Bucket=self.bucket_name, Prefix=prefix, Delimiter='/'
        )['CommonPrefixes']
        return max(entry['Prefix'] for entry in date_list)

    def get_object(self, object_path: str) -> Dict[str, Any]:
        return self.client.get_object(Bucket=self.bucket_name, Key=object_path)

    def get_folder_list_for_bucket(self, prefix: str) -> Dict[str, Any]:
        return self.client.list_objects(
            Bucket=self.bucket_name, Prefix=prefix, Delimiter='/'
        )

    def get_object_list_for_bucket(self, prefix: str) -> List[Dict[str, Any]]:
        paginator = self.client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=self.bucket_name, Prefix=prefix)
        contents = []
        for page in pages:
            contents.extend(page['Contents'])
        return contents

    def get_file_content_from_key(self, key: str) -> bytes:
        obj = self.client.get_object(Bucket=self.bucket_name, Key=key)
        return obj['Body'].read()

    def get_compressed_file_content_from_key(self, key: str) -> bytes:
        file_obj = self.get_object(key)
        with gzip.GzipFile(fileobj=file_obj['Body']) as gzipfile:
            content = gzipfile.read()
            return content

    def does_key_exist_for_bucket(self, key: str) -> bool:
        '''Returns if a particular key exists for a bucket'''
        res = self.client.list_objects_v2(Bucket=self.bucket_name, Prefix=key)
        for obj in res.get('Contents', []):
            if obj['Key'] == key:
                return True

        return False

    def generate_url_for_key(self, key: str, expiration_time: int) -> str:
        '''Generate a URL for document for `expiration_time` number of seconds.
        NOTE: While a link is produced for minio connections, link will
        not be able to be accessed outside our corp network.
        '''
        return self.client.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': self.bucket_name, 'Key': key},
            ExpiresIn=expiration_time,
        )

    def upload_file(
        self, filename: str, key: str, expiration: Optional[FileExpiration] = None
    ) -> None:
        # Boto3 doesn't allow temporary files to be defined on a per-file basis. Instead,
        # the buckets have lifecycle policies tied to specific tags. Passing in an
        # expiration here will use those lifecycle policies to delete the file in the
        # specified number of days. The lifecycle policies are not controlled here and to
        # modify them, look at `scripts/set_up_minio_lifecycle_policies.py`.
        extra_args = {}
        if expiration == FileExpiration.ONE_DAY:
            extra_args['Tagging'] = f'{FILE_EXPIRATION_TAG_KEY}=1-day'
        elif expiration == FileExpiration.SEVEN_DAYS:
            extra_args['Tagging'] = f'{FILE_EXPIRATION_TAG_KEY}=7-days'

        self.client.upload_file(filename, self.bucket_name, key, ExtraArgs=extra_args)

    def delete_file(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket_name, Key=key)
        LOG.info('Deleted file "%s" from %s', key, self.bucket_name)

    def delete_files(self, prefix: str) -> None:
        # Due to how S3 is structured, you can't delete a "folder" and instead
        # need to delete all files within the folder.
        objects = [
            {'Key': obj['Key']} for obj in self.get_object_list_for_bucket(prefix)
        ]
        self.client.delete_objects(Bucket=self.bucket_name, Delete={'Objects': objects})
        LOG.info('Deleted folder %s from %s', prefix, self.bucket_name)

    def write_object(self, key: str, file_contents: Any) -> None:
        '''Write data to a file in the specified bucket.

        file_contents is a "bytes or seekable file-like object" according to
        https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Client.put_object
        '''
        self.client.put_object(Body=file_contents, Bucket=self.bucket_name, Key=key)

    def set_file_expiration(
        self, key: str, expiration: Optional[FileExpiration] = None
    ) -> None:
        '''Update the expiration for the provided filepath (key).'''
        # If expiration is None, then the file will be set to never be deleted.
        tag_set = []
        if expiration is not None:
            tag_set = [{'Key': FILE_EXPIRATION_TAG_KEY, 'Value': expiration.value}]

        # This will replace all tags; it will not merge the tags.
        self.client.put_object_tagging(
            Key=key,
            Bucket=self.bucket_name,
            Tagging={'TagSet': tag_set},
        )
