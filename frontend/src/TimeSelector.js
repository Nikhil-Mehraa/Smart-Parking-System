import React from 'react';

function normalizeDate(str) {
  if (!str) return '';
  if (/^\d{2}[.\-/]\d{2}[.\-/]\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split(/[.\-/]/);
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return str;
}

export default function TimeSelector({
  date,
  setDate,
  start,
  setStart,
  end,
  setEnd,
  endDate,
  setEndDate,
}) {
  const safeDate = normalizeDate(date);
  const safeEndDate = normalizeDate(endDate);

  return (
    <div className="time-selector">
      <label>Date</label>
      <input
        type="date"
        value={safeDate}
        onChange={e => setDate(e.target.value)}
      />
      <label>Start</label>
      <input
        type="time"
        value={start}
        onChange={e => setStart(e.target.value)}
      />
      <label>End Date</label>
      <input
        type="date"
        value={safeEndDate}
        onChange={e => setEndDate(e.target.value)}
      />
      <label>End</label>
      <input
        type="time"
        value={end}
        onChange={e => setEnd(e.target.value)}
      />
    </div>
  );
}
