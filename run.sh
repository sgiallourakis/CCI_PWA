#!/bin/bash

# Sensor Dashboard Startup Script

echo "Starting Sensor Analytics Dashboard..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Get local IP address
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "======================================"
echo "Sensor Dashboard is starting..."
echo "======================================"
echo ""
echo "Access the dashboard at:"
echo "  Local:   http://localhost:5000"
echo "  Network: http://$IP:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the Flask app
python app.py
