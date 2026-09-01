from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Root endpoint should return Hello World."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}
