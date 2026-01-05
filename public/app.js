// app.js

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("Service worker registered"))
      .catch(err => console.error("SW error:", err));
  });
}

// Application State
const state = {
  sensors: [],
  currentFilter: 'all',
  currentView: 'gauge',
  isOnline: navigator.onLine
};

// API Configuration
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8080/api'
  : '/api';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadSensorData();
  setupAutoRefresh();
  checkConnectionStatus();
});

// Event Listeners
function initEventListeners() {
  // View Toggle
  document.getElementById('gauge-view-btn').addEventListener('click', () => switchView('gauge'));
  document.getElementById('list-view-btn').addEventListener('click', () => switchView('list'));

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => filterSensors(e.target.dataset.type));
  });

  // Query Modal
  document.getElementById('query-btn').addEventListener('click', openQueryModal);
  document.getElementById('close-modal').addEventListener('click', closeQueryModal);
  document.getElementById('submit-query').addEventListener('click', submitQuery);
  document.getElementById('clear-query').addEventListener('click', clearQuery);

  // Online/Offline Detection
  window.addEventListener('online', () => updateConnectionStatus(true));
  window.addEventListener('offline', () => updateConnectionStatus(false));
}

// Load Sensor Data
async function loadSensorData() {
  try {
    const response = await fetch(`${API_BASE}/sensors`);

    if (!response.ok) {
      // If API fails, use mock data
      state.sensors = getMockData();
    } else {
      state.sensors = await response.json();
    }

    // Store in localStorage for offline access
    localStorage.setItem('sensorData', JSON.stringify(state.sensors));

    renderDashboard();
  } catch (error) {
    console.error('Error loading sensors:', error);

    // Try to load from cache
    const cached = localStorage.getItem('sensorData');
    if (cached) {
      state.sensors = JSON.parse(cached);
      renderDashboard();
    } else {
      // Fallback to mock data
      state.sensors = getMockData();
      renderDashboard();
    }
  }
}

