import os
import time
import logging
from typing import Optional, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

logger = logging.getLogger("backend.auth")

JWT_SECRET = os.getenv("JWT_SECRET", "bavis_jwt_super_secret_signing_key_sih26187_2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class UserTokenData(BaseModel):
    user_id: str
    username: str
    role: str  # operator | supervisor | admin

# Pre-seeded users for demo/testing
DEMO_USERS = {
    "operator": {"password": "operator_password_123", "user_id": "usr_op_01", "role": "operator"},
    "supervisor": {"password": "supervisor_password_123", "user_id": "usr_sup_01", "role": "supervisor"},
    "admin": {"password": "admin_password_123", "user_id": "usr_adm_01", "role": "admin"}
}

def create_jwt_token(username: str, user_id: str, role: str) -> str:
    payload = {
        "sub": username,
        "user_id": user_id,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> UserTokenData:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return UserTokenData(
            user_id=payload["user_id"],
            username=payload["sub"],
            role=payload["role"]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

def get_current_user(token: str = Depends(oauth2_scheme)) -> UserTokenData:
    return decode_jwt_token(token)

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserTokenData = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            log_audit(user.user_id, user.role, "RBAC_DENIED", f"Attempted unauthorized access to endpoint requiring {self.allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"RBAC Policy Error: Role '{user.role}' is not authorized. Allowed roles: {self.allowed_roles}"
            )
        return user

def log_audit(user_id: str, role: str, action: str, resource: str, details: Optional[dict] = None):
    audit_entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "user_id": user_id,
        "user_role": role,
        "action": action,
        "resource": resource,
        "details": details or {}
    }
    logger.info(f"[AUDIT_LOG] {audit_entry}")
    return audit_entry
