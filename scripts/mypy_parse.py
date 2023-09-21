''' Given a mypy error message, parse it and output a GitHub Actions annotation '''
import sys


def parse(argument: str):
    '''Assumed mypy was run with: --show-column-numbers --no-color-output'''
    try:
        if argument.startswith('Found'):
            print(f'::error title=mypy::{argument}')
            sys.exit(1)
        if argument.startswith('Success:'):
            print(f'::debug title=mypy::{argument}')
        elif ':' in argument:
            path, line, col, level, message = [
                part.strip() for part in argument.split(':')
            ]
            print(f'::{level} title=mypy,file={path},line={line},col={col}::{message}')
    except ValueError:
        print(f'::error title=mypy::Failed to parse mypy error: {argument}')
        sys.exit(1)


if __name__ == "__main__":
    parse(' '.join(sys.argv[1:]))
