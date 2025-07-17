import logging
# Configure logging at the very top of the file
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

print("DEBUG: app/main.py loaded") # Debug print

# Import Base and engine first to ensure they are available
from app.database import Base, engine, get_db
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import pandas as pd
import json
from typing import List, Optional
import os
from dotenv import load_dotenv


from app.models import User, Dataset, Model, Prediction, Feedback
from app.schemas import *
from app.auth import authenticate_user, create_access_token, get_current_user, get_password_hash, verify_password
from app.ml_service import MLService
from app.visualization import VisualizationService

print("DEBUG MAIN: Base object imported:", Base) # Add this line to check Base object
load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Walmart Sales Analysis API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
ml_service = MLService()
viz_service = VisualizationService()


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah"
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "role": user.role
        }
    }

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    logger.info(f"Accessing /auth/me. User: {current_user.username}, Role: {current_user.role}")
    return current_user

@app.post("/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    store_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print("DEBUG MAIN: >>> Entering upload_dataset function <<<") # New debug print
    logger.info(f"Attempting to upload dataset. User: {current_user.username}, Role: {current_user.role}")
    print(f"DEBUG MAIN: User role for /datasets/upload is '{current_user.role}' (type: {type(current_user.role)})") # Debug print
    if current_user.role not in ["admin", "main_admin"]:
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to /datasets/upload.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")
    
    # Read and validate CSV
    try:
        df = pd.read_csv(file.file)
        
        # Validate required columns for Walmart dataset
        required_columns = ['Store', 'Dept', 'Date', 'Weekly_Sales', 'IsHoliday']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Kolom yang hilang: {', '.join(missing_columns)}"
            )
        
        # Convert Date column
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Save dataset to database
        dataset = Dataset(
            name=file.filename,
            store_id=store_id or f"Store_{df['Store'].iloc[0]}",
            records_count=len(df),
            file_size=file.size,
            uploaded_by=current_user.id,
            columns=json.dumps(df.columns.tolist()),
            status="completed"
        )
        
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        # Save data to CSV file
        os.makedirs("data", exist_ok=True)
        file_path = f"data/dataset_{dataset.id}.csv"
        df.to_csv(file_path, index=False)
        
        print("DEBUG MAIN: Dataset uploaded and processed successfully.") # New debug print
        return {
            "message": "Dataset berhasil diunggah",
            "dataset_id": dataset.id,
            "records": len(df),
            "columns": df.columns.tolist()
        }
        
    except Exception as e:
        logger.error(f"Error processing file for user {current_user.username}: {e}")
        print(f"DEBUG MAIN: Error during upload: {str(e)}") # New debug print
        raise HTTPException(status_code=400, detail=f"Error memproses file: {str(e)}")

@app.get("/datasets", response_model=List[DatasetResponse])
async def get_datasets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /datasets. User: {current_user.username}, Role: {current_user.role}")
    datasets = db.query(Dataset).all()
    return datasets

