"use client";
import Brand from "./brand";
import { useState } from "react";
import { ArrowRight, ShieldCheck, LifeBuoy } from "lucide-react";
export default function AuthForm() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.href = "/dashboard";
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Brand href="/" />
        <div>
          <span className="eyebrow">HERE TO HELP YOU</span>
          <h1>
            A little support.
            <br />A better workday.
          </h1>
          <p>
            One place to raise a request, connect with your support team, and
            keep things moving.
          </p>
          <div className="story-feature">
            <LifeBuoy />
            <span>Your team, one ticket away.</span>
          </div>
        </div>
        <small>Marina Homes · Internal staff portal</small>
      </section>
      <main className="auth-main">
        <div className="auth-card">
          <div className="mobile-auth-brand"><Brand href="/" /></div>
          <span className="icon-tile">
            <ShieldCheck />
          </span>
          <h2>{register ? "Join your staff helpdesk" : "Welcome back"}</h2>
          <p className="muted">
            {register
              ? "Create an account using your staff invitation code."
              : "Sign in to get support and follow your requests."}
          </p>
          <div className="auth-tabs">
            <button
              className={!register ? "selected" : ""}
              onClick={() => {
                setRegister(false);
                setError("");
              }}
            >
              Sign in
            </button>
            <button
              className={register ? "selected" : ""}
              onClick={() => {
                setRegister(true);
                setError("");
              }}
            >
              Create account
            </button>
          </div>
          <form onSubmit={submit}>
            {register && (
              <>
                <label>
                  Full name
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your full name"
                  />
                </label>
                <label>
                  Employee code
                  <input
                    name="employee_code"
                    required
                    minLength={2}
                    maxLength={40}
                    placeholder="e.g. MH-1024"
                  />
                </label>
              </>
            )}
            <label>
              Work email
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@marinahomes.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={register ? 12 : 1}
                maxLength={128}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder={
                  register ? "At least 12 characters" : "Enter your password"
                }
              />
            </label>
            {register && (
              <label>
                Staff invitation code
                <input
                  name="invite"
                  type="password"
                  required
                  placeholder="Provided by your administrator"
                />
              </label>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary full" disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-note">
            {register
              ? "Ask your administrator for the staff invitation code."
              : "Need access or help with your password? Contact your administrator."}
          </p>
        </div>
      </main>
    </div>
  );
}
