#!/usr/bin/env bash
set -o errexit

# this script is to patch swagger-express-middleware@3.0.0-alpha.5
# based on https://github.com/APIDevTools/swagger-express-middleware/pull/151

function change_file {
  file=$1
  line_num=$2
  line=$3

  kernel=$(uname -s)

  if [ ${kernel} = "Darwin" ]; then
    sed -i '' -e \
      "${line_num}s/.*/${line}/" \
      ${file}
  else
    sed -i \
      "${line_num}s/.*/${line}/" \
      ${file}
  fi
}

# 1) fix isOpenApi util method
file='./dist/node_modules/swagger-express-middleware-3/lib/helpers/util.js'
change_file $file 147 "  return req.openapi !== undefined \&\& req.openapi.operation !== undefined;"

# 2) add basePath to openapi.api
file='./dist/node_modules/swagger-express-middleware-3/lib/middleware/metadata/index.js'
change_file $file 36 "      basePath = util.normalizePath(basePath, router); context.api.basePath = basePath;"

# 3) add next() call to validate-request/validate-params middleware
file='./dist/node_modules/swagger-express-middleware-3/lib/middleware/validate-request/validate-params.js'
change_file $file 52 "  } next();"

# 4) add next() call to validate-request/validate-request-body middleware
file='./dist/node_modules/swagger-express-middleware-3/lib/middleware/validate-request/validate-request-body.js'
change_file $file 13 "  } next();"

# 5) add next() call to validate-request/validate-content-length middleware
file='./dist/node_modules/swagger-express-middleware-3/lib/middleware/validate-request/validate-content-length.js'
change_file $file 24 "  } next();"
