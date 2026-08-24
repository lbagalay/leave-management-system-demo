"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { loginAction, type LoginState } from "@/app/login/actions";
import { DEMO_PASSWORD } from "@/lib/auth/demo-users";

const initialState: LoginState = {};

const demoAccounts = [
  { label: "Employee", email: "employee@demo.com" },
  { label: "Supervisor", email: "supervisor@demo.com" },
  { label: "Admin", email: "admin@demo.com" },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="spin" size={18} />
          Signing in…
        </>
      ) : (
        <>
          Sign in
          <ArrowRight size={18} />
        </>
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState("employee@demo.com");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);

  function fillDemoAccount(accountEmail: string) {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div className="login-form-wrap">
      <div className="login-heading">
        <p className="eyebrow">Secure employee portal</p>
        <h1>Welcome back</h1>
        <p>Sign in to access your leave management workspace.</p>
      </div>

      <form action={formAction} className="login-form">
        <label className="field-label" htmlFor="email">
          Work email
        </label>
        <input
          className="text-input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <div className="password-field">
          <input
            className="text-input"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="password-toggle"
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {state.error && (
          <div className="form-error" role="alert">
            <AlertCircle size={17} />
            <span>{state.error}</span>
          </div>
        )}

        <SubmitButton />
      </form>

      <div className="demo-accounts">
        <div className="section-divider">
          <span>Demo accounts</span>
        </div>
        <p className="demo-help">Choose a role to fill in the demo credentials.</p>
        <div className="account-options">
          {demoAccounts.map((account) => (
            <button
              className={email === account.email ? "account-option account-option-active" : "account-option"}
              type="button"
              key={account.email}
              onClick={() => fillDemoAccount(account.email)}
            >
              <span>{account.label}</span>
              <small>{account.email}</small>
            </button>
          ))}
        </div>
        <p className="demo-password">
          Password: <code>{DEMO_PASSWORD}</code>
        </p>
      </div>
    </div>
  );
}
