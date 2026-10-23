from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from sqlalchemy import desc, func
from calendar import monthrange
import pytz
from ..models import Category, MoneyTransfer, Tag, User
from ..extensions import db

money_bp = Blueprint("money", __name__)

def get_date(date):
    return datetime.fromisoformat(date.replace("Z", "+00:00"))

def get_client_datetime(data):
    client_time_zone = data.get("timeZone", "SYSTEM")
    client_tz = pytz.timezone(client_time_zone)
    client_date = get_date(data.get("date"))

    if client_date.tzinfo is None:
        client_date = client_tz.localize(client_date)
    else:
        client_date = client_date.astimezone(client_tz)

    return client_date, client_tz

def utc_naive(date):
    return date.astimezone(pytz.utc).replace(tzinfo=None)

def local_day_bounds(client_date, client_tz):
    local_day = client_date.date()
    start_date = client_tz.localize(datetime.combine(local_day, datetime.min.time()))
    end_date = client_tz.localize(datetime.combine(local_day + timedelta(days=1), datetime.min.time()))
    return start_date, end_date

def local_month_bounds(client_date, client_tz):
    start_date = client_tz.localize(datetime(client_date.year, client_date.month, 1))
    if client_date.month == 12:
        end_date = client_tz.localize(datetime(client_date.year + 1, 1, 1))
    else:
        end_date = client_tz.localize(datetime(client_date.year, client_date.month + 1, 1))
    return start_date, end_date

def get_created_at(data):
    created_at = data.get("created_at")
    if not created_at:
        return datetime.utcnow()

    created_at = get_date(created_at)
    if created_at.tzinfo:
        created_at = created_at.astimezone(pytz.utc).replace(tzinfo=None)
    return created_at

def set_transfer_tags(transfer, tag_names):
    Tag.query.filter_by(money_transfer_id=transfer.id).delete()

    for tag_name in tag_names:
        category = Category.query.filter_by(name=tag_name).first()
        if not category:
            category = Category(
                name=tag_name,
                category_parent=None,
                number_of_operation=0
            )
            db.session.add(category)
            db.session.flush()

        db.session.add(Tag(
            category_id=category.id,
            money_transfer_id=transfer.id
        ))

def collect_tags_from(transfers):
    transfers_json = []
    user_names = {}

    for transfer in transfers:
        user_id = transfer.user_id
        if user_id not in user_names:
            user_names[user_id] = db.session.query(User.username).filter_by(id=user_id).scalar()

        transfers_json.append({
            "id": transfer.id,
            "description": transfer.description,
            "amount": transfer.amount,
            "created_at": transfer.created_at.isoformat(),
            "modifed_at": transfer.modifed_at.isoformat(),
            "tags": [
                {
                    "id": tag.category.id,
                    "name": tag.category.name
                }
                for tag in transfer.tags
            ],
            "created_by": user_names[user_id]
        })

    return jsonify(transfers_json)

def transfers_by_active_wallet():
    return MoneyTransfer.query.filter(
        MoneyTransfer.wallet_id == current_user.last_visited_wallet_id
    )

@money_bp.route("/money/<int:id>", methods=["GET"])
@login_required
def get_money(id):
    money = MoneyTransfer.query.filter_by(
        id=id,
        wallet_id=current_user.last_visited_wallet_id
    ).first_or_404()

    return jsonify({
        "id": money.id,
        "amount": money.amount,
        "description": money.description,
        "created_at": money.created_at.isoformat(),
        "modifed_at": money.modifed_at.isoformat()
    })

@money_bp.route("/add_money", methods=["POST"])
@login_required
def add_money():
    data = request.get_json()

    money = MoneyTransfer(
        amount=data["amount"],
        description=data["description"],
        created_at=get_created_at(data),
        user_id=current_user.id,
        wallet_id=current_user.last_visited_wallet_id
    )

    db.session.add(money)
    db.session.flush()
    set_transfer_tags(money, data.get("tags", []))
    db.session.commit()

    return jsonify({"message": "Money added"}), 200

