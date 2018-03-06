#!/usr/bin/env bash
set -o errexit

if [ $(git rev-parse --abbrev-ref HEAD) != "master" ]; then
  echo "this script runs only against master"
  exit 1
fi

docker_image_name='mustafar/parrot'

if [ -z $1 ]; then
  echo "release type not provided"
  exit 1
fi

if [ $1 == "patch" ]; then
  echo "starting patch release"
  npm version patch
elif [ $1 == "minor" ]; then
  echo "starting minor release"
  npm version minor
elif [ $1 == "major" ]; then
  echo "starting major release"
  npm version major
else
  echo "invalid release type"
  exit 1
fi

npm run build && npm run test:setup
version=v$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')
echo "version: $version"

git add package.json
git commit -m "chore: $1 release" package.json --no-verify
git tag $version
git push origin master
git push origin $version

docker tag $docker_image_name $docker_image_name:$version
docker push $docker_image_name
