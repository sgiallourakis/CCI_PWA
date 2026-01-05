# Sensor Analytics Dashboard PWA

A Progressive Web App for real-time sensor data analytics, designed to run on Raspberry Pi 4.

## Features

- **Real-time Gauges**: Visual representation of sensor data with circular gauges
- **Dual View Modes**: Switch between gauge view and scrollable list view
- **Sensor Filtering**: Filter by sensor type (temperature, humidity, pressure, motion, light)
- **Natural Language Queries**: Ask questions about your sensor data using an LLM interface
- **Offline Support**: Full PWA capabilities with offline data caching
- **ML/Statistical Analysis**: Built-in statistical analysis and trend detection
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- Vanilla JavaScript (no frameworks for optimal Pi performance)
- CSS3 with custom properties
- Service Worker for offline functionality
- LocalStorage for data persistence

### Backend
- Python Flask
- NumPy for statistical analysis
- Optional: scikit-learn, TensorFlow Lite for ML features

## Installation

### Prerequisites
- Raspberry Pi 4 (or any system with Python 3.8+)
- Python 3.8 or higher
- pip package manager

### Setup

1. Clone or copy this repository to your Raspberry Pi:
```bash
cd /home/pi
git clone <your-repo-url> sensor-dashboard
cd sensor-dashboard
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

5. Access the dashboard:
- Locally: `http://localhost:5000`
- From network: `http://<pi-ip-address>:5000`

### Running as a Service (Systemd)

To run the dashboard automatically on boot:

1. Create a systemd service file:
```bash
sudo nano /etc/systemd/system/sensor-dashboard.service
```

2. Add the following content:
```ini
[Unit]
Description=Sensor Analytics Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/sensor-dashboard
Environment="PATH=/home/pi/sensor-dashboard/venv/bin"
ExecStart=/home/pi/sensor-dashboard/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:
```bash
sudo systemctl enable sensor-dashboard
sudo systemctl start sensor-dashboard
sudo systemctl status sensor-dashboard
```

## API Endpoints

### GET `/api/sensors`
Returns current readings from all sensors.

### GET `/api/sensors/<sensor_id>/history?hours=24`
Returns historical data for a specific sensor.

### POST `/api/query`
Process natural language queries about sensor data.
```json
{
  "query": "What is the average temperature?",
  "sensors": [...]
}
```

### POST `/api/analyze`
Perform statistical analysis on sensor data.
```json
{
  "sensor_ids": ["sensor-1", "sensor-2"],
  "type": "summary"
}
```

### GET `/api/health`
Health check endpoint.

## Integrating Real Sensors

To integrate real sensor hardware:

1. Install sensor libraries (e.g., Adafruit_DHT for DHT22):
```bash
pip install adafruit-circuitpython-dht
```

2. Modify `app.py` to read from actual sensors:
```python
import board
import adafruit_dht

dht_sensor = adafruit_dht.DHT22(board.D4)

def read_temperature_sensor():
    try:
        temperature = dht_sensor.temperature
        return temperature
    except RuntimeError:
        return None
```

3. Replace the `generate_sensor_value()` function with actual sensor reads.

## Adding Local LLM Support

For natural language queries using a local LLM:

1. Install additional dependencies:
```bash
pip install transformers torch
```

2. Download a small model optimized for Pi (e.g., DistilGPT-2, TinyLlama):
```python
from transformers import pipeline

generator = pipeline('text-generation', model='TinyLlama/TinyLlama-1.1B-Chat-v1.0')
```

3. Update the `process_query()` function to use the LLM.

## Performance Optimization for Raspberry Pi

- The frontend uses vanilla JavaScript for minimal overhead
- Service worker caches all assets for fast loading
- Data updates every 5 seconds (configurable in `app.js`)
- Limited to 1000 historical data points per sensor

## Development

### File Structure
```
sensor-dashboard/
├── public/
│   ├── index.html       # Main HTML
│   ├── app.js           # Frontend JavaScript
│   ├── styles.css       # Styling
│   ├── sw.js            # Service Worker
│   ├── manifest.json    # PWA manifest
│   └── icons/           # App icons
├── app.py               # Flask backend
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

### Customization

- **Add sensor types**: Update `SENSOR_CONFIG` in `app.py` and add filter buttons in `index.html`
- **Adjust refresh rate**: Modify `setupAutoRefresh()` interval in `app.js`
- **Change color scheme**: Update CSS variables in `styles.css`
- **Add charts**: Integrate Chart.js or D3.js for time-series visualization

## Troubleshooting

### Service worker not registering
- Ensure you're accessing via `http://localhost` or HTTPS
- Check browser console for errors

### API requests failing
- Verify Flask is running on port 5000
- Check CORS settings if accessing from different origin
- Review Flask logs for errors

### Offline mode not working
- Clear browser cache and reload
- Check service worker is installed in DevTools > Application

## Future Enhancements

- [ ] Historical data visualization with charts
- [ ] Export data to CSV/JSON
- [ ] Push notifications for sensor alerts
- [ ] Multi-user authentication
- [ ] Database integration (SQLite/InfluxDB)
- [ ] Advanced ML models for anomaly detection
- [ ] Integration with MQTT for IoT devices

## License

MIT License - Feel free to modify and distribute.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
