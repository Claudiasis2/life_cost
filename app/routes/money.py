from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from sqlalchemy import desc, func
from calendar import monthrange
import pytz
from ..models import Category, MoneyTransfer, Tag, User
from ..extensions import db

money_bp = Blueprint("money", __name__)

def get_date(date):
    return datetime.fromisoformat(date.replace("Z", "+00:00"))

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

@money_bp.route("/money/<int:id>", methods=["GET"])
@login_required
def get_money(id):
    money = MoneyTransfer.query.get_or_404(id)
    # owner = User.query.get(money.user_id)
    return jsonify({
        "id": money.id,
        "amount": money.amount,
        "description": money.description,
        "created_at": money.created_at.isoformat(),
        "modifed_at": money.modifed_at.isoformat(),
        # "owner": money.user.username
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
        MoneyTransfer.query
        .filter(MoneyTransfer.wallet_id == current_user.last_visited_wallet_id)
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
    client_time_zone = data.get("timeZone", "SYSTEM")
    client_date = get_date(data.get("date"))
    client_tz = pytz.timezone(client_time_zone)

    if client_date.tzinfo is None:
        client_date = client_tz.localize(client_date)
    else:
        client_date = client_date.astimezone(client_tz)

    start_date = client_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = client_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    transfers = (
        MoneyTransfer.query
        .filter(
            MoneyTransfer.created_at >= start_date.astimezone(pytz.utc).replace(tzinfo=None),
            MoneyTransfer.created_at < end_date.astimezone(pytz.utc).replace(tzinfo=None),
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
    client_time_zone = data.get("timeZone", "SYSTEM")
    client_date = get_date(data.get("date"))
    client_tz = pytz.timezone(client_time_zone)

    year = client_date.year
    month = client_date.month
    days_in_month = monthrange(year, month)[1]

    start_date = client_tz.localize(datetime(year, month, 1, 0, 0, 0))
    end_date = client_tz.localize(datetime(year, month, days_in_month, 23, 59, 59, 999999))

    transfers = MoneyTransfer.query.filter(
        MoneyTransfer.created_at >= start_date.astimezone(pytz.utc).replace(tzinfo=None),
        MoneyTransfer.created_at <= end_date.astimezone(pytz.utc).replace(tzinfo=None),
        MoneyTransfer.wallet_id == current_user.last_visited_wallet_id
    ).all()

    daily_totals = {}
    for transfer in transfers:
        local_date = transfer.created_at.replace(tzinfo=pytz.utc).astimezone(client_tz).date()
        if local_date not in daily_totals:
            daily_totals[local_date] = 0
        daily_totals[local_date] += transfer.amount

    return jsonify({
        "month": month,
        "year": year,
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










