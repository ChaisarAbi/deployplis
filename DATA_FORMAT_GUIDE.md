# Walmart Sales Data Format Guide

## 📋 Required CSV Format

Sistem ini mengharapkan file CSV dengan format berikut:

### Kolom Wajib:
| Kolom | Tipe Data | Deskripsi | Contoh |
|-------|-----------|-----------|---------|
| `Store` | Integer | ID Toko (1-45) | 1, 2, 3, ... |
| `Dept` | Integer | ID Departemen (1-99) | 1, 2, 3, ... |
| `Date` | String | Tanggal (YYYY-MM-DD) | 2023-01-06 |
| `Weekly_Sales` | Float | Penjualan Mingguan ($) | 24215.46 |
| `IsHoliday` | Boolean | Hari Libur | True/False |

### Contoh Data:
\`\`\`csv
Store,Dept,Date,Weekly_Sales,IsHoliday
1,1,2023-01-06,24215.46,False
1,1,2023-01-13,46039.49,True
1,2,2023-01-06,50605.27,False
2,1,2023-01-06,18567.23,False
\`\`\`

## 🏪 Karakteristik Data

### Stores (Toko):
- **Range**: 1-45 (sesuai dataset Walmart asli)
- **Rekomendasi**: Gunakan 1-10 untuk testing
- **Karakteristik**: Setiap toko memiliki performa berbeda

### Departments (Departemen):
- **Range**: 1-99
- **Kategori Utama**:
  - 1-14: Grocery (prioritas tinggi, stabil)
  - 15-19: Pharmacy (prioritas tinggi, stabil)
  - 20-29: Electronics (prioritas tinggi, variabel)
  - 30-39: Automotive (prioritas tinggi, variabel)
  - 40-54: Clothing (prioritas sedang, stabil)
  - 55-64: Home & Garden (prioritas sedang, stabil)
  - 65-79: Sports & Toys (prioritas sedang, variabel)
  - 80-99: Miscellaneous (prioritas rendah, tidak teratur)

### Date (Tanggal):
- **Format**: YYYY-MM-DD
- **Frekuensi**: Data mingguan (biasanya Jumat)
- **Range**: 2010-2012 (dataset asli) atau 2022-2023 (sample data)

### Weekly_Sales (Penjualan Mingguan):
- **Unit**: Dollar ($)
- **Range**: $100 - $100,000+
- **Karakteristik**: Bervariasi berdasarkan departemen, musim, dan hari libur

### IsHoliday (Hari Libur):
- **True**: Minggu yang mengandung hari libur besar
- **False**: Minggu normal
- **Hari Libur**: Super Bowl, Easter, Mother's Day, Father's Day, Independence Day, Labor Day, Thanksgiving, Christmas

## 🎯 ABC-XYZ Classification

Data akan diklasifikasikan otomatis:

### ABC Analysis (berdasarkan total penjualan):
- **A**: 80% dari total penjualan (departemen prioritas tinggi)
- **B**: 15% dari total penjualan (departemen prioritas sedang)
- **C**: 5% dari total penjualan (departemen prioritas rendah)

### XYZ Analysis (berdasarkan variabilitas):
- **X**: Coefficient of Variation < 33% (permintaan stabil)
- **Y**: Coefficient of Variation 33-67% (permintaan variabel)
- **Z**: Coefficient of Variation > 67% (permintaan tidak teratur)

## 📊 Tips untuk Data Berkualitas

### 1. Konsistensi Temporal:
- Gunakan interval mingguan yang konsisten
- Pastikan tidak ada gap tanggal yang besar
- Mulai dari hari yang sama setiap minggu

### 2. Realisme Data:
- Penjualan holiday 20-50% lebih tinggi
- Penjualan musiman (Q4 lebih tinggi)
- Variasi antar departemen yang realistis

### 3. Volume Data:
- **Minimum**: 52 minggu data (1 tahun)
- **Optimal**: 104 minggu data (2 tahun)
- **Departemen**: Minimal 10-20 departemen per toko

### 4. Kualitas Data:
- Tidak ada nilai negatif untuk penjualan
- Tidak ada missing values
- Format tanggal konsisten

## 🚀 Cara Menggunakan Sample Data

### 1. Generate Sample Data:
\`\`\`bash
python generate_walmart_data.py
\`\`\`

### 2. File yang Dihasilkan:
- `walmart_complete_dataset.csv` - Dataset lengkap
- `walmart_store_X_data.csv` - Data per toko
- `walmart_sample_small.csv` - Sample kecil untuk testing
- `walmart_2023_data.csv` - Data terbaru saja

### 3. Upload ke Sistem:
1. Login sebagai admin
2. Pilih tab "Unggah Data"
3. Pilih toko yang sesuai
4. Upload file CSV

## ⚠️ Validasi Data

Sistem akan memvalidasi:
- ✅ Format kolom sesuai
- ✅ Tipe data benar
- ✅ Tidak ada missing values
- ✅ Range nilai masuk akal
- ✅ Format tanggal valid

## 🔍 Contoh Use Cases

### Testing Cepat:
\`\`\`csv
Store,Dept,Date,Weekly_Sales,IsHoliday
1,1,2023-01-06,15000.00,False
1,1,2023-01-13,22000.00,True
1,2,2023-01-06,8000.00,False
1,2,2023-01-13,12000.00,True
\`\`\`

### Production Data:
- Gunakan dataset Kaggle asli
- Atau generate dengan script yang disediakan
- Minimal 1000+ records untuk hasil ML yang baik
\`\`\`

\`\`\`shellscript file="setup_sample_data.sh"
#!/bin/bash

echo "🏪 Setting up Walmart Sales Sample Data"
echo "======================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is required but not installed."
    exit 1
fi

# Install required packages if not available
echo "📦 Installing required Python packages..."
pip3 install pandas numpy > /dev/null 2>&1

# Generate sample data
echo "🔄 Generating sample Walmart sales data..."
python3 generate_walmart_data.py

# Check if data was generated successfully
if [ -d "sample_datasets" ]; then
    echo ""
    echo "✅ Sample data generated successfully!"
    echo ""
    echo "📁 Available datasets:"
    ls -la sample_datasets/
    
    echo ""
    echo "📊 Quick stats:"
    echo "   • Complete dataset: $(wc -l &lt; sample_datasets/walmart_complete_dataset.csv) lines"
    echo "   • Small sample: $(wc -l &lt; sample_datasets/walmart_sample_small.csv) lines"
    echo "   • Individual store files: 10 files"
    
    echo ""
    echo "🚀 Next steps:"
    echo "1. Start the application:"
    echo "   docker-compose up"
    echo ""
    echo "2. Access the web interface:"
    echo "   http://localhost:3000"
    echo ""
    echo "3. Login as admin:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "4. Upload data:"
    echo "   • Go to 'Unggah Data' tab"
    echo "   • Select a store (1-10)"
    echo "   • Upload corresponding CSV file"
    echo ""
    echo "💡 Recommended for first test:"
    echo "   Upload 'walmart_sample_small.csv' for quick testing"
    
else
    echo "❌ Failed to generate sample data"
    exit 1
fi
