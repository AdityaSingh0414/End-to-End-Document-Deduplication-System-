import logging
from sqlalchemy.orm import Session
from backend.database.session import engine, SessionLocal
from backend.database.base_class import Base
from backend import models
from backend.utils.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    # Create tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create default admin if not exists
    logger.info("Checking for default admin account...")
    admin_email = "admin@enterprise.ai"
    admin = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin:
        logger.info(f"Creating default admin account ({admin_email})...")
        admin = models.User(
            email=admin_email,
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        logger.info("Admin account created successfully. Username: admin@enterprise.ai, Password: admin123")
    else:
        logger.info("Admin account already exists.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
