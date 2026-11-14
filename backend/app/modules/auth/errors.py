class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401, code: str = "unauthorized"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class AuthConfigError(AuthError):
    def __init__(self, message: str):
        super().__init__(message, status_code=503, code="not_configured")
