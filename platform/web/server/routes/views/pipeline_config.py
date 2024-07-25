from models.alchemy.data_upload.model import SourceConfig
from web.server.data.data_access import Transaction


def get_latest_config_by_source_id(source_id: int) -> SourceConfig:
    with Transaction() as transaction:
        return (
            transaction.find_all_by_fields(SourceConfig, {'source_id': source_id})
            .order_by(SourceConfig.created_on.desc())
            .first()
        )
