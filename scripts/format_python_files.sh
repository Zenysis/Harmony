#!/bin/bash -e
# From https://github.com/google/yapf/blob/master/plugins/pre-commit.sh

EXCLUDE_REGEX="/(venv|venv_py2|venv_pypy|venv_pypy3|pypy|migrations)/"

if [ $# -gt 0 ]; then
  black --skip-string-normalization -t py37 --exclude="${EXCLUDE_REGEX}" $@
  exit $?
fi

# Find all staged Python files, and exit early if there aren't any.
PYTHON_FILES=()
while IFS=$'\n' read -r line; do PYTHON_FILES+=("$line"); done \
  < <(git diff --name-only --cached --diff-filter=AM | grep --color=never '.py$')
if [ ${#PYTHON_FILES[@]} -eq 0 ]; then
  exit 0
fi

########## PIP VERSION #############
# Verify that black is installed; if not, warn and exit.
if ! command -v black >/dev/null; then
  echo 'black not on path; can not format. Please install black:'
  echo '    pip install -r requirements-dev.txt'
  exit 2
fi

# Check for unstaged changes to files in the index.
CHANGED_FILES=()
while IFS=$'\n' read -r line; do CHANGED_FILES+=("$line"); done \
  < <(git diff --name-only "${PYTHON_FILES[@]}")
if [ ${#CHANGED_FILES[@]} -gt 0 ]; then
  echo 'You have unstaged changes to some files in your commit; skipping '
  echo 'auto-format. Please stage, stash, or revert these changes. You may '
  echo 'find `git stash -k` helpful here.'
  echo 'Files with unstaged changes:' "${CHANGED_FILES[@]}"
  exit 1
fi

# Format all staged files, then exit with an error code if any have uncommitted
# changes.
echo 'Formatting staged Python files . . .'

########## PIP VERSION #############
black --skip-string-normalization -t py37 --exclude="${EXCLUDE_REGEX}" "${PYTHON_FILES[@]}"
######### END PIP VERSION ##########

CHANGED_FILES=()
while IFS=$'\n' read -r line; do CHANGED_FILES+=("$line"); done \
  < <(git diff --name-only "${PYTHON_FILES[@]}")
if [ ${#CHANGED_FILES[@]} -gt 0 ]; then
  echo 'Reformatted staged files. Please review and stage the changes.'
  echo 'Files updated: ' "${CHANGED_FILES[@]}"
  exit 1
else
  exit 0
fi
