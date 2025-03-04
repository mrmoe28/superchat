from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"status": "ok", "message": "FastAPI backend is running"}

@app.post("/api/chat")
async def chat(request: dict):
    return {
        "response": "This is a test response from the minimal FastAPI server",
        "preview": None
    } 