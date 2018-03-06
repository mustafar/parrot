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

echo 'here 1'
git add package.json
echo 'here 2'
git commit -m "chore: $1 release" package.json --no-verify --allow-empty
echo 'here 3'
git push origin master
echo 'here 4'
git tag $version --force
echo 'here 5'
git push origin $version
echo 'here 6'

docker tag $docker_image_name $docker_image_name:$version
docker push $docker_image_name
