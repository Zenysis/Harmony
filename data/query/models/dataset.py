import related


@related.immutable
class Dataset:
    '''The Dataset model represents the original source of a piece of data in the
    database. It normally represents the pipeline source that produced a set of rows in
    the database.
    '''

    id = related.StringField()
    name = related.StringField()
    description = related.StringField('')
    # TODO(stephen): Add an Interval model. This is currently unused.
    valid_intervals = related.SequenceField(str, [])
