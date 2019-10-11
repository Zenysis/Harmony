#!/bin/bash -e
NODE_ENV=production ./node_modules/webpack/bin/webpack.js -p --config web/webpack.prod.config.js --mode 'production'
