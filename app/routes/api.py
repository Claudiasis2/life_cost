from flask import Blueprint, jsonify
from flask_login import current_user

api_bp = Blueprint("api", __name__, url_prefix="/api")

def serialize_wallet(wallet):
    return {
        "id": wallet.id,
        "name": wallet.name,
        "description": wallet.description
    }

@api_bp.route("/me", methods=["GET"])
def me():
    if not current_user.is_authenticated:
        return jsonify({"is_authenticated": False, "user": None}), 200

    wallets = [
        serialize_wallet(wallet)
        for wallet in current_user.wallets
    ]
    active_wallet = next(
        (
            wallet
            for wallet in wallets
            if wallet["id"] == current_user.last_visited_wallet_id
        ),
        None
    )

    return jsonify({
        "is_authenticated": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "picture": current_user.picture,
            "last_visited_wallet_id": current_user.last_visited_wallet_id,
            "active_wallet": active_wallet,
            "wallets": wallets
        }
    }), 200
