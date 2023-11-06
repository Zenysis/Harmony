class DHIS2ValidationFailedException(Exception):
    '''Raise this exception when there is a failure from DHIS2 Validation.'''

    def __init__(self, path_to_report, message=None):
        self.path_to_report = path_to_report
        self.message = (
            message
            or f"DHIS2 data validation has failed. Some fetched data totals don't match DHIS2 API "
            f"totals. Here is the path to the files with unmatched totals: {self.path_to_report}"
        )

        super().__init__(self.message)
