import os
from typing import Dict, List, Optional
from urllib.parse import urljoin

import requests

from log import LOG
from config.settings import getenv
from util.connections.connection_manager import get_bucket_name

API_DOMAIN = "https://api.clouddataprep.com"
# Root endpoint for job group calls.
JOB_GROUPS_ENDPOINT = "/v4/jobGroups"
# Root endpoint for Flow group calls.
FLOW_GROUPS_ENDPOINT = "v4/wrangledDatasets"

# Job statuses
FAILED_JOB = 'Failed'
SUCCESSFUL_JOB = 'Complete'
CANCELED_JOB = 'Canceled'
COMPLETED_STATUSES = {FAILED_JOB, SUCCESSFUL_JOB, CANCELED_JOB}


class DataprepSetupException(Exception):
    def __init__(self, message):
        super().__init__()
        self.message = message


def _is_self_serve_input(flow_input: Dict, source_id: str) -> bool:
    '''Utility function to parse a Flow input dataset object from Dataprep.

    Args:
        - flow_input (Dict): Flow input object
        - source_id (str): source name to check for in bucket path
    Returns:
        - bool: True if Flow input located at a '/self_serve' path in the
        current deployment's bucket ('<bucket name>/self_serve/<source id>').
    '''
    deployment_name = os.environ['ZEN_ENV']
    if deployment_name is None:
        LOG.error('Deployment name is not defined')
        return False

    # Path is not a required part of the API response from dataprep.
    if 'path' not in flow_input:
        return False
    return flow_input['path'].startswith(f'/self_serve/{source_id}') and flow_input.get(
        'bucket'
    ) == get_bucket_name('gcs', deployment_name)


class DataprepManager:
    '''This class represents the Dataprep API manager. It holds the convenience methods to call
    Dataprep endpoints which return json objects as python dictionaries

    Parameters:
        :key: (str) API Key from Dataprep.
        :domain: (str) Dataprep API address
    '''

    def __init__(
        self,
        key=None,
        domain=API_DOMAIN,
    ):
        if key is None:
            key = getenv('DATAPREP_API_TOKEN', None)

        self.session = requests.Session()
        self.session.headers.update(
            {
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        )
        self.domain = domain

    def fetch_job_details(self, job_id: int) -> Dict[str, str]:
        '''Fetches job details from Dataprep given a jobId
        https://api.trifacta.com/dataprep-professional/index.html#operation/getJobGroup

        Args:
            - job_id (int): id of the job whose details to be fetched.
        Returns:
            - dict: The json response from the API.
        '''
        endpoint = urljoin(self.domain, f'{JOB_GROUPS_ENDPOINT}/{job_id}')
        response = self.session.get(endpoint).json()
        return response

    def trigger_job(self, recipe_id: int) -> requests.Response:
        '''Calls the Dataprep API to run a new job.
        https://api.trifacta.com/dataprep-professional/index.html#operation/runJobGroup

        Args:
            - recipe_id (int): The id of the Dataprep recipe to run
        Returns:
            - Response: The run job response from Dataprep
        '''
        endpoint = urljoin(self.domain, JOB_GROUPS_ENDPOINT)
        data = {"wrangledDataset": {"id": recipe_id}}
        return self.session.post(endpoint, json=data)

    def validate_job_can_be_run(self, recipe_id: int) -> bool:
        '''Tests whether a Dataprep job could be run successfully. This method calls the
        same Dataprep API to run a new job, but with "testMode" set to True
        https://api.trifacta.com/dataprep-professional/index.html#operation/runJobGroup.

        Args:
            - recipe_id (int): The id of the Dataprep recipe to run
        Returns:
            - bool: Whether the recipe could be run successfully
        '''
        endpoint = urljoin(self.domain, JOB_GROUPS_ENDPOINT)
        data = {"wrangledDataset": {"id": recipe_id}, "testMode": True}
        return self.session.post(endpoint, json=data).ok

    def fetch_flow_id(self, recipe_id: int) -> Optional[int]:
        '''Fetches the Flow id for the given recipe id. Each Flow may have multiple
        recipes and datasets associated with it.

        Args:
            - recipe_id (int): id of the Dataprep recipe
        Returns:
            - optional int: The Flow id for the recipe id. None if the recipe id
                is invalid.
        '''
        # Retrieve Flow id via recipe id
        recipe_endpoint = urljoin(self.domain, f'{FLOW_GROUPS_ENDPOINT}/{recipe_id}')
        recipe_config_response = self.session.get(recipe_endpoint).json()
        if recipe_config_response.get('exception'):
            return None
        return recipe_config_response.get('flow').get('id')

    def fetch_self_serve_flow_inputs(self, flow_id: int, source_id: str) -> List[Dict]:
        '''Fetches all Flow input datasets and filters by self-serve path.
        https://api.trifacta.com/dataprep-enterprise-cloud/index.html#operation/getFlowInputs

        Args:
            - flow_id (int): Dataprep Flow id
            - source_id (str): Source name to check in bucket path
        Returns:
            - list: List of Flow input dataset objects (see API docs for details)
        '''
        flow_input_endpoint = urljoin(self.domain, f'v4/flows/{flow_id}/inputs')
        flow_input_response = self.session.get(flow_input_endpoint).json()

        return list(
            filter(
                lambda input: _is_self_serve_input(input, source_id),
                flow_input_response.get('data'),
            )
        )

    def fetch_parameterization_status(self, recipe_id: int, source_id: str) -> bool:
        '''Checks if a Dataprep recipe links to a valid Flow and if so,
        whether or not that Flow is parameterized.

        Args:
            - recipe_id (int): id of the Dataprep recipe — used to fetch Flow
                id and its inputs
            - source_id (str): Source name that should be part of input path
        Returns:
            - boolean: True if Flow inputs are parameterized, False otherwise

        May raise for any of the following reasons:
        - Recipe id does not link to any Flow
        - Recipe id links to Flow with <1< self-serve input datasets
        - Recipe id links to an incorrectly-parameterized Flow
        '''
        flow_id = self.fetch_flow_id(recipe_id)
        if flow_id is None:
            raise DataprepSetupException('nonexistentRecipeIdError')

        self_serve_flow_inputs = self.fetch_self_serve_flow_inputs(flow_id, source_id)

        if len(self_serve_flow_inputs) == 1:
            # Check if Flow input dataset is parameterized via isDynamic attribute
            flow_parameterized = self_serve_flow_inputs[0].get('isDynamic', False)
            if flow_parameterized:
                # If the Flow is parameterized, confirm that the parameterized
                # path matches the expected `/self_serve/<source id>` path.
                if (
                    self_serve_flow_inputs[0].get('dynamicPath', '')
                    == f'/self_serve/{source_id}/'
                ):
                    return True
                raise DataprepSetupException('badParameterizationPathError')
            return False

        raise DataprepSetupException('badFlowInputCountError')
