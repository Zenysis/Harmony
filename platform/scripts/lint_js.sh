#!/bin/bash
# Find all JS files that have changed with respect to some other branch or commit,
# and run eslint on them.

COMMIT=${COMMIT:-master}
CHANGED_FILES=$(git diff --diff-filter=d --name-only $COMMIT -- '*.js' '*.jsx')
COMMIT_HASH=$(git rev-parse ${COMMIT})

if [[ -n $(git log | grep $COMMIT_HASH) ]]; then
    if [ -n "$CHANGED_FILES" ]; then
        echo "Running eslint on changed JS files...";
        ./node_modules/.bin/eslint $CHANGED_FILES
    else
        echo "No JS files have changed.";
    fi
else
    echo "Your branch is not up to date, $COMMIT_HASH, from $COMMIT is not present on the current branch."
fi
