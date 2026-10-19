"use client";

// app/page.js
// Landing page: typographic hero + Login / Register tabs (plain React
// state - no Bootstrap JS). On success the user is sent to /dashboard.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login, register } from "@/lib/api";
import { showToast } from "@/lib/toast";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  return (
    <div className="lf-landing">
      <div className="lf-theme-float">
        <ThemeToggle />
      </div>
      <div className="row g-5 align-items-start">
        <div className="col-lg-7">
          <section className="lf-rise">
            <p className="lf-eyebrow micro">
              <span className="lf-mark" aria-hidden="true"></span>
              Campus Lost &amp; Found
            </p>
            <h1 className="lf-display">
              Lost it on campus.
              <br />
              Someone probably found it<span className="lf-dot">.</span>
            </h1>
            <p className="lf-sub">
              Report what you lost, browse what has been handed in, submit a claim
              and collect it from the campus office. Matches are scored
              automatically; an admin verifies every claim.
            </p>
            <ol className="lf-steps">
              <li><span>01</span>Report a lost item or a found item</li>
              <li><span>02</span>We suggest possible matches automatically</li>
              <li><span>03</span>Claim the item - the admin verifies it</li>
            </ol>
            <div className="lf-demo-note">
              <span className="micro">Demo logins</span>
              <span><code>user@test.com</code> / user123 &nbsp;&middot;&nbsp; student</span>
              <span><code>admin@test.com</code> / admin123 &nbsp;&middot;&nbsp; admin</span>
            </div>
          </section>
        </div>
        <div className="col-lg-5">
          <section className="lf-auth-card card lf-rise lf-rise-2" aria-label="Login or register">
            <div className="card-header bg-white">
              <ul className="nav nav-pills" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    type="button"
                    className={`nav-link${tab === "login" ? " active" : ""}`}
                    onClick={() => setTab("login")}
                    aria-selected={tab === "login"}
                    role="tab"
                  >
                    Login
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    type="button"
                    className={`nav-link${tab === "register" ? " active" : ""}`}
                    onClick={() => setTab("register")}
                    aria-selected={tab === "register"}
                    role="tab"
                  >
                    Register
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {tab === "login" ? <LoginForm /> : <RegisterForm />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.password) e.password = "Password is required";
    return e;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      showToast("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-3">
        <label htmlFor="login-email" className="form-label">Email</label>
        <input
          id="login-email"
          type="email"
          className={`form-control${errors.email ? " is-invalid" : ""}`}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>
      <div className="mb-4">
        <label htmlFor="login-password" className="form-label">Password</label>
        <input
          id="login-password"
          type="password"
          className={`form-control${errors.password ? " is-invalid" : ""}`}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
      </div>
      <button className="btn btn-accent w-100" type="submit" disabled={busy}>
        {busy ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Please enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    if (!/^\d{6,15}$/.test(form.phone.trim())) e.phone = "Phone should be 6-15 digits";
    if (form.password.length < 6) e.password = "Password needs at least 6 characters";
    return e;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      showToast("Account created. Welcome!");
      router.push("/dashboard");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-3">
        <label htmlFor="reg-name" className="form-label">Name</label>
        <input
          id="reg-name"
          type="text"
          className={`form-control${errors.name ? " is-invalid" : ""}`}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
      </div>
      <div className="mb-3">
        <label htmlFor="reg-email" className="form-label">Email</label>
        <input
          id="reg-email"
          type="email"
          className={`form-control${errors.email ? " is-invalid" : ""}`}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>
      <div className="mb-3">
        <label htmlFor="reg-phone" className="form-label">Phone</label>
        <input
          id="reg-phone"
          type="tel"
          className={`form-control${errors.phone ? " is-invalid" : ""}`}
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
      </div>
      <div className="mb-4">
        <label htmlFor="reg-password" className="form-label">Password</label>
        <input
          id="reg-password"
          type="password"
          className={`form-control${errors.password ? " is-invalid" : ""}`}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
      </div>
      <button className="btn btn-accent w-100" type="submit" disabled={busy}>
        {busy ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
