from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.types import DateTime

from models.alchemy.mixin import UTCTimestampMixin
from models.alchemy.base import Base

if TYPE_CHECKING:
    from models.alchemy.query.model import PipelineDatasource


class DataUploadFileSummary(Base):
    '''Represents the information about a single file uploaded through data upload'''

    __tablename__ = "data_upload_file_summary"

    id = sa.Column(sa.Integer(), primary_key=True)
    # SelfServeSource that this file composes
    self_serve_source_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'self_serve_source.id', ondelete='CASCADE', name='valid_self_serve_source'
        ),
        nullable=True,
    )
    # Outdated: source_id text references a PipelineDatasource.
    # Now, self_serve_source_id overrrides it, but it's useful
    # to retain source_id for historical file replacement record.
    source_id = sa.Column(sa.String(100), nullable=False)
    file_path = sa.Column(sa.Text(), nullable=False)
    # Storing the user's original file name since we rename the file for reference internally.
    # This allows the displayed name to be as the user expects.
    user_file_name = sa.Column(sa.Text(), nullable=False)
    column_mapping = sa.Column(JSONB(), nullable=False)

    created = sa.Column(DateTime, nullable=False, server_default=sa.func.now())
    last_modified = sa.Column(
        DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()
    )

    self_serve_source = relationship('SelfServeSource')


class SelfServeSource(Base):
    '''Represents a data source configured and uploaded through the self-serve data
    upload tool.
    '''

    __tablename__ = "self_serve_source"

    id = sa.Column(sa.Integer(), primary_key=True)
    source_id = sa.Column(
        sa.String(),
        sa.ForeignKey('pipeline_datasource.id', ondelete='CASCADE'),
        nullable=False,
    )
    dataprep_flow_id = sa.Column(
        sa.Integer(), sa.ForeignKey('dataprep_flow.id', ondelete='CASCADE')
    )
    created = sa.Column(DateTime, nullable=False, server_default=sa.func.now())
    last_modified = sa.Column(
        DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()
    )

    dataprep_flow = relationship('DataprepFlow')
    file_summaries = relationship('DataUploadFileSummary')
    source = relationship('PipelineDatasource')


class DataprepFlow(Base, UTCTimestampMixin):
    '''Represents a dataprep flow for each source that has the required information to trigger a
    dataprep job and also validate an uploaded dataprep file.
    '''

    __tablename__ = "dataprep_flow"

    id = sa.Column(sa.Integer(), primary_key=True)
    expected_columns = sa.Column(JSONB(), nullable=False)
    recipe_id = sa.Column(sa.Integer(), unique=True, nullable=False)
    jobs = relationship(
        'DataprepJob', order_by='DataprepJob.created.desc()', backref='dataprep_flow'
    )
    appendable = sa.Column(sa.Boolean(), nullable=False)


class DataprepJob(Base):
    '''Represents information about a single dataprep job.'''

    __tablename__ = "dataprep_job"

    id = sa.Column(sa.Integer(), primary_key=True)
    created_on_dataprep = sa.Column(DateTime, nullable=True)
    last_modified_on_dataprep = sa.Column(DateTime, nullable=True)
    job_id = sa.Column(sa.Integer(), nullable=True)
    status = sa.Column(sa.String(100), nullable=True)
    dataprep_flow_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('dataprep_flow.id', ondelete='CASCADE'),
        nullable=False,
    )
    created = sa.Column(DateTime, nullable=False, server_default=sa.func.now())
    last_modified = sa.Column(
        DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()
    )


class SourceConfig(Base):
    __tablename__ = 'source_config'

    id = sa.Column(sa.Integer(), primary_key=True)
    config = sa.Column(JSONB(), nullable=False)
    source_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('self_serve_source.id', ondelete='CASCADE'),
        nullable=False,
    )
    is_active = sa.Column(sa.Boolean(), nullable=False, default=True)
    created_on = sa.Column(DateTime, nullable=False, server_default=sa.func.now())
    source = relationship('SelfServeSource')
