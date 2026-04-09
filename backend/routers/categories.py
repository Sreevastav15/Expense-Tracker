from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth import get_current_user

router = APIRouter()

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "💰"
    color: Optional[str] = "#6366f1"

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

@router.get("")
def list_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    categories = db.query(models.Category).filter(
        models.Category.user_id == current_user.id
    ).order_by(models.Category.is_default.desc(), models.Category.name).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "icon": c.icon,
            "color": c.color,
            "is_default": c.is_default,
        }
        for c in categories
    ]

@router.post("", status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check duplicate name
    existing = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.name == data.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    category = models.Category(
        name=data.name,
        icon=data.icon,
        color=data.color,
        is_default=False,
        user_id=current_user.id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return {"id": category.id, "name": category.name, "icon": category.icon, "color": category.color, "is_default": category.is_default}

@router.put("/{category_id}")
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if data.name:
        category.name = data.name
    if data.icon:
        category.icon = data.icon
    if data.color:
        category.color = data.color
    db.commit()
    db.refresh(category)
    return {"id": category.id, "name": category.name, "icon": category.icon, "color": category.color, "is_default": category.is_default}

@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default categories")
    db.delete(category)
    db.commit()