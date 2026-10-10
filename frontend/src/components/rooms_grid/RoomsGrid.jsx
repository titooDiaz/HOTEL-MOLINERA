import { useMemo, useState } from "react";

export default function RoomsGrid({ rooms, labels }) {
  const [status, setStatus] = useState(labels.allValue);
  const filteredRooms = useMemo(
    () => status === labels.allValue ? rooms : rooms.filter((room) => room.statusKey === status),
    [rooms, status, labels.allValue],
  );

  return (
    <section className="card-panel admin-data-panel">
      <div className="admin-panel-heading">
        <h2 className="admin-panel-title">{labels.title}</h2>
        <label className="admin-filter-control">
          <span>{labels.filterLabel}</span>
          <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)}>
            {labels.filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
      {filteredRooms.length ? (
        <div className="admin-room-grid">
          {filteredRooms.map((room) => (
            <article className="admin-room-card" key={room.number}>
              <div className="admin-room-card-heading">
                <strong className="admin-room-number">{room.number}</strong>
                <span className={`admin-status-badge ${room.statusClass}`}>{room.status}</span>
              </div>
              <p className="admin-room-type">{room.type} <span>· {room.floor}</span></p>
              <p className="admin-room-guest">{room.guest ? `${labels.guestPrefix} ${room.guest}` : labels.noGuest}</p>
            </article>
          ))}
        </div>
      ) : <p className="admin-empty-state">{labels.emptyText}</p>}
    </section>
  );
}
