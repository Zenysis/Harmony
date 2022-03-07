from builtins import object
import gzip
import json
import os
from typing import Any, Dict, List, Optional, Tuple

import boto3
from flask import current_app

DEFAULT_MINIO_CONFIG_FILEPATH = os.path.expanduser('~/.mc/config.json')
HOST_MAPPING = {'minio': 'zen', 's3': 's3', 'azure': 'azure', 'gcs': 'gcs'}

# This map specifies the default host used for deployments. Only deployments that
# do not use s3 must be specified here, since s3 is the default.
DEPLOYMENT_HOST_MAP = {'rw': 'minio'}

DEFAULT_HOST = 's3'


def _get_connection_values(host: str) -> Tuple[str, str, str]:
    '''Gets endpoint_url, access_key, and secret_access_key from appropriate
    config file. Returns a tuple as (endpoint_url, access_key,
    secret_access_key).
    '''
    host_name = HOST_MAPPING[host]
    with open(DEFAULT_MINIO_CONFIG_FILEPATH, 'r') as minio_config_file:
        whole_minio_config = json.load(minio_config_file)
        version = whole_minio_config['version']
        config_hosts_key = 'aliases' if version == '10' else 'hosts'
        minio_config = whole_minio_config[config_hosts_key][host_name]
        return (
            minio_config['url'],
            minio_config['accessKey'],
            minio_config['secretKey'],
        )


def get_bucket_name(deployment_name: str) -> str:
    '''This function returns the bucket name given a deployment name

    Args
    ----
        deployment_name (str): The name of the deployment
    returns
    -------
        str: The bucket name
    '''
    return f"zenysis-{deployment_name.replace('_', '-')}"


def get_deployment_host(deployment_name: str) -> str:
    '''This function returns the remote host for deployment_name. See `HOST_MAPPING`
    for the host options. In almost all cases, the host is s3.
    '''
    return DEPLOYMENT_HOST_MAP.get(deployment_name, DEFAULT_HOST)


class ConnectionManager:
    '''Class that handles connections with our Minio and S3 instances. Creates
    a cached boto3 connection.

    Currently, only a handful of functions are implemented.

    See https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Client
    for documentation on response types for boto3 client methods.
    '''

    # TODO(toshi): Add error handling

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
            self.deployment_name = current_app.zen_config.general.DEPLOYMENT_NAME
        else:
            self.deployment_name = deployment_name

        self.host = host or get_deployment_host(self.deployment_name)

        (endpoint_url, access_key, secret_access_key) = _get_connection_values(
            self.host
        )
        # pylint: disable=C0103

        self.client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_access_key,
        )
        self.bucket_name = bucket_name or get_bucket_name(self.deployment_name)

    def get_most_recent_date_for_prefix(self, prefix: str) -> str:
        date_list = self.client.list_objects_v2(
            Bucket=self.bucket_name, Prefix=prefix, Delimiter='/'
        )['CommonPrefixes']
        return max([entry['Prefix'] for entry in date_list])

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
        NOTE(toshi): While a link is produced for minio connections, link will
        not be able to be accessed outside our corp network.
        '''
        return self.client.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': self.bucket_name, 'Key': key},
            ExpiresIn=expiration_time,
        )

    def upload_file(self, filename: str, key: str) -> None:
        with open(filename, 'rb') as data:
            self.client.upload_fileobj(data, self.bucket_name, key)

    def write_object(self, key: str, file_contents: Any) -> None:
        '''Write data to a file in the specified bucket.

        file_contents is a "bytes or seekable file-like object" according to
        https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Client.put_object
        '''
        self.client.put_object(Body=file_contents, Bucket=self.bucket_name, Key=key)
