export type AuthMode = "login" | "signup";
export type AuthValues = { name: string; email: string; password: string; confirmPassword: string; remember: boolean };
export type FieldName = "name" | "email" | "password" | "confirmPassword";
export type FieldErrors = Partial<Record<FieldName, string>>;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Please enter your email address.";
  if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email, like you@example.com.";
}

export function validateAuth(values: AuthValues, mode: AuthMode): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  if (!values.password) errors.password = "Please enter your password.";
  if (mode === "signup") {
    if (values.name.trim().length < 2) errors.name = "Please enter your full name.";
    if (values.name.trim().length > 100) errors.name = "Please use 100 characters or fewer.";
    if (values.password && values.password.length < 8) errors.password = "Choose a password with at least 8 characters.";
    if (values.password.length > 128) errors.password = "Please use 128 characters or fewer.";
    if (!values.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (values.confirmPassword !== values.password) errors.confirmPassword = "Your passwords don't match. Please try again.";
  }
  return errors;
}

export function validatePasswordUpdate(password: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!password) errors.password = "Please enter your password.";
  else if (password.length < 8) errors.password = "Choose a password with at least 8 characters.";
  else if (password.length > 128) errors.password = "Please use 128 characters or fewer.";
  if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (confirmPassword !== password) errors.confirmPassword = "Your passwords don't match. Please try again.";
  return errors;
}
