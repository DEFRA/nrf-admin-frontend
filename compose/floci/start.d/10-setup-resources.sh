#!/bin/bash

# S3 buckets
aws s3 mb s3://data_backups

# SQS queues
#aws sqs create-queue --queue-name my-queue
