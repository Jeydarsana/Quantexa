from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes_market import router as market_router
from api.routes_analysis import router as analysis_router
from api.routes_backtest import router as backtest_router
from api.routes_ai import router as ai_router
from api.routes_intelligence import router as intelligence_router
from api.routes_simulation import router as simulation_router

load_dotenv()

app = FastAPI(
    title="QuantLens API",
    description="Backend API for the QuantLens Multi-Asset Financial Intelligence Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router, prefix="/api/market", tags=["Market"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(intelligence_router, prefix="/api/intelligence", tags=["Intelligence"])
app.include_router(backtest_router, prefix="/api", tags=["Backtest"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(simulation_router, prefix="/api/simulation", tags=["Simulation"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "QuantLens API is running"}
