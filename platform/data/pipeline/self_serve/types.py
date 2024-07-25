#!/usr/bin/env python
import related


@related.immutable
class ColumnNameMapping:
    '''Represents a mapping from input CSV column(s) to the canonical output column'''

    input_name = related.StringField()
    output_name = related.StringField()


# NOTE: will have to reformat once unpivoted data is supported
@related.immutable
class SourceConfigType:
    date_column = related.StringField()
    source = related.StringField()
    data_filename = related.StringField()
    dimensions = related.SequenceField(ColumnNameMapping, [])
    fields = related.SequenceField(ColumnNameMapping, [])
