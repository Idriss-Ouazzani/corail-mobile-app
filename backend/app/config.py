"""
Configuration pour Corail Backend
"""
import os
from pathlib import Path

# Databricks SQL Warehouse
DATABRICKS_HOST = os.getenv("DATABRICKS_HOST", "")
DATABRICKS_HTTP_PATH = os.getenv("DATABRICKS_HTTP_PATH", "")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN", "")

# Databricks Catalog & Schema
CATALOG = os.getenv("CATALOG", "io_catalog")
SCHEMA = os.getenv("SCHEMA", "corail")

# Firebase
FIREBASE_CREDENTIALS_PATH = os.getenv(
    "FIREBASE_CREDENTIALS_PATH",
    str(Path(__file__).parent.parent / "firebase-key.json")
)

# CORS
ALLOWED_ORIGINS = [
    "http://localhost:8081",  # Expo local
    "exp://",  # Expo Go
    "*"  # Pour dev - à restreindre en prod
]

