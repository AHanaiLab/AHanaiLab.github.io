#!/usr/bin/env bash
# 事務局用: 届いた絵とメタデータ(ニックネーム・メッセージ)をダウンロードする。
# 保存先の優先順位:
#   1. 環境変数 DEST (例: DEST="$HOME/Library/CloudStorage/GoogleDrive-xxx/マイドライブ/お絵描き" ./fetch.sh)
#   2. Google ドライブ for desktop の「マイドライブ/お絵描きボックス」(自動検出)
#   3. ./inbox
# 取得済みのファイルは再ダウンロードされません(差分のみ)。
set -euo pipefail
cd "$(dirname "$0")"
STACK_NAME="${STACK_NAME:-oekaki-box}"
REGION="${AWS_REGION:-ap-northeast-1}"

if [ -z "${DEST:-}" ]; then
  for root in "$HOME"/Library/CloudStorage/GoogleDrive-*/マイドライブ \
              "$HOME"/Library/CloudStorage/GoogleDrive-*/"My Drive"; do
    if [ -d "${root}" ]; then DEST="${root}/お絵描きボックス"; break; fi
  done
fi
DEST="${DEST:-$(pwd)/inbox}"

BUCKET="$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='InboxBucketName'].OutputValue" --output text)"
mkdir -p "${DEST}"
aws s3 sync "s3://${BUCKET}/drawings/" "${DEST}/" --region "${REGION}"
echo "保存先: ${DEST}  (件数: $(find "${DEST}" -name '*.png' | wc -l | tr -d ' '))"
