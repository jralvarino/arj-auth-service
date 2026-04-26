build-AuthFunction:
	npx esbuild src/handlers/login/index.ts \
		--bundle \
		--platform=node \
		--target=node22 \
		--format=cjs \
		--outfile="$(ARTIFACTS_DIR)/index.js" \
		--external:@aws-sdk/* \
		--sourcemap
	node -e "require('fs').writeFileSync('$(ARTIFACTS_DIR)/package.json', JSON.stringify({name:'arj-auth-service',version:'1.0.0'}))"

build-AuthorizerFunction:
	npx esbuild src/handlers/authorizer/index.ts \
		--bundle \
		--platform=node \
		--target=node22 \
		--format=cjs \
		--outfile="$(ARTIFACTS_DIR)/index.js" \
		--external:@aws-sdk/* \
		--sourcemap
	node -e "require('fs').writeFileSync('$(ARTIFACTS_DIR)/package.json', JSON.stringify({name:'arj-auth-service',version:'1.0.0'}))"
