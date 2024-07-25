#!/bin/bash

pushd $(dirname $0) &>/dev/null

./create_user.py -f Render -l Bot -u 'renderbot@zenysis.com' -s ACTIVE -a
./create_user.py --automation_user

popd &> /dev/null
