from passlib.context import CryptContext
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    h = pwd_context.hash("test")
    print(f"Bcrypt Success: {h}")
except Exception as e:
    print(f"Bcrypt Failed: {e}")

try:
    pwd_context_2 = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    h2 = pwd_context_2.hash("test")
    print(f"PBKDF2 Success: {h2}")
except Exception as e:
    print(f"PBKDF2 Failed: {e}")
