#!/usr/bin/env bash
set -o errexit

PARROT_NAME='mustafar/parrot'
PARROT_ROOT=$(pwd)

# stop running containers
npm run docker:stop 2>/dev/null || true

echo 'building image...'
docker build -t ${PARROT_NAME} dist

echo '\nstarting swagger2 container...'
docker run -d --name parrot-swagger2 \
-e PORT=15009 \
-e VERBOSE=on \
-p 15009:15009 \
-e API_SPEC="/spec.yml" \
-v "${PARROT_ROOT}/__tests__/swagger2.yml":/spec.yml \
${PARROT_NAME}:latest

echo '\nstarting openapi3 container...'
docker run -d --name parrot-openapi3 \
-e PORT=15010 \
-e VERBOSE=on \
-p 15010:15010 \
-e API_SPEC="/spec.yml" \
-e IS_OAS3="true" \
-v "${PARROT_ROOT}/__tests__/openapi3.yml":/spec.yml \
${PARROT_NAME}:latest

echo 'containers started!'
