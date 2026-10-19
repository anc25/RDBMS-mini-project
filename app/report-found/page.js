"use client";

// app/report-found/page.js
// Form to report a found item. Same shape as the lost form plus the
// "currently stored at" field. On success we go to /browse where the
// new item is now listed.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { createFound, getCategories, getLocations } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { todayStr } from "@/lib/dates";

export default function ReportFoundPage() {
  return (
    <AuthGuard>
      {() => (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h1 className="h3 mb-1">Report a found item</h1>
            <p className="text-muted">Thank you for handing it in! Its owner can now find and claim it.</p>
            <FoundForm />
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

function FoundForm() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    title: "", category_id: "", location_id: "", date_found: "", description: "", stored_at: "",
  });
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
    if (!form.date_found) e.date_found = "Pick the date you found it";
    else if (form.date_found > today) e.date_found = "Date cannot be in the future";
    return e;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    try {
      await createFound({
        title: form.title.trim(),
        category_id: Number(form.category_id),
        location_id: Number(form.location_id),
        date_found: form.date_found,
        description: form.description.trim(),
        stored_at: form.stored_at.trim(),
      });
      showToast("Found item reported. It is now listed in Browse.");
      router.push("/browse");
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
          <label htmlFor="found-title" className="form-label">Title</label>
          <input
            id="found-title"
            type="text"
            className={`form-control${errors.title ? " is-invalid" : ""}`}
            placeholder="e.g. Black iPhone"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="found-category" className="form-label">Category</label>
            <select
              id="found-category"
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
            <label htmlFor="found-location" className="form-label">Where it was found</label>
            <select
              id="found-location"
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
          <label htmlFor="found-date" className="form-label">Date found</label>
          <input
            id="found-date"
            type="date"
            max={today}
            className={`form-control${errors.date_found ? " is-invalid" : ""}`}
            value={form.date_found}
            onChange={(e) => set("date_found", e.target.value)}
          />
          {errors.date_found && <div className="invalid-feedback">{errors.date_found}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="found-stored" className="form-label">Currently stored at</label>
          <input
            id="found-stored"
            type="text"
            className="form-control"
            placeholder="e.g. Library help desk"
            value={form.stored_at}
            onChange={(e) => set("stored_at", e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="found-description" className="form-label">Description (optional)</label>
          <textarea
            id="found-description"
            className="form-control"
            rows={3}
            placeholder="Colour, brand, any marks that help the owner identify it"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <button className="btn btn-accent" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Create found item"}
        </button>
      </div>
    </form>
  );
}
