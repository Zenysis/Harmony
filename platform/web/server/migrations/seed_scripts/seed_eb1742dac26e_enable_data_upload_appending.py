import os
import sqlalchemy as sa

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.types import DateTime

from log import LOG
from web.server.data.data_access import Transaction
from web.server.migrations.seed_scripts import get_session

Base = declarative_base()


class DataUploadFileSummary(Base):
    '''Represents the information about a single file uploaded through data upload'''

    __tablename__ = "data_upload_file_summary"

    id = sa.Column(sa.Integer(), primary_key=True)
    self_serve_source_id = sa.Column(
        sa.Integer(),
        nullable=True,
    )
    source_id = sa.Column(sa.String(100), nullable=False)
    file_path = sa.Column(sa.Text(), nullable=False)
    user_file_name = sa.Column(sa.Text(), nullable=False)
    column_mapping = sa.Column(JSONB(), nullable=False)

    created = sa.Column(DateTime, nullable=False, server_default=sa.func.now())
    last_modified = sa.Column(
        DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()
    )


class SelfServeSource(Base):
    '''Represents a data source configured and uploaded through the self-serve data
    upload tool.
    '''

    __tablename__ = "self_serve_source"

    id = sa.Column(sa.Integer(), primary_key=True)
    file_summary_id = sa.Column(
        sa.Integer(),
        nullable=False,
    )
    last_modified = sa.Column(
        DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()
    )


def populate_dataprep_file_path(transaction):
    # Populate file_path column for existing data_upload_file_summary
    # rows that represent dataprep files, which previously held EMPTY values
    dataprep_file_summaries = transaction.find_all_by_fields(
        DataUploadFileSummary, {'file_path': ''}
    )
    for dataprep_summary_row in dataprep_file_summaries:
        _, extension = os.path.splitext(dataprep_summary_row.user_file_name)
        dataprep_summary_row.file_path = f'self_serve_input{extension}'
        transaction.add_or_update(dataprep_summary_row)
    LOG.info('Populated file_path for existing dataprep DataUploadFileSummary rows')


def move_fkey_from_self_serve_source_to_file_summary(transaction):
    # Instead of linking a DataUploadFileSummary to a SelfServeSource by
    # by keeping a foreign key to DataUploadFileSummary on SelfServeSource,
    # create a foreign key to SelfServeSource on DataUploadFileSummary.
    # This enables a self-serve source to have many file summaries.
    self_serve_source_list = transaction.find_all_by_fields(SelfServeSource, {})
    for self_serve_source in self_serve_source_list:
        current_file_summary = transaction.find_by_id(
            DataUploadFileSummary, self_serve_source.file_summary_id
        )
        if current_file_summary:
            current_file_summary.self_serve_source_id = self_serve_source.id
            transaction.add_or_update(current_file_summary)
    LOG.info(
        'Moved foreign key relationship from SelfServeSource to DataUploadFileSummary'
    )


def undo_move_fkey_from_self_serve_source_to_file_summary(transaction):
    data_upload_file_summaries = transaction.find_all_by_fields(
        DataUploadFileSummary, {}
    )
    # Reverse the fkey relationship. Don't have to worry about multiple file
    # summaries linking to the same self-serve source because every
    # DataUploadFileSummary will either have a unique or null self_serve_source_id
    # after the upvert seeding.
    for data_upload_file_summary in data_upload_file_summaries:
        associated_self_serve_source = transaction.find_by_id(
            SelfServeSource, data_upload_file_summary.self_serve_source_id
        )
        if associated_self_serve_source:
            associated_self_serve_source.file_summary_id = data_upload_file_summary.id
            transaction.add_or_update(associated_self_serve_source)
    LOG.info(
        'Moved foreign key relationship from DataUploadFileSummary to SelfServeSource'
    )


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        populate_dataprep_file_path(transaction)
        move_fkey_from_self_serve_source_to_file_summary(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        # Cannot revert populate_dataprep_file_path since we don't have a record
        # of which which file summaries were EMPTY
        undo_move_fkey_from_self_serve_source_to_file_summary(transaction)
