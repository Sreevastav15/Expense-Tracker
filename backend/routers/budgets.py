from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from database import get_db
import models
from auth import get_current_user

router = APIRouter()

class BudgetCreate(BaseModel):
    total_amount: float
    months: int
    label: Optional[str] = None
    start_date: datetime

    @validator("total_amount")
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @validator("months")
    def months_positive(cls, v):
        if v <= 0:
            raise ValueError("Months must be positive")
        return v

class BudgetUpdate(BaseModel):
    total_amount: Optional[float] = None
    months: Optional[int] = None
    label: Optional[str] = None
    start_date: Optional[datetime] = None

def budget_to_dict(b: models.Budget, db: Session, user_id: int) -> dict:
    # Calculate monthly allowance
    monthly_allowance = b.total_amount / b.months

    # Calculate actual spending per month since start_date
    from sqlalchemy import and_
    expenses = db.query(
        extract("year", models.Expense.date).label("year"),
        extract("month", models.Expense.date).label("month"),
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.user_id == user_id,
        models.Expense.date >= b.start_date
    ).group_by("year", "month").all()

    monthly_actuals = [{"year": int(e.year), "month": int(e.month), "total": float(e.total)} for e in expenses]

    return {
        "id": b.id,
        "label": b.label,
        "total_amount": b.total_amount,
        "months": b.months,
        "start_date": b.start_date.isoformat(),
        "monthly_allowance": round(monthly_allowance, 2),
        "monthly_actuals": monthly_actuals,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }

@router.get("")
def list_budgets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id
    ).order_by(models.Budget.created_at.desc()).all()
    return [budget_to_dict(b, db, current_user.id) for b in budgets]

@router.post("", status_code=201)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    budget = models.Budget(
        total_amount=data.total_amount,
        months=data.months,
        label=data.label,
        start_date=data.start_date,
        user_id=current_user.id
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget_to_dict(budget, db, current_user.id)

@router.put("/{budget_id}")
def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    if data.total_amount is not None:
        budget.total_amount = data.total_amount
    if data.months is not None:
        budget.months = data.months
    if data.label is not None:
        budget.label = data.label
    if data.start_date is not None:
        budget.start_date = data.start_date
    db.commit()
    db.refresh(budget)
    return budget_to_dict(budget, db, current_user.id)

@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()