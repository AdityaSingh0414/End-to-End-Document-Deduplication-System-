from sqlalchemy import create_engine
from backend.config import settings

connect_args = {}
if settings.get_database_url().startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.get_database_url(),
    pool_pre_ping=True,
    connect_args=connect_args
)
