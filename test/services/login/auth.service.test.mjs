import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

test("verifyToken returns decoded payload for a valid token", async () => {
    process.env.JWT_SECRET = "unit-test-secret";
    process.env.JWT_SECRET_PARAMETER_NAME = "";

    const modulePath = new URL("../../../dist/services/auth.service.js", import.meta.url);
    const { authService } = await import(`${modulePath.href}?case=valid-token`);

    const token = jwt.sign(
        {
            sub: "user-1",
            apps: ["financ"],
            name: "Test User",
        },
        "unit-test-secret",
        { algorithm: "HS256", expiresIn: "1h" }
    );

    const payload = await authService.verifyToken(token);

    assert.equal(payload.sub, "user-1");
    assert.deepEqual(payload.apps, ["financ"]);
    assert.equal(payload.name, "Test User");
});

test("verifyToken throws for an invalid token", async () => {
    process.env.JWT_SECRET = "unit-test-secret";
    process.env.JWT_SECRET_PARAMETER_NAME = "";

    const modulePath = new URL("../../../dist/services/auth.service.js", import.meta.url);
    const { authService } = await import(`${modulePath.href}?case=invalid-token`);

    await assert.rejects(() => authService.verifyToken("invalid-token"));
});
