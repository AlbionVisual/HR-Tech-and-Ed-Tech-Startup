import hashlib
import secrets


def hash_password(password: str) -> tuple[str, str]:
    """Возвращает (hash_hex, salt_hex)"""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), 200_000
    )
    return digest.hex(), salt


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), 200_000
    )
    return secrets.compare_digest(digest.hex(), expected_hash)