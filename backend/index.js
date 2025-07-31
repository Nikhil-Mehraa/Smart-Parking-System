const express = require("express");

const http = require("http");

const cors = require("cors");

const { Server } = require("socket.io");

const app = express();

app.use(cors());

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

const BASE_PRICE_PER_HOUR = 1;

const NUM_SLOTS = 21;

const holidays = ["2025-12-25", "2025-01-01", "2025-11-15"];

function todayStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const today = todayStr();

function getRandomStatus() {
  const n = Math.random();
  if (n < 0.15) return "out_of_order";
  if (n < 0.35) return "reserved";
  return "available";
}

// Initialize slots with bookings, totalBookings, and totalRevenue
const slots = Array.from({ length: NUM_SLOTS }, (_, i) => {
  const status = getRandomStatus();
  const isReserved = status === "reserved";
  const bookings = isReserved
    ? [{ date: today, start: "08:00", end: "18:00", endDate: today, price: 10 }]
    : [];
  // Reflect initial booking in totals
  const totalBookings = isReserved ? 1 : 0;
  const totalRevenue = isReserved ? 10 : 0;
  return {
    id: i + 1,
    bookings,
    status,
    totalBookings,
    totalRevenue,
  };
});

function dateTimeToMinutes(date, time) {
  if (!time) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, min] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, min).getTime() / 60000;
}

function getDurationMins(date, start, endDate, end) {
  const startMin = dateTimeToMinutes(date, start);
  const endMin = dateTimeToMinutes(endDate, end);
  if (startMin === null || endMin === null) return 0;
  return Math.max(0, endMin - startMin);
}

function isWeekend(dateStr) {
  const day = new Date(dateStr).getDay();
  return day === 6 || day === 0;
}

function isHoliday(dateStr) {
  return holidays.includes(dateStr);
}

function calculatePrice(mins, occupancy, dateStr) {
  let price = BASE_PRICE_PER_HOUR * (mins / 60);
  if (isWeekend(dateStr) || isHoliday(dateStr)) {
    price *= 1.3;
  } else if (occupancy > 0.7) {
    price *= 1.5;
  }
  return Math.round(price);
}

function isAvailable(slot, date, start, end, endDate) {
  if (slot.status === "out_of_order") return false;
  const reqStartMin = dateTimeToMinutes(date, start);
  const reqEndMin = dateTimeToMinutes(endDate, end);
  return slot.bookings.every((b) => {
    const bStart = dateTimeToMinutes(b.date, b.start);
    const bEnd = dateTimeToMinutes(b.endDate, b.end);
    return reqEndMin <= bStart || reqStartMin >= bEnd;
  });
}

app.post("/api/available-slots", (req, res) => {
  const { date, start, end, endDate } = req.body;
  if (!date || !start || !end || !endDate)
    return res.status(400).json({ error: "Missing date/start/end/endDate" });

  const mins = getDurationMins(date, start, endDate, end);

  // Consider only "available" and "reserved" slots (exclude "out_of_order")
  const consideredSlots = slots.filter(
    (s) => s.status === "available" || s.status === "reserved"
  );

  const bookedCount = consideredSlots.filter(
    (s) => !isAvailable(s, date, start, end, endDate)
  ).length;

  const occupancy = bookedCount / consideredSlots.length;

  res.json({
    slots: slots.map((slot) => ({
      id: slot.id,
      booked: !isAvailable(slot, date, start, end, endDate),
      price: calculatePrice(mins, occupancy, date),
      status: slot.status,
    })),
  });
});

app.get("/api/analytics", (req, res) => {
  const slotsWithStatus = slots.map((slot) => ({
    id: slot.id,
    totalBookings: slot.totalBookings,
    totalRevenue: slot.totalRevenue,
    status: slot.status,
  }));

  const statusCounts = { available: 0, reserved: 0, out_of_order: 0 };
  slots.forEach((s) => statusCounts[s.status]++);

  // Sensor status
  const workingSensors = slots.filter(
    (slot) => slot.status === "available" || slot.status === "reserved"
  ).length;

  const nonWorkingSensors = slots.filter((slot) => slot.status === "out_of_order").length;

  res.json({
    slots: slotsWithStatus,
    summary: {
      totalSlots: slots.length,
      totalBookings: slots.reduce((a, s) => a + s.totalBookings, 0),
      totalRevenue: slots.reduce((a, s) => a + s.totalRevenue, 0),
      statusCounts,
      sensorCounts: {
        working: workingSensors,
        out_of_status: nonWorkingSensors,
      },
    },
  });
});

