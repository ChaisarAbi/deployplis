#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Initialize database
python app/init_db.py

# Run the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
