# Smart parking System

A real-time smart parking management application built with React, Express, and Socket.IO. It allows users to view, reserve parking slots for specific dates and times, and displays analytics on bookings and revenue.

## Features

- **Real-time parking slot status** with availability updates via WebSockets
- **Slot reservation system** with date and time selection
- **Dynamic pricing** based on duration, occupancy, weekends, and holidays
- **User authentication** (signup/sign-in)
- **Analytics dashboard** showing bookings and revenue per slot
- **Responsive UI** with modern React and Chart.js visualizations

## Tech Stack

- **Frontend:** React, React Hooks, React Chart.js 2, Socket.IO Client
- **Backend:** Node.js, Express, Socket.IO
- **Styling:** CSS with variables and responsive design
- **Data:** In-memory backend slots with random status and bookings (can be extended)

## Installation

### Backend

1. Navigate to the backend directory (if separated):
2. Install dependencies:
3. Start the backend server:
The backend runs on `http://localhost:4000`.

### Frontend

1. Navigate to the frontend directory (if separated):
2. Install dependencies:
3. The frontend runs on `http://localhost:3000`.

## Usage

- Open the app in your browser.
- Sign up or log in to reserve parking slots.
- Select date and time ranges to see available parking slots and prices.
- Select one or more slots and reserve them.
- View analytics to see top booking slots and revenue data.

## Project Structure (Main Files)

- `index.js` (backend server with Socket.IO and REST API)
- `App.js` (main React app, manages state and routing)
- `SlotGrid.js` (displays slots and statuses)
- `TimeSelector.js` (date/time inputs)
- `AnalyticsPage.js` (charts and analytics display)
- `AuthPage.js` (user authentication UI)
- `App.css` (styling)

## Important Notes

- The backend uses in-memory data and randomizes slot statuses on server start; suitable for prototyping and demonstration.
- Reserving slots updates status to reserved in real time for all connected clients.

## Screenshots

<img width="1467" height="874" alt="image" src="https://github.com/user-attachments/assets/7261f303-dbd6-4ccc-8380-8b098014761f" />
<img width="1463" height="873" alt="image" src="https://github.com/user-attachments/assets/af194a5b-c625-4e8f-ab93-07d0e53cef89" />
<img width="1470" height="875" alt="image" src="https://github.com/user-attachments/assets/97742831-f62c-4b29-968e-9a9220e61eb6" />



## Future Improvements

- Persistent database backend (e.g., MongoDB, PostgreSQL)
- Advanced user roles and permissions
- Integration with payment gateways for reservations
- Enhanced analytics with filters and custom reports
- Deploy backend and frontend separately with environment configuration

## License

This project is open-sourced under the MIT License.



