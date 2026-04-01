from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers.routes import router as routes_router

load_dotenv()

app = FastAPI(
    title="Clean City AI Service",
    version="1.0.0",
    description="Route optimization service using OR-Tools TSP solver",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "cleancity-ai"}

app.include_router(routes_router, prefix="/api/routes")
