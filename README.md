# Walmart Sales Analysis System

Sistem analisis penjualan Walmart dengan machine learning menggunakan XGBoost dan optimasi Optuna.

## Fitur Utama

### Backend (FastAPI + Python)
- **XGBoost Machine Learning**: Model prediksi penjualan dengan XGBoost
- **Optuna Optimization**: Optimasi hyperparameter otomatis
- **SQLite Database**: Penyimpanan data ringan dan efisien
- **ABC-XYZ Classification**: Klasifikasi departemen berdasarkan nilai dan variabilitas
- **RESTful API**: API lengkap untuk semua operasi
- **Authentication**: Sistem autentikasi berbasis JWT
- **Data Visualization**: Endpoint untuk visualisasi data

### Frontend (Next.js + React)
- **Multi-role Dashboard**: Dashboard untuk Admin Utama, Admin, dan Manajer
- **Data Upload**: Interface upload data CSV Walmart
- **Model Training**: Interface pelatihan model dengan parameter kustom
- **Bayesian Optimization**: Interface optimasi dengan Optuna
- **Interactive Charts**: Visualisasi data dengan Plotly.js
- **Real-time Updates**: Update status real-time dengan React Query
- **Responsive Design**: Desain responsif dengan Tailwind CSS

## Teknologi yang Digunakan

### Backend
- **FastAPI**: Web framework Python modern
- **XGBoost**: Gradient boosting framework
- **Optuna**: Framework optimasi hyperparameter
- **SQLAlchemy**: ORM untuk database
- **SQLite**: Database ringan
- **Pandas**: Manipulasi data
- **Plotly**: Visualisasi data
- **JWT**: Autentikasi token

### Frontend
- **Next.js 14**: React framework dengan App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching dan caching
- **Plotly.js**: Interactive charts
- **Axios**: HTTP client
- **Shadcn/ui**: UI components

## Instalasi dan Menjalankan

### Menggunakan Docker (Recommended)

\`\`\`bash
# Clone repository
git clone <repository-url>
cd walmart-sales-analysis

# Jalankan dengan docker-compose
docker-compose up --build
\`\`\`

### Manual Installation

#### Backend
\`\`\`bash
# Masuk ke direktori backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -m app.init_db

# Jalankan server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

#### Frontend
\`\`\`bash
# Masuk ke direktori frontend
cd frontend

# Install dependencies
npm install

# Buat file environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Jalankan development server
npm run dev
\`\`\`

## Akses Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Akun Demo

- **Admin Utama**: `mainadmin` / `admin123`
- **Administrator**: `admin` / `admin123`
- **Manajer**: `manager` / `manager123`

## Dataset

Sistem ini dirancang untuk dataset Walmart Sales dari Kaggle:
https://www.kaggle.com/datasets/mikhail1681/walmart-sales

### Format Data yang Diperlukan
- **Store**: ID toko
- **Dept**: ID departemen
- **Date**: Tanggal (YYYY-MM-DD)
- **Weekly_Sales**: Penjualan mingguan
- **IsHoliday**: Boolean hari libur

## Fitur Machine Learning

### XGBoost Model
- Feature engineering otomatis (lag features, rolling statistics)
- Cross-validation untuk evaluasi model
- Metrics: RMSE, MAE, R², Accuracy

### Optuna Optimization
- Bayesian optimization untuk hyperparameter tuning
- Parameter yang dioptimasi:
  - n_estimators: 50-300
  - max_depth: 3-10
  - learning_rate: 0.01-0.3
  - subsample: 0.6-1.0
  - colsample_bytree: 0.6-1.0
  - reg_alpha: 0-10
  - reg_lambda: 0-10

### ABC-XYZ Classification
- **ABC Analysis**: Berdasarkan total penjualan (80-15-5 rule)
- **XYZ Analysis**: Berdasarkan coefficient of variation
- Klasifikasi otomatis departemen untuk strategi inventory

## API Endpoints

### Authentication
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Datasets
- `POST /datasets/upload` - Upload CSV dataset
- `GET /datasets` - Get all datasets

### Models
- `POST /models/train` - Train XGBoost model
- `POST /models/optimize` - Optimize model with Optuna

### Predictions
- `POST /predictions/generate` - Generate predictions
- `GET /predictions` - Get predictions

### Visualizations
- `GET /visualizations/sales-trend` - Sales trend chart
- `GET /visualizations/abc-xyz-heatmap` - ABC-XYZ heatmap

### Feedback
- `POST /feedback` - Submit feedback
- `GET /feedback` - Get feedback

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

Distributed under the MIT License. See `LICENSE` for more information.
\`\`\`

Sistem ini sekarang memiliki:

1. **Backend terpisah** dengan FastAPI, XGBoost, Optuna, dan SQLite
2. **Frontend terpisah** dengan Next.js dan integrasi API
3. **Machine Learning lengkap** dengan XGBoost dan optimasi Optuna
4. **Dataset Walmart** yang sesuai dengan struktur Kaggle
5. **Visualisasi interaktif** dengan Plotly.js
6. **Database SQLite** untuk penyimpanan data
7. **Docker support** untuk deployment mudah

Untuk menjalankan sistem:

1. **Backend**: `cd backend && python -m uvicorn app.main:app --reload`
2. **Frontend**: `cd frontend && npm run dev`
3. **Atau gunakan Docker**: `docker-compose up --build`

Sistem siap untuk analisis data penjualan Walmart dengan machine learning yang canggih!
