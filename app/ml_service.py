import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import optuna
import joblib
import os
from typing import Dict, List, Any, Tuple
import warnings
warnings.filterwarnings('ignore')

class MLService:
    def __init__(self):
        self.models = {}
        os.makedirs("models", exist_ok=True)
    
    def prepare_data(self, df: pd.DataFrame):
        """Prepare Walmart sales data for training"""
        # Make a copy to avoid modifying original data
        df = df.copy()
        
        # Convert Date to datetime
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Extract date features
        df['Year'] = df['Date'].dt.year
        df['Month'] = df['Date'].dt.month
        df['Week'] = df['Date'].dt.isocalendar().week
        df['DayOfYear'] = df['Date'].dt.dayofyear
        
        # Encode categorical variables
        le_store = LabelEncoder()
        le_dept = LabelEncoder()
        
        df['Store_encoded'] = le_store.fit_transform(df['Store'].astype(str))
        df['Dept_encoded'] = le_dept.fit_transform(df['Dept'].astype(str))
        
        # Sort data for proper lag feature creation
        df = df.sort_values(['Store', 'Dept', 'Date']).reset_index(drop=True)
        
        # Create lag features
        df['Sales_lag1'] = df.groupby(['Store', 'Dept'])['Weekly_Sales'].shift(1)
        df['Sales_lag2'] = df.groupby(['Store', 'Dept'])['Weekly_Sales'].shift(2)
        df['Sales_lag4'] = df.groupby(['Store', 'Dept'])['Weekly_Sales'].shift(4)
        
        # Rolling statistics - fix the index alignment issue
        def calculate_rolling_stats(group):
            group = group.copy()
            group['Sales_rolling_mean_4'] = group['Weekly_Sales'].rolling(window=4, min_periods=1).mean()
            group['Sales_rolling_std_4'] = group['Weekly_Sales'].rolling(window=4, min_periods=1).std()
            return group
        
        df = df.groupby(['Store', 'Dept']).apply(calculate_rolling_stats).reset_index(drop=True)
        
        # Fill NaN values in rolling std with 0
        df['Sales_rolling_std_4'] = df['Sales_rolling_std_4'].fillna(0)
        
        # Holiday effect
        df['IsHoliday'] = df['IsHoliday'].astype(int)
        
        # Drop rows with NaN values (due to lag features)
        df = df.dropna()
        
        # Features for training
        feature_columns = [
            'Store_encoded', 'Dept_encoded', 'Year', 'Month', 'Week', 'DayOfYear',
            'IsHoliday', 'Sales_lag1', 'Sales_lag2', 'Sales_lag4',
            'Sales_rolling_mean_4', 'Sales_rolling_std_4'
        ]
        
        X = df[feature_columns]
        y = df['Weekly_Sales']
        
        return X, y, df, le_store, le_dept
    
    def train_model(self, df: pd.DataFrame, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Train XGBoost model"""
        try:
            X, y, processed_df, le_store, le_dept = self.prepare_data(df)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Train XGBoost model
            model = xgb.XGBRegressor(
                n_estimators=parameters.get('n_estimators', 100),
                max_depth=parameters.get('max_depth', 6),
                learning_rate=parameters.get('learning_rate', 0.1),
                subsample=parameters.get('subsample', 0.8),
                random_state=42
            )
            
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            metrics = {
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
                'mae': float(mean_absolute_error(y_test, y_pred)),
                'r2_score': float(r2_score(y_test, y_pred)),
                'accuracy': float(100 * (1 - np.mean(np.abs((y_test - y_pred) / y_test))))
            }
            
            # Save model
            model_id = len(self.models) + 1
            model_path = f"models/xgboost_model_{model_id}.joblib"
            joblib.dump({
                'model': model,
                'le_store': le_store,
                'le_dept': le_dept,
                'feature_columns': X.columns.tolist()
            }, model_path)
            
            self.models[model_id] = {
                'model': model,
                'le_store': le_store,
                'le_dept': le_dept,
                'feature_columns': X.columns.tolist(),
                'path': model_path
            }
            
            return {
                'model_id': model_id,
                'metrics': metrics,
                'feature_importance': dict(zip(X.columns, model.feature_importances_))
            }
            
        except Exception as e:
            print(f"Error in train_model: {str(e)}")
            raise e
    
    def optimize_model(self, df: pd.DataFrame, n_trials: int = 50) -> Dict[str, Any]:
        """Optimize XGBoost model using Optuna"""
        try:
            X, y, processed_df, le_store, le_dept = self.prepare_data(df)
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            def objective(trial):
                params = {
                    'n_estimators': trial.suggest_int('n_estimators', 50, 300),
                    'max_depth': trial.suggest_int('max_depth', 3, 10),
                    'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                    'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                    'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                    'reg_alpha': trial.suggest_float('reg_alpha', 0, 10),
                    'reg_lambda': trial.suggest_float('reg_lambda', 0, 10),
                    'random_state': 42
                }
                
                model = xgb.XGBRegressor(**params)
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                return rmse
            
            # Run optimization
            study = optuna.create_study(direction='minimize')
            study.optimize(objective, n_trials=n_trials)
            
            # Train final model with best parameters
            best_params = study.best_params
            final_model = xgb.XGBRegressor(**best_params)
            final_model.fit(X_train, y_train)
            
            # Calculate metrics
            y_pred = final_model.predict(X_test)
            metrics = {
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
                'mae': float(mean_absolute_error(y_test, y_pred)),
                'r2_score': float(r2_score(y_test, y_pred)),
                'accuracy': float(100 * (1 - np.mean(np.abs((y_test - y_pred) / y_test))))
            }
            
            # Save optimized model
            model_id = len(self.models) + 1
            model_path = f"models/optimized_xgboost_model_{model_id}.joblib"
            joblib.dump({
                'model': final_model,
                'le_store': le_store,
                'le_dept': le_dept,
                'feature_columns': X.columns.tolist()
            }, model_path)
            
            self.models[model_id] = {
                'model': final_model,
                'le_store': le_store,
                'le_dept': le_dept,
                'feature_columns': X.columns.tolist(),
                'path': model_path
            }
            
            return {
                'model_id': model_id,
                'best_params': best_params,
                'metrics': metrics,
                'optimization_history': [trial.value for trial in study.trials]
            }
            
        except Exception as e:
            print(f"Error in optimize_model: {str(e)}")
            raise e
    
    def classify_abc_xyz(self, df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Enhanced ABC-XYZ classification with business metrics"""
        try:
            # Group by Store and Dept
            dept_stats = df.groupby(['Store', 'Dept']).agg({
                'Weekly_Sales': ['sum', 'mean', 'std', 'count']
            }).reset_index()
            
            dept_stats.columns = ['Store', 'Dept', 'Total_Sales', 'Mean_Sales', 'Std_Sales', 'Count']
            dept_stats['CV'] = dept_stats['Std_Sales'] / dept_stats['Mean_Sales']
            dept_stats['CV'] = dept_stats['CV'].fillna(0)
            
            # ABC Classification (based on total sales)
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
            
            # XYZ Classification (based on coefficient of variation)
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
            
            # Calculate business metrics
            def get_risk_level(abc, xyz):
                if abc == 'A' and xyz in ['X', 'Y']:
                    return 'low'
                elif abc == 'A' and xyz == 'Z':
                    return 'medium'
                elif abc == 'B':
                    return 'medium'
                else:
                    return 'high'
            
            def get_stock_recommendation(abc, xyz, mean_sales):
                if abc == 'A' and xyz == 'X':
                    return {'level': 'high', 'weeks': 4, 'amount': mean_sales * 4}
                elif abc == 'A' and xyz == 'Y':
                    return {'level': 'high', 'weeks': 3, 'amount': mean_sales * 3}
                elif abc == 'A' and xyz == 'Z':
                    return {'level': 'flexible', 'weeks': 2, 'amount': mean_sales * 2}
                elif abc == 'B':
                    return {'level': 'medium', 'weeks': 2, 'amount': mean_sales * 2}
                else:
                    return {'level': 'low', 'weeks': 1, 'amount': mean_sales * 1}
            
            def get_revenue_impact(abc, total_sales, overall_total):
                percentage = (total_sales / overall_total) * 100
                if abc == 'A':
                    return {'impact': 'high', 'percentage': percentage, 'priority': 1}
                elif abc == 'B':
                    return {'impact': 'medium', 'percentage': percentage, 'priority': 2}
                else:
                    return {'impact': 'low', 'percentage': percentage, 'priority': 3}
            
            overall_total = dept_stats['Total_Sales'].sum()
            
            # Create enhanced result dictionary
            classification = {}
            for _, row in dept_stats.iterrows():
                key = f"{int(row['Store'])}_{int(row['Dept'])}"
                abc_class = row['ABC_Class']
                xyz_class = row['XYZ_Class']
                
                classification[key] = {
                    'abc_class': abc_class,
                    'xyz_class': xyz_class,
                    'total_sales': float(row['Total_Sales']),
                    'mean_sales': float(row['Mean_Sales']),
                    'cv': float(row['CV']),
                    'risk_level': get_risk_level(abc_class, xyz_class),
                    'stock_recommendation': get_stock_recommendation(abc_class, xyz_class, row['Mean_Sales']),
                    'revenue_impact': get_revenue_impact(abc_class, row['Total_Sales'], overall_total),
                    'category_name': f"{abc_class}-{xyz_class}"
                }
            
            return classification
            
        except Exception as e:
            print(f"Error in classify_abc_xyz: {str(e)}")
            raise e
    
    def generate_predictions_by_category(self, df: pd.DataFrame, model_id: int, batch_size: int = 1000) -> Dict[str, Any]:
        """Generate predictions with categorization and batching"""
        try:
            if model_id not in self.models:
                # Load model from file
                model_path = f"models/xgboost_model_{model_id}.joblib"
                if not os.path.exists(model_path):
                    model_path = f"models/optimized_xgboost_model_{model_id}.joblib"
                
                if os.path.exists(model_path):
                    self.models[model_id] = joblib.load(model_path)
                else:
                    raise ValueError(f"Model {model_id} not found")
            
            model_data = self.models[model_id]
            model = model_data['model']
            
            X, y, processed_df, _, _ = self.prepare_data(df)
            
            # Get ABC-XYZ classification
            abc_xyz_classification = self.classify_abc_xyz(df)
            
            # Make predictions
            predictions = model.predict(X)
            
            # Organize results by category
            categorized_results = {
                'A-X': [], 'A-Y': [], 'A-Z': [],
                'B-X': [], 'B-Y': [], 'B-Z': [],
                'C-X': [], 'C-Y': [], 'C-Z': []
            }
            
            category_metrics = {}
            all_results = []
            
            # Process predictions in batches
            for i in range(0, len(processed_df), batch_size):
                batch_end = min(i + batch_size, len(processed_df))
                batch_df = processed_df.iloc[i:batch_end]
                batch_predictions = predictions[i:batch_end]
                
                for j, (idx, row) in enumerate(batch_df.iterrows()):
                    store_dept_key = f"{int(row['Store'])}_{int(row['Dept'])}"
                    classification_data = abc_xyz_classification.get(store_dept_key, {})
                    category = classification_data.get('category_name', 'C-Z')
                    
                    # Calculate individual accuracy
                    actual_sales = float(row['Weekly_Sales'])
                    predicted_sales = float(batch_predictions[j])
                    accuracy = 100 * (1 - abs(actual_sales - predicted_sales) / actual_sales) if actual_sales != 0 else 0
                    
                    result = {
                        'store': str(int(row['Store'])),
                        'dept': str(int(row['Dept'])),
                        'predicted_sales': predicted_sales,
                        'actual_sales': actual_sales,
                        'accuracy': accuracy,
                        'date': row['Date'].strftime('%Y-%m-%d'),
                        'category': category,
                        'classification_data': classification_data
                    }
                    
                    categorized_results[category].append(result)
                    all_results.append(result)
            
            # Calculate metrics per category
            for category, results in categorized_results.items():
                if results:
                    accuracies = [r['accuracy'] for r in results]
                    total_predicted = sum(r['predicted_sales'] for r in results)
                    total_actual = sum(r['actual_sales'] for r in results)
                    
                    category_metrics[category] = {
                        'count': len(results),
                        'avg_accuracy': np.mean(accuracies),
                        'min_accuracy': np.min(accuracies),
                        'max_accuracy': np.max(accuracies),
                        'total_predicted_sales': total_predicted,
                        'total_actual_sales': total_actual,
                        'revenue_impact': total_actual,
                        'confidence_level': 'high' if np.mean(accuracies) > 90 else 'medium' if np.mean(accuracies) > 80 else 'low'
                    }
            
            return {
                'categorized_results': categorized_results,
                'category_metrics': category_metrics,
                'all_results': all_results,
                'total_predictions': len(all_results),
                'abc_xyz_classification': abc_xyz_classification
            }
            
        except Exception as e:
            print(f"Error in generate_predictions_by_category: {str(e)}")
            raise e
    
    def generate_predictions(self, df: pd.DataFrame, model_id: int) -> List[Dict[str, Any]]:
        """Legacy method for backward compatibility"""
        result = self.generate_predictions_by_category(df, model_id)
        return result['all_results']
