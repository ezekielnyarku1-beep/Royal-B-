"use client";

import { useState, type InputHTMLAttributes } from "react";
import { AlertCircle, Eye, EyeOff, type LucideIcon } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
};

export function FormField({ label, icon: Icon, error, hint, id, type = "text", ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  const description = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className={`input-wrap ${error ? "input-error" : ""}`}>
      <Icon className="input-icon" size={19} strokeWidth={1.6} aria-hidden="true" />
      <input {...props} id={id} type={password && visible ? "text" : type} aria-invalid={!!error} aria-describedby={description} className={password ? "has-toggle" : ""}/>
      {password && <button type="button" className="password-toggle" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={19} strokeWidth={1.7}/> : <Eye size={19} strokeWidth={1.7}/>}</button>}
    </div>
    {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
    {error && <p id={`${id}-error`} className="field-error"><AlertCircle size={13} aria-hidden="true"/>{error}</p>}
  </div>;
}