@money_bp.route("/edit_money", methods=["POST"])
@login_required
def edit_money():
    data = request.get_json()
    money = MoneyTransfer.query.filter_by(
        id=data["id"],
        wallet_id=current_user.last_visited_wallet_id
    ).first()

    if money is None:
        return jsonify({"error": "MoneyTransfer not found"}), 404

    money.amount = data["amount"]
    money.description = data["description"]
    money.modifed_at = datetime.utcnow()
    set_transfer_tags(money, data.get("tags", []))
    db.session.commit()

    return jsonify({"message": "Money edited"}), 200

@money_bp.route("/last_money_transfers/<int:limit>", methods=["GET"])
@login_required
def last_money_transfers(limit):
    if limit < 0:
        limit = 10

    transfers = (
        transfers_by_active_wallet()
        .order_by(MoneyTransfer.created_at.desc())
        .limit(limit)
        .all()
    )
    return collect_tags_from(transfers)

@money_bp.route("/money_transfers_by_category/<int:category_id>", methods=["GET"])
@login_required
def money_transfers_by_category(category_id):
    category = Category.query.filter_by(id=category_id).first()
    if not category:
        return jsonify({"error": "Category not found"}), 404

    transfers = (
        MoneyTransfer.query
        .join(Tag, MoneyTransfer.id == Tag.money_transfer_id)
        .filter(
            Tag.category_id == category.id,
            MoneyTransfer.wallet_id == current_user.last_visited_wallet_id
        )
        .all()
    )
    return collect_tags_from(transfers)

@money_bp.route("/remove_money/<int:id>", methods=["DELETE"])
@login_required
def remove_money(id):
    money = MoneyTransfer.query.filter_by(
        id=id,
        wallet_id=current_user.last_visited_wallet_id
    ).first_or_404()

    Tag.query.filter_by(money_transfer_id=money.id).delete()
    db.session.delete(money)
    db.session.commit()

    return jsonify({"message": "Money removed"}), 200

@money_bp.route("/money_transfer_from_date", methods=["POST"])
@login_required
def money_transfers_by_date():
    data = request.get_json()
    client_date, client_tz = get_client_datetime(data)
    start_date, end_date = local_day_bounds(client_date, client_tz)

    transfers = (
        MoneyTransfer.query
        .filter(
            MoneyTransfer.created_at >= utc_naive(start_date),
            MoneyTransfer.created_at < utc_naive(end_date),
            MoneyTransfer.wallet_id == current_user.last_visited_wallet_id
        )
        .order_by(desc(MoneyTransfer.id))
        .all()
    )
    return collect_tags_from(transfers)

@money_bp.route("/money_transfers", methods=["POST"])
@login_required
def money_transfers_by_month():
    data = request.get_json()
    client_date, client_tz = get_client_datetime(data)
    start_date, end_date = local_month_bounds(client_date, client_tz)

    transfers = transfers_by_active_wallet().filter(
        MoneyTransfer.created_at >= utc_naive(start_date),
        MoneyTransfer.created_at < utc_naive(end_date)
    ).all()

    daily_totals = {}
    for transfer in transfers:
        local_date = transfer.created_at.replace(tzinfo=pytz.utc).astimezone(client_tz).date()
        if local_date not in daily_totals:
            daily_totals[local_date] = 0
        daily_totals[local_date] += transfer.amount

    return jsonify({
        "month": client_date.month,
        "year": client_date.year,
        "mean": compute_mean(),
        "mean_month": compute_month_mean(client_date),
        "total_amount": sum(daily_totals.values()),
        "days": [
            {"day": day.day, "total_amount": total}
            for day, total in daily_totals.items()
        ]
    })

def compute_mean():
    oldest_date, total_amount = (
        db.session.query(
            func.min(MoneyTransfer.created_at),
            func.sum(MoneyTransfer.amount)
        )
        .filter(MoneyTransfer.wallet_id == current_user.last_visited_wallet_id)
        .one()
    )

    if oldest_date is None:
        return 0

    day_difference = (datetime.utcnow() - oldest_date).days
    if day_difference == 0:
        return 0

    return total_amount / day_difference

