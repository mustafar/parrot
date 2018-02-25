#!/usr/bin/env bash
set -o errexit

docker build -t mustafar/parrot dist
docker run mustafar/parrot:latest
