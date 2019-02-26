#!/usr/bin/env bash
set -o errexit

PARROT_NAME='mustafar/parrot'
PARROT_ROOT=$(pwd)

if [ $(docker ps -a -q --filter="ancestor=${PARROT_NAME}" | wc -l) -gt 0 ]; then
  echo 'stopping already running containers...'
  docker stop $(docker ps -a -q --filter="ancestor=${PARROT_NAME}")
  docker rm $(docker ps -a -q --filter="ancestor=${PARROT_NAME}")
fi

echo 'building image...'
docker build -t ${PARROT_NAME} dist

echo '\nstarting container...'
docker run -d --name parrot \
-e PORT=15009 \
-e VERBOSE=on \
-p 15009:15009 \
-e SWAGGER_SPEC="/swagger.yml" \
-v "${PARROT_ROOT}/__tests__/swagger.yml":/swagger.yml \
${PARROT_NAME}:latest

echo 'container started!'
