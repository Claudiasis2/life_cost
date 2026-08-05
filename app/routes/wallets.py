from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from flask_jwt_extended import jwt_required
from ..models import Wallet, User
from ..extensions import db

wallets_bp = Blueprint("wallets", __name__)

@wallets_bp.route("/wallet/<int:id>", methods=["GET"])
# @login_required
def get_wallet(id):
    wallet = Wallet.query.get_or_404(id)
    return jsonify({
        "id": wallet.id,
        "name": wallet.name,
        "description": wallet.description
    })

@wallets_bp.route("/add_wallet", methods=["POST"])
# @login_required
def add_wallet():
    data = request.get_json()
    wallet = Wallet(
        name=data["name"],
        description=data.get("description")
    )
    db.session.add(wallet)
    db.session.commit()

    users = User.query.all()
    for user in users:
        user.wallets.append(wallet)

    db.session.commit()
    return jsonify({"message": "Wallet added"}), 200


@wallets_bp.route("/update_last_visited_wallet", methods=["POST"])
@login_required
def update_last_visited_wallet():
    data = request.get_json(silent=True) or {}
    wallet_id = data.get("wallet_id")

    try:
        wallet_id = int(wallet_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Wallet ID is required"}), 400

    if not any(wallet.id == wallet_id for wallet in current_user.wallets):
        return jsonify({"error": "Wallet not available for this user"}), 403

    current_user.last_visited_wallet_id = wallet_id
    db.session.commit()

    return jsonify({"message": "Last visited wallet updated"}), 200
