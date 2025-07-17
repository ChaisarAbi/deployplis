from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    name: str
    email: Optional[str] = None
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UserStatusUpdate(BaseModel):
    status: str  # "active" or "inactive"

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

# Dataset schemas
class DatasetBase(BaseModel):
    name: str
    store_id: str

class DatasetResponse(DatasetBase):
    id: int
    records_count: int
    file_size: int
    columns: str
    uploaded_by: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Model schemas
class ModelBase(BaseModel):
    name: str
    algorithm: str

class TrainModelRequest(BaseModel):
    dataset_id: int
    parameters: Optional[Dict[str, Any]] = None

class OptimizeModelRequest(BaseModel):
    dataset_id: int
    n_trials: int = 50

class ModelResponse(ModelBase):
    id: int
    dataset_id: int
    parameters: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    trained_by: int
    status: str
    created_at: str

    class Config:
        from_attributes = True

# Prediction schemas
class PredictionRequest(BaseModel):
    model_id: int

class PredictionResponse(BaseModel):
    id: int
    model_id: int
    store_id: str
    dept_id: str
    predicted_sales: float
    actual_sales: Optional[float] = None
    abc_class: Optional[str] = None
    xyz_class: Optional[str] = None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Feedback schemas
class FeedbackCreate(BaseModel):
    dept_id: Optional[str] = None
    category: str
    message: str

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    dept_id: Optional[str] = None
    category: str
    message: str
    status: str
    response: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Profile schemas
class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class NotificationSettings(BaseModel):
    emailNotifications: bool = True
    pushNotifications: bool = True
    weeklyReports: bool = True
    systemAlerts: bool = True
