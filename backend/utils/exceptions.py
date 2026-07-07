class AppBaseException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

class InvalidCredentialsException(AppBaseException):
    def __init__(self):
        super().__init__(status_code=401, detail="Invalid username or password.")

class UnsupportedFileFormatException(AppBaseException):
    def __init__(self, filename: str):
        super().__init__(status_code=400, detail=f"Unsupported file format: {filename}")

class DocumentNotFoundException(AppBaseException):
    def __init__(self, doc_id: str):
        super().__init__(status_code=404, detail=f"Document with ID {doc_id} not found.")

class StorageException(AppBaseException):
    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=detail)
