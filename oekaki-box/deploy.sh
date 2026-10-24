#!/usr/bin/env bash
# お絵描きボックス一括デプロイ:
#   sam build && sam deploy → フロントの API_BASE 差し込み → S3 同期 → CloudFront invalidation
# 使い方:
#   ./deploy.sh
#   OPEN_FROM=2026-10-01T00:00:00+09:00 OPEN_UNTIL=2026-10-31T23:59:59+09:00 \
#   NOTIFY_EMAIL=you@example.com TRIPO_API_KEY=tsk_xxx ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

for _py in /opt/homebrew/opt/python@3.12/bin /usr/local/opt/python@3.12/bin; do
  [ -d "${_py}" ] && PATH="${_py}:${PATH}"
done
export PATH

MISSING=0
for c in sam aws python3.12; do
  if ! command -v "$c" >/dev/null 2>&1; then
    echo "エラー: $c が見つかりません (saqra-portal/deploy.sh と同じ前提です。brew install aws-sam-cli awscli python@3.12)" >&2
    MISSING=1
  fi
done
[ "${MISSING}" -eq 1 ] && exit 1

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "エラー: AWS 認証情報が未設定または無効です。'aws configure' を実行してください (region: ap-northeast-1)" >&2
  exit 1
fi

STACK_NAME="${STACK_NAME:-oekaki-box}"
REGION="${AWS_REGION:-ap-northeast-1}"

PARAM_OVERRIDES=()
[ -n "${OPEN_FROM:-}" ] && PARAM_OVERRIDES+=("OpenFrom=${OPEN_FROM}")
[ -n "${OPEN_UNTIL:-}" ] && PARAM_OVERRIDES+=("OpenUntil=${OPEN_UNTIL}")
[ -n "${NOTIFY_EMAIL:-}" ] && PARAM_OVERRIDES+=("NotifyEmail=${NOTIFY_EMAIL}")
[ -n "${TRIPO_API_KEY:-}" ] && PARAM_OVERRIDES+=("TripoApiKey=${TRIPO_API_KEY}")
[ -n "${TRIPO_API_BASE:-}" ] && PARAM_OVERRIDES+=("TripoV3Base=${TRIPO_API_BASE}")
[ -n "${DAILY_MODEL_LIMIT:-}" ] && PARAM_OVERRIDES+=("DailyModelLimit=${DAILY_MODEL_LIMIT}")
[ -n "${RETENTION_DAYS:-}" ] && PARAM_OVERRIDES+=("RetentionDays=${RETENTION_DAYS}")

echo "==> sam build"
sam build

echo "==> sam deploy (stack: ${STACK_NAME}, region: ${REGION})"
DEPLOY_ARGS=(--stack-name "${STACK_NAME}" --region "${REGION}")
if [ "${#PARAM_OVERRIDES[@]}" -gt 0 ]; then
  DEPLOY_ARGS+=(--parameter-overrides "${PARAM_OVERRIDES[@]}")
fi
sam deploy "${DEPLOY_ARGS[@]}"

outputs() {
  aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
API_URL="$(outputs ApiUrl)"
BUCKET="$(outputs FrontendBucketName)"
DIST_ID="$(outputs DistributionId)"
FRONTEND_URL="$(outputs FrontendUrl)"

echo "==> フロントエンドに API_BASE を差し込み (${API_URL}/api)"
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "${BUILD_DIR}"' EXIT
for f in frontend/*.html; do
  sed "s|__API_BASE__|${API_URL}/api|g" "$f" > "${BUILD_DIR}/$(basename "$f")"
done

echo "==> S3 へ同期 (s3://${BUCKET})"
aws s3 sync "${BUILD_DIR}/" "s3://${BUCKET}/" --delete --region "${REGION}"

echo "==> CloudFront キャッシュ削除 (${DIST_ID})"
aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*" >/dev/null

echo ""
echo "================ デプロイ完了 ================"
echo "公開URL        : ${FRONTEND_URL}"
echo "受付状況の確認 : curl ${API_URL}/api/status"
echo "届いた絵の取得 : ./fetch.sh"
echo "=============================================="
