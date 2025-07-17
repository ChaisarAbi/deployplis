from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, User
from app.auth import get_password_hash
from dotenv import load_dotenv
load_dotenv()


# Create tables
Base.metadata.create_all(bind=engine)

def init_database():
    db = SessionLocal()
    
    # Check if users already exist
    if db.query(User).count() == 0:
        # Create default users
        users = [
            User(
                username="mainadmin",
                name="Administrator Utama",
                email="mainadmin@walmart.com",
                hashed_password=get_password_hash("admin123"),
                role="main_admin"
            ),
            User(
                username="admin",
                name="Administrator",
                email="admin@walmart.com",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            ),
            User(
                username="manager",
                name="Manajer",
                email="manager@walmart.com",
                hashed_password=get_password_hash("manager123"),
                role="manager"
            )
        ]
        
        for user in users:
            db.add(user)
        
        db.commit()
        print("Database initialized with default users")
    else:
        print("Database already initialized")
    
    db.close()

if __name__ == "__main__":
    init_database()
