#! /bin/bash
#
# To get CSS suitable for ALL browsers:   --autoprefix="> 0%"
node_modules/.bin/lessc --verbose --autoprefix="> 1%, Last 5 versions" nprogress.less nprogress.css
node_modules/.bin/lessc --verbose --autoprefix="> 1%, Last 5 versions" support/style.less support/style.css
node_modules/.bin/lessc --verbose --autoprefix="> 1%, Last 5 versions" test/test.less test/test.css

