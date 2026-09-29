"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { needsVerification } from "@/lib/types";

type Mode = "login" | "register" | "verify";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useSession();
  // Where to go after signing in — set by pages that bounced the student here.
  const next = params.get("next") ?? "/bookings";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const submitLogin = () =>
    run(async () => {
      const result = await api.login(email.trim(), password);
      // A 200 can still mean "not verified yet" — branch on shape, not status.
      if (needsVerification(result)) {
        setNotice(result.message);
        setMode("verify");
        return;
      }
      signIn(result);
      router.push(next);
    });

  const submitRegister = () =>
    run(async () => {
      const result = await api.register({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: "student",
      });
      if (needsVerification(result)) {
        setNotice(result.message);
        setMode("verify");
        return;
      }
      signIn(result);
      router.push(next);
    });

  const submitVerify = () =>
    run(async () => {
      const result = await api.verifyEmail(email.trim(), code.trim());
      if (needsVerification(result)) {
        setError("That code wasn't accepted. Request a new one.");
        return;
      }
      signIn(result);
      router.push(next);
    });

  const resend = () =>
    run(async () => {
      await api.resendCode(email.trim());
      setNotice(`We sent another code to ${email.trim()}.`);
    });

  const field =
    "w-full rounded-lg border border-ink-100 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
  const label = "mb-1 block text-sm font-medium text-ink-700";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "login"
            ? "Sign in"
            : mode === "register"
              ? "Create your account"
              : "Check your email"}
        </h1>
        <p className="mt-1 text-sm text-ink-700">
          {mode === "verify"
            ? `Enter the 6-digit code sent to ${email}.`
            : "You need an account to reserve a bed."}
        </p>

        {notice && (
          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {notice}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "login") submitLogin();
            else if (mode === "register") submitRegister();
            else submitVerify();
          }}
        >
          {mode === "verify" ? (
            <div>
              <label className={label} htmlFor="code">
                Verification code
              </label>
              <input
                id="code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className={`${field} tracking-[0.4em]`}
              />
            </div>
          ) : (
            <>
              {mode === "register" && (
                <>
                  <div>
                    <label className={label} htmlFor="name">
                      Full name
                    </label>
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={field}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="phone">
                      Phone <span className="text-ink-300">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={field}
                      autoComplete="tel"
                      placeholder="0201234567"
                    />
                  </div>
                </>
              )}
              <div>
                <label className={label} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className={label} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={field}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                />
                {mode === "register" && (
                  <p className="mt-1 text-xs text-ink-500">
                    At least 6 characters.
                  </p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="tap w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : "Verify"}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-sm">
          {mode === "verify" ? (
            <button
              onClick={resend}
              disabled={busy}
              className="text-brand-700 hover:underline disabled:opacity-60"
            >
              Send another code
            </button>
          ) : (
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
                setNotice(null);
              }}
              className="text-brand-700 hover:underline"
            >
              {mode === "login"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={<div className="p-12 text-center text-ink-500">Loading…</div>}>
      <AuthForm />
    </Suspense>
  );
}
