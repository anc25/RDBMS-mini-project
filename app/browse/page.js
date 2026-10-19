"use client";

// app/browse/page.js
// Filter bar (keyword, category, location, date range) over all
// unclaimed found items, shown as a card grid. Filters re-run the
// search on every change. Loading and empty states are included.

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import ItemCard from "@/components/ItemCard";
import { getCategories, getFound, getLocations } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { todayStr } from "@/lib/dates";

export default function BrowsePage() {
  return (
    <AuthGuard>
      {() => (
        <div>
          <h1 className="h3 mb-1">Browse found items</h1>
          <p className="text-muted">Everything that has been handed in and is waiting to be claimed.</p>
          <BrowseBody />
        </div>
      )}
    </AuthGuard>
  );
}

function BrowseBody() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({ q: "", category: "", location: "", from: "", to: "" });
  const [items, setItems] = useState(null); // null = loading
  const today = todayStr();

  // Dropdown options.
  useEffect(() => {
    let alive = true;
    getCategories().then((c) => alive && setCategories(c)).catch((err) => showToast(err.message, "error"));
    getLocations().then((l) => alive && setLocations(l)).catch((err) => showToast(err.message, "error"));
    return () => {
      alive = false;
    };
  }, []);

  // Re-search whenever a filter changes.
  useEffect(() => {
    let alive = true;
    getFound(filters)
      .then((data) => alive && setItems(data))
      .catch((err) => {
        if (!alive) return;
        setItems([]);
        showToast(err.message, "error");
      });
    return () => {
      alive = false;
    };
  }, [filters]);

  function set(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }

  return (
    <div>
      <form className="card shadow-sm mb-4" onSubmit={(e) => e.preventDefault()}>
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label htmlFor="f-q" className="form-label small mb-1">Keyword</label>
              <input
                id="f-q"
                type="search"
                className="form-control form-control-sm"
                placeholder="Search title or description"
                value={filters.q}
                onChange={(e) => set("q", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="f-category" className="form-label small mb-1">Category</label>
              <select
                id="f-category"
                className="form-select form-select-sm"
                value={filters.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="f-location" className="form-label small mb-1">Location</label>
              <select
                id="f-location"
                className="form-select form-select-sm"
                value={filters.location}
                onChange={(e) => set("location", e.target.value)}
              >
                <option value="">All</option>
                {locations.map((l) => (
                  <option key={l.location_id} value={l.location_id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="f-from" className="form-label small mb-1">From</label>
              <input
                id="f-from"
                type="date"
                max={today}
                className="form-control form-control-sm"
                value={filters.from}
                onChange={(e) => set("from", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="f-to" className="form-label small mb-1">To</label>
              <input
                id="f-to"
                type="date"
                max={today}
                className="form-control form-control-sm"
                value={filters.to}
                onChange={(e) => set("to", e.target.value)}
              />
            </div>
          </div>
        </div>
      </form>

      {items === null ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "var(--lf-accent)" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="alert alert-light border text-center">
          No found items match these filters yet. Try clearing the keyword or dates.
        </div>
      ) : (
        <div className="row g-3">
          {items.map((item) => (
            <ItemCard key={item.item_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