// Mock Data Generator
function getMockData() {
  const types = ['temperature', 'humidity', 'pressure', 'motion', 'light'];
  const locations = ['Living Room', 'Bedroom', 'Kitchen', 'Garage', 'Outdoor'];

  return Array.from({ length: 12 }, (_, i) => {
    const type = types[i % types.length];
    const location = locations[Math.floor(i / types.length) % locations.length];

    let value, unit, min, max;
    switch(type) {
      case 'temperature':
        value = (18 + Math.random() * 10).toFixed(1);
        unit = '°C';
        min = 15;
        max = 30;
        break;
      case 'humidity':
        value = (40 + Math.random() * 40).toFixed(0);
        unit = '%';
        min = 30;
        max = 80;
        break;
      case 'pressure':
        value = (980 + Math.random() * 60).toFixed(0);
        unit = 'hPa';
        min = 950;
        max = 1050;
        break;
      case 'motion':
        value = Math.random() > 0.5 ? 1 : 0;
        unit = '';
        min = 0;
        max = 1;
        break;
      case 'light':
        value = (200 + Math.random() * 800).toFixed(0);
        unit = 'lux';
        min = 0;
        max = 1000;
        break;
    }

    return {
      id: `sensor-${i + 1}`,
      name: `${location} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      value: parseFloat(value),
      unit,
      min,
      max,
      status: value > max * 0.9 ? 'warning' : value > max ? 'error' : 'active',
      lastUpdate: new Date(Date.now() - Math.random() * 300000).toISOString()
    };
  });
}

// Render Dashboard
function renderDashboard() {
  if (state.currentView === 'gauge') {
    renderGaugeView();
  } else {
    renderListView();
  }
}

// Render Gauge View
function renderGaugeView() {
  const container = document.getElementById('gauge-grid');
  const filtered = getFilteredSensors();

  container.innerHTML = filtered.map(sensor => createGaugeCard(sensor)).join('');
}

// Create Gauge Card
function createGaugeCard(sensor) {
  const percentage = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100;
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (percentage / 100) * circumference;

  return `
    <div class="gauge-card">
      <div class="gauge-header">
        <span class="gauge-name">${sensor.name}</span>
        <span class="gauge-status ${sensor.status}"></span>
      </div>
      <div class="gauge-visual">
        <svg class="gauge-svg" width="200" height="200" viewBox="0 0 200 200">
          <circle class="gauge-bg" cx="100" cy="100" r="90" />
          <circle
            class="gauge-fill"
            cx="100"
            cy="100"
            r="90"
            style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};"
          />
        </svg>
        <div class="gauge-value">
          <div class="gauge-number">${sensor.value}</div>
          <div class="gauge-unit">${sensor.unit}</div>
        </div>
      </div>
      <div class="gauge-footer">
        <span>Min: ${sensor.min}${sensor.unit}</span>
        <span>Max: ${sensor.max}${sensor.unit}</span>
      </div>
    </div>
  `;
}

// Render List View
function renderListView() {
  const container = document.getElementById('sensor-list-items');
  const filtered = getFilteredSensors();

  container.innerHTML = filtered.map(sensor => createListItem(sensor)).join('');
}

// Create List Item
function createListItem(sensor) {
  const timeAgo = getTimeAgo(new Date(sensor.lastUpdate));
  const nameParts = sensor.name.split(' ');
  const location = nameParts.slice(0, -1).join(' ');
  const sensorType = nameParts[nameParts.length - 1];

  return `
    <div class="list-item">
      <div class="sensor-name">
        <span class="sensor-location">${location}</span>
      </div>
      <div class="sensor-type-col">${sensor.type}</div>
      <div class="sensor-value">${sensor.value}${sensor.unit}</div>
      <div class="sensor-status">
        <span class="status-dot ${sensor.status}"></span>
        <span class="status-text">${sensor.status === 'active' ? 'normal' : sensor.status}</span>
      </div>
      <div class="sensor-time">${timeAgo}</div>
    </div>
  `;
}

// Get Filtered Sensors
function getFilteredSensors() {
  if (state.currentFilter === 'all') {
    return state.sensors;
  }
  return state.sensors.filter(s => s.type === state.currentFilter);
}

// Switch View
function switchView(view) {
  state.currentView = view;

  // Update buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${view}-view-btn`).classList.add('active');

  // Toggle dashboards
  if (view === 'gauge') {
    document.getElementById('gauge-dashboard').classList.remove('hidden');
    document.getElementById('list-dashboard').classList.add('hidden');
  } else {
    document.getElementById('gauge-dashboard').classList.add('hidden');
    document.getElementById('list-dashboard').classList.remove('hidden');
  }

  renderDashboard();
}

// Filter Sensors
function filterSensors(type) {
  state.currentFilter = type;

  // Update buttons
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  renderDashboard();
}

// Query Modal Functions
function openQueryModal() {
  document.getElementById('query-modal').classList.remove('hidden');
  document.getElementById('query-input').focus();
}

function closeQueryModal() {
  document.getElementById('query-modal').classList.add('hidden');
  clearQuery();
}

function clearQuery() {
  document.getElementById('query-input').value = '';
  document.getElementById('query-result').classList.add('hidden');
  document.getElementById('query-result').innerHTML = '';
}

async function submitQuery() {
  const query = document.getElementById('query-input').value.trim();

  if (!query) return;

  const submitBtn = document.getElementById('submit-query');
  const resultDiv = document.getElementById('query-result');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Processing...';

  try {
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sensors: state.sensors })
    });

    if (!response.ok) throw new Error('Query failed');

    const result = await response.json();

    resultDiv.innerHTML = `<strong>Answer:</strong><br>${result.answer}`;
    resultDiv.classList.remove('hidden');
  } catch (error) {
    console.error('Query error:', error);
    resultDiv.innerHTML = `<strong>Error:</strong><br>Unable to process query. ${state.isOnline ? 'Server may be unavailable.' : 'You are offline.'}`;
    resultDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Query';
  }
}

// Connection Status
function updateConnectionStatus(isOnline) {
  state.isOnline = isOnline;
  const statusText = document.getElementById('status-text');
  const statusDot = document.querySelector('.status-dot');

  if (isOnline) {
    statusText.textContent = 'Connected';
    statusDot.classList.remove('offline');
  } else {
    statusText.textContent = 'Offline';
    statusDot.classList.add('offline');
  }
}

function checkConnectionStatus() {
  updateConnectionStatus(navigator.onLine);
}

// Auto Refresh
function setupAutoRefresh() {
  setInterval(() => {
    if (state.isOnline) {
      loadSensorData();
    }
  }, 5000); // Refresh every 5 seconds
}

// Utility: Time Ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
