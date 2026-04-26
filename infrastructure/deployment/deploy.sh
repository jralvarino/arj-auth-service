#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./deploy.sh [app_id]
# Env overrides:
#   AWS_REGION, AWS_PROFILE, STACK_NAME, APP_ID, JWT_SECRET_PARAMETER_NAME, SAM_S3_BUCKET
#   CODEARTIFACT_DOMAIN, CODEARTIFACT_OWNER (required — AWS Account ID of the CodeArtifact domain)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
AWS_DIR="${ROOT_DIR}/infrastructure/aws"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -o allexport
  # shellcheck source=/dev/null
  source "${ROOT_DIR}/.env"
  set +o allexport
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-}"
STACK_NAME="${STACK_NAME:-arj-auth-service}"
APP_ID="${APP_ID:-${1:-financ}}"
JWT_SECRET_PARAMETER_NAME="${JWT_SECRET_PARAMETER_NAME:-/planly/jwt}"
SAM_S3_BUCKET="${SAM_S3_BUCKET:-}"

CODEARTIFACT_DOMAIN="${CODEARTIFACT_DOMAIN:?env var CODEARTIFACT_DOMAIN is required}"
CODEARTIFACT_OWNER="${CODEARTIFACT_DOMAIN_OWNER:?env var CODEARTIFACT_DOMAIN_OWNER is required}"
CODEARTIFACT_REPOSITORY="${CODEARTIFACT_REPOSITORY:?env var CODEARTIFACT_REPOSITORY is required}"
CODEARTIFACT_REGION="${CODEARTIFACT_REGION:-${AWS_REGION}}"

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: AWS CLI not found." >&2
  exit 1
fi

if ! command -v sam >/dev/null 2>&1; then
  echo "ERROR: SAM CLI not found." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found." >&2
  exit 1
fi

AWS_CMD=(aws)
if [[ -n "${AWS_PROFILE}" ]]; then
  AWS_CMD+=(--profile "${AWS_PROFILE}")
fi
AWS_CMD+=(--region "${AWS_REGION}")

echo "==> Authenticating with CodeArtifact..."
"${AWS_CMD[@]}" codeartifact login \
  --tool npm \
  --domain "${CODEARTIFACT_DOMAIN}" \
  --domain-owner "${CODEARTIFACT_OWNER}" \
  --region "${CODEARTIFACT_REGION}" \
  --repository "${CODEARTIFACT_REPOSITORY}"

echo "==> Installing dependencies..."
cd "${ROOT_DIR}"
npm install

echo "==> SAM build..."
cd "${AWS_DIR}"
sam build

echo "==> SAM deploy..."
SAM_DEPLOY_CMD=(
  sam deploy
  --stack-name "${STACK_NAME}"
  --region "${AWS_REGION}"
  --capabilities CAPABILITY_NAMED_IAM
  --parameter-overrides "AppId=${APP_ID}" "JwtSecretParameterName=${JWT_SECRET_PARAMETER_NAME}"
)

if [[ -n "${SAM_S3_BUCKET}" ]]; then
  SAM_DEPLOY_CMD+=(--s3-bucket "${SAM_S3_BUCKET}")
else
  SAM_DEPLOY_CMD+=(--resolve-s3)
fi

if [[ -n "${AWS_PROFILE}" ]]; then
  SAM_DEPLOY_CMD+=(--profile "${AWS_PROFILE}")
fi

"${SAM_DEPLOY_CMD[@]}"

echo ""
echo "Deploy completed successfully."