@app.post("/models/train")
async def train_model(
    request: TrainModelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Attempting to train model. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role not in ["admin", "main_admin"]:
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to /models/train.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    try:
        # Get dataset
        dataset = db.query(Dataset).filter(Dataset.id == request.dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
        
        # Load data
        file_path = f"data/dataset_{dataset.id}.csv"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File dataset tidak ditemukan")
        
        df = pd.read_csv(file_path)
        
        # Train model
        model_result = ml_service.train_model(df, request.parameters)
        
        # Save model to database
        model = Model(
            name=f"XGBoost_Model_{dataset.id}",
            dataset_id=dataset.id,
            algorithm="XGBoost",
            parameters=json.dumps(request.parameters),
            metrics=json.dumps(model_result['metrics']),
            trained_by=current_user.id,
            status="completed"
        )
        
        db.add(model)
        db.commit()
        db.refresh(model)
        
        return {
            "message": "Model berhasil dilatih",
            "model_id": model.id,
            "metrics": model_result['metrics']
        }
        
    except Exception as e:
        logger.error(f"Error training model for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Error melatih model: {str(e)}")

@app.post("/models/optimize")
async def optimize_model(
    request: OptimizeModelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Attempting to optimize model. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role not in ["admin", "main_admin"]:
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to /models/optimize.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    try:
        # Get dataset
        dataset = db.query(Dataset).filter(Dataset.id == request.dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
        
        # Load data
        file_path = f"data/dataset_{dataset.id}.csv"
        df = pd.read_csv(file_path)
        
        # Optimize model with Optuna
        optimization_result = ml_service.optimize_model(df, request.n_trials)
        
        # Save optimized model
        model = Model(
            name=f"Optimized_XGBoost_{dataset.id}",
            dataset_id=dataset.id,
            algorithm="XGBoost_Optimized",
            parameters=json.dumps(optimization_result['best_params']),
            metrics=json.dumps(optimization_result['metrics']),
            trained_by=current_user.id,
            status="completed"
        )
        
        db.add(model)
        db.commit()
        db.refresh(model)
        
        return {
            "message": "Optimasi model selesai",
            "model_id": model.id,
            "best_params": optimization_result['best_params'],
            "metrics": optimization_result['metrics'],
            "trials_completed": request.n_trials
        }
        
    except Exception as e:
        logger.error(f"Error optimizing model for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Error optimasi model: {str(e)}")

@app.get("/models", response_model=List[ModelResponse])
async def get_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /models. User: {current_user.username}, Role: {current_user.role}")
    models = db.query(Model).order_by(Model.created_at.desc()).all()
    
    # Format models for frontend with all required fields
    formatted_models = []
    for model in models:
        try:
            metrics = json.loads(model.metrics) if model.metrics else {}
            formatted_model = {
                "id": model.id,
                "name": model.name,
                "algorithm": model.algorithm,
                "status": model.status,
                "created_at": model.created_at.isoformat(),
                "metrics": metrics,
                "dataset_id": model.dataset_id,
                "trained_by": model.trained_by,
                "parameters": model.parameters
            }
            formatted_models.append(formatted_model)
        except Exception as e:
            logger.error(f"Error formatting model {model.id}: {e}")
            # Add model with basic info even if metrics parsing fails
            formatted_models.append({
                "id": model.id,
                "name": model.name,
                "algorithm": model.algorithm,
                "status": model.status,
                "created_at": model.created_at.isoformat(),
                "metrics": {},
                "dataset_id": model.dataset_id,
                "trained_by": model.trained_by,
                "parameters": model.parameters
            })
    
    return formatted_models

@app.post("/predictions/generate")
async def generate_predictions(
    request: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Attempting to generate predictions. User: {current_user.username}, Role: {current_user.role}")
    try:
        # Get model and dataset
        model = db.query(Model).filter(Model.id == request.model_id).first()
        if not model:
            raise HTTPException(status_code=404, detail="Model tidak ditemukan")
        
        dataset = db.query(Dataset).filter(Dataset.id == model.dataset_id).first()
        file_path = f"data/dataset_{dataset.id}.csv"
        df = pd.read_csv(file_path)
        
        # Generate categorized predictions
        prediction_result = ml_service.generate_predictions_by_category(df, model.id)
        
        # Save predictions to database with enhanced data
        for pred in prediction_result['all_results']:
            classification_data = pred.get('classification_data', {})
            
            prediction = Prediction(
                model_id=model.id,
                store_id=pred['store'],
                dept_id=pred['dept'],
                predicted_sales=pred['predicted_sales'],
                actual_sales=pred.get('actual_sales'),
                abc_class=classification_data.get('abc_class'),
                xyz_class=classification_data.get('xyz_class'),
                created_by=current_user.id
            )
            db.add(prediction)
        
        db.commit()
        
        return {
            "message": "Prediksi berhasil dibuat dengan kategorisasi",
            "predictions_count": prediction_result['total_predictions'],
            "category_breakdown": prediction_result['category_metrics'],
            "abc_xyz_classification": prediction_result['abc_xyz_classification']
        }
        
    except Exception as e:
        logger.error(f"Error generating predictions for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Error membuat prediksi: {str(e)}")

# New endpoint for categorized predictions
@app.get("/predictions/categorized")
async def get_categorized_predictions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /predictions/categorized. User: {current_user.username}, Role: {current_user.role}")
    
    predictions = db.query(Prediction).all()
    
    # Group predictions by category
    categorized = {
        'A-X': [], 'A-Y': [], 'A-Z': [],
        'B-X': [], 'B-Y': [], 'B-Z': [],
        'C-X': [], 'C-Y': [], 'C-Z': []
    }
    
    category_metrics = {}
    
    for pred in predictions:
        category = f"{pred.abc_class or 'C'}-{pred.xyz_class or 'Z'}"
        
        # Calculate accuracy
        accuracy = 0
        if pred.actual_sales and pred.actual_sales != 0:
            accuracy = 100 * (1 - abs(pred.actual_sales - pred.predicted_sales) / pred.actual_sales)
        
        pred_data = {
            'id': pred.id,
            'store_id': pred.store_id,
            'dept_id': pred.dept_id,
            'predicted_sales': pred.predicted_sales,
            'actual_sales': pred.actual_sales,
            'accuracy': accuracy,
            'created_at': pred.created_at.isoformat()
        }
        
        categorized[category].append(pred_data)
    
    # Calculate metrics per category
    for category, preds in categorized.items():
        if preds:
            accuracies = [p['accuracy'] for p in preds]
            total_predicted = sum(p['predicted_sales'] for p in preds)
            total_actual = sum(p['actual_sales'] or 0 for p in preds)
            
            category_metrics[category] = {
                'count': len(preds),
                'avg_accuracy': sum(accuracies) / len(accuracies) if accuracies else 0,
                'total_predicted_sales': total_predicted,
                'total_actual_sales': total_actual,
                'confidence_level': 'high' if (sum(accuracies) / len(accuracies) if accuracies else 0) > 90 else 'medium'
            }
    
    return {
        'categorized_predictions': categorized,
        'category_metrics': category_metrics
    }

@app.get("/predictions", response_model=List[PredictionResponse])
async def get_predictions(
    model_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /predictions. User: {current_user.username}, Role: {current_user.role}")
    query = db.query(Prediction)
    if model_id:
        query = query.filter(Prediction.model_id == model_id)
    
    predictions = query.all()
    return predictions

@app.get("/visualizations/sales-trend")
async def get_sales_trend(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /visualizations/sales-trend. User: {current_user.username}, Role: {current_user.role}")
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
        
        file_path = f"data/dataset_{dataset.id}.csv"
        df = pd.read_csv(file_path)
        
        chart_data = viz_service.create_sales_trend_chart(df)
        return chart_data
        
    except Exception as e:
        logger.error(f"Error creating sales trend visualization for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Error membuat visualisasi: {str(e)}")

@app.get("/visualizations/abc-xyz-heatmap")
async def get_abc_xyz_heatmap(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /visualizations/abc-xyz-heatmap. User: {current_user.username}, Role: {current_user.role}")
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
        
        file_path = f"data/dataset_{dataset.id}.csv"
        df = pd.read_csv(file_path)
        
        chart_data = viz_service.create_abc_xyz_heatmap(df)
        return chart_data
        
    except Exception as e:
        logger.error(f"Error creating ABC-XYZ heatmap for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Error membuat heatmap: {str(e)}")

@app.post("/feedback")
async def submit_feedback(
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Attempting to submit feedback. User: {current_user.username}, Role: {current_user.role}")
    feedback = Feedback(
        user_id=current_user.id,
        dept_id=feedback_data.dept_id,
        category=feedback_data.category,
        message=feedback_data.message,
        status="pending"
    )
    
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    return {"message": "Umpan balik berhasil dikirim", "feedback_id": feedback.id}

@app.get("/feedback", response_model=List[FeedbackResponse])
async def get_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /feedback. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role == "main_admin":
        feedback = db.query(Feedback).all()
    else:
        feedback = db.query(Feedback).filter(Feedback.user_id == current_user.id).all()
    
    return feedback

@app.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /dashboard/stats. User: {current_user.username}, Role: {current_user.role}")
    stats = {
        "total_datasets": db.query(Dataset).count(),
        "total_models": db.query(Model).count(),
        "total_predictions": db.query(Prediction).count(),
        "total_feedback": db.query(Feedback).count()
    }
    
    if current_user.role == "main_admin":
        stats["total_users"] = db.query(User).count()
    
    return stats

# Enhanced dashboard stats for managers
@app.get("/dashboard/manager-stats")
async def get_manager_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Accessing /dashboard/manager-stats. User: {current_user.username}, Role: {current_user.role}")
    
    predictions = db.query(Prediction).all()
    
    if not predictions:
        return {
            "category_summary": {},
            "revenue_impact": {},
            "risk_assessment": {},
            "stock_recommendations": {}
        }
    
    # Group by categories
    categories = {}
    total_revenue = 0
    
    for pred in predictions:
        category = f"{pred.abc_class or 'C'}-{pred.xyz_class or 'Z'}"
        
        if category not in categories:
            categories[category] = {
                'count': 0,
                'total_predicted': 0,
                'total_actual': 0,
                'accuracies': []
            }
        
        categories[category]['count'] += 1
        categories[category]['total_predicted'] += pred.predicted_sales
        categories[category]['total_actual'] += pred.actual_sales or 0
        
        if pred.actual_sales and pred.actual_sales != 0:
            accuracy = 100 * (1 - abs(pred.actual_sales - pred.predicted_sales) / pred.actual_sales)
            categories[category]['accuracies'].append(accuracy)
        
        total_revenue += pred.actual_sales or pred.predicted_sales
    
    # Calculate summary metrics
    category_summary = {}
    revenue_impact = {}
    risk_assessment = {}
    stock_recommendations = {}
    
    for category, data in categories.items():
        avg_accuracy = sum(data['accuracies']) / len(data['accuracies']) if data['accuracies'] else 0
        
        category_summary[category] = {
            'product_count': data['count'],
            'avg_accuracy': round(avg_accuracy, 2),
            'confidence_level': 'Tinggi' if avg_accuracy > 90 else 'Sedang' if avg_accuracy > 80 else 'Rendah'
        }
        
        revenue_percentage = (data['total_actual'] / total_revenue * 100) if total_revenue > 0 else 0
        revenue_impact[category] = {
            'total_revenue': data['total_actual'],
            'percentage': round(revenue_percentage, 2),
            'priority': 'Tinggi' if category.startswith('A') else 'Sedang' if category.startswith('B') else 'Rendah'
        }
        
        # Risk assessment based on ABC-XYZ
        abc, xyz = category.split('-')
        if abc == 'A' and xyz in ['X', 'Y']:
            risk_level = 'Rendah'
            recommendation = 'Pertahankan stok optimal'
        elif abc == 'A' and xyz == 'Z':
            risk_level = 'Sedang'
            recommendation = 'Monitor ketat, stok fleksibel'
        elif abc == 'B':
            risk_level = 'Sedang'
            recommendation = 'Perencanaan standar'
        else:
            risk_level = 'Tinggi'
            recommendation = 'Evaluasi kebutuhan stok'
        
        risk_assessment[category] = {
            'risk_level': risk_level,
            'recommendation': recommendation
        }
        
        # Stock recommendations
        avg_sales = data['total_actual'] / data['count'] if data['count'] > 0 else 0
        if abc == 'A':
            stock_weeks = 4 if xyz == 'X' else 3 if xyz == 'Y' else 2
        elif abc == 'B':
            stock_weeks = 2
        else:
            stock_weeks = 1
        
        stock_recommendations[category] = {
            'recommended_stock': avg_sales * stock_weeks,
            'stock_weeks': stock_weeks,
            'reorder_point': avg_sales * (stock_weeks / 2)
        }
    
    return {
        "category_summary": category_summary,
        "revenue_impact": revenue_impact,
        "risk_assessment": risk_assessment,
        "stock_recommendations": stock_recommendations
    }

# Continue with existing endpoints...
@app.get("/api/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Accessing /api/users. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role != "main_admin":
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to /api/users.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    users = db.query(User).filter(User.role.in_(["admin", "manager"])).all()
    return users

@app.post("/api/users", response_model=UserResponse)
async def create_user(user_create: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Attempting to create user. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role != "main_admin":
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to create user.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    db_user = db.query(User).filter(User.username == user_create.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username sudah terdaftar")
    
    hashed_password = get_password_hash(user_create.password)
    new_user = User(
        username=user_create.username,
        name=user_create.name,
        email=user_create.email,
        hashed_password=hashed_password,
        role=user_create.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"User '{new_user.username}' created by {current_user.username}.")
    return new_user

@app.put("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Attempting to update user {user_id}. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role != "main_admin":
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to update user.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    
    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    logger.info(f"User '{db_user.username}' updated by {current_user.username}.")
    return db_user

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Attempting to delete user {user_id}. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role != "main_admin":
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to delete user.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    
    db.delete(db_user)
    db.commit()
    logger.info(f"User '{db_user.username}' deleted by {current_user.username}.")
    return {"message": "Pengguna berhasil dihapus"}

@app.post("/api/users/{user_id}/reset-password")
async def reset_user_password(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Attempting to reset password for user {user_id}. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role != "main_admin":
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to reset password.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    
    # Generate a new random password (for demo, you might send it via email in real app)
    new_password = "new_password_123" # Replace with actual random generation
    db_user.hashed_password = get_password_hash(new_password)
    db.commit()
    logger.info(f"Password for user '{db_user.username}' reset by {current_user.username}.")
    return {"message": "Password berhasil direset. Password baru: " + new_password}

@app.put("/api/users/{user_id}/status")
async def update_user_status(user_id: int, status_update: UserStatusUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Attempting to update status for user {user_id}. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role != "main_admin":
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to update user status.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    
    db_user.is_active = (status_update.status == "active")
    db.commit()
    db.refresh(db_user)
    logger.info(f"User '{db_user.username}' status changed to {status_update.status} by {current_user.username}.")
    return {"message": "Status pengguna berhasil diperbarui"}

@app.get("/api/models/current")
async def get_current_model_metrics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Accessing /api/models/current. User: {current_user.username}, Role: {current_user.role}")
    latest_model = db.query(Model).order_by(Model.created_at.desc()).first()
    if latest_model:
        try:
            metrics = json.loads(latest_model.metrics) if latest_model.metrics else {}
            return {
                "accuracy": metrics.get("accuracy", 0),
                "rmse": metrics.get("rmse", 0),
                "mae": metrics.get("mae", 0),
                "r2Score": metrics.get("r2_score", 0),
                "trainingTime": "N/A",
                "lastTrained": latest_model.created_at.isoformat(),
                "status": latest_model.status
            }
        except Exception as e:
            logger.error(f"Error parsing model metrics: {e}")
            return {
                "accuracy": 0,
                "rmse": 0,
                "mae": 0,
                "r2Score": 0,
                "trainingTime": "N/A",
                "lastTrained": latest_model.created_at.isoformat(),
                "status": latest_model.status
            }
    return None

@app.get("/api/models/history")
async def get_model_training_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Accessing /api/models/history. User: {current_user.username}, Role: {current_user.role}")
    history = db.query(Model).order_by(Model.created_at.desc()).all()
    
    result = []
    for model in history:
        try:
            metrics = json.loads(model.metrics) if model.metrics else {}
            params = json.loads(model.parameters) if model.parameters else {}
            result.append({
                "id": str(model.id),
                "date": model.created_at.isoformat(),
                "accuracy": metrics.get("accuracy"),
                "rmse": metrics.get("rmse"),
                "parameters": ", ".join([f"{k}:{v}" for k,v in params.items()]),
                "duration": "N/A",
                "status": model.status,
                "modelId": model.id
            })
        except Exception as e:
            logger.error(f"Error formatting model history for model {model.id}: {e}")
            result.append({
                "id": str(model.id),
                "date": model.created_at.isoformat(),
                "accuracy": None,
                "rmse": None,
                "parameters": "N/A",
                "duration": "N/A",
                "status": model.status,
                "modelId": model.id
            })
    return result

@app.post("/api/models/export")
async def export_model(current_user: User = Depends(get_current_user)):
    logger.info(f"Attempting to export model. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role != "main_admin":
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to export model.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    dummy_model_content = b"This is a dummy model file content."
    from fastapi.responses import StreamingResponse
    import io
    
    return StreamingResponse(io.BytesIO(dummy_model_content), media_type="application/octet-stream", headers={"Content-Disposition": "attachment; filename=dummy_model.joblib"})

@app.get("/api/datasets/{dataset_id}/preview")
async def preview_dataset(dataset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Accessing /api/datasets/{dataset_id}/preview. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role not in ["admin", "main_admin"]:
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to dataset preview.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
    
    file_path = f"data/dataset_{dataset.id}.csv"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File dataset tidak ditemukan")
    
    df = pd.read_csv(file_path)
    return {"name": dataset.name, "preview": df.head().to_dict(orient="records")}

@app.get("/api/datasets/{dataset_id}/download")
async def download_dataset(dataset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Attempting to download dataset {dataset_id}. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role not in ["admin", "main_admin"]:
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to dataset download.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
    
    file_path = f"data/dataset_{dataset.id}.csv"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File dataset tidak ditemukan")
    
    from fastapi.responses import FileResponse
    return FileResponse(path=file_path, filename=dataset.name, media_type="text/csv")

@app.get("/api/predictions/{prediction_id}/details")
async def get_prediction_details(prediction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Accessing /api/predictions/{prediction_id}/details. User: {current_user.username}, Role: {current_user.role}")
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediksi tidak ditemukan")
    
    return {
        "id": prediction.id,
        "model_id": prediction.model_id,
        "store_id": prediction.store_id,
        "dept_id": prediction.dept_id,
        "predicted_sales": prediction.predicted_sales,
        "actual_sales": prediction.actual_sales,
        "abc_class": prediction.abc_class,
        "xyz_class": prediction.xyz_class,
        "created_at": prediction.created_at.isoformat(),
        "message": "Detail prediksi untuk ID ini"
    }

@app.post("/api/predictions/{prediction_id}/export")
async def export_prediction(prediction_id: int, current_user: User = Depends(get_current_user)):
    logger.info(f"Attempting to export prediction {prediction_id}. User: {current_user.username}, Role: {current_user.role}")
    dummy_prediction_content = b"id,store,dept,predicted_sales,actual_sales\n1,1,1,1000,950\n2,1,2,2000,2100"
    from fastapi.responses import StreamingResponse
    import io
    
    return StreamingResponse(io.BytesIO(dummy_prediction_content), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=prediction_{prediction_id}.csv"})

@app.get("/api/activities/recent")
async def get_recent_activities(current_user: User = Depends(get_current_user)):
    logger.info(f"Accessing /api/activities/recent. User: {current_user.username}, Role: {current_user.role}")
    mock_activities = [
        {"id": "act1", "user": "mainadmin", "action": "Menambahkan admin baru 'john.doe'", "type": "feedback", "time": "5 menit lalu"},
        {"id": "act2", "user": "admin", "action": "Mengunggah dataset 'Sales Data Q1 2024'", "type": "data", "time": "15 menit lalu"},
        {"id": "act3", "user": "manager", "action": "Mengirim umpan balik tentang 'Departemen Elektronik'", "type": "feedback", "time": "30 menit lalu"},
        {"id": "act4", "user": "admin", "action": "Melatih ulang model XGBoost", "type": "model", "time": "1 jam lalu"},
        {"id": "act5", "user": "mainadmin", "action": "Mengoptimasi model dengan 50 trials", "type": "optimization", "time": "2 jam lalu"},
    ]
    return mock_activities

@app.get("/api/datasets")
async def get_all_datasets_for_frontend(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Accessing /api/datasets (for frontend). User: {current_user.username}, Role: {current_user.role}")
    datasets = db.query(Dataset).all()
    # Attach uploader info if available
    datasets_with_uploader = []
    for ds in datasets:
        uploader = db.query(User).filter(User.id == ds.uploaded_by).first()
        ds_dict = ds.__dict__
        ds_dict["uploader"] = {"name": uploader.name, "username": uploader.username} if uploader else None
        datasets_with_uploader.append(ds_dict)
    return datasets_with_uploader

@app.get("/api/predictions")
async def get_all_predictions_for_frontend(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Accessing /api/predictions (for frontend). User: {current_user.username}, Role: {current_user.role}")
    predictions = db.query(Prediction).all()
    
    # Aggregate predictions by model and add creator info
    aggregated_predictions = {}
    for pred in predictions:
        model_name = db.query(Model).filter(Model.id == pred.model_id).first()
        creator = db.query(User).filter(User.id == pred.created_by).first()
        
        key = pred.model_id # Group by model
        if key not in aggregated_predictions:
            aggregated_predictions[key] = {
                "id": pred.id, # Use first prediction ID for the group
                "created_at": pred.created_at.isoformat(),
                "model": {"name": model_name.name if model_name else "Unknown"},
                "count": 0,
                "total_actual_sales": 0,
                "total_predicted_sales": 0,
                "creator": {"name": creator.name if creator else "System"},
                "accuracy_sum": 0,
                "prediction_count_for_accuracy": 0
            }
        
        aggregated_predictions[key]["count"] += 1
        aggregated_predictions[key]["total_actual_sales"] += pred.actual_sales if pred.actual_sales else 0
        aggregated_predictions[key]["total_predicted_sales"] += pred.predicted_sales
        
        # Calculate accuracy for each prediction and sum it up
        if pred.actual_sales and pred.actual_sales != 0:
            accuracy = 100 * (1 - abs(pred.actual_sales - pred.predicted_sales) / pred.actual_sales)
            aggregated_predictions[key]["accuracy_sum"] += accuracy
            aggregated_predictions[key]["prediction_count_for_accuracy"] += 1
            
    final_predictions = []
    for key, agg_data in aggregated_predictions.items():
        if agg_data["prediction_count_for_accuracy"] > 0:
            agg_data["accuracy"] = agg_data["accuracy_sum"] / agg_data["prediction_count_for_accuracy"]
        else:
            agg_data["accuracy"] = None
        final_predictions.append(agg_data)
        
    return final_predictions

@app.put("/api/profile")
async def update_profile(profile_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Attempting to update profile. User: {current_user.username}, Role: {current_user.role}")
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    logger.info(f"Profile for user '{db_user.username}' updated.")
    return {"message": "Profil berhasil diperbarui"}

@app.put("/api/profile/change-password")
async def change_password(password_data: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Attempting to change password. User: {current_user.username}, Role: {current_user.role}")
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    
    if not verify_password(password_data.currentPassword, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Password saat ini salah")
    
    db_user.hashed_password = get_password_hash(password_data.newPassword)
    db.commit()
    logger.info(f"Password for user '{db_user.username}' changed.")
    return {"message": "Password berhasil diubah"}

@app.put("/api/profile/notifications")
async def update_notification_settings(settings: NotificationSettings, current_user: User = Depends(get_current_user)):
    logger.info(f"Attempting to update notification settings. User: {current_user.username}, Role: {current_user.role}")
    # In a real application, you would save these settings to the database for the user.
    # For now, it's just a mock success.
    return {"message": "Pengaturan notifikasi berhasil disimpan", "settings": settings.model_dump()}

@app.post("/api/reports/generate")
async def generate_report(current_user: User = Depends(get_current_user)):
    logger.info(f"Attempting to generate report. User: {current_user.username}, Role: {current_user.role}")
    if current_user.role != "main_admin":
        logger.warning(f"User {current_user.username} (Role: {current_user.role}) denied access to generate report.")
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # This is a mock implementation. In a real app, you'd generate a PDF report.
    dummy_pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</ProcSet[/PDF/Text]/Font<</F1 5 0 R>>>>/Contents 4 0 R>>endobj 4 0 obj<</Length 52>>stream\nBT /F1 24 Tf 100 700 Td (Dummy Report Content) Tj ET\nendstream\n5 0 obj<</Type/Font/Subtype/Type1/Name/F1/BaseFont/Helvetica/Encoding/MacRomanEncoding>>endobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000059 00000 n\n0000000120 00000 n\n0000000290 00000 n\n0000000343 00000 n\ntrailer<</Size 6/Root 1 0 R>>startxref\n496\n%%EOF"
    from fastapi.responses import StreamingResponse
    import io
    
    return StreamingResponse(io.BytesIO(dummy_pdf_content), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=dummy_report.pdf"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
