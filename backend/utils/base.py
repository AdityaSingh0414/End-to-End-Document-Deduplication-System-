from abc import ABC, abstractmethod

class BaseStorage(ABC):
    @abstractmethod
    def save_file(self, file_content: bytes, filename: str) -> str:
        """Saves a file to the storage provider. Returns the identifier/path of the file."""
        pass

    @abstractmethod
    def get_file(self, file_path: str) -> bytes:
        """Retrieves file content from the storage provider using its identifier/path."""
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """Deletes a file from the storage provider. Returns True if successful, False otherwise."""
        pass
