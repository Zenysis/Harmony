from builtins import object
from sqlalchemy.orm import sessionmaker

from data.pipeline.datatypes.explorer_models import (
    Locations,
    LocationTypes,
    Groups,
    Metrics,
    Properties,
    Fields,
)
from db.postgres.connection import PostgresConnection
from log import LOG
from util.pipeline.database_dump import flatten_self_referential_table


class GeoExplorerDatasource(object):
    def __init__(self, postgres_configuration, deployment):
        self.initialized = False
        self.postgres_configuration = postgres_configuration
        self.database_session = None
        self.deployment = deployment

    def _initialize_datasource(self):
        if self.initialized:
            return

        # Fetch the list of databases available
        database_engine = PostgresConnection.create_sqlalchemy(
            self.postgres_configuration
        )

        query = 'SELECT datname FROM pg_database WHERE datistemplate = false'
        databases = database_engine.execute(query).fetchall()

        # Find the most recent database created for this deployment
        # TODO(moriah, stephen): Make this check more robust. Right now, we are
        # hardcoding the requirement that the db prefix starts with deployment
        # name and date.
        db_prefix = '%s_2' % self.deployment
        matching_databases = [db[0] for db in databases if db[0].startswith(db_prefix)]

        assert matching_databases, (
            'No matching database found for prefix: %s' % db_prefix
        )

        current_db = sorted(matching_databases)[-1]

        # Create engine that connects to the most recent database
        # for this deployment
        new_engine = PostgresConnection.create_sqlalchemy(
            self.postgres_configuration, current_db
        )
        Session = sessionmaker(bind=new_engine)
        self.database_session = Session()
        self.initialized = True
        LOG.info('** Using postgres datasource %s **', current_db)

    def get_location_hierarchy(self):
        # NOTE(moriah): explicitly listing the properties of the Locations
        # model so we can convert it into a more convenient format.
        location_hierarchy_info = ('id', 'type_id', 'parent_id', 'name')
        location_types = self.get_location_types()
        locations = self.database_session.query(Locations).all()
        rows = [
            {column: getattr(location, column) for column in location_hierarchy_info}
            for location in locations
        ]
        for row in rows:
            if row['id'] == row['parent_id']:
                row['parent_id'] = 0
        locations_flat = flatten_self_referential_table(
            rows, *(location_hierarchy_info)
        )
        location_hierarchy = {}
        for location in locations:
            formatted_location = {
                'id': location.id,
                'lat': location.lat,
                'lng': location.lng,
                'name': location.name,
                # Properties needed to match GTA
                'geoName': location.name,
                'geoKey': location.id,
            }
            for type_id, name in locations_flat[location.id].items():
                formatted_location[location_types[type_id]] = name
            location_hierarchy[location.id] = formatted_location
        return location_hierarchy

    def get_location_types(self):
        self._initialize_datasource()
        return {
            location_type.id: location_type.name
            for location_type in self.database_session.query(LocationTypes).all()
        }

    def get_property_groups(self):
        self._initialize_datasource()
        # Used directly by GeoForm mount to get Property group ids.
        group_ids = self.database_session.query(Properties.field_id).distinct().all()
        return [group_id.field_id for group_id in group_ids]

    def get_metric_groups(self):
        self._initialize_datasource()
        # Used directly by GeoForm mount to get Metric group ids.
        group_ids = (
            self.database_session.query(Groups.id)
            .join(Fields)
            .join(Metrics)
            .distinct()
            .all()
        )
        return [group_id.id for group_id in group_ids]
