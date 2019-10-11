#!/bin/bash -e
./node_modules/.bin/webpack-dashboard -- node_modules/.bin/webpack-dev-server --config web/webpack.config.js --mode 'development'
