import { test } from "node:test";
import assert from "node:assert/strict";
import { isLegacyAuthReturn } from "../src/lib/auth-return.ts";

test("ordinary home-page links keep the landing page", () => {
  assert.equal(isLegacyAuthReturn("", ""), false);
  assert.equal(isLegacyAuthReturn("?utm_source=whatsapp", "#intro-start"), false);
});

test("existing PKCE and confirmation email returns go to the login flow", () => {
  assert.equal(isLegacyAuthReturn("?code=test-code", ""), true);
  assert.equal(isLegacyAuthReturn("?token_hash=test-hash&type=signup", ""), true);
});

test("implicit recovery and failed email returns stay in the authentication flow", () => {
  assert.equal(isLegacyAuthReturn("", "#access_token=test-token&refresh_token=test-refresh&type=recovery"), true);
  assert.equal(isLegacyAuthReturn("", "#type=recovery"), true);
  assert.equal(isLegacyAuthReturn("?error=access_denied&error_code=otp_expired", ""), true);
  assert.equal(isLegacyAuthReturn("", "#error=access_denied&error_description=Expired"), true);
});
