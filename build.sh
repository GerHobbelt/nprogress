#! /bin/bash
node_modules/.bin/lessc --verbose nprogress.less nprogress.css
node_modules/.bin/lessc --verbose support/style.less support/style.css
node_modules/.bin/lessc --verbose test/test.less test/test.css

