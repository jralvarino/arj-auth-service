#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./deploy.sh [app_id]
# Env overrides:
#   AWS_REGION, AWS_PROFILE, STACK_NAME, APP_ID, JWT_SECRET_PARAMETER_NAME, SAM_S3_BUCKET
#   CODEARTIFACT_DOMAIN, CODEARTIFACT_OWNER (obrigatório — AWS Account ID do domínio CodeArtifact)

AWS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${AWS_DIR}/../.." && pwd)"

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-}"
STACK_NAME="${STACK_NAME:-arj-auth-service}"
APP_ID="${APP_ID:-${1:-financ}}"
JWT_SECRET_PARAMETER_NAME="${JWT_SECRET_PARAMETER_NAME:-/planly/jwt}"
SAM_S3_BUCKET="${SAM_S3_BUCKET:-}"

CODEARTIFACT_DOMAIN="${CODEARTIFACT_DOMAIN:-arj}"
CODEARTIFACT_OWNER="${CODEARTIFACT_OWNER:?'Defina CODEARTIFACT_OWNER com o AWS Account ID do domínio CodeArtifact'}"

if ! command -v aws >/dev/null 2>&1; then
  echo "Erro: AWS CLI nao encontrado."
  exit 1
fi

if ! command -v sam >/dev/null 2>&1; then
  echo "Erro: SAM CLI nao encontrado."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Erro: npm nao encontrado."
  exit 1
fi

AWS_CMD=(aws)
if [[ -n "${AWS_PROFILE}" ]]; then
  AWS_CMD+=(--profile "${AWS_PROFILE}")
fi
AWS_CMD+=(--region "${AWS_REGION}")

echo "Configurando CodeArtifact..."
"${AWS_CMD[@]}" codeartifact login \
  --tool npm \
  --domain "${CODEARTIFACT_DOMAIN}" \
  --domain-owner "${CODEARTIFACT_OWNER}" \
  --repository common-utils-layer

echo "Instalando dependencias..."
cd "${ROOT_DIR}"
npm install

echo "Build SAM..."
cd "${AWS_DIR}"
sam build

echo "Deploy SAM..."
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

echo "Deploy concluido com sucesso."
