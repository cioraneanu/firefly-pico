#!/bin/sh
# Builds the web app in ../front and copies it to WebApp/, which the iOS app bundles and serves at pico://localhost.
# Run it before building the app, and again after changing the web app (not needed with PICO_DEV_SERVER).
set -e
cd "$(dirname "$0")/../../front"
npm run generate
rsync -a --delete --exclude '*.gz' --exclude '*.br' .output/public/ ../ios/WebApp/
echo "Copied the web app to ios/WebApp"
