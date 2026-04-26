import test from "node:test";
import assert from "node:assert/strict";

test("resolveJwtSecret returns JWT_SECRET env when provided", async () => {
    process.env.JWT_SECRET = "unit-test-secret";
    process.env.JWT_SECRET_PARAMETER_NAME = "";

    const modulePath = new URL("../../../dist/services/jwtSecret.js", import.meta.url);
    const { resolveJwtSecret } = await import(`${modulePath.href}?case=env-secret`);

    const secret = await resolveJwtSecret();
    assert.equal(secret, "unit-test-secret");
});
