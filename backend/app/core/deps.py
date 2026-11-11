from uuid import UUID


DEMO_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


async def get_current_user_id() -> UUID:
    """Temporary auth stub until real authentication is implemented."""
    return DEMO_USER_ID
