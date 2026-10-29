import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAuth, validateEmail, validatePasswordUpdate } from "../src/lib/validation.ts";
import { AuthConfigurationError, authErrorMessage } from "../src/lib/auth.ts";

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
