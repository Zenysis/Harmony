import related

from data.query.models.calculation import Calculation


@related.immutable
class Field:
    '''The Field model stores information about a calculable field in the database.'''

    id = related.StringField()
    calculation = Calculation.child_field()
    canonical_name = related.StringField(required=False, key='canonicalName')
    short_name = related.StringField(required=False, key='shortName')
    label = related.StringField('', required=False, key='userDefinedLabel')

    def field_name(self):
        if self.label:
            return self.label
        return self.canonical_name

    def original_field_id(self):
        return self.id.rsplit('__', 1)[0]
