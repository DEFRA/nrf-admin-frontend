#!/bin/bash

# S3 buckets
aws s3 mb s3://data_backups

# SQS queues
aws sqs create-queue --queue-name cdp-uploader-download-requests
aws sqs create-queue --queue-name cdp-clamav-results
aws sqs create-queue --queue-name mock-clamav
aws sqs create-queue --queue-name cdp-uploader-scan-results-callback.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true