def compute_month_mean(client_date):
    total_amount = (
        db.session.query(func.sum(MoneyTransfer.amount))
        .filter(MoneyTransfer.wallet_id == current_user.last_visited_wallet_id)
        .filter(func.month(MoneyTransfer.created_at) == client_date.month)
        .filter(func.year(MoneyTransfer.created_at) == client_date.year)
        .scalar()
    )

    if total_amount is None:
        return 0

    return total_amount / monthrange(client_date.year, client_date.month)[1]

@money_bp.route("/chart_data", methods=["POST"])
@login_required
def chart_data():
    data = request.get_json(silent=True) or {}
    client_time_zone = data.get("timeZone", "SYSTEM")
    client_tz = pytz.timezone(client_time_zone)

    transfers = transfers_by_active_wallet().all()

    daily_totals = {}
    for transfer in transfers:
        local_date = transfer.created_at.replace(tzinfo=pytz.utc).astimezone(client_tz).date()
        if local_date not in daily_totals:
            daily_totals[local_date] = 0
        daily_totals[local_date] += transfer.amount

    return jsonify([
        {"Date": date.isoformat(), "Close": total}
        for date, total in sorted(daily_totals.items())
    ])

@money_bp.route("/pi_data", methods=["POST"])
@login_required
def pi_data():
    transfers = transfers_by_active_wallet().all()

    income = 0
    outcome = 0
    for transfer in transfers:
        if transfer.amount > 0:
            outcome += transfer.amount
        else:
            income += transfer.amount

    return jsonify({"income": income, "outcome": outcome})


def _shifted_month_bounds(client_date, client_tz, offset):
    total = client_date.year * 12 + (client_date.month - 1) + offset
    year, month_index = divmod(total, 12)
    month = month_index + 1
    start_date = client_tz.localize(datetime(year, month, 1))
    if month == 12:
        end_date = client_tz.localize(datetime(year + 1, 1, 1))
    else:
        end_date = client_tz.localize(datetime(year, month + 1, 1))
    return year, month, start_date, end_date


def _sums_for_range(start_utc, end_utc, wallet_id):
    base_filters = [
        MoneyTransfer.wallet_id == wallet_id,
        MoneyTransfer.created_at >= start_utc,
        MoneyTransfer.created_at < end_utc,
    ]
    ingresos = (
        db.session.query(func.sum(MoneyTransfer.amount))
        .filter(*base_filters, MoneyTransfer.amount > 0)
        .scalar()
    ) or 0
    egresos_neg = (
        db.session.query(func.sum(MoneyTransfer.amount))
        .filter(*base_filters, MoneyTransfer.amount < 0)
        .scalar()
    ) or 0
    egresos = abs(egresos_neg)
    return float(ingresos), float(egresos)


def _money(value):
    return round(float(value or 0), 2)


def _pct_change(current, previous):
    if previous is None or previous == 0:
        return None
    return round((current - previous) / abs(previous) * 100, 2)


def _category_totals(start_utc, end_utc, wallet_id, egresos_total, limit=6):
    if not egresos_total:
        return []

    rows = (
        db.session.query(
            Category.id,
            Category.name,
            func.sum(func.abs(MoneyTransfer.amount)).label("total"),
        )
        .join(Tag, Tag.category_id == Category.id)
        .join(MoneyTransfer, MoneyTransfer.id == Tag.money_transfer_id)
        .filter(
            MoneyTransfer.wallet_id == wallet_id,
            MoneyTransfer.created_at >= start_utc,
            MoneyTransfer.created_at < end_utc,
            MoneyTransfer.amount < 0,
        )
        .group_by(Category.id, Category.name)
        .order_by(func.sum(func.abs(MoneyTransfer.amount)).desc())
        .all()
    )

    categorized_total = sum(float(row.total or 0) for row in rows)
    # Gastos con amount < 0 que no tienen Tag/Category (el JOIN los excluye):
    # van a "Otros" para que las categorías sumen el 100% de los egresos.
    uncategorized_total = max(float(egresos_total) - categorized_total, 0)

    categories = []
    for row in rows[:limit]:
        total = _money(row.total)
        categories.append({
            "id": row.id,
            "name": row.name,
            "total": total,
            "pct": round(total / float(egresos_total) * 100, 2),
        })

    others_total = sum(float(row.total or 0) for row in rows[limit:]) + uncategorized_total
    if others_total > 0:
        others_total = _money(others_total)
        categories.append({
            "id": None,
            "name": "Otros",
            "total": others_total,
            "pct": round(others_total / float(egresos_total) * 100, 2),
        })

    return categories


