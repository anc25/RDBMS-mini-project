// components/ItemCard.js
// Card used by the Browse grid: title, category badge, location, date
// and a "View" button that opens the item detail page.

import Link from "next/link";
import StatusBadge from "./StatusBadge";

export default function ItemCard({ item }) {
  return (
    <div className="col-sm-6 col-lg-4">
      <div className="card h-100 shadow-sm">
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <h5 className="card-title mb-0">{item.title}</h5>
            <StatusBadge status={item.status} />
          </div>
          <span className="badge bg-body-tertiary text-body-secondary border align-self-start mb-2">{item.category}</span>
          <p className="card-text small mb-1">
            <strong>Found at:</strong> {item.location}
          </p>
          <p className="card-text small mb-1">
            <strong>Date:</strong> {item.date_found}
          </p>
          <p className="card-text small text-muted mb-3">{item.description}</p>
          <Link href={`/item/${item.item_id}`} className="btn btn-accent btn-sm mt-auto align-self-start">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
