import asyncio

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, chats, media, messages, nicknames, users
from app.websocket.chat_ws import chat_websocket
from app.websocket.global_ws import global_websocket
from app.tasks.cleanup import cleanup_inactive_users

app = FastAPI(title="Anogram")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api")
app.include_router(users.router,     prefix="/api")
app.include_router(chats.router,     prefix="/api")
app.include_router(messages.router,  prefix="/api")
app.include_router(media.router,     prefix="/api")
app.include_router(nicknames.router, prefix="/api")


@app.on_event("startup")
async def startup():
    asyncio.create_task(cleanup_inactive_users())


@app.websocket("/ws/global")
async def ws_global(websocket: WebSocket, token: str):
    await global_websocket(websocket, token)


@app.websocket("/ws/{chat_id}")
async def ws_chat(websocket: WebSocket, chat_id: int, token: str):
    await chat_websocket(websocket, chat_id, token)
