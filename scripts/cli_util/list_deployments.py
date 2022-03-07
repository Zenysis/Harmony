from typing import Dict, List, Optional, TypedDict
import pandas as pd
from pylib.base.term_color import TermColor

from prod.roledefs import ROLE_DEFINITIONS
from config import VALID_MODULES
from config.loader import import_configuration_module
from scripts.cli_util.deployment_credentials import DEPLOYMENT_CREDENTIALS_MAP

DEPLOYMENT_CODES = set(VALID_MODULES)


class DeploymentInfo(TypedDict):
    deployment_name: str
    deployment_code: str
    url: str


def get_url_from_deployment(deployment_name: str) -> Optional[str]:
    # for staging deployments we have to get the url from the roledef configuration
    if 'staging' in deployment_name:
        config = ROLE_DEFINITIONS.get(deployment_name, None)
        if config:
            service_env = config.get('service_env', None)
            if service_env:
                web_env = service_env.get('web', None)
                hosts = web_env.get('VIRTUAL_HOST', None)
                if hosts:
                    host = hosts.split(',')[0]
                    return f'https://{host}'

    # for prod deployments, we can get the public-facing URL from the
    # DEPLOYMENT_BASE_URL in the deployment's python config
    zen_env = get_zen_env_from_deployment(deployment_name)
    if zen_env:
        zen_config = import_configuration_module(zen_env)
        return zen_config.general.DEPLOYMENT_BASE_URL

    return None


def get_zen_env_from_deployment(deployment_name: str) -> Optional[str]:
    '''Get the deployment code (ZEN_ENV) from a deployment name.
    For example, 'zm-web-staginga' would return 'zm'
    '''
    config = ROLE_DEFINITIONS.get(deployment_name, None)
    if config:
        env = config.get('env', None)
        if env:
            return env.get('ZEN_ENV', None)
    return None


def get_url_to_deployment_mapping() -> Dict[str, List[str]]:
    '''
    Returns:
        Dict of url to deployment names
        Keys are urls, values are list of deployment names that share that url.
    '''
    mapping = {}
    for dep_name in get_all_deployment_names():
        url = get_url_from_deployment(dep_name)
        if url in mapping:
            mapping[url].append(dep_name)
        else:
            mapping[url] = [dep_name]
    return mapping


def get_all_deployments() -> List[DeploymentInfo]:
    '''Get a list of all deployments we can interact with. This function gets
    the deployment web role names that have a valid postgres database configuration,
    along with their deployment codes.

    For example, this would be a dict in the list:
        { 'deployment_name': 'pk-web-aws-prod', 'deployment_code': 'pk' }

    This function does NOT print out the list, as opposed to `list_deployments`.
    This function just returns it.

    Returns:
        List[DeploymentInfo]: list of all deployments as a dict of
            `deployment_name`, `deployment_code`, and `url`
    '''
    deployments = []
    for dep_name, config in ROLE_DEFINITIONS.items():
        if 'instance_options' in config and 'env' in config:
            env = config.get('env', {})
            instance_options = config.get('instance_options', {})
            service_env = config.get('service_env', {})
            web_env = service_env.get('web', {})

            if (
                'database_credential_id' in instance_options
                and 'conduit_token' in instance_options
                and 'ZEN_ENV' in env
                and 'VIRTUAL_HOST' in web_env
            ):
                deployments.append(
                    {
                        'deployment_name': dep_name,
                        'deployment_code': env['ZEN_ENV'],
                        'url': get_url_from_deployment(dep_name),
                        'passphrase': DEPLOYMENT_CREDENTIALS_MAP.get(dep_name, ''),
                    }
                )
    deployments.sort(key=lambda d: d['deployment_name'])
    return deployments


def get_all_deployment_names() -> List[str]:
    '''Get a list of all deployment names. A deployment name is a valid web
    role, such as 'pk-web-aws-prod'.
    '''
    return [d['deployment_name'] for d in get_all_deployments()]


def is_deployment_name_valid(deployment_name: str, print_help: bool = False) -> bool:
    '''Checks if a given deployment name is valid (i.e. does it have a postgres
    config?)

    Args:
        deployment_name (str): the deployment name to check
        print_help (bool): whether or not to print a help message if the given
            `deployment_name` is invalid
    Returns:
        bool
    '''
    deployments = set(get_all_deployment_names())
    is_valid = deployment_name in deployments
    if not is_valid and print_help:
        print(TermColor.ColorStr('Deployment name is invalid', 'RED'))
        list_deployments(intro_msg='These are the valid deployments:')
    return is_valid


def is_deployment_code_valid(deployment_code: str, print_help: bool = False) -> bool:
    '''Checks if a given deployment code is valid.

    Args:
        deployment_code (str): the deployment code to check
        print_help (bool): whether or not to print a help message if the given
            `deployment_name` is invalid
    Returns:
        bool
    '''
    is_valid = deployment_code in DEPLOYMENT_CODES
    if not is_valid and print_help:
        print(TermColor.ColorStr('Deployment code is invalid', 'RED'))
        list_deployments(intro_msg='These are the valid deployment codes:')
    return is_valid


def list_deployments(intro_msg: Optional[str] = None) -> List[str]:
    '''Print out all deployments we can interact with.

    Args:
        intro_msg (str): a message to print before the list of deployments

    Returns:
        List[DeploymentInfo]: list of all deployments as a dict of
            `deployment_name` and `deployment_code`
        Side effect: Prints to stdout
    '''
    deployments = get_all_deployments()

    if intro_msg:
        print(intro_msg)

    # using pandas because they have a really nice way of printing tables
    print(TermColor.ColorStr(pd.DataFrame(deployments).to_string(index=False), 'AUQA'))
    return deployments
