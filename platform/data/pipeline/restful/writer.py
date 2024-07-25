'''This module contains classes for writing data from a response to a file'''
from typing import Union

import httpx
import requests

from util.file.ambiguous_file import AmbiguousFile


class ResponseWriter:
    '''This class writes data from a response to a file'''

    def __init__(
        self,
        response: Union[httpx.Response, requests.Response],
        file_path: str,
    ):
        self.response = response
        self.file_path = file_path

    def write(self):
        '''Writes a response to a file'''
        with AmbiguousFile(self.file_path, write=True) as output_file:
            output_file.write(self.response.content)

    async def async_write(self):
        '''Writes a response to a file'''
        await self.response.aread()
        with AmbiguousFile(self.file_path, write=True) as output_file:
            output_file.write(self.response.content)

    @classmethod
    def save_response(cls, response: requests.Response, file_path: str):
        '''Writes a json response to a file'''
        cls(response, file_path).write()

    @classmethod
    async def async_save_response(cls, response: httpx.Response, file_path: str):
        '''Writes a json response to a file'''
        await cls(response, file_path).async_write()


class ResponseStreamWriter(ResponseWriter):
    '''This class writes data from a streaming response to a file'''

    def write(self):
        """'Writes a response to a file"""
        with AmbiguousFile(self.file_path, write=True) as output_file:
            for chuck in self.response.iter_content(chunk_size=1024):
                output_file.write(chuck.decode("utf-8"))

    async def async_write(self):
        '''Writes a response to a file'''
        with AmbiguousFile(self.file_path, write=True) as output_file:
            async for chuck in self.response.aiter_bytes():
                output_file.write(chuck.decode("utf-8"))