@money_bp.route("/dashboard_summary", methods=["POST"])
@login_required
def dashboard_summary():
    data = request.get_json(silent=True) or {}
    wallet_id = current_user.last_visited_wallet_id
    if wallet_id is None:
        return jsonify({"error": "No active wallet"}), 400

    try:
        if data.get("date"):
            client_date, client_tz = get_client_datetime(data)
        else:
            client_time_zone = data.get("timeZone", "SYSTEM")
            client_tz = pytz.timezone(client_time_zone)
            client_date = datetime.now(client_tz)
    except pytz.exceptions.UnknownTimeZoneError:
        return jsonify({"error": "Unknown timeZone"}), 400

    year, month, start_date, end_date = _shifted_month_bounds(client_date, client_tz, 0)
    prev_year, prev_month, prev_start, prev_end = _shifted_month_bounds(client_date, client_tz, -1)

    ingresos, egresos = _sums_for_range(utc_naive(start_date), utc_naive(end_date), wallet_id)
    prev_ingresos, prev_egresos = _sums_for_range(utc_naive(prev_start), utc_naive(prev_end), wallet_id)
    ingresos, egresos = _money(ingresos), _money(egresos)
    prev_ingresos, prev_egresos = _money(prev_ingresos), _money(prev_egresos)
    saldo = _money(ingresos - egresos)
    prev_saldo = _money(prev_ingresos - prev_egresos)

    evolution = []
    for offset in range(-7, 1):
        ev_year, ev_month, ev_start, ev_end = _shifted_month_bounds(client_date, client_tz, offset)
        ev_ingresos, ev_egresos = _sums_for_range(utc_naive(ev_start), utc_naive(ev_end), wallet_id)
        evolution.append({
            "key": f"{ev_year:04d}-{ev_month:02d}",
            "year": ev_year,
            "month": ev_month,
            "ingresos": _money(ev_ingresos),
            "egresos": _money(ev_egresos),
        })

    categories = _category_totals(utc_naive(start_date), utc_naive(end_date), wallet_id, egresos)

    transfers = transfers_by_active_wallet().filter(
        MoneyTransfer.created_at >= utc_naive(start_date),
        MoneyTransfer.created_at < utc_naive(end_date)
    ).all()
    daily_totals = {}
    for transfer in transfers:
        local_date = transfer.created_at.replace(tzinfo=pytz.utc).astimezone(client_tz).date()
        daily_totals[local_date] = daily_totals.get(local_date, 0) + transfer.amount

    return jsonify({
        "wallet_id": wallet_id,
        "month": {"year": year, "month": month, "ingresos": ingresos, "egresos": egresos, "saldo": saldo},
        "prev_month": {"year": prev_year, "month": prev_month, "ingresos": prev_ingresos, "egresos": prev_egresos, "saldo": prev_saldo},
        "deltas_pct": {
            "ingresos": _pct_change(ingresos, prev_ingresos),
            "egresos": _pct_change(egresos, prev_egresos),
            "saldo": _pct_change(saldo, prev_saldo),
        },
        "evolution": evolution,
        "by_category": categories,
        "days": [
            {"day": day.day, "total_amount": _money(total)}
            for day, total in daily_totals.items()
        ],
    })








