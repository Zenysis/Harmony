#!/usr/bin/env python
import sys
from pylib.base.flags import Flags

from scripts.cli_util.commands import Command
from scripts.translations.translations_export import translations_export
from scripts.translations.translations_generate import translations_generate
from scripts.translations.translations_watch import translations_watch
from scripts.translations.translations_list_dangling import translations_list_dangling
from scripts.translations.translations_list_dangling_ref import (
    translations_list_dangling_ref,
)
from scripts.translations.translations_list_out_of_sync import (
    translations_list_out_of_sync,
)
from scripts.translations.translations_import import translations_import
from scripts.translations.translations_add_locale import translations_add_locale


def main():
    '''A CLI to execute common translation operations.'''
    Flags.PARSER.add_argument(
        '--verbose',
        action='store_true',
        default=False,
        help='Use this flag to print out more detailed information',
    )

    Flags.PARSER.add_argument(
        '--out',
        type=str,
        required=False,
        help='Filename of where to store output (if applicable)',
    )

    Flags.PARSER.add_argument(
        '--locale',
        type=str,
        required=False,
        help='Locale to target for one of the translation commands (if applicable)',
    )

    Flags.PARSER.add_argument(
        '--base_locale',
        default='en',
        type=str,
        required=False,
        help='Used for comparison to determine which translations in other locales should be" \
        "considered dangling',
    )

    Flags.PARSER.add_argument(
        '--missing',
        action='store_true',
        required=False,
        help='When set, only missing translations will be exported',
    )

    Flags.PARSER.add_argument(
        '--out_of_sync',
        action='store_true',
        required=False,
        help='When set, only out-of-sync translations will be exported',
    )

    Flags.PARSER.add_argument(
        '--input_file',
        type=str,
        required=False,
        help='Filename with translated text to upload to app (if applicable)',
    )

    Command.register_command(
        name='generate',
        description='Generate new translation files and keys for entire codebase',
        func=translations_generate,
    )

    Command.register_command(
        name='list_dangling_translations',
        description='List the IDs of all dangling translations.',
        func=translations_list_dangling,
        params=[
            Command.ParamCombination(
                optional_params=('--base_locale'),
                description='Base locale used to define dangling translations (default \"en\")',
            )
        ],
    )

    Command.register_command(
        name='list_dangling_references',
        description='List the IDs of all translation references that do not match a translation.',
        func=translations_list_dangling_ref,
    )

    Command.register_command(
        name='watch',
        description='Watch for new translations and automatically update i18n.js files',
        func=translations_watch,
        params=[Command.ParamCombination(optional_params='--verbose')],
    )

    Command.register_command(
        name='export',
        description='Export all I18N translations to a csv',
        func=translations_export,
        params=[
            Command.ParamCombination(
                required_params=('--locale', '--out'),
                optional_params=('--missing', '--out_of_sync'),
                description='Export all I18N translations for a given locale '
                'to a csv specified in --out',
            )
        ],
    )

    Command.register_command(
        name='list_out_of_sync',
        description='List all translations in i18n.js files tagged as out of sync',
        func=translations_list_out_of_sync,
    )

    Command.register_command(
        name='import',
        description='Import translations CSV into app. Required columns: filename, id, translation',
        func=translations_import,
        params=[
            Command.ParamCombination(
                required_params=('--locale', '--input_file'),
                description='Import new I18N translations for a given locale '
                'from the csv specified in --input_file',
            )
        ],
    )

    Command.register_command(
        name='add_locale',
        description='Add a new locale to the project',
        func=translations_add_locale,
        params=[
            Command.ParamCombination(
                required_params=('--locale'), description='ISO code for new locale'
            )
        ],
    )

    Command.initialize_commands()
    Command.run(Flags.ARGS.command)


if __name__ == '__main__':
    sys.exit(main())
