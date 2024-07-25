from collections import defaultdict
from datetime import datetime, timedelta
from flask_potion import fields
from flask_potion.routes import Route
from flask_potion.schema import FieldSet
from sqlalchemy import not_

from models.alchemy.pipeline_runs import PipelineRunMetadata
from web.server.api.api_models import PrincipalResource
from web.server.data.data_access import Transaction


# NOTE: The structure that gets returned uses the sources as keys, which
# alchemy doesn't like. However, returning this structure means less data transformations
# here and on the backend.
# {
#     source1: [
#         {
#             'dataPointsCount': fields.Number(),
#             'endDate': fields.String(),
#             'generationDatetime': fields.DateTime(),
#             'startDate': fields.String(),
#         }
#     ],
# }


class PipelineRunMetadataResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `PipelineRunMetadata` class.'''

    class Meta:
        model = PipelineRunMetadata

    class Schema:
        digestMetadata = fields.Any(attribute='digest_metadata')
        generationDatetime = fields.DateTime(attribute='generation_datetime')
        source = fields.String()

    @Route.GET(
        '/digest_overview',
        title='Get pipeline metadata overview',
        schema=FieldSet({'lookbackWeeks': fields.Number(attribute='lookback_weeks')}),
        # see comment above
        response_schema=fields.Any(),
    )
    def get_digest_overview(self, lookback_weeks):
        with Transaction() as transaction:
            weeks_ago = datetime.utcnow() - timedelta(weeks=int(lookback_weeks))
            recent_updates = (
                transaction.run_raw()
                .query(PipelineRunMetadata)
                .filter(
                    PipelineRunMetadata.generation_datetime > weeks_ago,
                    not_(
                        PipelineRunMetadata.digest_metadata.contains({'failed': True})
                    ),
                )
                .all()
            )
            # group the recent updates by source
            out = defaultdict(list)
            for update in recent_updates:
                metadata = {
                    'dataPointsCount': update.digest_metadata['data_points_count'],
                    'endDate': update.digest_metadata['end_date'],
                    # formatting the string here since we don't do any manipulations
                    # of the object when creating the model on the frontend, and
                    # because we only need to sort the date (not perform any other operations)
                    'generationDatetime': update.generation_datetime.strftime(
                        '%Y-%m-%d %H:%M:%S'
                    ),
                    'startDate': update.digest_metadata['start_date'],
                    'fieldsCount': update.digest_metadata['fields_count'],
                }
                out[update.source].append(metadata)
            return out


RESOURCE_TYPES = [PipelineRunMetadataResource]
