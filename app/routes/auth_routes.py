from __future__ import annotations

from sqlalchemy import or_
from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from ..models import Task, User
from ..utils import api_response, wants_json_response

auth_bp = Blueprint("auth", __name__)


def _extract_payload():
    return request.get_json(silent=True) or request.form


@auth_bp.get("/")
def home():
    return redirect(url_for("auth.dashboard")) if current_user.is_authenticated else redirect(url_for("auth.login_page"))


@auth_bp.route("/register", methods=["GET", "POST"])
def register_page():
    if request.method == "GET":
        return render_template("register.html")

    payload = _extract_payload()
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    confirm_password = payload.get("confirm_password") or password

    if not username or not email or not password:
        message = "Username, email, and password are required."
        if wants_json_response():
            return api_response(False, message, status_code=400)
        flash(message, "danger")
        return redirect(url_for("auth.register_page"))

    if password != confirm_password:
        message = "Passwords do not match."
        if wants_json_response():
            return api_response(False, message, status_code=400)
        flash(message, "danger")
        return redirect(url_for("auth.register_page"))

    existing_user = User.query.filter(or_(User.username == username, User.email == email)).first()
    if existing_user:
        message = "Username or email already exists."
        if wants_json_response():
            return api_response(False, message, status_code=409)
        flash(message, "danger")
        return redirect(url_for("auth.register_page"))

    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(new_user)
    db.session.commit()

    login_user(new_user)
    message = "Registration successful."
    if wants_json_response():
        return api_response(True, message, {"redirect": url_for("auth.dashboard"), "user": new_user.to_dict()}, status_code=201)

    flash(message, "success")
    return redirect(url_for("auth.dashboard"))


@auth_bp.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "GET":
        return render_template("login.html")

    payload = _extract_payload()
    identifier = (payload.get("identifier") or payload.get("email") or payload.get("username") or "").strip().lower()
    password = payload.get("password") or ""
    remember = str(payload.get("remember", "")).lower() in {"1", "true", "yes", "on"}

    if not identifier or not password:
        message = "Email or username and password are required."
        if wants_json_response():
            return api_response(False, message, status_code=400)
        flash(message, "danger")
        return redirect(url_for("auth.login_page"))

    user = User.query.filter(or_(User.email == identifier, User.username == identifier)).first()
    if not user or not check_password_hash(user.password_hash, password):
        message = "Invalid credentials."
        if wants_json_response():
            return api_response(False, message, status_code=401)
        flash(message, "danger")
        return redirect(url_for("auth.login_page"))

    login_user(user, remember=remember)
    message = "Logged in successfully."
    if wants_json_response():
        return api_response(True, message, {"redirect": url_for("auth.dashboard"), "user": user.to_dict()})

    flash(message, "success")
    return redirect(url_for("auth.dashboard"))


@auth_bp.get("/logout")
def logout_page():
    logout_user()
    message = "You have been logged out."
    if wants_json_response():
        return api_response(True, message, {"redirect": url_for("auth.login_page")})

    flash(message, "info")
    return redirect(url_for("auth.login_page"))


@auth_bp.get("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", current_user=current_user)
