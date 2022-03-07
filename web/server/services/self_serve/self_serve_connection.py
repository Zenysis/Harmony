# mypy: disallow_untyped_defs=True
import os
from typing import List, Optional, TypedDict

import related

from data.pipeline.self_serve.types import SourceConfigType
from util.connections.connection_manager import ConnectionManager


class ColumnNameMappingType(TypedDict):
    input_name: str
    output_name: str


class ConfigJsonType(TypedDict):
    date_column: str
    source: str
    data_filename: str
    dimensions: List[ColumnNameMappingType]
    field: List[ColumnNameMappingType]


class SelfServeConnection:
    '''Handles the connection to remote storage for self serve data upload,
    which stores the uploaded CSVs, config files, and active sources for self serve data upload.
    '''

    def __init__(
        self,
        source_id: str,
        host: Optional[str] = None,
        deployment_name: Optional[str] = None,
    ):
        self.source_id = source_id
        # NOTE(sophie): Allow the deployment_code to be passed in in case we are using
        # this class outside of the application context.
        self.connection_manager = ConnectionManager(
            host=host, deployment_name=deployment_name
        )

        self.active_sources_key = os.path.join('self_serve', 'active_sources.txt')

    def get_file_key(self, filename: str) -> str:
        '''Gets the filepath within a remote bucket for the given source and filename'''
        return os.path.join('self_serve', self.source_id, filename)

    def get_active_sources(self) -> List[str]:
        '''Fetches the active_sources and their bucket key for the deployment.'''
        active_sources = []
        if self.connection_manager.does_key_exist_for_bucket(self.active_sources_key):
            file_content = (
                self.connection_manager.get_file_content_from_key(
                    self.active_sources_key
                )
                .decode('utf-8')
                .strip()
            )
            if file_content:
                active_sources = file_content.split('\n')
        return active_sources

    def add_active_source(self) -> None:
        active_sources = self.get_active_sources()
        if self.source_id not in active_sources:
            active_sources.append(self.source_id)
            self.connection_manager.write_object(
                self.active_sources_key, '\n'.join(active_sources)
            )

    def remove_active_source(self) -> None:
        '''Removes a source from the active sources file in the remote bucket'''
        # TODO(anyone): When we figure out how to delete files from s3, this function should also
        # delete the folder matching the source_id and all of those files.
        active_sources = self.get_active_sources()
        if self.source_id in active_sources:
            active_sources.remove(self.source_id)
            self.connection_manager.write_object(
                self.active_sources_key, '\n'.join(active_sources)
            )

    def upload_data_file(self, filepath: str) -> str:
        '''This function uploads data to s3 and returns the s3 filepath.

        Args
        ----
            filepath (str): Path on server to the file to be uploaded to s3
        returns
        -------
            filename (str): name of file stored in the self_serve/<source_id>/ directory in s3
        '''
        filename = os.path.basename(filepath)
        s3_key = self.get_file_key(filename)
        self.connection_manager.upload_file(filepath, s3_key)
        return filename

    def get_config(self) -> Optional[SourceConfigType]:
        config_key = self.get_file_key('config.json')
        if self.connection_manager.does_key_exist_for_bucket(config_key):
            config_json = self.connection_manager.get_file_content_from_key(
                config_key
            ).decode('utf-8')
            return related.from_json(config_json, SourceConfigType)
        return None

    def update_config(self, config_json: ConfigJsonType) -> None:
        config_key = self.get_file_key('config.json')
        self.connection_manager.write_object(config_key, config_json)

    def get_data_rows(self, file_path: str) -> List[str]:
        '''Gets the source's current csv file data as a list of rows.'''
        file_key = self.get_file_key(file_path)
        return (
            self.connection_manager.get_compressed_file_content_from_key(file_key)
            .decode('utf-8')
            .split('\n')
        )