io.on("connection", (socket) => {
  socket.emit("slots", slots);

  socket.on("book", ({ slotId, date, start, end, endDate }, cb) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !isAvailable(slot, date, start, end, endDate)) {
      cb && cb({ success: false, msg: "Unavailable" });
      return;
    }

    const mins = getDurationMins(date, start, endDate, end);

    // Use considered slots excluding out_of_order for occupancy
    const consideredSlots = slots.filter(
      (s) => s.status === "available" || s.status === "reserved"
    );

    const bookedCount = consideredSlots.filter(
      (s) => !isAvailable(s, date, start, end, endDate)
    ).length;

    const occupancy = bookedCount / consideredSlots.length;

    const price = calculatePrice(mins, occupancy, date);

    slot.bookings.push({ date, start, end, endDate, price });

    slot.totalBookings += 1;

    slot.totalRevenue += price;

    io.emit("slots", slots);

    cb && cb({ success: true, price });

    // Optionally: emit analytics update
    io.emit("analytics", {
      slots,
      summary: {
        totalSlots: slots.length,
        totalBookings: slots.reduce((a, s) => a + s.totalBookings, 0),
        totalRevenue: slots.reduce((a, s) => a + s.totalRevenue, 0),
        statusCounts: {
          available: slots.filter((s) => s.status === "available").length,
          reserved: slots.filter((s) => s.status === "reserved").length,
          out_of_order: slots.filter((s) => s.status === "out_of_order").length,
        },
        sensorCounts: {
          working:
            slots.filter(
              (s) => s.status === "available" || s.status === "reserved"
            ).length,
          out_of_status: slots.filter((s) => s.status === "out_of_order").length,
        },
      },
    });
  });

  socket.on("bookBulk", ({ slotIds, date, start, end, endDate }, cb) => {
    if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0)
      return cb && cb({ success: false, msg: "No slots selected" });

    const unavailableSlots = slotIds.filter((id) => {
      const slot = slots.find((s) => s.id === id);
      return !slot || !isAvailable(slot, date, start, end, endDate);
    });

    if (unavailableSlots.length > 0)
      return cb &&
        cb({
          success: false,
          msg: `Slots unavailable: ${unavailableSlots.join(", ")}`,
        });

    slotIds.forEach((slotId) => {
      const slot = slots.find((s) => s.id === slotId);
      const mins = getDurationMins(date, start, endDate, end);

      // Consider slots excluding out_of_order for occupancy
      const consideredSlots = slots.filter(
        (s) => s.status === "available" || s.status === "reserved"
      );

      const bookedCount = consideredSlots.filter(
        (s) => !isAvailable(s, date, start, end, endDate)
      ).length;

      const occupancy = bookedCount / consideredSlots.length;

      const price = calculatePrice(mins, occupancy, date);

      slot.bookings.push({ date, start, end, endDate, price });

      slot.totalBookings += 1;

      slot.totalRevenue += price;

      slot.status = "reserved"; // mark slot booked (red)
    });

    io.emit("slots", slots);

    // Update analytics
    const slotsWithStatus = slots.map((slot) => ({
      id: slot.id,
      totalBookings: slot.totalBookings,
      totalRevenue: slot.totalRevenue,
      status: slot.status,
    }));

    const statusCounts = { available: 0, reserved: 0, out_of_order: 0 };
    slots.forEach((s) => statusCounts[s.status]++);

    io.emit("analytics", {
      slots: slotsWithStatus,
      summary: {
        totalSlots: slots.length,
        totalBookings: slots.reduce((a, s) => a + s.totalBookings, 0),
        totalRevenue: slots.reduce((a, s) => a + s.totalRevenue, 0),
        statusCounts,
        sensorCounts: {
          working: slots.filter(
            (s) => s.status === "available" || s.status === "reserved"
          ).length,
          out_of_status: slots.filter((s) => s.status === "out_of_order").length,
        },
      },
    });

    cb && cb({ success: true });
  });
});

server.listen(4000, () =>
  console.log("🚗 Parking backend with randomness at http://localhost:4000")
);
