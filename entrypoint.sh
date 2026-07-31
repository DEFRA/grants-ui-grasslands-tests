#!/bin/sh

echo "run_id: $RUN_ID"

# Execute passed command, e.g. 'npm test' or 'npm run test:ci'
echo "Executing: $@"
"$@"
test_exit_code=$?

if [ $test_exit_code -ne 0 ]; then
  touch FAILED
fi

# Publish report if running in CDP only, i.e. not in GitHub CI
if [ -n "${CDP_HTTP_PROXY}" ]; then
  npm run report:publish
  publish_exit_code=$?

  if [ $publish_exit_code -ne 0 ]; then
    echo "failed to publish test results"
    exit $publish_exit_code
  fi
fi

# At the end of the test run, if the suite has failed we write a file called 'FAILED'
if [ -f FAILED ]; then
  echo "test suite failed"
  exit 1
fi

echo "test suite passed"
exit 0
