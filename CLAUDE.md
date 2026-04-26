# CLAUDE.md — arj-auth-service

## Security Directives

### Informações sensíveis no repositório

Este repositório contém informações sensíveis que **NÃO devem existir em um repositório público**. Ao trabalhar neste projeto, observe e corrija:

#### 1. AWS Account ID exposto
- **Arquivo**: [infrastructure/aws/deploy.sh:20](infrastructure/aws/deploy.sh#L20) — `CODEARTIFACT_OWNER` com valor hardcoded `679004717470`
- **Arquivo**: [.npmrc:3-5](.npmrc#L3) — ID da conta embutido na URL do CodeArtifact
- **Ação**: O account ID deve ser parametrizado via variável de ambiente (`CODEARTIFACT_OWNER`) sem default hardcoded, ou movido para um arquivo `.env` ignorado pelo git.

#### 2. `node_modules/` rastreado pelo git
- O diretório `node_modules/` está commitado no repositório. Isso expõe todas as dependências, aumenta desnecessariamente o tamanho do repo e pode ocultar pacotes maliciosos.
- **Ação**: Adicionar `node_modules/` ao `.gitignore` e removê-lo do tracking com `git rm -r --cached node_modules/`.

#### 3. Artefatos de build rastreados (`infrastructure/aws/.aws-sam/build/`)
- Arquivos compilados e source maps (`.js`, `.js.map`) gerados pelo SAM build estão commitados.
- O `build.toml` contém caminhos absolutos do sistema local (`/Users/alvarino.ribeiro/...`).
- **Ação**: Adicionar `infrastructure/aws/.aws-sam/` ao `.gitignore` e remover do tracking.

#### 4. Ausência de `.gitignore`
- O repositório não possui `.gitignore`, o que permite que arquivos sensíveis (`.env`, `node_modules`, builds) sejam commitados acidentalmente.
- **Ação**: Criar `.gitignore` cobrindo pelo menos: `node_modules/`, `infrastructure/aws/.aws-sam/`, `*.env`, `*.env.local`, `dist/`, `build/`.

### Regras para novos códigos

- **Nunca** hardcode AWS Account IDs, ARNs com account ID, tokens, secrets ou senhas em arquivos fonte.
- Segredos devem vir de variáveis de ambiente ou AWS SSM/Secrets Manager — padrão já usado em [src/services/auth/jwtSecret.ts](src/services/auth/jwtSecret.ts).
- Antes de criar qualquer arquivo de configuração (`.npmrc`, `samconfig.toml`, etc.), verificar se ele pode conter dados sensíveis e garantir que está no `.gitignore`.
- Arquivos de build e artefatos compilados nunca devem ser commitados.

### Checklist antes de cada commit

- [ ] Nenhum secret, token ou chave hardcoded
- [ ] `node_modules/` e `infrastructure/aws/.aws-sam/` não estão staged
- [ ] Arquivos `.env*` não estão staged
- [ ] `.gitignore` atualizado para novos artefatos gerados
