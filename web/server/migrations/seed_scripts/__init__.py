from sqlalchemy.orm import class_mapper, Session

from log import LOG

_RESET_SEQUENECE_COMMAND_FORMAT = '''
SELECT setval((SELECT pg_get_serial_sequence('{table_name}', '{id_column}')),
(SELECT COALESCE(MAX({id_column}), 0) FROM public.{table_name}) + 1);
'''


def reset_table_sequence_id(entity_class, transaction):

    mapper = class_mapper(entity_class)
    table_name = mapper.local_table

    if len(mapper.primary_key) > 1:
        LOG.info(
            'Cannot update primary key sequence for table \'%s\' as '
            'it has a composite primary key. ',
            table_name,
        )
    else:
        id_column = class_mapper(entity_class).primary_key[0].name
        reset_sequence_id_command = _RESET_SEQUENECE_COMMAND_FORMAT.format(
            table_name=table_name, id_column=id_column
        )

        transaction.run_raw().execute(reset_sequence_id_command)
        LOG.info(
            'Successfully staged updated primary key sequence for ' 'table \'%s\'',
            table_name,
        )


def get_session(alembic_operation):
    bind = alembic_operation.get_bind()
    return Session(bind=bind)
