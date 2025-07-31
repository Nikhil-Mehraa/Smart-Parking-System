import React, { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import SlotGrid from './SlotGrid';
import AnalyticsPage from './AnalyticsPage';
import TimeSelector from './TimeSelector';
import AuthPage from './AuthPage';
import './App.css';

import { 
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend 
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

function App() {
  // 1. Track current user from localStorage
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('currentUser'));
  // 2. Logout handler
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  // --- YOUR EXISTING DASHBOARD STATE ---
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availableSlotData, setAvailableSlotData] = useState([]);
  const [socket, setSocket] = useState(null);

  // --- SOCKET + FETCH LOGIC ---
  useEffect(() => {
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    const handleSlotsUpdate = (slotsData) => {
      setSlots(slotsData);

      // Refetch available slots + prices when we receive updated slots data
      if (date && start && end && endDate) {
        fetch('http://localhost:4000/api/available-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, start, end, endDate }),
        })
          .then((res) => res.json())
          .then((data) => setAvailableSlotData(data.slots))
          .catch((err) => console.error('Failed to fetch updated slot prices:', err));
      }
    };

    newSocket.on('slots', handleSlotsUpdate);

    return () => {
      newSocket.off('slots', handleSlotsUpdate);
      newSocket.close();
    };
  }, [date, start, end, endDate]);

  // Initial fetch of available slots/prices when date/time changes
  useEffect(() => {
    if (!date || !start || !end || !endDate) return;

    fetch('http://localhost:4000/api/available-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, start, end, endDate }),
    })
      .then((res) => res.json())
      .then((data) => setAvailableSlotData(data.slots))
      .catch((err) => console.error('Error fetching available slots:', err));
  }, [date, start, end, endDate]);

  const toggleSlotSelection = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  const totalPrice = useMemo(() => {
    return selectedSlots.reduce((sum, slotId) => {
      const slot = availableSlotData.find((s) => s.id === slotId);
      return sum + (slot?.price || 0);
    }, 0);
  }, [selectedSlots, availableSlotData]);

  const handleReserveSelected = () => {
    if (!selectedSlots.length) {
      alert('Please select at least one slot.');
      return;
    }
    if (!date || !start || !end || !endDate) {
      alert('Please select date and time.');
      return;
    }
    if (!socket) {
      alert('Connection error. Please refresh the page.');
      return;
    }

    socket.emit(
      'bookBulk',
      { slotIds: selectedSlots, date, start, end, endDate },
      (response) => {
        if (response.success) {
          alert('Reservation successful!');
          setSelectedSlots([]);
        } else {
          alert(response.msg || 'Reservation failed. Please try again.');
        }
      }
    );
  };

  // 3. Redirect to AuthPage if not logged in
  if (!currentUser) {
    return <AuthPage onAuthSuccess={() => setCurrentUser(localStorage.getItem('currentUser'))} />;
  }

  // 4. Dashboard with Logout and conditional TimeSelector render (FIXED)
  return (
    <div className="App">
      <header>
        <h1>Parking Slot Reservation</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {/* Render TimeSelector ONLY when NOT showing analytics */}
      {!showAnalytics && (
        <TimeSelector
          date={date}
          setDate={setDate}
          start={start}
          setStart={setStart}
          end={end}
          setEnd={setEnd}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      )}

      {!showAnalytics ? (
        <>
          <SlotGrid
            slots={slots}
            date={date}
            start={start}
            end={end}
            endDate={endDate}
            selectedSlots={selectedSlots}
            toggleSlotSelection={toggleSlotSelection}
            availableSlotData={availableSlotData}
          />

          <div className="slot-actions">
            <button id="reserve-btn" onClick={handleReserveSelected} disabled={!selectedSlots.length}>
              Reserve Selected ({selectedSlots.length})
            </button>
            {selectedSlots.length ? (
              <span className="price-sum">Total Price: €{totalPrice}</span>
            ) : (
              <span>Select slot(s)</span>
            )}
            <button id="analytics-btn" onClick={() => setShowAnalytics(true)}>
              Show Analytics
            </button>
          </div>
        </>
      ) : (
        <>
          <button onClick={() => setShowAnalytics(false)}>← Back to Slots</button>
          <AnalyticsPage />
        </>
      )}
    </div>
  );
}

export default App;
