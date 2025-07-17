import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

def create_sample_walmart_data():
    """Create sample Walmart sales data for testing"""
    
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Parameters
    stores = [1, 2, 3]
    departments = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2023, 12, 31)
    
    # Generate date range (weekly data)
    date_range = pd.date_range(start=start_date, end=end_date, freq='W')
    
    # Holiday dates (simplified)
    holidays = [
        datetime(2023, 1, 1),   # New Year
        datetime(2023, 7, 4),   # Independence Day
        datetime(2023, 11, 23), # Thanksgiving
        datetime(2023, 12, 25), # Christmas
    ]
    
    data = []
    
    for store in stores:
        for dept in departments:
            # Base sales for this store-dept combination
            base_sales = np.random.uniform(10000, 50000)
            
            # Seasonal factor (higher in Q4)
            seasonal_factor = 1.0
            
            for date in date_range:
                # Check if holiday
                is_holiday = any(abs((date - holiday).days) <= 3 for holiday in holidays)
                
                # Seasonal adjustment (higher sales in Q4)
                if date.month in [11, 12]:
                    seasonal_factor = 1.3
                elif date.month in [6, 7, 8]:
                    seasonal_factor = 1.1
                else:
                    seasonal_factor = 1.0
                
                # Holiday boost
                holiday_factor = 1.5 if is_holiday else 1.0
                
                # Random variation
                random_factor = np.random.uniform(0.8, 1.2)
                
                # Calculate weekly sales
                weekly_sales = base_sales * seasonal_factor * holiday_factor * random_factor
                
                # Add some departments with declining trend
                if dept in [8, 9, 10]:
                    trend_factor = 1.0 - (date.dayofyear / 365) * 0.2
                    weekly_sales *= trend_factor
                
                data.append({
                    'Store': store,
                    'Dept': dept,
                    'Date': date.strftime('%Y-%m-%d'),
                    'Weekly_Sales': round(weekly_sales, 2),
                    'IsHoliday': is_holiday
                })
    
    # Create DataFrame
    df_walmart = pd.DataFrame(data)
    
    # Create sample files for each store
    os.makedirs('sample_data', exist_ok=True)
    
    for store in stores:
        store_data = df_walmart[df_walmart['Store'] == store].copy()
        filename = f'sample_data/walmart_store_{store}_sales.csv'
        store_data.to_csv(filename, index=False)
        print(f"Created: {filename} with {len(store_data)} records")
    
    # Create combined file
    combined_filename = 'sample_data/walmart_all_stores_sales.csv'
    df_walmart.to_csv(combined_filename, index=False)
    print(f"Created: {combined_filename} with {len(df_walmart)} records")
    
    return df_walmart

