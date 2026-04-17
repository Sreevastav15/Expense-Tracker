from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from database import get_db
import models
from auth import get_current_user

router = APIRouter()

# =========================
# SCHEMAS
# =========================

class ExpenseCreate(BaseModel):
    amount: float
    category_id: int
    budget_id: int
    date: datetime
    notes: Optional[str] = None

    @validator("amount")
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return round(v, 2)


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category_id: Optional[int] = None
    budget_id: Optional[int] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None


# =========================
# HELPER
# =========================

def expense_to_dict(e: models.Expense) -> dict:
    return {
        "id": e.id,
        "amount": e.amount,
        "budget": {
            "id": e.budget.id,
            "label": e.budget.label,
            "total_amount": e.budget.total_amount,
            "spent": e.budget.spent
        } if e.budget else None,
        "notes": e.notes,
        "date": e.date.isoformat(),
        "category_id": e.category_id,
        "category": {
            "id": e.category.id,
            "name": e.category.name,
            "icon": e.category.icon,
            "color": e.category.color,
        } if e.category else None,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "updated_at": e.updated_at.isoformat() if e.updated_at else None,
    }


# =========================
# LIST
# =========================

@router.get("")
def list_expenses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    sort: Optional[str] = "date_desc",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Expense).options(
        joinedload(models.Expense.category),
        joinedload(models.Expense.budget)
    ).filter(models.Expense.user_id == current_user.id)

    if category_id:
        query = query.filter(models.Expense.category_id == category_id)
    if search:
        query = query.filter(models.Expense.notes.ilike(f"%{search}%"))
    if date_from:
        query = query.filter(models.Expense.date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(models.Expense.date <= datetime.fromisoformat(date_to))
    if amount_min is not None:
        query = query.filter(models.Expense.amount >= amount_min)
    if amount_max is not None:
        query = query.filter(models.Expense.amount <= amount_max)

    if sort == "date_asc":
        query = query.order_by(models.Expense.date.asc())
    elif sort == "amount_desc":
        query = query.order_by(models.Expense.amount.desc())
    elif sort == "amount_asc":
        query = query.order_by(models.Expense.amount.asc())
    else:
        query = query.order_by(models.Expense.date.desc())

    total = query.count()
    expenses = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [expense_to_dict(e) for e in expenses],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


# =========================
# CREATE
# =========================

@router.post("", status_code=201)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    category = db.query(models.Category).filter(
        models.Category.id == data.category_id,
        models.Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    budget = db.query(models.Budget).filter(
        models.Budget.id == data.budget_id,
        models.Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    expense = models.Expense(
        amount=data.amount,
        category_id=data.category_id,
        budget_id=data.budget_id,
        date=data.date,
        notes=data.notes,
        user_id=current_user.id
    )

    budget.spent = (budget.spent or 0) + data.amount

    db.add(expense)
    db.commit()
    db.refresh(expense)

    expense = db.query(models.Expense).options(
        joinedload(models.Expense.category),
        joinedload(models.Expense.budget)
    ).filter(models.Expense.id == expense.id).first()

    return expense_to_dict(expense)


# =========================
# GET
# =========================

@router.get("/{expense_id}")
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expense = db.query(models.Expense).options(
        joinedload(models.Expense.category),
        joinedload(models.Expense.budget)
    ).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    return expense_to_dict(expense)


# =========================
# UPDATE
# =========================

@router.put("/{expense_id}")
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    old_amount = expense.amount

    old_budget = db.query(models.Budget).filter(
        models.Budget.id == expense.budget_id,
        models.Budget.user_id == current_user.id
    ).first()

    # Budget change
    if data.budget_id is not None and data.budget_id != expense.budget_id:
        new_budget = db.query(models.Budget).filter(
            models.Budget.id == data.budget_id,
            models.Budget.user_id == current_user.id
        ).first()

        if not new_budget:
            raise HTTPException(status_code=404, detail="Budget not found")

        if old_budget:
            old_budget.spent = (old_budget.spent or 0) - expense.amount

        new_budget.spent = (new_budget.spent or 0) + expense.amount

        expense.budget_id = data.budget_id
        old_budget = new_budget

    # Amount change
    if data.amount is not None:
        if data.amount <= 0:
            raise HTTPException(status_code=422, detail="Amount must be positive")

        new_amount = round(data.amount, 2)

        if old_budget:
            old_budget.spent = (old_budget.spent or 0) - old_amount + new_amount

        expense.amount = new_amount

    if data.category_id is not None:
        cat = db.query(models.Category).filter(
            models.Category.id == data.category_id,
            models.Category.user_id == current_user.id
        ).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        expense.category_id = data.category_id

    if data.date is not None:
        expense.date = data.date

    if data.notes is not None:
        expense.notes = data.notes

    db.commit()

    expense = db.query(models.Expense).options(
        joinedload(models.Expense.category),
        joinedload(models.Expense.budget)
    ).filter(models.Expense.id == expense_id).first()

    return expense_to_dict(expense)


# =========================
# DELETE
# =========================

@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense.budget:
        expense.budget.spent = (expense.budget.spent or 0) - expense.amount

    db.delete(expense)
    db.commit()


# =========================
# CALENDAR MONTHLY (FIXED)
# =========================

@router.get("/calendar/monthly")
def calendar_monthly(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expenses = db.query(models.Expense).options(
        joinedload(models.Expense.category),
        joinedload(models.Expense.budget)   # ✅ IMPORTANT
    ).filter(
        models.Expense.user_id == current_user.id,
        extract("year", models.Expense.date) == year,
        extract("month", models.Expense.date) == month,
    ).order_by(models.Expense.date.asc()).all()

    calendar_data = {}

    for e in expenses:
        day_key = e.date.strftime("%Y-%m-%d")

        if day_key not in calendar_data:
            calendar_data[day_key] = {
                "total": 0,
                "expenses": []
            }

        calendar_data[day_key]["total"] += e.amount
        calendar_data[day_key]["expenses"].append(expense_to_dict(e))

    return calendar_data