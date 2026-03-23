"""
tests/integration/test_users.py
─────────────────────────────────
Integration tests for user profile management endpoints.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestGetProfile:
    async def test_get_profile_authenticated(
        self, client: AsyncClient, registered_user: dict, auth_headers: dict
    ):
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registered_user["email"]
        assert data["full_name"] == registered_user["full_name"]
        assert "hashed_password" not in data

    async def test_get_profile_unauthenticated_rejected(self, client: AsyncClient):
        response = await client.get("/api/v1/users/me")
        assert response.status_code == 401

    async def test_get_profile_with_invalid_token_rejected(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer totally.fake.token"},
        )
        assert response.status_code == 401


class TestUpdateProfile:
    async def test_update_full_name(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.patch(
            "/api/v1/users/me",
            json={"full_name": "Updated Name"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"

    async def test_update_preferred_sort(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.patch(
            "/api/v1/users/me",
            json={"preferred_sort": "time"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["preferred_sort"] == "time"

    async def test_update_invalid_sort_rejected(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.patch(
            "/api/v1/users/me",
            json={"preferred_sort": "vibes"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_update_password_succeeds(
        self, client: AsyncClient, registered_user: dict, auth_headers: dict
    ):
        # Update the password
        response = await client.patch(
            "/api/v1/users/me",
            json={"password": "NewSecurePass99"},
            headers=auth_headers,
        )
        assert response.status_code == 200

        # Old password should no longer work
        old_login = await client.post("/api/v1/auth/login", data={
            "username": registered_user["email"],
            "password": registered_user["password"],
        })
        assert old_login.status_code == 401

        # New password should work
        new_login = await client.post("/api/v1/auth/login", data={
            "username": registered_user["email"],
            "password": "NewSecurePass99",
        })
        assert new_login.status_code == 200


class TestDeactivateAccount:
    async def test_deactivate_account(
        self, client: AsyncClient, auth_headers: dict
    ):
        response = await client.delete("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 204
