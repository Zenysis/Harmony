import json

from flask import current_app
from pydruid.utils.filters import Dimension as DimensionFilter

from data.query.models.calculation import MaxCalculation
from data.query.models.query_filter import FieldFilter
from db.druid.query_builder import GroupByQueryBuilder

# Restructure data to fit what we expect on the front end, and make
# it easier to access all the values associated with any particular
# variable
def _build_rows(risk_score_metadata):
    data = []
    for factor_id in risk_score_metadata:
        if factor_id.endswith('__MEAN') or factor_id.endswith('__VALUE'):
            continue

        signed_term = risk_score_metadata[factor_id]
        # Add in a column denoting whether the term is positive
        # or negative, or 0
        term_type = 'Positive'
        if signed_term == 0:
            term_type = 'None'
        elif signed_term < 0:
            term_type = 'Negative'

        data.append(
            {
                'avg': round(risk_score_metadata[factor_id + '__MEAN'], 3),
                'term': abs(signed_term),
                'type': term_type,
                'value': risk_score_metadata[factor_id + '__VALUE'],
                'variable': factor_id,
            }
        )

    return data


# We query druid to get the metadata about a risk score for a particular sex
# worker id. This metadata is stored as a JSON blob for the dimension
# `risk_score_blob`.
def get_risk_score_metadata(participant_id):
    druid_context = current_app.druid_context

    query_filter = (DimensionFilter('risk_score_blob') != '') & (
        DimensionFilter('sw_unique_id') == participant_id
    )

    # We only need the value of the dimension 'risk_score_blob' but we query the
    # field `pct_prob` to fit with our general druid query infrastructure.
    query = GroupByQueryBuilder(
        druid_context.current_datasource.name,
        'all',
        ['risk_score_blob'],
        [druid_context.data_time_boundary.get_full_time_interval()],
        MaxCalculation(filter=FieldFilter('pct_prob')).to_druid('__unused__'),
        query_filter,
    )

    result = current_app.query_client.run_query(query)

    # There should only be at most one risk score for this participant.
    if len(result) != 1:
        return []

    risk_score_metadata = json.loads(result[0]['event']['risk_score_blob'])

    data = _build_rows(risk_score_metadata)
    return data


# NOTE(nina, stephen):
# ***** Additional development notes, not needed for the endpoint ***** #
# If you want to run this query inside a python shell, you can append this.
# You'll have to update the datasource name each day to the latest version. Also you'll
# need to run `ZEN_ENV='za' python` to get the query client to work right:
#
# from db.druid.query_client import DruidQueryClient
# participant_id = 'Aa-1992-Jama'
# query = GroupByQueryBuilder(
#     'za_20200626',
#     'all',
#     ['risk_score_blob'],
#     ['2009-01-01/2023-11-15'],
#     MaxCalculation(filter=FieldFilter('pct_prob')).to_druid('__unused__'),
#     query_filter,
# )
#
# result = DruidQueryClient.run_query(query)
