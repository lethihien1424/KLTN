from fastapi import Depends, Request
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.dependencies.auth_dependency import get_current_user
from src.models.user_model import User
from src.services.authorization_service import AuthorizationContext, AuthorizationService


def get_authorization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuthorizationContext:
    # FastAPI caches this dependency within the request, not across requests.
    return AuthorizationService().load(db, current_user)


def require_permission(*required_permissions: str):
    if not required_permissions:
        raise ValueError("At least one permission is required.")

    def dependency(request: Request, db: Session = Depends(get_db), context: AuthorizationContext = Depends(get_authorization)) -> User:
        from src.services.activity_audit import bind_actor
        user = AuthorizationService.check(context, *required_permissions)
        bind_actor(db, user, request)
        return user

    return dependency
