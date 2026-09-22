import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const frontend = await readFile(new URL("../blog.js", import.meta.url), "utf8");
const bridge = await readFile(new URL("../supabase/functions/blog-admin/index.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/202609220001_secure_blog_posts.sql", import.meta.url), "utf8");

const establishedUids = [
  "372c6a7f-4e6b-49fa-8228-183b46cbdede",
  "bd126b9b-aa23-42e0-85f5-4560cab8fc57",
  "7348ca2f-147d-4a3b-b9d2-a854c4a12430"
];

assert.match(frontend, /ADMIN_AUTH_URL = "https:\/\/bkjqaetxwvcdciieevvs\.supabase\.co"/);
assert.match(frontend, /BLOG_SUPABASE_URL = "https:\/\/kscbrnmhqugcwfohczve\.supabase\.co"/);
assert.doesNotMatch(frontend, /service_role|SERVICE_ROLE/i, "browser bundle must not contain a service-role credential");
assert.doesNotMatch(frontend, /db\.from\("posts"\)\.(insert|update|delete)/, "browser must not write posts directly");
assert.match(frontend, /\.eq\("published", true\)/, "anonymous reads must explicitly request published posts");

for (const uid of establishedUids) {
  assert.ok(frontend.includes(uid), `frontend is missing established administrator UID ${uid}`);
  assert.ok(bridge.includes(uid), `bridge is missing established administrator UID ${uid}`);
}

assert.match(bridge, /\/auth\/v1\/user/, "bridge must validate the token with the shared Auth authority");
assert.match(bridge, /ADMIN_UIDS\.has\(user\.id\)/, "bridge must enforce the administrator UID allowlist");
assert.match(bridge, /SUPABASE_SERVICE_ROLE_KEY/, "only the server-side bridge may use the runtime service role");
assert.match(bridge, /request\.method === "POST"/);
assert.match(bridge, /request\.method === "PATCH"/);
assert.match(bridge, /request\.method === "DELETE"/);

assert.match(migration, /enable row level security/i);
assert.match(migration, /revoke insert, update, delete[^;]+from anon, authenticated/is);
assert.match(migration, /using \(published is true\)/i);

console.log("Cross-project blog authorization checks passed.");
