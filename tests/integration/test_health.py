"""
tests/integration/test_health.py
──────────────────────────────────
Basic health check and API metadata tests.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestHealth:
    async def test_health_check(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "RideSync+"

    async def test_openapi_docs_accessible(self, client: AsyncClient):
        response = await client.get("/api/v1/docs")
        assert response.status_code == 200

    async def test_openapi_schema_accessible(self, client: AsyncClient):
        response = await client.get("/api/v1/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "paths" in schema
