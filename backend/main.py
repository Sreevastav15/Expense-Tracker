from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from database import engine, Base
import models
from routers import auth, expenses, categories, budgets, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Expense Tracker API",
    description="Full-stack expense tracker with JWT auth",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

@app.get("/")
def root():
    return {"message": "Expense Tracker API v1.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}