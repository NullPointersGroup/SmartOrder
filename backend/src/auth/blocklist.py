import os

_BLOCKLIST: set[str] = set()

def load_blocklist(path: str = "common_passwords.txt") -> None:
    global _BLOCKLIST
    if os.path.exists(path):
        with open(path) as f:
            _BLOCKLIST = {line.strip().lower() for line in f}

def is_password_common(password: str) -> bool:
    return password.lower() in _BLOCKLIST