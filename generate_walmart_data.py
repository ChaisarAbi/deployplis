import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

def generate_walmart_sales_data():
    """
    Generate realistic Walmart sales data for testing
    Format sesuai dengan dataset Kaggle Walmart Sales
    """
    
    # Set random seed untuk hasil yang konsisten
    np.random.seed(42)
    random.seed(42)
    
    # Parameter dataset
    stores = list(range(1, 11))  # Store 1-10
    departments = list(range(1, 100))  # Department 1-99
    
    # Periode data: 2 tahun (2022-2023)
    start_date = datetime(2022, 1, 7)  # Mulai dari Jumat
    end_date = datetime(2023, 12, 29)  # Sampai Jumat
    
    # Generate weekly dates (setiap Jumat)
    current_date = start_date
    dates = []
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=7)
    
    # Holiday dates (hari libur yang mempengaruhi penjualan)
    holiday_dates = [
        # 2022
        datetime(2022, 2, 11),  # Super Bowl
        datetime(2022, 4, 15),  # Easter
        datetime(2022, 5, 13),  # Mother's Day
        datetime(2022, 6, 17),  # Father's Day
        datetime(2022, 7, 4),   # Independence Day
        datetime(2022, 9, 2),   # Labor Day
        datetime(2022, 11, 25), # Thanksgiving
        datetime(2022, 12, 23), # Christmas
        datetime(2022, 12, 30), # New Year
        
        # 2023
        datetime(2023, 2, 10),  # Super Bowl
        datetime(2023, 4, 7),   # Easter
        datetime(2023, 5, 12),  # Mother's Day
        datetime(2023, 6, 16),  # Father's Day
        datetime(2023, 7, 4),   # Independence Day
        datetime(2023, 9, 1),   # Labor Day
        datetime(2023, 11, 24), # Thanksgiving
        datetime(2023, 12, 22), # Christmas
        datetime(2023, 12, 29), # New Year
    ]
    
    # Department categories dengan karakteristik berbeda
    dept_categories = {
        # High-value, stable (A-X)
        'grocery': list(range(1, 15)),
        'pharmacy': list(range(15, 20)),
        
        # High-value, variable (A-Y)
        'electronics': list(range(20, 30)),
        'automotive': list(range(30, 35)),
        
        # High-value, irregular (A-Z)
        'jewelry': list(range(35, 40)),
        
        # Medium-value, stable (B-X)
        'clothing': list(range(40, 55)),
        'home_garden': list(range(55, 65)),
        
        # Medium-value, variable (B-Y)
        'sports': list(range(65, 75)),
        'toys': list(range(75, 80)),
        
        # Medium-value, irregular (B-Z)
        'seasonal': list(range(80, 85)),
        
        # Low-value, stable (C-X)
        'health_beauty': list(range(85, 90)),
        
        # Low-value, variable (C-Y)
        'books_music': list(range(90, 95)),
        
        # Low-value, irregular (C-Z)
        'misc': list(range(95, 100)),
    }
    
    # Base sales untuk setiap kategori
    category_base_sales = {
        'grocery': (15000, 25000),
        'pharmacy': (8000, 15000),
        'electronics': (20000, 40000),
        'automotive': (12000, 25000),
        'jewelry': (5000, 30000),
        'clothing': (8000, 18000),
        'home_garden': (6000, 15000),
        'sports': (5000, 12000),
        'toys': (4000, 10000),
        'seasonal': (2000, 15000),
        'health_beauty': (3000, 8000),
        'books_music': (2000, 6000),
        'misc': (1000, 5000),
    }
    
    # Variability untuk setiap kategori (untuk XYZ classification)
    category_variability = {
        'grocery': 0.1,      # X - Low variability
        'pharmacy': 0.15,    # X - Low variability
        'electronics': 0.3,  # Y - Medium variability
        'automotive': 0.25,  # Y - Medium variability
        'jewelry': 0.6,      # Z - High variability
        'clothing': 0.2,     # X - Low variability
        'home_garden': 0.18, # X - Low variability
        'sports': 0.35,      # Y - Medium variability
        'toys': 0.4,         # Y - Medium variability
        'seasonal': 0.8,     # Z - High variability
        'health_beauty': 0.15, # X - Low variability
        'books_music': 0.45,   # Y - Medium variability
        'misc': 0.7,           # Z - High variability
    }
    
    def get_dept_category(dept):
        for category, dept_list in dept_categories.items():
            if dept in dept_list:
                return category
        return 'misc'
    
    def is_holiday_week(date, holiday_dates):
        for holiday in holiday_dates:
            if abs((date - holiday).days) <= 3:
                return True
        return False
    
    # Generate data
    data = []
    
    print("Generating Walmart sales data...")
    
    for store in stores:
        print(f"Processing Store {store}...")
        
        # Store factor (beberapa toko lebih besar dari yang lain)
        store_factor = np.random.uniform(0.7, 1.3)
        
        for dept in departments:
            category = get_dept_category(dept)
            base_min, base_max = category_base_sales[category]
            variability = category_variability[category]
            
            # Department base sales untuk store ini
            dept_base_sales = np.random.uniform(base_min, base_max) * store_factor
            
            for date in dates:
                # Check if holiday week
                is_holiday = is_holiday_week(date, holiday_dates)
                
                # Seasonal factors
                month = date.month
                seasonal_factor = 1.0
                
                if category == 'seasonal':
                    # Seasonal items peak in Q4
                    if month in [11, 12]:
                        seasonal_factor = 2.5
                    elif month in [1, 2]:
                        seasonal_factor = 0.3
                    else:
                        seasonal_factor = 0.8
                elif category == 'toys':
                    # Toys peak during holidays
                    if month in [11, 12]:
                        seasonal_factor = 2.0
                    elif month in [6, 7, 8]:
                        seasonal_factor = 1.2
                    else:
                        seasonal_factor = 0.9
                elif category == 'clothing':
                    # Clothing has back-to-school and holiday peaks
                    if month in [8, 9, 11, 12]:
                        seasonal_factor = 1.3
                    elif month in [1, 2]:
                        seasonal_factor = 0.7
                    else:
                        seasonal_factor = 1.0
                elif category == 'electronics':
                    # Electronics peak during holidays
                    if month in [11, 12]:
                        seasonal_factor = 1.5
                    elif month in [1]:
                        seasonal_factor = 0.8
                    else:
                        seasonal_factor = 1.0
                else:
                    # General seasonal pattern
                    if month in [11, 12]:
                        seasonal_factor = 1.2
                    elif month in [1, 2]:
                        seasonal_factor = 0.9
                    else:
                        seasonal_factor = 1.0
                
                # Holiday boost
                holiday_factor = 1.4 if is_holiday else 1.0
                
                # Random variation based on category variability
                random_factor = np.random.normal(1.0, variability)
                random_factor = max(0.1, random_factor)  # Ensure positive sales
                
                # Trend factor (some departments declining, others growing)
                days_from_start = (date - start_date).days
                if category in ['books_music', 'misc']:
                    # Declining trend
                    trend_factor = 1.0 - (days_from_start / 730) * 0.3
                elif category in ['electronics', 'pharmacy']:
                    # Growing trend
                    trend_factor = 1.0 + (days_from_start / 730) * 0.2
                else:
                    # Stable
                    trend_factor = 1.0
                
                # Calculate final weekly sales
                weekly_sales = (dept_base_sales * 
                              seasonal_factor * 
                              holiday_factor * 
                              random_factor * 
                              trend_factor)
                
                # Ensure minimum sales
                weekly_sales = max(100, weekly_sales)
                
                data.append({
                    'Store': store,
                    'Dept': dept,
                    'Date': date.strftime('%Y-%m-%d'),
                    'Weekly_Sales': round(weekly_sales, 2),
                    'IsHoliday': is_holiday
                })
    
    return pd.DataFrame(data)

