#!/bin/bash
# Find all Python files that have changed with respect to some other branch or commit,
# and run pylint on them.

COMMIT=${COMMIT:-master}
CHANGED_FILES=$(git diff --diff-filter=d --name-only $COMMIT -- '*.py')
COMMIT_HASH=$(git rev-parse ${COMMIT})

if [[ -n $(git log | grep $COMMIT_HASH) ]]; then
    if [ -n "$CHANGED_FILES" ]; then
        echo "Running pylint on changed Python files...";
        source venv/bin/activate
        pylint --reports=no $CHANGED_FILES;
    else
        echo "No Python files have changed.";
    fi
else
    echo "Your branch is not up to date, $COMMIT_HASH, from $COMMIT is not present on the current branch."
fi
