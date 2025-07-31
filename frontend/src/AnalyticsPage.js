import React, { useEffect, useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import './App.css';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    slots: [],
    summary: { statusCounts: {} }
  });
  const [showMode, setShowMode] = useState('top10');

  useEffect(() => {
    fetch('http://localhost:4000/api/analytics')
      .then(res => res.json())
      .then(setAnalytics);
  }, []);

  const { slots, summary } = analytics;
  const workingSensors = (summary.statusCounts?.available || 0) + (summary.statusCounts?.reserved || 0);
  const outOfStatusSensors = summary.statusCounts?.out_of_order || 0;

  const topSlots = [...slots]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, showMode === 'top10' ? 10 : slots.length);

  const sensorDoughnutData = {
    labels: ['Working Properly', 'Out of Status'],
    datasets: [{
      data: [workingSensors, outOfStatusSensors],
      backgroundColor: ['#2196F3', '#d32f2f'],
      borderWidth: 2,
    }],
  };

  const barChartData = {
    labels: topSlots.map(slot => `Slot ${slot.id}`),
    datasets: [
      {
        label: 'Bookings',
        data: topSlots.map(slot => slot.totalBookings),
        backgroundColor: '#1976d2',
        borderRadius: 6,
        maxBarThickness: 28,
      },
      {
        label: 'Revenue (€)',
        data: topSlots.map(slot => slot.totalRevenue),
        backgroundColor: '#ff9800',
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const chartOptions = {
    plugins: { legend: { position: 'bottom' } },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#ccc' } },
    },
  };

  return (
    <div className="analytics-page">
      <div className="analytics-summary">
        <h2>Parking Analytics</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <span>Total Slots</span>
            <strong>{summary.totalSlots}</strong>
          </div>
          <div className="summary-card">
            <span>Total Bookings</span>
            <strong>{summary.totalBookings}</strong>
          </div>
          <div className="summary-card">
            <span>Total Revenue</span>
            <strong>€{summary.totalRevenue}</strong>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Sensor Status</h3>
          <div className="doughnut-chart-container">
            <Doughnut data={sensorDoughnutData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3>
            <div>Top Slots by Revenue</div>
            <div className="chart-mode-tabs">
              <button
                className={showMode === 'top10' ? 'active' : ''}
                onClick={() => setShowMode('top10')}
              >
                Top 10
              </button>
              <button
                className={showMode === 'all' ? 'active' : ''}
                onClick={() => setShowMode('all')}
              >
                All
              </button>
            </div>
          </h3>
          <div className="bar-chart-container">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="leaderboard-section">
        <h3>Slot Leaderboard</h3>
        <div className="analytics-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Slot ID</th>
                <th>Status</th>
                <th>Bookings</th>
                <th>Revenue (€)</th>
              </tr>
            </thead>
            <tbody>
              {slots
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .map((slot, i) => (
                  <tr key={slot.id}>
                    <td>{i + 1}</td>
                    <td>{slot.id}</td>
                    <td>{slot.status.replaceAll('_', ' ')}</td>
                    <td>{slot.totalBookings}</td>
                    <td>€{slot.totalRevenue}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