def create_sample_files():
    """Create sample CSV files for different scenarios"""
    
    print("Generating complete dataset...")
    df = generate_walmart_sales_data()
    
    # Create output directory
    os.makedirs('sample_datasets', exist_ok=True)
    
    # 1. Complete dataset
    df.to_csv('sample_datasets/walmart_complete_dataset.csv', index=False)
    print(f"✅ Created: walmart_complete_dataset.csv ({len(df):,} records)")
    
    # 2. Individual store files
    for store in df['Store'].unique():
        store_data = df[df['Store'] == store].copy()
        filename = f'sample_datasets/walmart_store_{store}_data.csv'
        store_data.to_csv(filename, index=False)
        print(f"✅ Created: walmart_store_{store}_data.csv ({len(store_data):,} records)")
    
    # 3. Sample small dataset for quick testing
    sample_data = df[
        (df['Store'].isin([1, 2, 3])) & 
        (df['Dept'].isin(list(range(1, 21))))
    ].copy()
    sample_data.to_csv('sample_datasets/walmart_sample_small.csv', index=False)
    print(f"✅ Created: walmart_sample_small.csv ({len(sample_data):,} records)")
    
    # 4. Recent data only (2023)
    recent_data = df[df['Date'] >= '2023-01-01'].copy()
    recent_data.to_csv('sample_datasets/walmart_2023_data.csv', index=False)
    print(f"✅ Created: walmart_2023_data.csv ({len(recent_data):,} records)")
    
    # Print dataset statistics
    print("\n📊 Dataset Statistics:")
    print(f"Total Records: {len(df):,}")
    print(f"Date Range: {df['Date'].min()} to {df['Date'].max()}")
    print(f"Stores: {df['Store'].nunique()} (Store {df['Store'].min()}-{df['Store'].max()})")
    print(f"Departments: {df['Dept'].nunique()} (Dept {df['Dept'].min()}-{df['Dept'].max()})")
    print(f"Holiday Records: {df['IsHoliday'].sum():,} ({df['IsHoliday'].mean()*100:.1f}%)")
    print(f"Sales Range: ${df['Weekly_Sales'].min():,.2f} - ${df['Weekly_Sales'].max():,.2f}")
    print(f"Average Weekly Sales: ${df['Weekly_Sales'].mean():,.2f}")
    
    # Show sample data
    print("\n📋 Sample Data (first 10 rows):")
    print(df.head(10).to_string(index=False))
    
    return df

if __name__ == "__main__":
    print("🏪 Walmart Sales Data Generator")
    print("=" * 50)
    
    df = create_sample_files()
    
    print("\n✅ All sample datasets created successfully!")
    print("\n📁 Files created in 'sample_datasets/' directory:")
    print("   • walmart_complete_dataset.csv - Full dataset (all stores, all departments)")
    print("   • walmart_store_X_data.csv - Individual store data (X = 1-10)")
    print("   • walmart_sample_small.csv - Small sample for quick testing")
    print("   • walmart_2023_data.csv - Recent data only")
    
    print("\n🚀 How to use:")
    print("1. Start your application: docker-compose up")
    print("2. Go to http://localhost:3000")
    print("3. Login as admin (admin/admin123)")
    print("4. Go to 'Unggah Data' tab")
    print("5. Select a store and upload the corresponding CSV file")
    
    print("\n💡 Recommended for testing:")
    print("   • Start with 'walmart_sample_small.csv' for quick testing")
    print("   • Use individual store files for realistic scenarios")
    print("   • Use complete dataset for full-scale testing")
