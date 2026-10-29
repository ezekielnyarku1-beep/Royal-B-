import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAuth, validateEmail, validatePasswordUpdate } from "../src/lib/validation.ts";
import { AuthConfigurationError, authErrorMessage } from "../src/lib/auth.ts";
import { authErrorReference } from "../src/lib/auth-errors.ts";

const values = { name: "Ama Mensah", email: "ama@example.com", password: "a secure passphrase", confirmPassword: "a secure passphrase", remember: false };

test("login accepts existing provider passwords without applying signup rules", () => {
  assert.deepEqual(validateAuth({ ...values, name: "", password: "old", confirmPassword: "" }, "login"), {});
});
test("blank submissions produce friendly errors for every required field", () => {
  const errors = validateAuth({ name: "", email: " ", password: "", confirmPassword: "", remember: false }, "signup");
  assert.deepEqual(Object.keys(errors).sort(), ["confirmPassword", "email", "name", "password"]);
});
test("signup rejects short and mismatched passwords", () => {
  const errors = validateAuth({ ...values, password: "short" }, "signup");
  assert.match(errors.password!, /8 characters/);
  assert.match(errors.confirmPassword!, /don't match/);
});
test("email validates whitespace and rejects invalid addresses", () => {
  assert.equal(validateEmail("  ama@example.com  "), undefined);
  for (const email of ["", " ", "ama", "ama@", "ama@example", "ama @example.com"]) assert.ok(validateEmail(email));
});
test("valid signup accepts Unicode names and passphrases", () => {
  assert.deepEqual(validateAuth({ ...values, name: "Ési Osei" }, "signup"), {});
});
test("password updates require a strong matching confirmation", () => {
  assert.deepEqual(validatePasswordUpdate("secure passphrase", "secure passphrase"), {});
  assert.match(validatePasswordUpdate("short", "different").password!, /8 characters/);
  assert.match(validatePasswordUpdate("secure passphrase", "different").confirmPassword!, /don't match/);
});
test("authentication errors stay generic except for missing configuration", () => {
  assert.equal(authErrorMessage(new Error("Invalid login credentials")), "We couldn't complete that request. Please try again in a moment.");
  assert.match(authErrorMessage(new AuthConfigurationError()), /aren't configured/);
});

test("known signup failures explain email delivery, rate limits and password requirements", () => {
  assert.match(authErrorMessage({ code: "email_address_not_authorized" }), /Confirmation emails are not enabled for new customer addresses/);
  assert.match(authErrorMessage({ code: "over_email_send_rate_limit" }), /Confirmation emails are temporarily limited/);
  assert.match(authErrorMessage({ code: "signup_disabled" }), /New accounts are temporarily unavailable/);
  assert.match(authErrorMessage({ code: "email_address_invalid" }), /valid email address/);
  assert.match(authErrorMessage({ code: "weak_password", reasons: ["characters"] }), /uppercase and lowercase letters, a number and a symbol/);
  assert.match(authErrorMessage({ code: "weak_password", reasons: ["pwned"] }), /choose a unique password/);
  assert.match(authErrorMessage({ code: "email_not_confirmed" }), /confirm your email before logging in/);
  assert.match(authErrorMessage({ name: "AuthRetryableFetchError" }), /check your internet connection/);
});

test("safe error references do not expose raw messages or account existence", () => {
  const raw = "Private backend detail or user@example.com";
  assert.equal(authErrorReference({ code: "over_email_send_rate_limit", message: raw }), "over_email_send_rate_limit");
  assert.equal(authErrorReference({ code: raw }), undefined);
  assert.equal(authErrorReference({ name: "AuthRetryableFetchError" }), "account_connection");
  assert.equal(authErrorMessage({ code: "constructor", message: raw }), "We couldn't complete that request. Please try again in a moment.");
  assert.equal(authErrorMessage({ code: "email_exists" }), authErrorMessage({ code: "user_already_exists" }));
  assert.ok(!authErrorMessage({ code: "unexpected_failure", message: raw }).includes(raw));
});
