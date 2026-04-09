from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract, func
from typing import Optional
from datetime import datetime, date
from database import get_db
import models
from auth import get_current_user

router = APIRouter()

@router.get("/summary")
def dashboard_summary(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    now = datetime.now()
    target_year = year or now.year
    target_month = month or now.month

    # Total all time
    total_all = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id
    ).scalar() or 0

    # This month
    month_total = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id,
        extract("year", models.Expense.date) == target_year,
        extract("month", models.Expense.date) == target_month,
    ).scalar() or 0

    # This month count
    month_count = db.query(func.count(models.Expense.id)).filter(
        models.Expense.user_id == current_user.id,
        extract("year", models.Expense.date) == target_year,
        extract("month", models.Expense.date) == target_month,
    ).scalar() or 0

    # Category breakdown this month
    category_breakdown = db.query(
        models.Category.id,
        models.Category.name,
        models.Category.icon,
        models.Category.color,
        func.sum(models.Expense.amount).label("total"),
        func.count(models.Expense.id).label("count")
    ).join(models.Expense, models.Expense.category_id == models.Category.id).filter(
        models.Expense.user_id == current_user.id,
        extract("year", models.Expense.date) == target_year,
        extract("month", models.Expense.date) == target_month,
    ).group_by(models.Category.id).order_by(func.sum(models.Expense.amount).desc()).all()

    # Monthly trend (last 12 months)
    monthly_trend = db.query(
        extract("year", models.Expense.date).label("year"),
        extract("month", models.Expense.date).label("month"),
        func.sum(models.Expense.amount).label("total"),
        func.count(models.Expense.id).label("count")
    ).filter(
        models.Expense.user_id == current_user.id,
    ).group_by("year", "month").order_by("year", "month").all()

    # Daily spending this month
    daily_spending = db.query(
        extract("day", models.Expense.date).label("day"),
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.user_id == current_user.id,
        extract("year", models.Expense.date) == target_year,
        extract("month", models.Expense.date) == target_month,
    ).group_by("day").order_by("day").all()

    # Recent 5 expenses
    recent = db.query(models.Expense).options(
        joinedload(models.Expense.category)
    ).filter(
        models.Expense.user_id == current_user.id
    ).order_by(models.Expense.date.desc()).limit(5).all()

    return {
        "total_all_time": round(float(total_all), 2),
        "month_total": round(float(month_total), 2),
        "month_count": month_count,
        "category_breakdown": [
            {
                "id": c.id, "name": c.name, "icon": c.icon, "color": c.color,
                "total": round(float(c.total), 2), "count": c.count,
                "percentage": round(float(c.total) / float(month_total) * 100, 1) if month_total else 0
            }
            for c in category_breakdown
        ],
        "monthly_trend": [
            {"year": int(m.year), "month": int(m.month), "total": round(float(m.total), 2), "count": m.count}
            for m in monthly_trend
        ],
        "daily_spending": [
            {"day": int(d.day), "total": round(float(d.total), 2)}
            for d in daily_spending
        ],
        "recent_expenses": [
            {
                "id": e.id,
                "amount": e.amount,
                "notes": e.notes,
                "date": e.date.isoformat(),
                "category": {"name": e.category.name, "icon": e.category.icon, "color": e.category.color} if e.category else None
            }
            for e in recent
        ]
    }

@router.get("/yearly")
def yearly_comparison(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Monthly totals grouped by year for bar chart comparison"""
    results = db.query(
        extract("year", models.Expense.date).label("year"),
        extract("month", models.Expense.date).label("month"),
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.user_id == current_user.id
    ).group_by("year", "month").order_by("year", "month").all()

    return [{"year": int(r.year), "month": int(r.month), "total": round(float(r.total), 2)} for r in results]