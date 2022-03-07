from typing import Any, List, Dict

import gspread
from google.oauth2.service_account import Credentials
from log import LOG


class GoogleSheetHelper:
    '''A class for working with reading and writing into google spreadsheets
    '''

    def __init__(self, client_secret) -> None:
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
        ]
        creds = Credentials.from_service_account_info(client_secret, scopes=scopes)
        self.client = gspread.authorize(creds)

    def read_all(self, workbook_name: str, sheet_title: str):
        # Extract and return all of the values
        try:
            sh = self.client.open(workbook_name)
            worksheet = sh.worksheet(sheet_title)
            data = worksheet.get_all_records()
            return data
        except gspread.exceptions.SpreadsheetNotFound:
            LOG.error(
                'Googlesheet not found. Make sure the googlesheet exists '
                'and service account workbooks@zen-1234.iam.gserviceaccount.com '
                'has editor access to the googlesheet'
            )

    def insert_bulk_data(
        self, workbook_name: str, sheet_title: str, data: List[Dict[str, Any]]
    ):
        '''Insert data into google spreadsheet workbook
        '''
        try:
            # Find a workbook by name
            sh = self.client.open(workbook_name)

            # Find the worksheet by title
            worksheet = sh.worksheet(sheet_title)
            worksheet.batch_update(data)
        except gspread.exceptions.SpreadsheetNotFound:
            LOG.error(
                'Googlesheet not found. Make sure the googlesheet exists '
                'and service account workbooks@zen-1234.iam.gserviceaccount.com '
                'has editor access to the googlesheet'
            )
