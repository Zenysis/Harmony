from typing import Tuple, List

DATA_VALUESETS_ENDPOINTS = "/api/dataValueSets"
EVENTS_ENDPOINTS = "/api/events"
ENROLLMENTS_ENDPOINTS = "/api/enrollments"
ANALYTICS_ENDPOINTS = "/api/analytics"
DATA_ELEMENT_GROUPS_ENDPOINTS = "/api/dataElementGroups"
DATASETS_ENDPOINT = "/api/dataSets"
DATA_ELEMENT_GROUPS_PARAMS = {
    "fields": "id,name,dataElements["
    "id,name,shortName,aggregationType,domainType,valueType"
    "]",
    "paging": "false",
}
DATASETS_PARAMS = {
    "fields": "organisationUnits,id,name,displayName,periodType,"
    "dimensionItemType,categoryCombo[id],"
    "dataSetElements[dataElement[id,name,shortName,"
    "aggregationType,domainType,valueType,children]",
    "paging": "false",
}

# Commonly used constants
DATASETS = "dataSets"
DATASET = "dataSet"
DATA_ELEMENTS = "dataElements"
DATA_ELEMENT = "dataElement"
DATA_ELEMENT_GROUPS = "dataElementGroups"
DATA_ELEMENT_GROUP = "dataElementGroup"
VALUE_TYPE = "valueType"
DHIS2_ID = "id"
PERIOD_TYPE = "periodType"
DATASET_ELEMENTS = "dataSetElements"
ORGANISATION_UNITS = "organisationUnits"


def generate_analytics_endpoint(
    dhis2_instance_name: str, raw_data: bool, data_format: str
) -> Tuple[str, dict, List[str]]:
    '''Generate analytics endpoint'''
    params: dict = {"ignoreLimit": "true"}
    dimensions: List[str] = []
    if raw_data and data_format.lower() == "csv":
        endpoint = f"/{dhis2_instance_name}{ANALYTICS_ENDPOINTS}/rawData.csv"
        dimensions.append("co:*")
    else:
        endpoint = f"/{dhis2_instance_name}{ANALYTICS_ENDPOINTS}.{data_format.lower()}"
        params["skipMeta"] = "true"
    return endpoint, params, dimensions
