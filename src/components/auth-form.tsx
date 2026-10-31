"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CircleAlert, KeyRound, LoaderCircle, LockKeyhole, Mail, UserRound, X } from "lucide-react";
import { FormField } from "./form-field";
import { authAdapter, authErrorMessage, authErrorReference } from "@/lib/auth";
import { useAccount } from "@/hooks/use-account";
import { AccountSummary } from "./account-summary";
import { validateAuth, validateEmail, validatePasswordUpdate, type AuthMode, type AuthValues, type FieldErrors, type FieldName } from "@/lib/validation";

const initialValues: AuthValues = { name: "", email: "", password: "", confirmPassword: "", remember: false };
type Notice = { message: string; error: boolean; reference?: string } | null;

export function AuthForm() {
  const router = useRouter();
  const account = useAccount();
  const [mode, setMode] = useState<AuthMode>("login");
  const [values, setValues] = useState<AuthValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [pendingAction, setPendingAction] = useState<"password" | "google" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const login = mode === "login";
  const pending = pendingAction !== null;

  useEffect(() => {
    try {
      return authAdapter.onAuthStateChange(event => {
        if (event === "PASSWORD_RECOVERY") setRecoveringPassword(true);
        if (event === "SIGNED_OUT") {
          setMode("login"); setValues(initialValues); setErrors({}); setTouched({}); setNotice(null); setRecoveringPassword(false);
        }
      });
    } catch (error) {
      setNotice({ message: authErrorMessage(error), error: true });
    }
  }, []);

  function switchMode(next: AuthMode) {
    if (next === mode || pending) return;
    setMode(next); setErrors({}); setTouched({}); setNotice(null);
    setValues(v => ({ ...v, password: "", confirmPassword: "", remember: false }));
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "login" : event.key === "End" ? "signup" : login ? "signup" : "login";
    switchMode(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  function fieldProps(field: FieldName) {
    return {
      id: field, name: field, value: values[field], required: true, error: errors[field], disabled: pending,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = { ...values, [field]: event.target.value };
        setValues(next); setNotice(null);
        const validated = validateAuth(next, mode);
        setErrors(previous => {
          const updated = { ...previous };
          for (const key of Object.keys(touched) as FieldName[]) updated[key] = validated[key];
          return updated;
        });
      },
      onBlur: () => {
        setTouched(t => ({ ...t, [field]: true }));
        setErrors(e => ({ ...e, [field]: validateAuth(values, mode)[field] }));
      },
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const validated = validateAuth(values, mode);
    setErrors(validated); setTouched({ name: true, email: true, password: true, confirmPassword: true }); setNotice(null);
    if (Object.keys(validated).length) {
      const order: FieldName[] = login ? ["email", "password"] : ["name", "email", "password", "confirmPassword"];
      document.getElementById(order.find(k => validated[k])!)?.focus();
      return;
    }
    setPendingAction("password");
    try {
      const result = login
        ? await authAdapter.signIn({ email: values.email.trim(), password: values.password, remember: values.remember })
        : await authAdapter.signUp({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      if (login || result.authenticated) router.replace("/shop/");
      else setNotice({ message: result.message, error: false });
    } catch (error) {
      setNotice({ message: authErrorMessage(error), error: true, reference: authErrorReference(error) });
    } finally { setPendingAction(null); setValues(v => ({ ...v, password: "", confirmPassword: "" })); }
  }

  async function signInWithGoogle() {
    if (pending) return;
    setPendingAction("google");
    setNotice(null);
    try {
      await authAdapter.signInWithGoogle({ remember: login && values.remember });
    } catch (error) {
      setNotice({ message: authErrorMessage(error), error: true, reference: authErrorReference(error) });
    } finally {
      setPendingAction(null);
    }
  }

  if (recoveringPassword) {
    return <PasswordRecoveryForm onComplete={() => setRecoveringPassword(false)} />;
  }
  if (account.loading) return <div className="auth-content" role="status">Checking your account…</div>;
  if (account.user) return <AccountSummary user={account.user}/>;

  return <div className="auth-content">
    <div className="welcome-icon" aria-hidden="true"><LockKeyhole size={23} strokeWidth={1.5}/><span><Check size={9} strokeWidth={3}/></span></div>
    <div className="auth-heading"><h2>{login ? "Welcome back." : "Create your account"}</h2><p>{login ? "Log in to your Big B Royale account." : "Save products, delivery details and order requests."}</p></div>
    <div className={`auth-tabs ${!login ? "signup-active" : ""}`} role="tablist" aria-label="Account access">
      <span className="tab-indicator" aria-hidden="true"/>
      <button type="button" role="tab" id="tab-login" aria-selected={login} aria-controls="auth-panel" tabIndex={login ? 0 : -1} onKeyDown={handleTabKey} onClick={() => switchMode("login")} disabled={pending}>Log in</button>
      <button type="button" role="tab" id="tab-signup" aria-selected={!login} aria-controls="auth-panel" tabIndex={login ? -1 : 0} onKeyDown={handleTabKey} onClick={() => switchMode("signup")} disabled={pending}>Sign up</button>
    </div>
    <div id="auth-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} tabIndex={0}>
      <form key={mode} className="auth-form" noValidate onSubmit={submit} aria-busy={pending}>
        {!login && <FormField {...fieldProps("name")} label="Full name" icon={UserRound} placeholder="Enter your full name" autoComplete="name" maxLength={100}/>}
        <FormField {...fieldProps("email")} label="Email address" icon={Mail} type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254}/>
        <FormField {...fieldProps("password")} label="Password" icon={LockKeyhole} type="password" placeholder={login ? "Enter your password" : "Create a password"} autoComplete={login ? "current-password" : "new-password"} hint={!login ? "Use at least 8 characters." : undefined}/>
        {!login && <FormField {...fieldProps("confirmPassword")} label="Confirm password" icon={LockKeyhole} type="password" placeholder="Re-enter your password" autoComplete="new-password"/>}
        {login && <div className="form-options"><label className="remember"><input type="checkbox" checked={values.remember} disabled={pending} onChange={e => setValues(v => ({ ...v, remember: e.target.checked }))}/><span>Remember me</span></label><button className="text-button" type="button" onClick={() => dialog.current?.showModal()}>Forgot password?</button></div>}
        <div aria-live="polite" aria-atomic="true">{notice && <div className={`form-notice ${notice.error ? "notice-error" : ""}`}><CircleAlert size={17} aria-hidden="true"/><p>{notice.message}{notice.reference && <small className="auth-error-reference">Support reference: {notice.reference}</small>}</p></div>}</div>
        <button type="submit" className="primary-button" disabled={pending}>{pending ? <><LoaderCircle size={18} className="animate-spin"/>Please wait…</> : <>{login ? "Log in" : "Create account"}<ArrowRight size={18}/></>}</button>
        <div className="auth-divider"><span>or continue with</span></div>
        <button type="button" className="google-button" disabled={pending} onClick={signInWithGoogle}>
          {pendingAction === "google" ? <LoaderCircle size={19} className="animate-spin" aria-hidden="true"/> : <GoogleMark/>}
          {pendingAction === "google" ? "Connecting to Google…" : "Continue with Google"}
        </button>
      </form>
    </div>
    <p className="switch-prompt">{login ? "New here?" : "Already have an account?"} <button type="button" className="text-button" disabled={pending} onClick={() => { switchMode(login ? "signup" : "login"); document.getElementById(login ? "tab-signup" : "tab-login")?.focus(); }}>{login ? "Create an account" : "Log in"}<ArrowRight size={13}/></button></p>
    <ResetPasswordDialog dialogRef={dialog} email={values.email}/>
  </div>;
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
    <path fill="var(--blue)" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15z"/>
    <path fill="var(--blue)" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z"/>
    <path fill="var(--blue)" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3z"/>
    <path fill="var(--blue)" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z"/>
  </svg>;
}

function PasswordRecoveryForm({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const validated = validatePasswordUpdate(password, confirmPassword);
    setErrors(validated);
    setNotice(null);
    if (Object.keys(validated).length) {
      document.getElementById(validated.password ? "recovery-password" : "recovery-confirm-password")?.focus();
      return;
    }

    setPending(true);
    try {
      const result = await authAdapter.updatePassword({ password });
      setNotice({ message: result.message, error: false });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setNotice({ message: authErrorMessage(error), error: true });
    } finally {
      setPending(false);
    }
  }

  return <div className="auth-content">
    <div className="welcome-icon" aria-hidden="true"><LockKeyhole size={23} strokeWidth={1.5}/><span><Check size={9} strokeWidth={3}/></span></div>
    <div className="auth-heading"><div className="form-eyebrow">YOUR ROYAL SPACE</div><h2>Choose a new password.</h2><p>Set a new password to get back to your account.</p></div>
    <form className="auth-form" noValidate onSubmit={submit} aria-busy={pending}>
      <FormField id="recovery-password" name="password" label="New password" icon={LockKeyhole} type="password" value={password} placeholder="Create a new password" autoComplete="new-password" hint="Use at least 8 characters." required disabled={pending} error={errors.password} onChange={event => { setPassword(event.target.value); setErrors(previous => ({ ...previous, password: undefined })); setNotice(null); }} />
      <FormField id="recovery-confirm-password" name="confirmPassword" label="Confirm new password" icon={LockKeyhole} type="password" value={confirmPassword} placeholder="Re-enter your new password" autoComplete="new-password" required disabled={pending} error={errors.confirmPassword} onChange={event => { setConfirmPassword(event.target.value); setErrors(previous => ({ ...previous, confirmPassword: undefined })); setNotice(null); }} />
      <div aria-live="polite" aria-atomic="true">{notice && <div className={`form-notice ${notice.error ? "notice-error" : ""}`}><CircleAlert size={17} aria-hidden="true"/><p>{notice.message}</p></div>}</div>
      {notice?.error === false
        ? <button type="button" className="primary-button" onClick={onComplete}>Continue to your account<ArrowRight size={18}/></button>
        : <button type="submit" className="primary-button" disabled={pending}>{pending ? <><LoaderCircle size={18} className="animate-spin"/>Please wait…</> : <>Update password<ArrowRight size={18}/></>}</button>}
    </form>
  </div>;
}

function ResetPasswordDialog({ dialogRef, email }: { dialogRef: React.RefObject<HTMLDialogElement | null>; email: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const invalid = validateEmail(value); setError(invalid); setNotice(null);
    if (invalid) { document.getElementById("reset-email")?.focus(); return; }
    setPending(true);
    try { const result = await authAdapter.resetPassword({ email: value.trim() }); setNotice({ message: result.message, error: false }); }
    catch (error) { setNotice({ message: authErrorMessage(error), error: true }); }
    finally { setPending(false); }
  }
  return <dialog className="reset-dialog" ref={dialogRef} aria-labelledby="reset-title" aria-describedby="reset-description" onClose={() => { setValue(""); setError(undefined); setNotice(null); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close(); } }}>
    <button type="button" className="dialog-close" aria-label="Close password reset" onClick={() => dialogRef.current?.close()}><X size={20}/></button>
    <div className="reset-icon"><KeyRound size={25}/></div>
    <h2 id="reset-title">A fresh start.</h2><p id="reset-description">Enter your email to get a password reset link.</p>
    <form noValidate onSubmit={submit} aria-busy={pending}>
      <FormField id="reset-email" label="Email address" icon={Mail} type="email" value={value} autoComplete="email" placeholder={email || "you@example.com"} onChange={e => { setValue(e.target.value); setError(undefined); setNotice(null); }} error={error} required disabled={pending}/>
      <div aria-live="polite" aria-atomic="true">{notice && <div className={`form-notice ${notice.error ? "notice-error" : ""}`}><CircleAlert size={17}/><p>{notice.message}</p></div>}</div>
      <button className="primary-button" type="submit" disabled={pending}>{pending ? "Please wait…" : "Send reset link"}<ArrowRight size={18}/></button>
    </form>
    <button className="text-button back-button" type="button" onClick={() => dialogRef.current?.close()}>Back to log in</button>
  </dialog>;
}
