#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./aws/add-user.sh --email user@example.com --password "secret" --apps "financ,admin" [--name "User Name"] [--avatar "https://..."]
# Env overrides:
#   AWS_REGION, AWS_PROFILE, USER_TABLE_NAME

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-}"
USER_TABLE_NAME="${USER_TABLE_NAME:-user}"

EMAIL=""
PASSWORD=""
APPS_CSV=""
NAME=""
AVATAR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --email)
      EMAIL="${2:-}"
      shift 2
      ;;
    --password)
      PASSWORD="${2:-}"
      shift 2
      ;;
    --apps)
      APPS_CSV="${2:-}"
      shift 2
      ;;
    --name)
      NAME="${2:-}"
      shift 2
      ;;
    --avatar)
      AVATAR="${2:-}"
      shift 2
      ;;
    *)
      echo "Argumento invalido: $1"
      exit 1
      ;;
  esac
done

if [[ -z "${EMAIL}" || -z "${PASSWORD}" || -z "${APPS_CSV}" ]]; then
  echo "Uso: ./aws/add-user.sh --email user@example.com --password \"secret\" --apps \"financ,admin\" [--name \"User Name\"] [--avatar \"https://...\"]"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "Erro: AWS CLI nao encontrado."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Erro: Node.js nao encontrado."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)"
cd "${ROOT_DIR}"

AWS_CMD=(aws)
if [[ -n "${AWS_PROFILE}" ]]; then
  AWS_CMD+=(--profile "${AWS_PROFILE}")
fi
AWS_CMD+=(--region "${AWS_REGION}")

PASSWORD_HASH="$(node --input-type=module -e "import bcrypt from 'bcryptjs'; const password = process.argv[1]; console.log(await bcrypt.hash(password, 10));" "${PASSWORD}")"
USER_ID="$(node --input-type=module -e "import { randomUUID } from 'node:crypto'; console.log(randomUUID());")"
CREATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ITEM_JSON="$(node --input-type=module -e '
const email = process.argv[1].trim().toLowerCase();
const passwordHash = process.argv[2];
const appsCsv = process.argv[3];
const userId = process.argv[4];
const createdAt = process.argv[5];
const name = process.argv[6];
const avatar = process.argv[7];
const apps = appsCsv.split(",").map((v) => v.trim()).filter(Boolean);
if (apps.length === 0) {
  throw new Error("apps deve conter pelo menos 1 valor.");
}
const item = {
  userId: { S: userId },
  email: { S: email },
  passwordHash: { S: passwordHash },
  apps: { L: apps.map((app) => ({ S: app })) },
  createdAt: { S: createdAt }
};
if (name) item.name = { S: name };
if (avatar) item.avatar = { S: avatar };
process.stdout.write(JSON.stringify(item));
' "${EMAIL}" "${PASSWORD_HASH}" "${APPS_CSV}" "${USER_ID}" "${CREATED_AT}" "${NAME}" "${AVATAR}")"

echo "Criando usuario ${EMAIL} na tabela ${USER_TABLE_NAME}..."
"${AWS_CMD[@]}" dynamodb put-item \
  --table-name "${USER_TABLE_NAME}" \
  --item "${ITEM_JSON}" \
  --condition-expression "attribute_not_exists(userId)"

echo "Usuario criado com sucesso."
echo "userId: ${USER_ID}"
echo "email: ${EMAIL,,}"
echo "apps: ${APPS_CSV}"
