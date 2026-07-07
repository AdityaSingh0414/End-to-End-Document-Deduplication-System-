import logging
from typing import List, Dict

logger = logging.getLogger("document_chat")


class DocumentChatSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.history: List[Dict[str, str]] = []
        logger.info(f"Initialized new Document Chat Session: {session_id}")

    def add_message(self, role: str, content: str):
        """Appends a dialog message (role: 'user' or 'assistant') to local memory."""
        self.history.append({"role": role, "content": content})
        logger.info(f"Added '{role}' message to history. (Total turns: {len(self.history)})")

    def get_history(self) -> List[Dict[str, str]]:
        """Returns the full conversational history of this session."""
        return self.history

    def clear(self):
        """Resets conversation logs."""
        self.history = []
        logger.info(f"Reset history for session: {self.session_id}")
