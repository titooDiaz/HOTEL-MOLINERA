// Muestra las habitaciones administrativas en una cuadrícula filtrable por estado.
import { useMemo, useState } from "react";

export default function RoomsGrid({
  rooms,
  labels,
  deletingRoomId,
  updatingImagesRoomId,
  onManageRoom,
  onDeleteRoom,
  onUpdateRoomImages,
  paymentDetails,
  updatingPaymentId,
  onPaymentDetailChange,
  onRegisterPayment,
}) {
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
              <p className="admin-room-type">{room.type} <span>· {room.floorLabel}</span></p>
              <p className="admin-room-guest">{room.guest ? `${labels.guestPrefix} ${room.guest}` : labels.noGuest}</p>
              {room.currentReservation && !room.isDeleted && (
                <div className="admin-room-payment">
                  <div className="admin-room-payment-summary">
                    <span>Pago habitación</span>
                    <strong>{room.currentReservation.paymentStatus === "pagado" ? "Pagado" : `Saldo: Bs. ${Number(room.currentReservation.balance || 0).toLocaleString("es-VE")}`}</strong>
                  </div>
                  {room.currentReservation.paymentStatus !== "pagado" && (
                    <div className="admin-room-payment-form">
                      <input
                        type="number"
                        min="0.01"
                        max={room.currentReservation.balance || room.currentReservation.total}
                        step="0.01"
                        placeholder="Monto"
                        aria-label={`Monto de pago de habitación ${room.number}`}
                        value={paymentDetails[room.currentReservation.id]?.amount || ""}
                        onChange={(event) => onPaymentDetailChange(room.currentReservation.id, "amount", event.target.value)}
                        disabled={updatingPaymentId !== null}
                      />
                      <select
                        aria-label={`Método de pago de habitación ${room.number}`}
                        value={paymentDetails[room.currentReservation.id]?.method || "efectivo"}
                        onChange={(event) => onPaymentDetailChange(room.currentReservation.id, "method", event.target.value)}
                        disabled={updatingPaymentId !== null}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="pago_movil">Pago móvil</option>
                      </select>
                      {["transferencia", "pago_movil"].includes(paymentDetails[room.currentReservation.id]?.method) && (
                        <input
                          type="text"
                          maxLength="150"
                          placeholder="Referencia"
                          aria-label={`Referencia del pago de habitación ${room.number}`}
                          value={paymentDetails[room.currentReservation.id]?.transactionReference || ""}
                          onChange={(event) => onPaymentDetailChange(room.currentReservation.id, "transactionReference", event.target.value)}
                          disabled={updatingPaymentId !== null}
                        />
                      )}
                      <button type="button" className="admin-action-button admin-action-button--primary" onClick={() => onRegisterPayment(room.currentReservation)} disabled={updatingPaymentId !== null}>
                        {updatingPaymentId === room.currentReservation.id ? "Guardando..." : "Registrar pago"}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!room.isDeleted && (
                <>
                  <button
                    className="admin-action-button admin-action-button--outline admin-room-delete"
                    type="button"
                    onClick={() => onManageRoom(room)}
                    disabled={deletingRoomId !== null || updatingImagesRoomId !== null}
                  >
                    Gestionar habitación
                  </button>
                  <label className="admin-action-button admin-action-button--outline admin-room-delete">
                    {updatingImagesRoomId === room.id ? "Subiendo..." : "Reemplazar galería"}
                    <input
                      className="room-image-upload-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      disabled={updatingImagesRoomId !== null || deletingRoomId !== null}
                      onChange={(event) => {
                        onUpdateRoomImages(room, event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </>
              )}
              <button
                className="admin-action-button admin-action-button--danger admin-room-delete"
                type="button"
                onClick={() => onDeleteRoom(room)}
                disabled={deletingRoomId !== null || updatingImagesRoomId !== null}
                aria-label={`${labels.deleteLabel}: ${room.number}`}
              >
                {deletingRoomId === room.id
                  ? "Eliminando..."
                  : room.isDeleted
                    ? "Eliminar definitivamente"
                    : labels.deleteLabel}
              </button>
            </article>
          ))}
        </div>
      ) : <p className="admin-empty-state">{labels.emptyText}</p>}
    </section>
  );
}
