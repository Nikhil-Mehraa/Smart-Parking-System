import React from 'react';

// Helper to format status strings: "out_of_order" => "Out Of Order"
function formatStatus(status) {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Function to check if a slot is booked for the given date/time range
function isSlotBooked(slot, date, start, end, endDate) {
  // Out of order slots are considered NOT booked for this time window (just unavailable)
  if (slot.status === 'out_of_order') return false;

  // Reserved slots are always booked
  if (slot.status === 'reserved') return true;

  // Only "available" slots check bookings array
  if (!slot.bookings || slot.status !== 'available') return false;

  const reqStart = new Date(`${date}T${start}:00`).getTime();
  const reqEnd = new Date(`${endDate}T${end}:00`).getTime();

  // Check if any booking overlaps with requested time
  return slot.bookings.some(b => {
    const bStart = new Date(`${b.date}T${b.start}:00`).getTime();
    const bEnd = new Date(`${b.endDate}T${b.end}:00`).getTime();
    return !(reqEnd <= bStart || reqStart >= bEnd);
  });
}

export default function SlotGrid({
  slots,
  date,
  start,
  end,
  endDate,
  selectedSlots,
  toggleSlotSelection,
  availableSlotData,
}) {
  if (!slots || !slots.length) return <p>No slots available.</p>;

  return (
    <div className="slot-grid">
      {slots.map(slot => {
        const slotData = availableSlotData.find(s => s.id === slot.id);
        const booked = isSlotBooked(slot, date, start, end, endDate);
        const statusClass = slot.status; // for CSS class styling

        // Determine if slot is selected (for UI)
        const isSelected = selectedSlots.includes(slot.id);

        return (
          <div
            key={slot.id}
            className={`slot ${statusClass} ${isSelected ? 'selected' : ''}`}
            onClick={() => {
              // Prevent selecting out_of_order or already booked
              if (slot.status === 'out_of_order' || booked) return;
              toggleSlotSelection(slot.id);
            }}
            title={
              booked
                ? 'This slot is already booked'
                : slot.status === 'out_of_order'
                ? 'This slot is out of order and unavailable'
                : 'Click to select'
            }
          >
            <p>Slot {slot.id}</p>

            {slotData && (
              <p className="slot-price">€{slotData.price}</p>
            )}

            <p className="status">
              {statusClass === 'reserved'
                ? 'Booked'
                : formatStatus(slot.status)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
