#!/usr/bin/env python
# Create a default admin account for a deployment in the dev database.
import subprocess
import sys

from typing import Tuple

from pylib.base.flags import Flags
from pylib.file.file_utils import FileUtils


def guess_zenysis_email(git_email: str) -> str:
    # Try to figure out what the user's zenysis.com email address is if they have not
    # set it up in their git config.
    # NOTE(stephen): Relying on the mostly-well-maintained git mailmap that is used for
    # internal zenysis pipeline commit stats.
    mailmap_lines = FileUtils.FileContents(
        'pipeline/zen/static_data/git-mailmap'
    ).split('\n')

    email_token = f'<{git_email}>'
    for line in mailmap_lines:
        if email_token not in line or '@zenysis.com>' not in line:
            continue

        # Extract the username portion of the email address. This is easier than trying
        # to actually parse the mailmap line format.
        email_end_idx = line.index('@zenysis.com>')
        email_start_idx = line.rfind('<', 0, email_end_idx) + 1
        email_username = line[email_start_idx:email_end_idx]
        return f'{email_username}@zenysis.com'

    # If we've made it this far, no email could be deduced.
    return ''


def deduce_user_data() -> Tuple[str, str, str, str]:
    git_user = subprocess.check_output(
        'git config user.name', shell=True, text=True
    ).strip()
    git_email = subprocess.check_output(
        'git config user.email', shell=True, text=True
    ).strip()

    # Parse the git user name into a first and last name, if possible.
    first_name = git_user.title()
    last_name = ''
    if ' ' in first_name:
        (first_name, last_name) = first_name.rsplit(' ', 1)

    # If the user's email address ends with zenysis.com, we're good! Nothing more to do.
    if git_email.endswith('@zenysis.com'):
        return (first_name, last_name, git_email, git_email)

    # If the user's email address does not end with zenysis.com, we have to do a lot
    # more work to try and figure out what the true email is.
    return (first_name, last_name, guess_zenysis_email(git_email), git_email)


def main():
    Flags.PARSER.add_argument(
        'db_name',
        type=str,
        help='The dev database name to add a default admin user for.',
    )
    Flags.InitArgs()

    (first_name, last_name, zenysis_email, git_email) = deduce_user_data()

    if not zenysis_email:
        print(
            'Unable to create admin user. Cannot find @zenysis.com email address',
            f'for git user email {git_email}',
        )
        return 7

    args = [
        '-d',
        f'postgresql://postgres:@localhost/{Flags.ARGS.db_name}',
        '-p',
        'zenysis',
        '-a',
        '-u',
        zenysis_email,
        '-f',
        first_name,
    ]
    if last_name:
        args.extend(['-l', last_name])

    result = subprocess.run(
        ['scripts/create_user.py', *args],
        check=False,
        cwd=FileUtils.GetSrcRoot(),
        stderr=subprocess.STDOUT,
        stdout=subprocess.PIPE,
        text=True,
    )

    if result.returncode != 0:
        print('Error creating user')
        print(result.stdout)
        return 1

    print(f'Default user created. Username: {zenysis_email} Password: zenysis')
    return 0


if __name__ == '__main__':
    sys.exit(main())
