from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, chats, messages, push, users
from app.websocket.chat_ws import chat_websocket
from app.websocket.global_ws import global_websocket

app = FastAPI(title="Anogram")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/api")
app.include_router(users.router,    prefix="/api")
app.include_router(chats.router,    prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(push.router,     prefix="/api")


@app.websocket("/ws/global")
async def ws_global(websocket: WebSocket, token: str):
    await global_websocket(websocket, token)


@app.websocket("/ws/{chat_id}")
async def ws_chat(websocket: WebSocket, chat_id: int, token: str):
    await chat_websocket(websocket, chat_id, token)
