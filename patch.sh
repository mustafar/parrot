#!/usr/bin/env bash
set -o errexit

# this script is to patch swagger-express-middleware@3.0.0-alpha.5
# based on https://github.com/APIDevTools/swagger-express-middleware/pull/151

# 1) fix isOpenApi util method
file='./dist/node_modules/swagger-express-middleware-3/lib/helpers/util.js'
sed -i '' -e \
  "147s/.*/  return req.openapi !== undefined \&\& req.openapi.operation !== undefined;/" \
  $file

# 2) add basePath to openapi.api
file='./dist/node_modules/swagger-express-middleware-3/lib/middleware/metadata/index.js'
sed -i '' -e \
  "36s/.*/      basePath = util.normalizePath(basePath, router); context.api.basePath = basePath;/" \
  $file

# 3) add next() call to validate-request/validate-params middleware
file='./dist/node_modules/swagger-express-middleware-3/lib/middleware/validate-request/validate-params.js'
sed -i '' -e \
  "52s/.*/  } next();/" \
  $file

# 4) add next() call to validate-request/validate-request-body middleware
file='./dist/node_modules/swagger-express-middleware-3/lib/middleware/validate-request/validate-request-body.js'
sed -i '' -e \
  "13s/.*/  } next();/" \
  $file

# 5) add next() call to validate-request/validate-content-length middleware
file='./dist/node_modules/swagger-express-middleware-3/lib/middleware/validate-request/validate-content-length.js'
sed -i '' -e \
  "24s/.*/  } next();/" \
  $file
