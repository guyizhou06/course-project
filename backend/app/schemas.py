from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True


class HealthLogBase(BaseModel):
    metric_type: str = "weight"
    value1: float
    unit: str = "kg"
    logged_at: Optional[datetime] = None


class HealthLogCreate(HealthLogBase):
    pass


class HealthLogOut(HealthLogBase):
    id: int

    class Config:
        from_attributes = True


class HealthLogList(BaseModel):
    items: List[HealthLogOut]


class TrendPoint(BaseModel):
    date: date
    avg: float
    count: int


class TrendsResponse(BaseModel):
    metric: str
    days: int
    unit: str = "kg"
    points: List[TrendPoint]
    avg_last_7: Optional[float] = None
    avg_prev_7: Optional[float] = None
    weekly_change: Optional[float] = None
    trend: Optional[str] = None  # up | down | stable


class DashboardSummary(BaseModel):
    heartRate: Optional[HealthLogOut] = None
    steps: Optional[HealthLogOut] = None
    sleep: Optional[HealthLogOut] = None
    water: Optional[HealthLogOut] = None
    weight: Optional[HealthLogOut] = None
