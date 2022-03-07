from flask import jsonify, current_app
from werkzeug.exceptions import ServiceUnavailable


class HealthCheck:
    def run(self):
        druid_metadata = current_app.druid_context.druid_metadata
        if not druid_metadata.is_datasource_queryable(
            current_app.druid_context.current_datasource.name
        ):
            raise ServiceUnavailable()

        return jsonify({'success': True})
