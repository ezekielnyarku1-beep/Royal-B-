type ProviderError = { code?: unknown; name?: unknown; status?: unknown; reasons?: unknown };

const messages: Record<string, string> = {
  email_address_not_authorized: "Confirmation emails are not enabled for new customer addresses yet. Please contact Big B Royale so we can fix email delivery.",
  over_email_send_rate_limit: "Confirmation emails are temporarily limited. Please try again later, or contact Big B Royale if this keeps happening.",
  over_request_rate_limit: "Too many attempts have been made. Please wait before trying again.",
  signup_disabled: "New accounts are temporarily unavailable. Please contact Big B Royale.",
  email_provider_disabled: "Email signup is temporarily unavailable. Please contact Big B Royale.",
  email_address_invalid: "Please use a valid email address that can receive confirmation emails.",
  email_not_confirmed: "Please confirm your email before logging in. Check your inbox and spam folder for the confirmation link.",
  invalid_credentials: "The email or password is incorrect. Please check your details and try again.",
  user_already_exists: "Please check your email for next steps. If you have already registered, log in or use Forgot password.",
  email_exists: "Please check your email for next steps. If you have already registered, log in or use Forgot password.",
  captcha_failed: "Account verification could not be completed. Please try again, or contact Big B Royale if it continues.",
  request_timeout: "Account services took too long to respond. Please check your connection and try again.",
  same_password: "Please choose a password different from your current password.",
  otp_expired: "This email link has expired. Please request a new link and try again.",
  flow_state_expired: "This email link has expired. Please request a new link and open it in the same browser.",
  bad_code_verifier: "Please open the confirmation link in the same browser where you started, or request a new link.",
};

function providerError(error: unknown): ProviderError | null {
  return error !== null && typeof error === "object" ? error as ProviderError : null;
}

/** Safe support reference only: no raw API messages, addresses or credentials. */
export function authErrorReference(error: unknown): string | undefined {
  const value = providerError(error);
  if (typeof value?.code === "string" && /^[a-z][a-z_]{0,63}$/.test(value.code)) return value.code;
  if (value?.name === "AuthRetryableFetchError") return "account_connection";
}

export function providerErrorMessage(error: unknown): string {
  const value = providerError(error);
  const code = authErrorReference(error);
  if (code === "weak_password") {
    const reasons = Array.isArray(value?.reasons) ? value.reasons : [];
    if (reasons.includes("pwned")) return "This password is too common or has appeared in a data breach. Please choose a unique password.";
    if (reasons.includes("characters")) return "Please use a password with uppercase and lowercase letters, a number and a symbol.";
    return "Your password does not meet the account security requirements. Please choose a longer, stronger password.";
  }
  if (code && Object.hasOwn(messages, code)) return messages[code];
  if (code === "account_connection" || value?.name === "TypeError" || value?.name === "AbortError") return "We couldn’t reach account services. Please check your internet connection and try again.";
  return "We couldn't complete that request. Please try again in a moment.";
}
