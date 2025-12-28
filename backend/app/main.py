"""
Corail Backend API - FastAPI + Firebase Auth + Databricks
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from .auth import init_firebase, CurrentUser
from .database import db
from .config import ALLOWED_ORIGINS

# Initialiser Firebase au démarrage
init_firebase()

# Créer l'app FastAPI
app = FastAPI(
    title="Corail VTC API",
    description="Backend pour l'application mobile Corail VTC",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# MODELS
# ============================================================================

class Ride(BaseModel):
    id: str
    creator_id: str
    picker_id: Optional[str]
    pickup_address: str
    dropoff_address: str
    scheduled_at: str
    price_cents: int
    status: str
    visibility: str
    vehicle_type: Optional[str]
    distance_km: Optional[float]
    duration_minutes: Optional[int]
    commission_enabled: bool
    group_id: Optional[str]


class CreateRideRequest(BaseModel):
    pickup_address: str
    dropoff_address: str
    scheduled_at: str
    price_cents: int
    visibility: str = "PUBLIC"
    vehicle_type: str = "STANDARD"
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    commission_enabled: bool = True
    group_ids: Optional[List[str]] = []


# ============================================================================
# ROUTES
# ============================================================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "Corail VTC API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/api/v1/rides", response_model=List[Ride])
async def get_rides(
    user_id: str = CurrentUser,
    status: Optional[str] = Query(None, description="Filter by status"),
    visibility: Optional[str] = Query(None, description="Filter by visibility"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Récupère les courses disponibles
    
    - Filtre par statut (PUBLISHED, CLAIMED, COMPLETED)
    - Filtre par visibilité (PUBLIC, GROUP)
    - Pagination
    """
    try:
        # Construire la requête SQL
        query = """
        SELECT 
            id,
            creator_id,
            picker_id,
            pickup_address,
            dropoff_address,
            scheduled_at,
            price_cents,
            status,
            visibility,
            vehicle_type,
            distance_km,
            duration_minutes,
            commission_enabled,
            group_id
        FROM rides
        WHERE 1=1
        """
        
        params = {}
        
        if status:
            query += " AND status = :status"
            params["status"] = status
        
        if visibility:
            query += " AND visibility = :visibility"
            params["visibility"] = visibility
        
        query += " ORDER BY scheduled_at ASC LIMIT :limit OFFSET :skip"
        params["limit"] = limit
        params["skip"] = skip
        
        results = db.execute_query(query, params)
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/v1/rides", response_model=dict)
async def create_ride(
    ride: CreateRideRequest,
    user_id: str = CurrentUser
):
    """
    Créer une nouvelle course
    
    Le creator_id sera automatiquement le user_id Firebase authentifié
    """
    try:
        # Générer un ID unique
        ride_id = f"ride-{user_id}-{int(datetime.now().timestamp())}"
        
        # Insérer dans la base
        query = """
        INSERT INTO rides (
            id,
            creator_id,
            pickup_address,
            dropoff_address,
            scheduled_at,
            price_cents,
            status,
            visibility,
            vehicle_type,
            distance_km,
            duration_minutes,
            commission_enabled,
            group_id,
            created_at,
            updated_at
        ) VALUES (
            :id,
            :creator_id,
            :pickup_address,
            :dropoff_address,
            :scheduled_at,
            :price_cents,
            'PUBLISHED',
            :visibility,
            :vehicle_type,
            :distance_km,
            :duration_minutes,
            :commission_enabled,
            :group_id,
            CURRENT_TIMESTAMP(),
            CURRENT_TIMESTAMP()
        )
        """
        
        params = {
            "id": ride_id,
            "creator_id": user_id,
            "pickup_address": ride.pickup_address,
            "dropoff_address": ride.dropoff_address,
            "scheduled_at": ride.scheduled_at,
            "price_cents": ride.price_cents,
            "visibility": ride.visibility,
            "vehicle_type": ride.vehicle_type,
            "distance_km": ride.distance_km,
            "duration_minutes": ride.duration_minutes,
            "commission_enabled": ride.commission_enabled,
            "group_id": ride.group_ids[0] if ride.group_ids else None
        }
        
        db.execute_non_query(query, params)
        
        return {
            "success": True,
            "ride_id": ride_id,
            "message": "Course créée avec succès"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating ride: {str(e)}")


@app.get("/api/v1/rides/{ride_id}", response_model=Ride)
async def get_ride(
    ride_id: str,
    user_id: str = CurrentUser
):
    """Récupère les détails d'une course spécifique"""
    try:
        query = "SELECT * FROM rides WHERE id = :ride_id"
        results = db.execute_query(query, {"ride_id": ride_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Ride not found")
        
        return results[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/v1/rides/{ride_id}/claim")
async def claim_ride(
    ride_id: str,
    user_id: str = CurrentUser
):
    """Prendre une course (claim)"""
    try:
        # Vérifier que la course existe et est disponible
        check_query = "SELECT status, creator_id FROM rides WHERE id = :ride_id"
        results = db.execute_query(check_query, {"ride_id": ride_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Ride not found")
        
        if results[0]["status"] != "PUBLISHED":
            raise HTTPException(status_code=400, detail="Ride not available")
        
        if results[0]["creator_id"] == user_id:
            raise HTTPException(status_code=400, detail="Cannot claim your own ride")
        
        # Claim la course
        update_query = """
        UPDATE rides 
        SET picker_id = :user_id, 
            status = 'CLAIMED',
            updated_at = CURRENT_TIMESTAMP()
        WHERE id = :ride_id
        """
        
        db.execute_non_query(update_query, {"user_id": user_id, "ride_id": ride_id})
        
        return {
            "success": True,
            "message": "Course réclamée avec succès"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error claiming ride: {str(e)}")


@app.get("/api/v1/my-rides", response_model=List[Ride])
async def get_my_rides(
    user_id: str = CurrentUser,
    type: str = Query("claimed", description="claimed or published")
):
    """
    Récupère les courses de l'utilisateur
    
    - type=claimed : courses que j'ai prises
    - type=published : courses que j'ai créées
    """
    try:
        if type == "claimed":
            query = "SELECT * FROM rides WHERE picker_id = :user_id ORDER BY scheduled_at DESC"
        else:
            query = "SELECT * FROM rides WHERE creator_id = :user_id ORDER BY scheduled_at DESC"
        
        results = db.execute_query(query, {"user_id": user_id})
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============================================================================
# DEV / DEBUG ROUTES
# ============================================================================

@app.get("/api/v1/debug/config")
async def debug_config():
    """Route de debug pour vérifier la config (à retirer en prod)"""
    import os
    return {
        "databricks_host": os.getenv("DATABRICKS_HOST", "NOT SET")[:20] + "...",
        "catalog": os.getenv("CATALOG", "io_catalog"),
        "schema": os.getenv("SCHEMA", "corail"),
        "firebase_configured": os.path.exists(os.getenv("FIREBASE_CREDENTIALS_PATH", "")),
    }

