"""
tests/integration/test_auth.py
────────────────────────────────
Integration tests for authentication endpoints.
Uses the shared async test client with an in-memory SQLite DB.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "email": "newuser@ridesync.gh",
            "full_name": "New User",
            "password": "SecurePass1",
            "preferred_sort": "cost",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@ridesync.gh"
        assert data["full_name"] == "New User"
        assert "hashed_password" not in data
        assert "id" in data

    async def test_register_duplicate_email(self, client: AsyncClient):
        payload = {
            "email": "duplicate@ridesync.gh",
            "full_name": "First User",
            "password": "SecurePass1",
            "preferred_sort": "cost",
        }
        await client.post("/api/v1/auth/register", json=payload)
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 409

    async def test_register_weak_password_rejected(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "email": "weak@ridesync.gh",
            "full_name": "Weak User",
            "password": "abc",           # < 8 characters
            "preferred_sort": "cost",
        })
        assert response.status_code == 422

    async def test_register_invalid_email_rejected(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "full_name": "Bad Email",
            "password": "SecurePass1",
            "preferred_sort": "cost",
        })
        assert response.status_code == 422

    async def test_register_invalid_sort_preference_rejected(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "email": "sort@ridesync.gh",
            "full_name": "Sort User",
            "password": "SecurePass1",
            "preferred_sort": "vibes",   # invalid
        })
        assert response.status_code == 422


class TestLogin:
    async def test_login_success_returns_tokens(
        self, client: AsyncClient, registered_user: dict
    ):
        response = await client.post("/api/v1/auth/login", data={
            "username": registered_user["email"],
            "password": registered_user["password"],
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password_rejected(
        self, client: AsyncClient, registered_user: dict
    ):
        response = await client.post("/api/v1/auth/login", data={
            "username": registered_user["email"],
            "password": "WrongPassword99",
        })
        assert response.status_code == 401

    async def test_login_unknown_email_rejected(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/login", data={
            "username": "ghost@ridesync.gh",
            "password": "SecurePass1",
        })
        assert response.status_code == 401


class TestTokenRefresh:
    async def test_refresh_returns_new_tokens(
        self, client: AsyncClient, registered_user: dict
    ):
        login = await client.post("/api/v1/auth/login", data={
            "username": registered_user["email"],
            "password": registered_user["password"],
        })
        refresh_token = login.json()["refresh_token"]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    async def test_refresh_with_invalid_token_rejected(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "this.is.not.valid"},
        )
        assert response.status_code == 401