def create_sample_indonesian_retail_data():
    """Create sample Indonesian retail sales data for testing"""
    
    # Set random seed for reproducibility
    np.random.seed(42)
    random.seed(42)
    
    # Indonesian store data
    stores = [
        {"id": "TK001", "name": "Indomaret Sudirman", "location": "Jakarta Pusat"},
        {"id": "TK002", "name": "Alfamart Kemang", "location": "Jakarta Selatan"},
        {"id": "TK003", "name": "Circle K Senayan", "location": "Jakarta Pusat"},
        {"id": "TK004", "name": "Lawson Kuningan", "location": "Jakarta Selatan"},
        {"id": "TK005", "name": "FamilyMart PIK", "location": "Jakarta Utara"},
    ]
    
    # Indonesian product categories and items
    indonesian_products = [
        # Makanan Instan
        {"name": "Indomie Goreng", "category": "Makanan Instan", "brand": "Indofood", "price": 3500, "dept": "FOOD"},
        {"name": "Mie Sedaap Kari Ayam", "category": "Makanan Instan", "brand": "Wings Food", "price": 3200, "dept": "FOOD"},
        {"name": "Pop Mie Ayam Bawang", "category": "Makanan Instan", "brand": "Indofood", "price": 4500, "dept": "FOOD"},
        {"name": "Sarimi Isi 2", "category": "Makanan Instan", "brand": "Indofood", "price": 2800, "dept": "FOOD"},
        
        # Minuman
        {"name": "Teh Botol Sosro", "category": "Minuman", "brand": "Sosro", "price": 4000, "dept": "BEVERAGE"},
        {"name": "Aqua 600ml", "category": "Minuman", "brand": "Aqua", "price": 3000, "dept": "BEVERAGE"},
        {"name": "Pocari Sweat", "category": "Minuman", "brand": "Otsuka", "price": 6500, "dept": "BEVERAGE"},
        {"name": "Fruit Tea Apple", "category": "Minuman", "brand": "Sosro", "price": 4500, "dept": "BEVERAGE"},
        
        # Snack
        {"name": "Chitato Sapi Panggang", "category": "Snack", "brand": "Indofood", "price": 8500, "dept": "SNACK"},
        {"name": "Taro Net", "category": "Snack", "brand": "Taro", "price": 7000, "dept": "SNACK"},
        {"name": "Pringles Original", "category": "Snack", "brand": "Pringles", "price": 25000, "dept": "SNACK"},
        {"name": "Oreo Original", "category": "Snack", "brand": "Oreo", "price": 12000, "dept": "SNACK"},
        
        # Personal Care
        {"name": "Pepsodent 190g", "category": "Personal Care", "brand": "Pepsodent", "price": 15000, "dept": "PERSONAL"},
        {"name": "Pantene Shampoo", "category": "Personal Care", "brand": "Pantene", "price": 28000, "dept": "PERSONAL"},
        {"name": "Lifebuoy Sabun Mandi", "category": "Personal Care", "brand": "Lifebuoy", "price": 8500, "dept": "PERSONAL"},
        {"name": "Rexona Deodorant", "category": "Personal Care", "brand": "Rexona", "price": 18000, "dept": "PERSONAL"},
        
        # Household
        {"name": "Rinso Deterjen 800g", "category": "Household", "brand": "Rinso", "price": 22000, "dept": "HOUSEHOLD"},
        {"name": "Sunlight 800ml", "category": "Household", "brand": "Sunlight", "price": 12500, "dept": "HOUSEHOLD"},
        {"name": "Baygon Spray", "category": "Household", "brand": "Baygon", "price": 35000, "dept": "HOUSEHOLD"},
        {"name": "Stella Tissue", "category": "Household", "brand": "Stella", "price": 15000, "dept": "HOUSEHOLD"},
    ]
    
    # Date range
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2023, 12, 31)
    date_range = pd.date_range(start=start_date, end=end_date, freq='W')
    
    # Indonesian holidays
    indonesian_holidays = [
        datetime(2023, 1, 1),   # Tahun Baru
        datetime(2023, 1, 22),  # Tahun Baru Imlek
        datetime(2023, 4, 22),  # Idul Fitri
        datetime(2023, 8, 17),  # Kemerdekaan RI
        datetime(2023, 12, 25), # Natal
    ]
    
    data = []
    
    for store in stores:
        for product in indonesian_products:
            # Base sales quantity for this store-product combination
            base_quantity = random.randint(50, 200)
            
            for date in date_range:
                # Check if holiday
                is_holiday = any(abs((date - holiday).days) <= 3 for holiday in indonesian_holidays)
                
                # Seasonal factors
                seasonal_factor = 1.0
                if date.month in [6, 7]:  # Ramadan/Lebaran season
                    if product["category"] in ["Makanan Instan", "Minuman"]:
                        seasonal_factor = 1.4
                elif date.month in [11, 12]:  # Christmas/New Year season
                    seasonal_factor = 1.2
                
                # Holiday boost
                holiday_factor = 1.3 if is_holiday else 1.0
                
                # Weekend factor
                weekend_factor = 1.1 if date.weekday() >= 5 else 1.0
                
                # Random variation
                random_factor = random.uniform(0.7, 1.3)
                
                # Calculate quantity sold
                quantity = int(base_quantity * seasonal_factor * holiday_factor * weekend_factor * random_factor)
                quantity = max(1, quantity)  # Ensure at least 1 unit sold
                
                # Calculate sales in IDR
                unit_price = product["price"]
                total_sales_idr = quantity * unit_price
                
                # Add some price variation (discounts, promotions)
                price_variation = random.uniform(0.9, 1.1)
                actual_unit_price = int(unit_price * price_variation)
                actual_sales_idr = quantity * actual_unit_price
                
                # Calculate profit margin (typical retail margins in Indonesia)
                if product["category"] == "Makanan Instan":
                    profit_margin = random.uniform(15, 25)
                elif product["category"] == "Personal Care":
                    profit_margin = random.uniform(20, 35)
                elif product["category"] == "Snack":
                    profit_margin = random.uniform(25, 40)
                else:
                    profit_margin = random.uniform(18, 30)
                
                # Stock level based on sales performance
                if quantity > base_quantity * 1.2:
                    stock_level = "Low"
                elif quantity < base_quantity * 0.8:
                    stock_level = "High"
                else:
                    stock_level = "Medium"
                
                data.append({
                    'Store': store["id"],
                    'Store_Name': store["name"],
                    'Store_Location': store["location"],
                    'Dept': product["dept"],
                    'Dept_Name': product["category"],
                    'Date': date.strftime('%Y-%m-%d'),
                    'Item_Name': product["name"],
                    'Item_Category': product["category"],
                    'Item_Brand': product["brand"],
                    'Item_Price_IDR': actual_unit_price,
                    'Quantity_Sold': quantity,
                    'Weekly_Sales_IDR': actual_sales_idr,
                    'Profit_Margin_Percent': round(profit_margin, 2),
                    'Stock_Level': stock_level,
                    'IsHoliday': is_holiday
                })
    
    # Create DataFrame
    df_indonesian = pd.DataFrame(data)
    
    # Create sample files
    os.makedirs('sample_data', exist_ok=True)
    
    # Create files per store
    for store in stores:
        store_data = df_indonesian[df_indonesian['Store'] == store["id"]].copy()
        filename = f'sample_data/retail_{store["id"]}_sales.csv'
        store_data.to_csv(filename, index=False)
        print(f"Created: {filename} with {len(store_data)} records")
    
    # Create combined file
    combined_filename = 'sample_data/indonesian_retail_sales.csv'
    df_indonesian.to_csv(combined_filename, index=False)
    print(f"Created: {combined_filename} with {len(df_indonesian)} records")
    
    # Create summary statistics
    print("\n=== RINGKASAN DATA ===")
    print(f"Total records: {len(df_indonesian):,}")
    print(f"Date range: {df_indonesian['Date'].min()} to {df_indonesian['Date'].max()}")
    print(f"Stores: {len(df_indonesian['Store'].unique())}")
    print(f"Products: {len(df_indonesian['Item_Name'].unique())}")
    print(f"Categories: {', '.join(df_indonesian['Item_Category'].unique())}")
    print(f"Total sales: Rp {df_indonesian['Weekly_Sales_IDR'].sum():,.0f}")
    print(f"Average weekly sales per item: Rp {df_indonesian['Weekly_Sales_IDR'].mean():,.0f}")
    
    # Top products by sales
    print("\n=== TOP 10 PRODUK TERLARIS ===")
    top_products = df_indonesian.groupby('Item_Name')['Weekly_Sales_IDR'].sum().sort_values(ascending=False).head(10)
    for product, sales in top_products.items():
        print(f"{product}: Rp {sales:,.0f}")
    
    return df_indonesian

if __name__ == "__main__":
    print("Creating sample Walmart sales data...")
    df_walmart = create_sample_walmart_data()
    print("\nSample data created successfully!")
    print(f"Total records: {len(df_walmart)}")
    print(f"Date range: {df_walmart['Date'].min()} to {df_walmart['Date'].max()}")
    print(f"Stores: {sorted(df_walmart['Store'].unique())}")
    print(f"Departments: {sorted(df_walmart['Dept'].unique())}")
    print("\nFirst few rows:")
    print(df_walmart.head())
    
    print("\nCreating sample Indonesian retail sales data...")
    df_indonesian = create_sample_indonesian_retail_data()
    print("\nSample data created successfully!")
