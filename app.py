from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random
import time
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict

app = Flask(__name__, static_folder='public')
CORS(app)

# In-memory sensor data storage
sensor_data = defaultdict(list)
MAX_HISTORY = 1000

# Sensor configuration
SENSOR_CONFIG = {
    'temperature': {'min': 15, 'max': 30, 'unit': '°C'},
    'humidity': {'min': 30, 'max': 80, 'unit': '%'},
    'pressure': {'min': 950, 'max': 1050, 'unit': 'hPa'},
    'motion': {'min': 0, 'max': 1, 'unit': ''},
    'light': {'min': 0, 'max': 1000, 'unit': 'lux'}
}

LOCATIONS = ['Living Room', 'Bedroom', 'Kitchen', 'Garage', 'Outdoor']


def generate_sensor_value(sensor_type):
    """Generate realistic sensor values with some variation"""
    config = SENSOR_CONFIG[sensor_type]

    if sensor_type == 'temperature':
        base = 22
        variation = random.gauss(0, 2)
        value = max(config['min'], min(config['max'], base + variation))
    elif sensor_type == 'humidity':
        base = 50
        variation = random.gauss(0, 10)
        value = max(config['min'], min(config['max'], base + variation))
    elif sensor_type == 'pressure':
        base = 1013
        variation = random.gauss(0, 20)
        value = max(config['min'], min(config['max'], base + variation))
    elif sensor_type == 'motion':
        value = 1 if random.random() > 0.7 else 0
    elif sensor_type == 'light':
        base = 500
        variation = random.gauss(0, 200)
        value = max(config['min'], min(config['max'], base + variation))

    return round(value, 1) if sensor_type in ['temperature'] else int(value)


def get_sensor_status(value, sensor_type):
    """Determine sensor status based on value"""
    config = SENSOR_CONFIG[sensor_type]

    if value > config['max']:
        return 'error'
    elif value > config['max'] * 0.9:
        return 'warning'
    elif value < config['min']:
        return 'error'
    elif value < config['min'] * 1.1:
        return 'warning'
    else:
        return 'active'


@app.route('/')
def serve_app():
    """Serve the PWA"""
    return send_from_directory('public', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('public', path)


@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    """Get current sensor readings"""
    sensors = []

    for i, sensor_type in enumerate(['temperature', 'humidity', 'pressure', 'motion', 'light'] * 3):
        location = LOCATIONS[i // 5]
        sensor_id = f"sensor-{i + 1}"

        value = generate_sensor_value(sensor_type)
        config = SENSOR_CONFIG[sensor_type]

        sensor = {
            'id': sensor_id,
            'name': f"{location} {sensor_type.capitalize()}",
            'type': sensor_type,
            'value': value,
            'unit': config['unit'],
            'min': config['min'],
            'max': config['max'],
            'status': get_sensor_status(value, sensor_type),
            'lastUpdate': datetime.now().isoformat()
        }

        sensors.append(sensor)

        # Store in history
        sensor_data[sensor_id].append({
            'timestamp': time.time(),
            'value': value
        })

        # Keep only recent history
        if len(sensor_data[sensor_id]) > MAX_HISTORY:
            sensor_data[sensor_id] = sensor_data[sensor_id][-MAX_HISTORY:]

    return jsonify(sensors)


@app.route('/api/sensors/<sensor_id>/history', methods=['GET'])
def get_sensor_history(sensor_id):
    """Get historical data for a specific sensor"""
    hours = int(request.args.get('hours', 24))
    cutoff_time = time.time() - (hours * 3600)

    history = [
        point for point in sensor_data.get(sensor_id, [])
        if point['timestamp'] >= cutoff_time
    ]

    return jsonify(history)


@app.route('/api/query', methods=['POST'])
def process_query():
    """Process natural language queries using ML/statistical analysis"""
    data = request.json
    query = data.get('query', '').lower()
    sensors = data.get('sensors', [])

    # Simple query processing (can be replaced with local LLM)
    response = process_simple_query(query, sensors)

    return jsonify({'answer': response})


def process_simple_query(query, sensors):
    """Process simple statistical queries"""

    # Temperature queries
    if 'average temperature' in query or 'mean temperature' in query:
        temps = [s['value'] for s in sensors if s['type'] == 'temperature']
        if temps:
            avg = np.mean(temps)
            return f"The average temperature across all sensors is {avg:.1f}°C"

    # Maximum/minimum queries
    if 'highest' in query or 'maximum' in query:
        if 'temperature' in query:
            temps = [(s['name'], s['value']) for s in sensors if s['type'] == 'temperature']
            if temps:
                max_sensor = max(temps, key=lambda x: x[1])
                return f"The highest temperature is {max_sensor[1]}°C at {max_sensor[0]}"
        elif 'humidity' in query:
            hums = [(s['name'], s['value']) for s in sensors if s['type'] == 'humidity']
            if hums:
                max_sensor = max(hums, key=lambda x: x[1])
                return f"The highest humidity is {max_sensor[1]}% at {max_sensor[0]}"

    if 'lowest' in query or 'minimum' in query:
        if 'temperature' in query:
            temps = [(s['name'], s['value']) for s in sensors if s['type'] == 'temperature']
            if temps:
                min_sensor = min(temps, key=lambda x: x[1])
                return f"The lowest temperature is {min_sensor[1]}°C at {min_sensor[0]}"

    # Status queries
    if 'warning' in query or 'alert' in query:
        warnings = [s for s in sensors if s['status'] in ['warning', 'error']]
        if warnings:
            msg = f"Found {len(warnings)} sensor(s) with alerts: "
            msg += ", ".join([f"{s['name']} ({s['status']})" for s in warnings])
            return msg
        return "All sensors are operating normally."

    # Count queries
    if 'how many' in query:
        if 'sensor' in query:
            return f"There are {len(sensors)} sensors being monitored."
        if 'motion' in query:
            motion_sensors = [s for s in sensors if s['type'] == 'motion' and s['value'] == 1]
            return f"There are {len(motion_sensors)} motion sensor(s) currently detecting movement."

    # Default response
    return "I can help with queries about sensor statistics, averages, maximums, minimums, and alerts. Try asking 'What is the average temperature?' or 'Are there any warnings?'"


@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    """Perform statistical analysis on sensor data"""
    data = request.json
    sensor_ids = data.get('sensor_ids', [])
    analysis_type = data.get('type', 'summary')

    results = {}

    for sensor_id in sensor_ids:
        history = sensor_data.get(sensor_id, [])
        if not history:
            continue

        values = [point['value'] for point in history]

        if analysis_type == 'summary':
            results[sensor_id] = {
                'mean': float(np.mean(values)),
                'median': float(np.median(values)),
                'std': float(np.std(values)),
                'min': float(np.min(values)),
                'max': float(np.max(values)),
                'count': len(values)
            }
        elif analysis_type == 'trend':
            # Simple linear regression for trend
            x = np.arange(len(values))
            z = np.polyfit(x, values, 1)
            trend = 'increasing' if z[0] > 0 else 'decreasing' if z[0] < 0 else 'stable'
            results[sensor_id] = {
                'trend': trend,
                'slope': float(z[0])
            }

    return jsonify(results)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'sensors_tracked': len(sensor_data)
    })


if __name__ == '__main__':
    # For Raspberry Pi deployment, bind to all interfaces
    # Using port 8080 (port 5000 may be used by AirPlay on macOS)
    app.run(host='0.0.0.0', port=8080, debug=True)
