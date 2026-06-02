#!/bin/bash

# S3 buckets
aws s3 mb s3://data_backups
# cdp-uploader stages incoming files here (config default S3_CDP_QUARANTINE_BUCKET)
# before the virus scan; without it uploads fail with NoSuchBucket and stay "initiated".
aws s3 mb s3://cdp-uploader-quarantine

# SQS queues
aws sqs create-queue --queue-name cdp-uploader-download-requests
aws sqs create-queue --queue-name cdp-clamav-results
aws sqs create-queue --queue-name mock-clamav
aws sqs create-queue --queue-name cdp-uploader-scan-results-callback.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true

# Virus-scan trigger: a PutObject to the quarantine bucket must fire an
# s3:ObjectCreated event onto the mock-clamav queue, which the (mock) scanner
# consumes. Without this notification the scan never starts and uploads sit at
# "pending" forever.
aws s3api put-bucket-notification-configuration \
  --bucket cdp-uploader-quarantine \
  --notification-configuration '{"QueueConfigurations":[{"QueueArn":"arn:aws:sqs:eu-west-2:000000000000:mock-clamav","Events":["s3:ObjectCreated:*"]}]}'
