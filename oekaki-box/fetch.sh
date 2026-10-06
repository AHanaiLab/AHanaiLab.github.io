#!/usr/bin/env bash
# 事務局用: 届いた絵とメタデータ(ニックネーム・メッセージ)を ./inbox/ にダウンロードする
set -euo pipefail
cd "$(dirname "$0")"
STACK_NAME="${STACK_NAME:-oekaki-box}"
REGION="${AWS_REGION:-ap-northeast-1}"
BUCKET="$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='InboxBucketName'].OutputValue" --output text)"
mkdir -p inbox
aws s3 sync "s3://${BUCKET}/drawings/" inbox/ --region "${REGION}"
echo "保存先: $(pwd)/inbox  (件数: $(find inbox -name '*.png' | wc -l | tr -d ' '))"
