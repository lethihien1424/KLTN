"""Keep HTTP server errors visible across the configured browser origins."""
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from src.core.config import settings

logger = logging.getLogger("uvicorn.error")


async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Lỗi máy chủ không xác định: %s", exc)
    # ServerErrorMiddleware wraps the CORS middleware. Its error response must
    # carry CORS too, otherwise browsers hide a real HTTP 500 as a fetch failure.
    origin = request.headers.get("origin")
    headers = {}
    if origin in settings.cors_origins:
        headers = {"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Vary": "Origin"}
    return JSONResponse(
        status_code=500,
        content={"detail": "Máy chủ gặp lỗi xử lý yêu cầu (HTTP 500). Vui lòng thử lại hoặc liên hệ quản trị viên."},
        headers=headers,
    )
