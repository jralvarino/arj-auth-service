# CLAUDE.md — arj-auth-service

## General Directives

- **Language**: All content (code, comments, commit messages, documentation, script output) must be written in English.
- **Public repository**: This is a public repository. Never hardcode sensitive data of any kind — AWS Account IDs, ARNs, tokens, secrets, passwords, internal URLs, or environment-specific values. All sensitive configuration must come from environment variables or AWS SSM/Secrets Manager.

## Security Directives

### No hardcoded sensitive data

This is a **public repository**. The following are strictly forbidden in any committed file:

- AWS Account IDs, ARNs containing account IDs
- API keys, auth tokens, or bearer tokens
- Passwords or password hashes
- Private keys or certificates
- Internal domain names or URLs containing account/org identifiers
- SSM parameter names or paths that reveal internal naming conventions

Secrets must come from environment variables or AWS SSM/Secrets Manager — see the established pattern in [src/services/login/jwtSecret.ts](src/services/login/jwtSecret.ts).

### Known issues resolved

The following sensitive data exposures were identified and fixed (2026-04-25):

1. **AWS Account ID hardcoded** in `deploy.sh` and `.npmrc` — replaced with required env vars
2. **`node_modules/` committed to git** — removed from tracking, added to `.gitignore`
3. **SAM build artifacts committed** (`infrastructure/aws/.aws-sam/`) — removed from tracking, added to `.gitignore`
4. **`.npmrc` committed** — contains CodeArtifact URLs; added to `.gitignore`, generated at runtime by deployment scripts

### Configuration files

Before creating any config file (`.npmrc`, `samconfig.toml`, `.env`, etc.), verify it cannot contain sensitive data. If it can, add it to `.gitignore` before the first commit.

Build artifacts and compiled files must never be committed.

## Pre-commit Checklist

- [ ] No secrets, tokens, or keys hardcoded
- [ ] No AWS Account IDs in any file
- [ ] `node_modules/` and `infrastructure/aws/.aws-sam/` are not staged
- [ ] `.env*` files are not staged
- [ ] `.npmrc` is not staged
- [ ] `.gitignore` updated for any new generated artifacts
