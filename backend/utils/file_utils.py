import os
from pathlib import Path
from backend.utils.base import BaseStorage
from backend.config import settings
from backend.utils.exceptions import StorageException

class LocalStorage(BaseStorage):
    def __init__(self, base_dir: str = settings.UPLOAD_DIR):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, file_content: bytes, filename: str) -> str:
        try:
            # Prevent directory traversal attacks
            safe_filename = Path(filename).name
            target_path = self.base_dir / safe_filename
            
            # If file already exists, append a suffix to avoid overwriting
            counter = 1
            stem = Path(safe_filename).stem
            suffix = Path(safe_filename).suffix
            while target_path.exists():
                target_path = self.base_dir / f"{stem}_{counter}{suffix}"
                counter += 1
            
            with open(target_path, "wb") as f:
                f.write(file_content)
            
            return str(target_path)
        except Exception as e:
            raise StorageException(f"Failed to save file: {str(e)}")

    def get_file(self, file_path: str) -> bytes:
        try:
            path = Path(file_path)
            if not path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            with open(path, "rb") as f:
                return f.read()
        except Exception as e:
            raise StorageException(f"Failed to read file: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        try:
            path = Path(file_path)
            if path.exists():
                os.remove(path)
                return True
            return False
        except Exception as e:
            raise StorageException(f"Failed to delete file: {str(e)}")


# Default storage instance
storage = LocalStorage()
