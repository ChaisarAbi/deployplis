import logging
# Configure logging at the very top of the file
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

print("DEBUG: app/auth.py loaded") # Debug print

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

# Security configuration
SECRET_KEY = "your-secret-key-here"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password, hashed_password):
  return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
  return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str):
  user = db.query(User).filter(User.username == username).first()
  if not user:
      logger.warning(f"Authentication failed: User '{username}' not found.")
      return False
  if not verify_password(password, user.hashed_password):
      logger.warning(f"Authentication failed: Invalid password for user '{username}'.")
      return False
  logger.info(f"User '{username}' authenticated successfully. Role: {user.role}")
  return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
  to_encode = data.copy()
  if expires_delta:
      expire = datetime.utcnow() + expires_delta
  else:
      expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  logger.info(f"Access token created for user '{data.get('sub')}' with role '{data.get('role')}'.")
  return encoded_jwt

def get_current_user(
  credentials: HTTPAuthorizationCredentials = Depends(security),
  db: Session = Depends(get_db)
):
  print("DEBUG AUTH: Inside get_current_user function.") # Debug print
  credentials_exception = HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Could not validate credentials",
      headers={"WWW-Authenticate": "Bearer"},
  )
  
  try:
      payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
      username: str = payload.get("sub")
      user_role: str = payload.get("role") # Get role from token payload
      if username is None:
          logger.error("JWT payload 'sub' is missing.")
          raise credentials_exception
  except JWTError as e:
      logger.error(f"JWT decoding error: {e}")
      raise credentials_exception
  
  user = db.query(User).filter(User.username == username).first()
  if user is None:
      logger.error(f"User '{username}' from token not found in database.")
      raise credentials_exception
  
  # Log the user and role from DB and token
  logger.info(f"Current user: {user.username}, Role from DB: {user.role}, Role from Token: {user_role}")
  print(f"DEBUG AUTH: User role from DB: {user.role}, Type: {type(user.role)}") # Debug print
  
  return user
