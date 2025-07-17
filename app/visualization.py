import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from typing import Dict, Any

class VisualizationService:
    def create_sales_trend_chart(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create sales trend visualization"""
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Aggregate sales by date
        daily_sales = df.groupby('Date')['Weekly_Sales'].sum().reset_index()
        
        # Create line chart
        fig = px.line(
            daily_sales, 
            x='Date', 
            y='Weekly_Sales',
            title='Tren Penjualan Walmart',
            labels={'Weekly_Sales': 'Penjualan Mingguan', 'Date': 'Tanggal'}
        )
        
        fig.update_layout(
            xaxis_title="Tanggal",
            yaxis_title="Penjualan Mingguan",
            hovermode='x unified'
        )
        
        return json.loads(fig.to_json())
    
    def create_abc_xyz_heatmap(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create ABC-XYZ classification heatmap"""
        # Calculate ABC-XYZ classification
        dept_stats = df.groupby(['Store', 'Dept']).agg({
            'Weekly_Sales': ['sum', 'mean', 'std']
        }).reset_index()
        
        dept_stats.columns = ['Store', 'Dept', 'Total_Sales', 'Mean_Sales', 'Std_Sales']
        dept_stats['CV'] = dept_stats['Std_Sales'] / dept_stats['Mean_Sales']
        dept_stats['CV'] = dept_stats['CV'].fillna(0)
        
        # ABC Classification
        dept_stats = dept_stats.sort_values('Total_Sales', ascending=False)
        dept_stats['Cumulative_Sales'] = dept_stats['Total_Sales'].cumsum()
        dept_stats['Cumulative_Percentage'] = dept_stats['Cumulative_Sales'] / dept_stats['Total_Sales'].sum() * 100
        
        def assign_abc_class(cum_pct):
            if cum_pct <= 80:
                return 'A'
            elif cum_pct <= 95:
                return 'B'
            else:
                return 'C'
        
        dept_stats['ABC_Class'] = dept_stats['Cumulative_Percentage'].apply(assign_abc_class)
        
        # XYZ Classification
        cv_33_percentile = dept_stats['CV'].quantile(0.33)
        cv_67_percentile = dept_stats['CV'].quantile(0.67)
        
        def assign_xyz_class(cv):
            if cv <= cv_33_percentile:
                return 'X'
            elif cv <= cv_67_percentile:
                return 'Y'
            else:
                return 'Z'
        
        dept_stats['XYZ_Class'] = dept_stats['CV'].apply(assign_xyz_class)
        
        # Create heatmap data
        heatmap_data = dept_stats.groupby(['ABC_Class', 'XYZ_Class']).size().reset_index(name='Count')
        heatmap_pivot = heatmap_data.pivot(index='ABC_Class', columns='XYZ_Class', values='Count').fillna(0)
        
        # Create heatmap
        fig = px.imshow(
            heatmap_pivot,
            title='Heatmap Klasifikasi ABC-XYZ',
            labels=dict(x="Klasifikasi XYZ", y="Klasifikasi ABC", color="Jumlah Departemen"),
            aspect="auto"
        )
        
        return json.loads(fig.to_json())
    
    def create_department_performance_chart(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create department performance comparison"""
        dept_performance = df.groupby('Dept')['Weekly_Sales'].agg(['sum', 'mean']).reset_index()
        dept_performance.columns = ['Dept', 'Total_Sales', 'Avg_Sales']
        dept_performance = dept_performance.sort_values('Total_Sales', ascending=False).head(10)
        
        fig = px.bar(
            dept_performance,
            x='Dept',
            y='Total_Sales',
            title='Top 10 Departemen Berdasarkan Total Penjualan',
            labels={'Total_Sales': 'Total Penjualan', 'Dept': 'Departemen'}
        )
        
        return json.loads(fig.to_json())
    
    def create_store_comparison_chart(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create store performance comparison"""
        store_performance = df.groupby('Store')['Weekly_Sales'].sum().reset_index()
        store_performance = store_performance.sort_values('Weekly_Sales', ascending=False)
        
        fig = px.bar(
            store_performance,
            x='Store',
            y='Weekly_Sales',
            title='Perbandingan Performa Toko',
            labels={'Weekly_Sales': 'Total Penjualan', 'Store': 'Toko'}
        )
        
        return json.loads(fig.to_json())
    
    def create_holiday_impact_chart(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create holiday impact analysis"""
        holiday_impact = df.groupby('IsHoliday')['Weekly_Sales'].mean().reset_index()
        holiday_impact['IsHoliday'] = holiday_impact['IsHoliday'].map({True: 'Hari Libur', False: 'Hari Biasa'})
        
        fig = px.bar(
            holiday_impact,
            x='IsHoliday',
            y='Weekly_Sales',
            title='Dampak Hari Libur terhadap Penjualan',
            labels={'Weekly_Sales': 'Rata-rata Penjualan', 'IsHoliday': 'Jenis Hari'}
        )
        
        return json.loads(fig.to_json())
