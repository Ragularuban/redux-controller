#!/bin/sh
# postinstall.sh

# TL;DR node require() and react-native require() types conflict, so I'm
# commenting out the node type definition since we're in a RN env.
# https://github.com/DefinitelyTyped/DefinitelyTyped/issues/15960
# https://github.com/aws/aws-amplify/issues/281
# https://github.com/aws/aws-sdk-js/issues/1926

# Make sed behave on all platforms.
# https://stackoverflow.com/a/38595160s
echo "Removing duplicate declare var require: NodeRequire; in @types/node";
cross_platform_sed () {
  sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

cross_platform_sed "s/\(^declare var require: NodeRequire;\)/\/\/\1/g" node_modules/\@types/node/index.d.ts