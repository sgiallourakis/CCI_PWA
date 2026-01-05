# Quick Start Guide

## Getting Started in 3 Steps

### 1. Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the Application
```bash
./run.sh
```

Or manually:
```bash
python app.py
```

### 3. Open the Dashboard

Open your browser and navigate to:
- **Local**: http://localhost:5000
- **From another device**: http://YOUR_PI_IP:5000

## Features Overview

### Main Dashboard Views

1. **Gauge View** (Default)
   - Circular gauges showing real-time sensor readings
   - Color-coded status indicators (green = normal, orange = warning, red = error)
   - Min/Max ranges displayed

2. **List View**
   - Scrollable table of all sensors
   - Sortable columns
   - Status badges
   - Last update timestamps

### Sensor Filtering

Click the filter buttons at the top to view specific sensor types:
- All Sensors
- Temperature
- Humidity
- Pressure
- Motion
- Light

### Natural Language Queries

Click the **"Ask Query"** button to:
- Ask questions about your sensor data
- Get statistical summaries
- Check for alerts and warnings

Example queries:
- "What is the average temperature?"
- "Show me the highest humidity reading"
- "Are there any warnings?"
- "How many motion sensors are active?"

### Offline Mode

The app works offline after the first load:
- All UI elements are cached
- Last known sensor data is available
- Automatic sync when connection restored
- Status indicator shows connection state

## Testing the Application

The app includes mock sensor data by default. You'll see:
- 12 simulated sensors across 5 locations
- Random but realistic values
- Auto-refresh every 5 seconds

## Next Steps

### Connect Real Sensors

See README.md for instructions on:
- Integrating physical sensors
- Adding new sensor types
- Customizing the dashboard

### Deploy to Raspberry Pi

1. Transfer files to your Pi:
```bash
scp -r CCI_PWA/ pi@your-pi-ip:/home/pi/sensor-dashboard
```

2. SSH into your Pi:
```bash
ssh pi@your-pi-ip
cd /home/pi/sensor-dashboard
./run.sh
```

3. Set up auto-start (see README.md for systemd service)

### Customize

- Edit `public/styles.css` for appearance
- Modify `app.py` for backend logic
- Update `public/app.js` for frontend behavior

## Troubleshooting

**Port 5000 already in use?**
```bash
# Change port in app.py (last line)
app.run(host='0.0.0.0', port=8080, debug=True)
```

**Can't access from network?**
- Check firewall settings
- Ensure Pi is on the same network
- Use Pi's actual IP address (not localhost)

**Service worker issues?**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check browser console for errors

## Support

For issues and questions, refer to:
- README.md for detailed documentation
- Browser DevTools console for errors
- Flask logs in terminal

Enjoy your sensor dashboard!
