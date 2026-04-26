import test from "node:test";
import assert from "node:assert/strict";

test("login controller exposes POST /auth/login route", async () => {
    const modulePath = new URL("../../../dist/controllers/login.controller.js", import.meta.url);
    const { routes } = await import(`${modulePath.href}?case=routes`);

    assert.ok(Array.isArray(routes));
    assert.ok(routes.some((route) => route.method === "POST" && route.path === "/auth/login"));
});
