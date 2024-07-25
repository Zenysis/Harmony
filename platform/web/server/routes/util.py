from werkzeug.routing import BaseConverter

# Custom url converter that transforms a + delimited path segment into a
# python list. For example: /demo/x+y
# Via: http://exploreflask.com/en/latest/views.html#custom-converters
class ListConverter(BaseConverter):
    def to_python(self, value):
        return value.split('+')

    def to_url(self, values):
        return '+'.join(BaseConverter.to_url(value) for value in values)

    @staticmethod
    def register_converter(flask_app):
        flask_app.url_map.converters['list'] = ListConverter
