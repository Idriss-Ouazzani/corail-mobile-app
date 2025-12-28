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

class User(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    rating: Optional[int] = None
    total_reviews: Optional[int] = None


class GroupMember(BaseModel):
    id: str
    user_id: Optional[str]
    email: str
    role: str  # ADMIN, MEMBER
    status: str  # ACTIVE, PENDING, REJECTED, LEFT
    full_name: Optional[str] = None


class Group(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str  # Databricks utilise owner_id, pas creator_id
    icon: str
    created_at: Optional[str] = None
    members: Optional[List[GroupMember]] = []


class CreateGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "👥"


class InviteToGroupRequest(BaseModel):
    email: str


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
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    completed_at: Optional[str] = None
    creator: Optional[User] = None
    picker: Optional[User] = None


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


@app.get("/health")
async def health():
    """Health check for monitoring"""
    return {"status": "healthy"}


@app.get("/api/v1/health")
async def api_health():
    """API health check"""
    return {"status": "healthy", "version": "1.0.0"}


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
        # Construire la requête SQL avec jointure users
        query = """
        SELECT 
            r.id,
            r.creator_id,
            r.picker_id,
            r.pickup_address,
            r.dropoff_address,
            r.scheduled_at,
            r.price_cents,
            r.status,
            r.visibility,
            r.vehicle_type,
            r.distance_km,
            r.duration_minutes,
            r.commission_enabled,
            r.group_id,
            r.created_at,
            r.updated_at,
            r.completed_at,
            u.id as creator_user_id,
            u.email as creator_email,
            u.full_name as creator_full_name,
            u.rating as creator_rating,
            u.total_reviews as creator_total_reviews
        FROM rides r
        LEFT JOIN users u ON r.creator_id = u.id
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
        
        # Transformer les résultats pour inclure les informations du créateur
        rides = []
        for row in results:
            ride_data = {
                "id": row["id"],
                "creator_id": row["creator_id"],
                "picker_id": row.get("picker_id"),
                "pickup_address": row["pickup_address"],
                "dropoff_address": row["dropoff_address"],
                "scheduled_at": row["scheduled_at"],
                "price_cents": row["price_cents"],
                "status": row["status"],
                "visibility": row["visibility"],
                "vehicle_type": row.get("vehicle_type"),
                "distance_km": row.get("distance_km"),
                "duration_minutes": row.get("duration_minutes"),
                "commission_enabled": row["commission_enabled"],
                "group_id": row.get("group_id"),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at"),
                "completed_at": row.get("completed_at"),
            }
            
            # Ajouter les informations du créateur si disponibles
            if row.get("creator_user_id"):
                ride_data["creator"] = {
                    "id": row["creator_user_id"],
                    "email": row.get("creator_email"),
                    "full_name": row.get("creator_full_name"),
                    "rating": row.get("creator_rating"),
                    "total_reviews": row.get("creator_total_reviews"),
                }
            
            rides.append(ride_data)
        
        return rides
    
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


@app.delete("/api/v1/rides/{ride_id}")
async def delete_ride(
    ride_id: str,
    user_id: str = CurrentUser
):
    """
    Supprimer une course
    
    Seulement le créateur peut supprimer sa propre course
    """
    try:
        # Vérifier que la course existe et appartient à l'utilisateur
        check_query = "SELECT creator_id, status FROM rides WHERE id = :ride_id"
        results = db.execute_query(check_query, {"ride_id": ride_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Course non trouvée")
        
        if results[0]["creator_id"] != user_id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres courses")
        
        # Supprimer la course
        delete_query = "DELETE FROM rides WHERE id = :ride_id"
        db.execute_non_query(delete_query, {"ride_id": ride_id})
        
        return {
            "success": True,
            "message": "Course supprimée avec succès"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting ride: {str(e)}")


# ============================================================================
# GROUPS ROUTES
# ============================================================================

@app.get("/api/v1/groups", response_model=List[Group])
async def get_my_groups(user_id: str = CurrentUser):
    """
    Récupère les groupes de l'utilisateur
    """
    try:
        query = """
        SELECT DISTINCT
            g.id,
            g.name,
            g.description,
            g.owner_id,
            g.icon,
            g.created_at
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = :user_id AND gm.status = 'ACTIVE'
        ORDER BY g.created_at DESC
        """
        
        groups_data = db.execute_query(query, {"user_id": user_id})
        
        # Pour chaque groupe, récupérer les membres
        groups = []
        for group in groups_data:
            members_query = """
            SELECT 
                gm.id,
                gm.user_id,
                gm.email,
                gm.role,
                gm.status,
                u.full_name
            FROM group_members gm
            LEFT JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = :group_id AND gm.status IN ('ACTIVE', 'PENDING')
            ORDER BY gm.role DESC, gm.status, gm.email
            """
            members_data = db.execute_query(members_query, {"group_id": group["id"]})
            
            groups.append({
                "id": group["id"],
                "name": group["name"],
                "description": group.get("description"),
                "owner_id": group["owner_id"],
                "icon": group.get("icon", "👥"),
                "created_at": group.get("created_at"),
                "members": members_data
            })
        
        return groups
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/v1/groups")
async def create_group(
    group: CreateGroupRequest,
    user_id: str = CurrentUser
):
    """
    Créer un nouveau groupe
    """
    try:
        import uuid
        from datetime import datetime
        
        group_id = f"group-{uuid.uuid4()}"
        
        # Créer le groupe
        create_group_query = """
        INSERT INTO groups (id, name, description, owner_id, icon, created_at, updated_at)
        VALUES (:id, :name, :description, :owner_id, :icon, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
        """
        
        db.execute_non_query(create_group_query, {
            "id": group_id,
            "name": group.name,
            "description": group.description,
            "owner_id": user_id,
            "icon": group.icon
        })
        
        # Ajouter le créateur comme membre admin
        member_id = f"member-{uuid.uuid4()}"
        add_member_query = """
        INSERT INTO group_members (id, group_id, user_id, email, role, status, invited_by, created_at, updated_at)
        SELECT :id, :group_id, :user_id, u.email, 'ADMIN', 'ACTIVE', NULL, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
        FROM users u WHERE u.id = :user_id
        """
        
        db.execute_non_query(add_member_query, {
            "id": member_id,
            "group_id": group_id,
            "user_id": user_id
        })
        
        return {
            "success": True,
            "group_id": group_id,
            "message": "Groupe créé avec succès"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating group: {str(e)}")


@app.post("/api/v1/groups/{group_id}/invite")
async def invite_to_group(
    group_id: str,
    invitation: InviteToGroupRequest,
    user_id: str = CurrentUser
):
    """
    Inviter quelqu'un à rejoindre un groupe
    
    L'invitation est créée avec status=PENDING.
    Un vrai système d'email/notification nécessiterait Firebase Cloud Functions.
    """
    try:
        import uuid
        
        # Vérifier que l'utilisateur est admin du groupe
        check_admin_query = """
        SELECT role FROM group_members
        WHERE group_id = :group_id AND user_id = :user_id AND status = 'ACTIVE'
        """
        admin_check = db.execute_query(check_admin_query, {"group_id": group_id, "user_id": user_id})
        
        if not admin_check or admin_check[0]["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Seuls les admins peuvent inviter des membres")
        
        # Vérifier si l'email existe déjà dans le groupe
        check_existing_query = """
        SELECT status FROM group_members
        WHERE group_id = :group_id AND email = :email
        """
        existing = db.execute_query(check_existing_query, {"group_id": group_id, "email": invitation.email})
        
        if existing:
            if existing[0]["status"] == "ACTIVE":
                raise HTTPException(status_code=400, detail="Cet utilisateur est déjà membre du groupe")
            elif existing[0]["status"] == "PENDING":
                raise HTTPException(status_code=400, detail="Une invitation est déjà en attente pour cet email")
        
        # Récupérer le user_id si l'email existe dans la table users
        find_user_query = "SELECT id FROM users WHERE email = :email"
        user_result = db.execute_query(find_user_query, {"email": invitation.email})
        found_user_id = user_result[0]["id"] if user_result else None
        
        # Créer l'invitation
        invitation_id = f"member-{uuid.uuid4()}"
        create_invitation_query = """
        INSERT INTO group_members (id, group_id, user_id, email, role, status, invited_by, invited_at, created_at, updated_at)
        VALUES (:id, :group_id, :user_id, :email, 'MEMBER', 'PENDING', :invited_by, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
        """
        
        db.execute_non_query(create_invitation_query, {
            "id": invitation_id,
            "group_id": group_id,
            "user_id": found_user_id,
            "email": invitation.email,
            "invited_by": user_id
        })
        
        return {
            "success": True,
            "invitation_id": invitation_id,
            "message": f"Invitation envoyée à {invitation.email}",
            "note": "⚠️ Système d'email non implémenté. L'utilisateur doit accepter manuellement l'invitation."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inviting to group: {str(e)}")


@app.get("/api/v1/groups/{group_id}")
async def get_group_details(
    group_id: str,
    user_id: str = CurrentUser
):
    """
    Récupère les détails d'un groupe
    """
    try:
        # Vérifier que l'utilisateur est membre du groupe
        check_member_query = """
        SELECT status FROM group_members
        WHERE group_id = :group_id AND user_id = :user_id
        """
        member_check = db.execute_query(check_member_query, {"group_id": group_id, "user_id": user_id})
        
        if not member_check or member_check[0]["status"] != "ACTIVE":
            raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de ce groupe")
        
        # Récupérer les infos du groupe
        group_query = """
        SELECT id, name, description, owner_id, icon, created_at
        FROM groups WHERE id = :group_id
        """
        group_data = db.execute_query(group_query, {"group_id": group_id})
        
        if not group_data:
            raise HTTPException(status_code=404, detail="Groupe non trouvé")
        
        # Récupérer les membres
        members_query = """
        SELECT 
            gm.id,
            gm.user_id,
            gm.email,
            gm.role,
            gm.status,
            u.full_name
        FROM group_members gm
        LEFT JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = :group_id AND gm.status IN ('ACTIVE', 'PENDING')
        ORDER BY gm.role DESC, gm.status, gm.email
        """
        members_data = db.execute_query(members_query, {"group_id": group_id})
        
        group = group_data[0]
        return {
            "id": group["id"],
            "name": group["name"],
            "description": group.get("description"),
            "owner_id": group["owner_id"],
            "icon": group.get("icon", "👥"),
            "created_at": group.get("created_at"),
            "members": members_data
        }
    
    except HTTPException:
        raise
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

