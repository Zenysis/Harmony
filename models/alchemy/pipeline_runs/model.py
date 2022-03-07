import datetime
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from models.alchemy.base import Base


class PipelineRunMetadata(Base):
    '''Represents a single datasource's metadata for a pipeline run'''

    __tablename__ = 'pipeline_run_metadata'

    id = sa.Column(sa.Integer(), primary_key=True)
    source = sa.Column(sa.String())
    generation_datetime = sa.Column(sa.DateTime(), default=datetime.datetime.utcnow)
    # Metadata includes data_points_count, start_date, end_date, mapped_locations_count,
    # unmatched_locations_count
    # TODO(sophie): add more metadata such as the number of (empty) rows etc
    digest_metadata = sa.Column(JSONB())
