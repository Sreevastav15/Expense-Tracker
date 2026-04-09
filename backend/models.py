from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class CurrencyEnum(str, enum.Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    AED = "AED"
    INR = "INR"
    JPY = "JPY"
    CAD = "CAD"
    AUD = "AUD"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    currency = Column(String(10), default="USD")
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), default="💰")
    color = Column(String(20), default="#6366f1")
    is_default = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="categories")
    expenses = relationship("Expense", back_populates="category")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Float, nullable=False)
    months = Column(Integer, nullable=False)
    label = Column(String(200), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="budgets")