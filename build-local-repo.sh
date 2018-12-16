#!/bin/sh
echo "Creating Local Repo"
rm -rf local-repo
mkdir local-repo
cp -rf dist local-repo
cp -rf node_modules local-repo
cp -rf package.json local-repo
cd local-repo && yarn link
echo "Local Repo Created"
