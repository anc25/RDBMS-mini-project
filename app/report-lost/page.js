"use client";

// app/report-lost/page.js
// Form to file a new lost report. Category and location come from the
// API, the date cannot be in the future, and on success we go to
// /my-reports where the new matches will show up.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { createLost, getCategories, getLocations } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { todayStr } from "@/lib/dates";

export default function ReportLostPage() {
  return (
    <AuthGuard>
      {() => (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h1 className="h3 mb-1">Report a lost item</h1>
            <p className="text-muted">Fill in what you lost. We will look for matching found items right away.</p>
            <LostForm />
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

function LostForm() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ title: "", category_id: "", location_id: "", date_lost: "", description: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const today = todayStr();

  useEffect(() => {
    let alive = true;
    Promise.all([getCategories(), getLocations()])
      .then(([cats, locs]) => {
        if (!alive) return;
        setCategories(cats);
        setLocations(locs);
      })
      .catch((err) => showToast(err.message, "error"));
    return () => {
      alive = false;
    };
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const e = {};
    if (form.title.trim().length < 3) e.title = "Title needs at least 3 characters";
    if (!form.category_id) e.category_id = "Pick a category";
    if (!form.location_id) e.location_id = "Pick a location";
    if (!form.date_lost) e.date_lost = "Pick the date you lost it";
    else if (form.date_lost > today) e.date_lost = "Date cannot be in the future";
    return e;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    try {
      await createLost({
        title: form.title.trim(),
        category_id: Number(form.category_id),
        location_id: Number(form.location_id),
        date_lost: form.date_lost,
        description: form.description.trim(),
      });
      showToast("Lost report created. Check My Reports for matches.");
      router.push("/my-reports");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card shadow-sm">
      <div className="card-body">
        <div className="mb-3">
          <label htmlFor="lost-title" className="form-label">Title</label>
          <input
            id="lost-title"
            type="text"
            className={`form-control${errors.title ? " is-invalid" : ""}`}
            placeholder="e.g. Black iPhone 13"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="lost-category" className="form-label">Category</label>
            <select
              id="lost-category"
              className={`form-select${errors.category_id ? " is-invalid" : ""}`}
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
            >
              <option value="">Choose...</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <div className="invalid-feedback">{errors.category_id}</div>}
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="lost-location" className="form-label">Location last seen</label>
            <select
              id="lost-location"
              className={`form-select${errors.location_id ? " is-invalid" : ""}`}
              value={form.location_id}
              onChange={(e) => set("location_id", e.target.value)}
            >
              <option value="">Choose...</option>
              {locations.map((l) => (
                <option key={l.location_id} value={l.location_id}>{l.name}</option>
              ))}
            </select>
            {errors.location_id && <div className="invalid-feedback">{errors.location_id}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="lost-date" className="form-label">Date lost</label>
          <input
            id="lost-date"
            type="date"
            max={today}
            className={`form-control${errors.date_lost ? " is-invalid" : ""}`}
            value={form.date_lost}
            onChange={(e) => set("date_lost", e.target.value)}
          />
          {errors.date_lost && <div className="invalid-feedback">{errors.date_lost}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="lost-description" className="form-label">Description (optional)</label>
          <textarea
            id="lost-description"
            className="form-control"
            rows={3}
            placeholder="Colour, brand, stickers, contents - anything that proves it is yours"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <button className="btn btn-accent" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Create lost report"}
        </button>
      </div>
    </form>
  );
}
