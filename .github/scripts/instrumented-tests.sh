#!/usr/bin/env bash
# Copyright (c) 2026. valo.media GmbH
# Licensed under the Apache License, Version 2.0.

set -euo pipefail

screenshots="${GITHUB_WORKSPACE}/build/instrumented-test-screenshots"
rm -rf "${screenshots}"
adb shell rm -rf /sdcard/Download/jetnews-test-screenshots

./gradlew connectedCheck --no-daemon --stacktrace

mkdir -p "${screenshots}"
adb pull /sdcard/Download/jetnews-test-screenshots/. "${screenshots}"
for name in main-activity-home-feed main-activity-navigation-destinations main-activity-article; do
  if [ ! -s "${screenshots}/${name}.png" ]; then
    echo "::error::Missing instrumented test screenshot: ${name}.png"
    exit 1
  fi
done
