#!/bin/bash

echo "Creating sample Walmart sales data..."

# Create sample data using Python script
python create_sample_data.py

echo "Sample data files created in 'sample_data' directory:"
ls -la sample_data/

echo ""
echo "You can now upload these CSV files through the web interface:"
echo "1. Start the application: docker-compose up"
echo "2. Go to http://localhost:3000"
echo "3. Login as admin (admin/admin123)"
echo "4. Go to 'Unggah Data' tab"
echo "5. Select store and upload the corresponding CSV file"
