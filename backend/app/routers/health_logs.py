from typing import List, Dict, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import HealthLog
from ..schemas import HealthLogCreate, HealthLogOut, TrendsResponse, TrendPoint, DashboardSummary
from ..deps import get_current_user
from datetime import datetime, timedelta


router = APIRouter(prefix="/health-logs", tags=["health-logs"])


@router.get("/", response_model=List[HealthLogOut])
def list_logs(metric_type: Optional[str] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = db.query(HealthLog).filter(HealthLog.user_id == user.id)
    if metric_type:
        query = query.filter(HealthLog.metric_type == metric_type)
    items = query.order_by(HealthLog.logged_at.desc()).all()
    return items


@router.post("/", response_model=HealthLogOut, status_code=201)
def create_log(payload: HealthLogCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    log = HealthLog(
        user_id=user.id,
        metric_type=payload.metric_type or "weight",
        value1=payload.value1,
        unit=payload.unit or "kg",
        logged_at=payload.logged_at,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    metrics_to_fetch = ['weight', 'heartRate', 'steps', 'sleep', 'water']
    summary_data = {}

    for metric in metrics_to_fetch:
        latest_log = (
            db.query(HealthLog)
            .filter(HealthLog.user_id == user.id, HealthLog.metric_type == metric)
            .order_by(HealthLog.logged_at.desc())
            .first()
        )
        summary_data[metric] = latest_log
    
    return DashboardSummary(**summary_data)


@router.get("/trends", response_model=TrendsResponse)
def get_trends(
    metric: str = "weight",
    days: int = 14,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    days = max(1, min(days, 90))
    since_dt = datetime.utcnow() - timedelta(days=days)

    rows: List[HealthLog] = (
        db.query(HealthLog)
        .filter(
            HealthLog.user_id == user.id,
            HealthLog.metric_type == metric,
            HealthLog.logged_at >= since_dt,
        )
        .order_by(HealthLog.logged_at.asc())
        .all()
    )

    buckets: Dict[str, Dict[str, float]] = {}
    for r in rows:
        dkey = r.logged_at.date().isoformat()
        if dkey not in buckets:
            buckets[dkey] = {"sum": 0.0, "count": 0}
        buckets[dkey]["sum"] += float(r.value1)
        buckets[dkey]["count"] += 1

    # Build continuous timeline (optional fill missing days with count=0?)
    # For simplicity, only include days that have data
    points: List[TrendPoint] = []
    for dkey in sorted(buckets.keys()):
        s = buckets[dkey]["sum"]
        c = buckets[dkey]["count"]
        avg = s / c if c else 0.0
        points.append(TrendPoint(date=datetime.fromisoformat(dkey).date(), avg=avg, count=c))

    # Compute last 7 vs previous 7 averages
    def avg_of_last(n: int, pts: List[TrendPoint]) -> float:
        if not pts:
            return 0.0
        tail = pts[-n:] if len(pts) >= n else pts[:]
        if not tail:
            return 0.0
        return sum(p.avg for p in tail) / len(tail)

    avg_last_7 = avg_of_last(7, points)
    prev_end = max(0, len(points) - 7)
    avg_prev_7 = avg_of_last(7, points[:prev_end]) if prev_end > 0 else 0.0
    weekly_change = avg_last_7 - avg_prev_7 if points else 0.0

    # Trend classification: compare first vs last average
    trend = None
    if len(points) >= 2:
        delta = points[-1].avg - points[0].avg
        threshold = 0.05  # 0.05 kg as minimal noticeable change
        if delta > threshold:
            trend = "up"
        elif delta < -threshold:
            trend = "down"
        else:
            trend = "stable"

    return TrendsResponse(
        metric=metric,
        days=days,
        unit=rows[0].unit if rows else "kg",
        points=points,
        avg_last_7=avg_last_7 if points else None,
        avg_prev_7=avg_prev_7 if points else None,
        weekly_change=weekly_change if points else None,
        trend=trend,
    )

@router.get("/stats/summary")
def get_stats_summary(
    days: int = 30,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """获取统计摘要"""
    since_dt = datetime.utcnow() - timedelta(days=days)
    
    # 获取所有指标数据
    metrics = ['weight', 'heartRate', 'steps', 'sleep', 'water']
    stats = {}
    
    for metric in metrics:
        records = db.query(HealthLog).filter(
            HealthLog.user_id == user.id,
            HealthLog.metric_type == metric,
            HealthLog.logged_at >= since_dt,
        ).all()
        
        if records:
            values = [r.value1 for r in records]
            stats[metric] = {
                "count": len(values),
                "avg": sum(values) / len(values),
                "min": min(values),
                "max": max(values),
                "latest": values[-1],
                "trend": "up" if len(values) >= 2 and values[-1] > values[0] else "down" if values[-1] < values[0] else "stable"
            }
        else:
            stats[metric] = None
    
    return stats