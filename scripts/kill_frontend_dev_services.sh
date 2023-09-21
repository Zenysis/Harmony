#!/bin/bash -eu
set -o pipefail

ZEN_SRC_ROOT=$(git rev-parse --show-toplevel)

pushd "${ZEN_SRC_ROOT}" &> /dev/null

echo 'Finding and killing frontend dev services'

# Kill webpack.
if pgrep -f 'webpack' > /dev/null ; then
  echo 'Killing webpack'
  pkill -2 -f 'webpack'
fi

# Kill our custom flow watching program (not used by everyone).
if pgrep -f 'watch_flow' > /dev/null ; then
  echo 'Killing watch_flow.py monitoring script'
  pkill -2 -f 'watch_flow'
fi

# Stop the flow server. The only one we can gracefully shut down!
if pgrep -f 'flow-bin' > /dev/null ; then
  echo 'Stopping flow-bin monitor'
  node_modules/.bin/flow stop
fi

# Kill the eslint daemon server.
if pgrep -f 'eslint_d' > /dev/null ; then
  echo 'Killing eslint daemon'
  pkill -2 -f 'eslint_d'
fi

# Kill the prettier daemon server.
if pgrep -f 'prettier_d' > /dev/null ; then
  echo 'Killing prettier daemon'
  pkill -2 -f 'prettier_d'
fi

# Kill the stylelint daemon server.
if pgrep -f 'stylelint_d' > /dev/null ; then
  echo 'Killing stylelint daemon'
  pkill -2 -f 'stylelint_d'
fi

echo 'Finished'
popd &> /dev/null
