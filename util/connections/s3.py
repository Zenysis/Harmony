from builtins import object
import json
import os

import boto3

DEFAULT_MINIO_CONFIG_FILEPATH = os.path.expanduser('~/.mc/config.json')
HOST_MAPPING = {'minio': 'zen', 's3': 's3'}


def _get_connection_values(host):
    '''Gets endpoint_url, access_key, and secret_access_key from appropriate
    config file. Returns a tuple as (endpoint_url, access_key,
    secret_access_key).
    '''
    host_name = HOST_MAPPING[host]
    with open(DEFAULT_MINIO_CONFIG_FILEPATH, 'r') as minio_config_file:
        whole_minio_config = json.load(minio_config_file)
        minio_config = whole_minio_config['hosts'][host_name]
        return (
            minio_config['url'],
            minio_config['accessKey'],
            minio_config['secretKey'],
        )


class S3ConnectionManager(object):
    '''Class that handles connections with our Minio and S3 instances. Creates
    a cached S3 connection.

    Currently, only a handful of functions are implemented.
    '''

    # TODO(toshi): Add error handling

    def __init__(self, host):
        '''Sets internal connection client. Current host options are `s3` and
        `minio`.
        '''
        (endpoint_url, access_key, secret_access_key) = _get_connection_values(host)
        # pylint: disable=C0103
        self.client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_access_key,
        )

    def get_most_recent_date_for_prefix(self, bucket_name, prefix):
        date_list = self.client.list_objects_v2(
            Bucket=bucket_name, Prefix=prefix, Delimiter='/'
        )['CommonPrefixes']
        return max([entry['Prefix'] for entry in date_list])

    def get_object_list_for_bucket(self, bucket_name, prefix):
        object_list_response = self.client.list_objects_v2(
            Bucket=bucket_name, Prefix=prefix
        )
        return object_list_response['Contents']

    def get_file_content_from_key(self, bucket, key):
        obj = self.client.get_object(Bucket=bucket, Key=key)
        return obj['Body'].read()

    def does_key_exist_for_bucket(self, bucket_name, key):
        '''Returns if a particular key exists for a bucket
        '''
        res = self.client.list_objects_v2(Bucket=bucket_name, Prefix=key)
        for obj in res.get('Contents', []):
            if obj['Key'] == key:
                return True

        return False

    def generate_url_for_key(self, bucket_name, key, expiration_time):
        '''Generate a URL for document for `expiration_time` number of seconds.
        NOTE(toshi): While a link is produced for minio connections, link will
        not be able to be accessed outside our corp network.
        '''
        return self.client.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': bucket_name, 'Key': key},
            ExpiresIn=expiration_time,
        )
