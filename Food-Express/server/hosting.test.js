import assert from "node:assert/strict";
import process from "node:process";
import { after, test } from "node:test";
import { once } from "node:events";

process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/food_express_test";
process.env.JWT_SECRET = "test-only-secret-with-more-than-thirty-two-characters";
process.env.NODE_ENV = "development";

const { app } = await import("./index.js");
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const baseUrl = `http://127.0.0.1:${server.address().port}`;

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("combined server serves the frontend at its root", async () => {
  const response = await fetch(`${baseUrl}/`);
  assertResponseOk(response);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(await response.text(), /<div id="root"><\/div>/);
});

test("combined server serves the frontend for client-side routes", async () => {
  const response = await fetch(`${baseUrl}/restaurants`);
  assertResponseOk(response);
  assert.match(response.headers.get("content-type"), /text\/html/);
});

test("combined server keeps health and unknown API routes under the API", async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assertResponseOk(health);
  assert.deepEqual(await health.json(), { status: "ok" });

  const missingApi = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(missingApi.status, 404);
  assert.deepEqual(await missingApi.json(), { error: "API endpoint not found." });
});

test("API allows Vite requests from either local development hostname", async () => {
  for (const origin of ["http://localhost:5173", "http://127.0.0.1:5173"]) {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: origin },
    });
    assertResponseOk(response);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
  }
});

function assertResponseOk(response) {
  if (!response.ok) {
    throw new Error(`Expected a successful response; received ${response.status}.`);
  }
}
