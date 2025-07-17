from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    role = Column(String)  # main_admin, admin, manager
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    datasets = relationship("Dataset", back_populates="uploader")
    models = relationship("Model", back_populates="trainer")
    predictions = relationship("Prediction", back_populates="creator")
    feedback = relationship("Feedback", back_populates="user")

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    store_id = Column(String)
    records_count = Column(Integer)
    file_size = Column(Integer)
    columns = Column(Text)  # JSON string of column names
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="processing")  # processing, completed, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    uploader = relationship("User", back_populates="datasets")
    models = relationship("Model", back_populates="dataset")

class Model(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    algorithm = Column(String)  # XGBoost, XGBoost_Optimized
    parameters = Column(Text)  # JSON string of model parameters
    metrics = Column(Text)  # JSON string of model metrics
    trained_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="training")  # training, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    dataset = relationship("Dataset", back_populates="models")
    trainer = relationship("User", back_populates="models")
    predictions = relationship("Prediction", back_populates="model")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"))
    store_id = Column(String)
    dept_id = Column(String)
    predicted_sales = Column(Float)
    actual_sales = Column(Float, nullable=True)
    abc_class = Column(String, nullable=True)  # A, B, C
    xyz_class = Column(String, nullable=True)  # X, Y, Z
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    model = relationship("Model", back_populates="predictions")
    creator = relationship("User", back_populates="predictions")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    dept_id = Column(String, nullable=True)
    category = Column(String)  # data_correction, classification_issue, general_feedback
    message = Column(Text)
    status = Column(String, default="pending")  # pending, reviewed, resolved
    response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="feedback")
