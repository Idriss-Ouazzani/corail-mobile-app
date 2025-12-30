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
    credits: Optional[int] = 0
    verification_status: Optional[str] = "UNVERIFIED"  # UNVERIFIED, PENDING, VERIFIED, REJECTED
    professional_card_number: Optional[str] = None
    siren: Optional[str] = None
    phone: Optional[str] = None
    is_admin: Optional[bool] = False


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
    group_id: Optional[str]
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    completed_at: Optional[str] = None
    creator: Optional[User] = None
    picker: Optional[User] = None


class PersonalRide(BaseModel):
    """Course personnelle d'un chauffeur (Uber, Bolt, Direct, etc.)"""
    id: str
    driver_id: str
    source: str  # UBER, BOLT, DIRECT_CLIENT, MARKETPLACE, OTHER
    pickup_address: str
    dropoff_address: str
    scheduled_at: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    price_cents: Optional[int] = None
    currency: str = "EUR"
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    notes: Optional[str] = None
    status: str  # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreatePersonalRideRequest(BaseModel):
    """Requête pour créer une course personnelle"""
    source: str
    pickup_address: str
    dropoff_address: str
    scheduled_at: Optional[str] = None
    price_cents: Optional[int] = None
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    notes: Optional[str] = None
    status: str = "SCHEDULED"


class UpdatePersonalRideRequest(BaseModel):
    """Requête pour mettre à jour une course personnelle"""
    source: Optional[str] = None
    pickup_address: Optional[str] = None
    dropoff_address: Optional[str] = None
    scheduled_at: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    price_cents: Optional[int] = None
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class Badge(BaseModel):
    id: str
    name: str
    description: Optional[str]
    icon: str
    color: str
    rarity: str  # COMMON, RARE, EPIC, LEGENDARY
    category: str  # ACTIVITY, ACHIEVEMENT, MILESTONE, SPECIAL
    requirement_description: Optional[str]


class UserBadge(BaseModel):
    id: str
    user_id: str
    badge_id: str
    earned_at: str
    progress: Optional[int] = None
    badge_name: Optional[str] = None
    badge_description: Optional[str] = None
    badge_icon: Optional[str] = None
    badge_color: Optional[str] = None
    badge_rarity: Optional[str] = None
    badge_category: Optional[str] = None


class CreateUserRequest(BaseModel):
    id: str  # Firebase UID
    email: str
    full_name: str
    verification_status: str = "UNVERIFIED"


class SubmitVerificationRequest(BaseModel):
    full_name: str
    phone: str
    professional_card_number: str
    siren: str


class VerificationReviewRequest(BaseModel):
    status: str  # VERIFIED or REJECTED
    rejection_reason: Optional[str] = None


class CreateRideRequest(BaseModel):
    pickup_address: str
    dropoff_address: str
    scheduled_at: str
    price_cents: int
    visibility: str = "PUBLIC"
    vehicle_type: str = "STANDARD"
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    group_ids: Optional[List[str]] = []
    client_name: Optional[str] = None
    client_phone: Optional[str] = None


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
    - Expire automatiquement les courses PUBLISHED dont la date est passée
    """
    try:
        # 🔄 Auto-expiration : Mettre à jour les courses PUBLISHED dont scheduled_at est dans le passé
        expire_query = """
        UPDATE rides
        SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP()
        WHERE status = 'PUBLISHED' 
        AND scheduled_at < CURRENT_TIMESTAMP()
        """
        try:
            db.execute_query(expire_query)
        except Exception as e:
            # Log mais ne pas bloquer si l'expiration échoue
            print(f"⚠️ Warning: Failed to expire rides: {e}")
        
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
            r.group_id,
            r.created_at,
            r.updated_at,
            r.completed_at,
            u.id as creator_user_id,
            u.email as creator_email,
            u.full_name as creator_full_name,
            u.rating as creator_rating,
            u.total_reviews as creator_total_reviews,
            u.credits as creator_credits
        FROM rides r
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.status != 'EXPIRED'
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
                    "credits": row.get("creator_credits", 0),
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
            group_id,
            client_name,
            client_phone,
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
            :group_id,
            :client_name,
            :client_phone,
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
            "group_id": ride.group_ids[0] if ride.group_ids else None,
            "client_name": ride.client_name,
            "client_phone": ride.client_phone
        }
        
        db.execute_non_query(query, params)
        
        # 🎉 SYSTÈME DE CRÉDITS : +1 crédit pour PUBLIC et GROUP (pas PERSONAL)
        credit_message = ""
        if ride.visibility in ["PUBLIC", "GROUP"]:
            credit_query = """
            UPDATE users 
            SET credits = COALESCE(credits, 0) + 1
            WHERE id = :user_id
            """
            db.execute_non_query(credit_query, {"user_id": user_id})
            print(f"✅ +1 crédit Corail pour {user_id} (publication {ride.visibility})")
            credit_message = " +1 crédit Corail"
        
        # 🏆 Vérifier et attribuer des badges automatiquement
        check_and_award_badges(user_id)
        
        return {
            "success": True,
            "ride_id": ride_id,
            "message": f"Course créée avec succès !{credit_message}"
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
        # 🎯 SYSTÈME DE CRÉDITS : Vérifier que l'utilisateur a au moins 1 crédit
        credits_query = "SELECT credits FROM users WHERE id = :user_id"
        credits_result = db.execute_query(credits_query, {"user_id": user_id})
        
        if not credits_result or credits_result[0].get("credits", 0) < 1:
            raise HTTPException(
                status_code=402,  # Payment Required
                detail="Crédits insuffisants. Publiez des courses pour gagner des crédits !"
            )
        
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
        
        # 🎉 SYSTÈME DE CRÉDITS : -1 crédit pour avoir pris une course
        deduct_credit_query = """
        UPDATE users 
        SET credits = credits - 1
        WHERE id = :user_id
        """
        db.execute_non_query(deduct_credit_query, {"user_id": user_id})
        
        print(f"✅ -1 crédit Corail pour {user_id} (prise de course)")
        
        return {
            "success": True,
            "message": "Course réclamée avec succès"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error claiming ride: {str(e)}")


@app.post("/api/v1/rides/{ride_id}/complete")
async def complete_ride(
    ride_id: str,
    user_id: str = CurrentUser
):
    """Terminer/Valider une course (CLAIMED -> COMPLETED)"""
    try:
        # Vérifier que la course existe et que l'utilisateur est le picker
        check_query = "SELECT status, picker_id, creator_id, visibility FROM rides WHERE id = :ride_id"
        results = db.execute_query(check_query, {"ride_id": ride_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Ride not found")
        
        ride = results[0]
        
        if ride["picker_id"] != user_id and ride["creator_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to complete this ride")
        
        if ride["status"] != "CLAIMED":
            raise HTTPException(status_code=400, detail="Only CLAIMED rides can be completed")
        
        # Marquer la course comme complétée
        update_query = """
        UPDATE rides 
        SET status = 'COMPLETED',
            completed_at = CURRENT_TIMESTAMP(),
            updated_at = CURRENT_TIMESTAMP()
        WHERE id = :ride_id
        """
        
        db.execute_non_query(update_query, {"ride_id": ride_id})
        
        # 🎉 SYSTÈME DE CRÉDITS : +1 crédit supplémentaire pour le créateur si PUBLIC/GROUP
        if ride["visibility"] in ["PUBLIC", "GROUP"] and ride["creator_id"]:
            bonus_credit_query = """
            UPDATE users 
            SET credits = COALESCE(credits, 0) + 1
            WHERE id = :creator_id
            """
            db.execute_non_query(bonus_credit_query, {"creator_id": ride["creator_id"]})
            print(f"✅ +1 crédit bonus pour {ride['creator_id']} (course {ride['visibility']} complétée)")
        
        return {
            "success": True,
            "message": "Course terminée avec succès ! Le créateur a reçu un crédit bonus."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing ride: {str(e)}")


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


@app.post("/api/v1/rides/{ride_id}/complete")
async def complete_ride(
    ride_id: str,
    user_id: str = CurrentUser
):
    """
    Marquer une course comme terminée
    
    Seulement le picker peut marquer la course comme complétée.
    🎉 Le créateur reçoit +1 crédit supplémentaire (total +2 pour la course)
    """
    try:
        # Vérifier que la course existe et appartient au picker
        check_query = "SELECT creator_id, picker_id, status FROM rides WHERE id = :ride_id"
        results = db.execute_query(check_query, {"ride_id": ride_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Course non trouvée")
        
        ride = results[0]
        
        if ride["picker_id"] != user_id:
            raise HTTPException(
                status_code=403, 
                detail="Seul le chauffeur qui a pris la course peut la marquer comme terminée"
            )
        
        if ride["status"] != "CLAIMED":
            raise HTTPException(
                status_code=400, 
                detail=f"La course doit être en statut CLAIMED (statut actuel: {ride['status']})"
            )
        
        # Marquer la course comme terminée
        update_query = """
        UPDATE rides 
        SET status = 'COMPLETED',
            completed_at = CURRENT_TIMESTAMP(),
            updated_at = CURRENT_TIMESTAMP()
        WHERE id = :ride_id
        """
        db.execute_non_query(update_query, {"ride_id": ride_id})
        
        # 🎉 SYSTÈME DE CRÉDITS : +1 crédit bonus au créateur (course prise ET validée)
        credit_query = """
        UPDATE users 
        SET credits = COALESCE(credits, 0) + 1
        WHERE id = :creator_id
        """
        db.execute_non_query(credit_query, {"creator_id": ride["creator_id"]})
        
        print(f"✅ +1 crédit Corail bonus pour {ride['creator_id']} (course terminée)")
        
        # 🏆 Vérifier et attribuer des badges automatiquement (pour créateur ET picker)
        check_and_award_badges(ride["creator_id"])
        check_and_award_badges(user_id)  # picker
        
        return {
            "success": True,
            "message": "Course terminée avec succès ! +1 crédit pour l'apporteur d'affaires 🪸"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing ride: {str(e)}")


# ============================================================================
# CREDITS ROUTES
# ============================================================================

@app.get("/api/v1/credits")
async def get_user_credits(
    user_id: str = CurrentUser
):
    """
    Récupérer le solde de crédits Corail de l'utilisateur
    """
    try:
        query = "SELECT credits FROM users WHERE id = :user_id"
        results = db.execute_query(query, {"user_id": user_id})
        
        if not results:
            # Si l'utilisateur n'existe pas encore dans la table users, le créer avec 5 crédits
            insert_query = """
            INSERT INTO users (id, email, full_name, credits)
            VALUES (:user_id, '', '', 5)
            """
            db.execute_non_query(insert_query, {"user_id": user_id})
            return {"credits": 5}
        
        return {"credits": results[0].get("credits", 0)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching credits: {str(e)}")


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
# 👤 USERS
# ============================================================================

@app.post("/api/v1/users")
async def create_user(user_data: CreateUserRequest):
    """
    Créer un nouvel utilisateur dans Databricks après inscription Firebase
    """
    try:
        # Vérifier si l'utilisateur existe déjà
        check_query = "SELECT id FROM users WHERE id = :user_id"
        existing = db.execute_query(check_query, {"user_id": user_data.id})
        
        if existing:
            print(f"ℹ️ Utilisateur {user_data.id} existe déjà, pas de création")
            return {"success": True, "message": "User already exists", "user_id": user_data.id}
        
        # Créer l'utilisateur
        insert_query = """
        INSERT INTO users (
            id, email, full_name, verification_status, credits, created_at, updated_at
        ) VALUES (
            :id, :email, :full_name, :verification_status, 0, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
        )
        """
        
        db.execute_non_query(insert_query, {
            "id": user_data.id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "verification_status": user_data.verification_status,
        })
        
        print(f"✅ Utilisateur créé: {user_data.email} ({user_data.id}) - Status: {user_data.verification_status}")
        
        # 🏆 Attribuer automatiquement le badge "Early Adopter" 
        # (condition : inscrit avant le 25 janvier 2026)
        from datetime import datetime
        if datetime.now().date() <= datetime(2026, 1, 25).date():
            try:
                # Vérifier que le badge existe
                badge_check = db.execute_query(
                    "SELECT id FROM badges WHERE id = 'badge-early-adopter'"
                )
                
                if badge_check:
                    # Attribuer le badge avec un ID unique
                    badge_id_unique = f"ub-{user_data.id}-early-adopter"
                    award_badge_query = """
                    INSERT INTO user_badges (id, user_id, badge_id, earned_at)
                    VALUES (:id, :user_id, 'badge-early-adopter', CURRENT_TIMESTAMP())
                    """
                    db.execute_non_query(award_badge_query, {
                        "id": badge_id_unique,
                        "user_id": user_data.id
                    })
                    print(f"🏆 Badge 'Early Adopter' attribué à {user_data.email}")
                else:
                    print("⚠️ Badge 'Early Adopter' n'existe pas dans la table badges")
            except Exception as badge_error:
                print(f"⚠️ Erreur attribution badge Early Adopter: {str(badge_error)}")
                # Ne pas bloquer la création de l'utilisateur si le badge échoue
        
        return {
            "success": True,
            "message": "User created successfully",
            "user_id": user_data.id
        }
    
    except Exception as e:
        print(f"❌ Erreur création utilisateur: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")


# ============================================================================
# ✅ VERIFICATION PROFESSIONNELLE
# ============================================================================

@app.get("/api/v1/verification/status")
async def get_verification_status(user_id: str = CurrentUser):
    """Récupérer le statut de vérification de l'utilisateur"""
    try:
        query = """
        SELECT 
            id,
            email,
            full_name,
            phone,
            verification_status,
            professional_card_number,
            siren,
            verification_submitted_at,
            verification_rejection_reason,
            is_admin
        FROM users
        WHERE id = :user_id
        """
        result = db.execute_query(query, {"user_id": user_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return result[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/v1/verification/submit")
async def submit_verification(
    verification: SubmitVerificationRequest,
    user_id: str = CurrentUser
):
    """Soumettre les documents de vérification professionnelle"""
    try:
        # Mettre à jour le profil utilisateur
        update_query = """
        UPDATE users
        SET 
            full_name = :full_name,
            phone = :phone,
            professional_card_number = :professional_card_number,
            siren = :siren,
            verification_status = 'PENDING',
            verification_submitted_at = CURRENT_TIMESTAMP()
        WHERE id = :user_id
        """
        
        db.execute_non_query(update_query, {
            "user_id": user_id,
            "full_name": verification.full_name,
            "phone": verification.phone,
            "professional_card_number": verification.professional_card_number,
            "siren": verification.siren
        })
        
        # Enregistrer dans l'historique
        import uuid
        history_id = f"vh-{uuid.uuid4()}"
        history_query = """
        INSERT INTO verification_history (
            id, user_id, status, professional_card_number, siren, submitted_at, created_at
        ) VALUES (
            :id, :user_id, 'PENDING', :professional_card_number, :siren, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
        )
        """
        
        db.execute_non_query(history_query, {
            "id": history_id,
            "user_id": user_id,
            "professional_card_number": verification.professional_card_number,
            "siren": verification.siren
        })
        
        print(f"✅ Vérification soumise pour {user_id} - Carte: {verification.professional_card_number}, SIREN: {verification.siren}")
        
        return {
            "success": True,
            "message": "Vérification soumise avec succès ! Votre compte sera validé sous 24-48h.",
            "status": "PENDING"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting verification: {str(e)}")


@app.post("/api/v1/admin/verification/{user_id}/review")
async def review_verification(
    user_id: str,
    review: VerificationReviewRequest,
    admin_id: str = CurrentUser
):
    """
    [ADMIN] Valider ou rejeter une vérification
    """
    try:
        # Vérifier que l'utilisateur qui fait la requête est admin
        admin_check = db.execute_query(
            "SELECT is_admin FROM users WHERE id = :admin_id",
            {"admin_id": admin_id}
        )
        
        if not admin_check or not admin_check[0].get('is_admin'):
            raise HTTPException(status_code=403, detail="Admin privileges required")
        
        if review.status not in ["VERIFIED", "REJECTED"]:
            raise HTTPException(status_code=400, detail="Status must be VERIFIED or REJECTED")
        
        # Mettre à jour le statut de l'utilisateur
        update_query = """
        UPDATE users
        SET 
            verification_status = :status,
            verification_reviewed_at = CURRENT_TIMESTAMP(),
            verification_reviewed_by = :admin_id,
            verification_rejection_reason = :rejection_reason
        WHERE id = :user_id
        """
        
        db.execute_non_query(update_query, {
            "user_id": user_id,
            "status": review.status,
            "admin_id": admin_id,
            "rejection_reason": review.rejection_reason
        })
        
        # Enregistrer dans l'historique
        import uuid
        history_id = f"vh-{uuid.uuid4()}"
        history_query = """
        INSERT INTO verification_history (
            id, user_id, status, reviewed_at, reviewed_by, rejection_reason, created_at
        ) VALUES (
            :id, :user_id, :status, CURRENT_TIMESTAMP(), :admin_id, :rejection_reason, CURRENT_TIMESTAMP()
        )
        """
        
        db.execute_non_query(history_query, {
            "id": history_id,
            "user_id": user_id,
            "status": review.status,
            "admin_id": admin_id,
            "rejection_reason": review.rejection_reason
        })
        
        print(f"✅ Vérification {review.status} pour {user_id} par admin {admin_id}")
        
        return {
            "success": True,
            "message": f"Vérification {review.status.lower()}e avec succès",
            "status": review.status
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reviewing verification: {str(e)}")


@app.get("/api/v1/admin/verification/pending")
async def get_pending_verifications(admin_id: str = CurrentUser):
    """
    [ADMIN] Récupérer toutes les vérifications en attente
    TODO: Ajouter vérification des droits admin
    """
    try:
        query = "SELECT * FROM v_pending_verifications"
        results = db.execute_query(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============================================================================
# 🏆 BADGES ENDPOINTS
# ============================================================================

@app.get("/api/v1/badges", response_model=List[Badge])
async def get_all_badges():
    """Récupérer tous les badges disponibles"""
    try:
        query = """
        SELECT 
            id, name, description, icon, color, rarity, category, requirement_description
        FROM badges
        ORDER BY 
            CASE rarity
                WHEN 'LEGENDARY' THEN 1
                WHEN 'EPIC' THEN 2
                WHEN 'RARE' THEN 3
                WHEN 'COMMON' THEN 4
            END,
            name
        """
        badges_data = db.execute_query(query)
        return badges_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/v1/users/{user_id}/badges", response_model=List[UserBadge])
async def get_user_badges(user_id: str, current_user_id: str = CurrentUser):
    """Récupérer les badges d'un utilisateur"""
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other user's badges")
    
    try:
        query = """
        SELECT 
            ub.id,
            ub.user_id,
            ub.badge_id,
            ub.earned_at,
            ub.progress,
            b.name AS badge_name,
            b.description AS badge_description,
            b.icon AS badge_icon,
            b.color AS badge_color,
            b.rarity AS badge_rarity,
            b.category AS badge_category
        FROM user_badges ub
        LEFT JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = :user_id
        ORDER BY ub.earned_at DESC
        """
        badges_data = db.execute_query(query, {"user_id": user_id})
        return badges_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/v1/users/{user_id}/badges/{badge_id}")
async def award_badge(user_id: str, badge_id: str, current_user_id: str = CurrentUser):
    """Attribuer un badge à un utilisateur (attribution automatique)"""
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Vérifier si le badge existe
        badge_query = "SELECT id FROM badges WHERE id = :badge_id"
        badge_exists = db.execute_query(badge_query, {"badge_id": badge_id})
        
        if not badge_exists:
            raise HTTPException(status_code=404, detail="Badge not found")
        
        # Vérifier si l'utilisateur a déjà ce badge
        check_query = """
        SELECT id FROM user_badges 
        WHERE user_id = :user_id AND badge_id = :badge_id
        """
        already_has = db.execute_query(check_query, {"user_id": user_id, "badge_id": badge_id})
        
        if already_has:
            return {"message": "User already has this badge", "badge_id": badge_id}
        
        # Attribuer le badge
        import uuid
        badge_award_id = f"ub-{uuid.uuid4()}"
        
        insert_query = """
        INSERT INTO user_badges (id, user_id, badge_id, earned_at)
        VALUES (:id, :user_id, :badge_id, CURRENT_TIMESTAMP())
        """
        db.execute_query(insert_query, {
            "id": badge_award_id,
            "user_id": user_id,
            "badge_id": badge_id
        })
        
        # Récupérer les détails du badge pour le retour
        badge_details_query = """
        SELECT 
            ub.id,
            ub.user_id,
            ub.badge_id,
            ub.earned_at,
            ub.progress,
            b.name AS badge_name,
            b.description AS badge_description,
            b.icon AS badge_icon,
            b.color AS badge_color,
            b.rarity AS badge_rarity,
            b.category AS badge_category
        FROM user_badges ub
        LEFT JOIN badges b ON ub.badge_id = b.id
        WHERE ub.id = :id
        """
        badge_details = db.execute_query(badge_details_query, {"id": badge_award_id})
        
        if badge_details:
            return {
                "message": "Badge awarded successfully!",
                "badge": badge_details[0]
            }
        
        return {"message": "Badge awarded", "badge_id": badge_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def check_and_award_badges(user_id: str):
    """
    Fonction helper pour vérifier et attribuer automatiquement des badges
    basés sur les actions de l'utilisateur
    """
    try:
        # Récupérer les stats de l'utilisateur
        stats_query = """
        SELECT 
            COUNT(CASE WHEN creator_id = :user_id THEN 1 END) as total_published,
            COUNT(CASE WHEN picker_id = :user_id AND status = 'COMPLETED' THEN 1 END) as total_completed,
            COALESCE(u.credits, 0) as total_credits
        FROM rides
        LEFT JOIN users u ON u.id = :user_id
        WHERE creator_id = :user_id OR picker_id = :user_id
        """
        stats = db.execute_query(stats_query, {"user_id": user_id})
        
        if not stats:
            return
        
        stat = stats[0]
        total_published = stat.get("total_published", 0)
        total_completed = stat.get("total_completed", 0)
        total_credits = stat.get("total_credits", 0)
        
        # Badges à attribuer basés sur les conditions
        badges_to_award = []
        
        # Activity badges
        if total_published >= 1:
            badges_to_award.append("badge-first-ride")
        if total_published >= 5:
            badges_to_award.append("badge-5-rides")
        if total_published >= 25:
            badges_to_award.append("badge-serial-publisher")
        if total_published >= 100:
            badges_to_award.append("badge-100-rides")
        
        # Milestone badges
        if total_completed >= 100:
            badges_to_award.append("badge-100-completed")
        if total_credits >= 1000:
            badges_to_award.append("badge-1000-credits")
        
        # Attribuer les badges qui ne sont pas déjà possédés
        for badge_id in badges_to_award:
            try:
                # Vérifier si déjà possédé
                check_query = """
                SELECT id FROM user_badges 
                WHERE user_id = :user_id AND badge_id = :badge_id
                """
                already_has = db.execute_query(check_query, {"user_id": user_id, "badge_id": badge_id})
                
                if not already_has:
                    # Attribuer
                    import uuid
                    badge_award_id = f"ub-{uuid.uuid4()}"
                    insert_query = """
                    INSERT INTO user_badges (id, user_id, badge_id, earned_at)
                    VALUES (:id, :user_id, :badge_id, CURRENT_TIMESTAMP())
                    """
                    db.execute_query(insert_query, {
                        "id": badge_award_id,
                        "user_id": user_id,
                        "badge_id": badge_id
                    })
                    print(f"✅ Badge '{badge_id}' awarded to user {user_id}")
            except Exception as e:
                print(f"⚠️ Error awarding badge {badge_id}: {str(e)}")
                continue
    
    except Exception as e:
        print(f"⚠️ Error checking badges for user {user_id}: {str(e)}")


# ============================================================================
# PERSONAL RIDES ROUTES (Enregistrement courses externes)
# ============================================================================

@app.post("/api/v1/personal-rides")
async def create_personal_ride(
    ride_data: CreatePersonalRideRequest,
    current_user_id: str = CurrentUser
):
    """
    Créer une nouvelle course personnelle (Uber, Bolt, Direct Client, etc.)
    """
    try:
        import uuid
        ride_id = f"pr-{uuid.uuid4()}"
        
        # Valider le source
        valid_sources = ["UBER", "BOLT", "DIRECT_CLIENT", "MARKETPLACE", "OTHER"]
        if ride_data.source not in valid_sources:
            raise HTTPException(
                status_code=400, 
                detail=f"Source must be one of: {', '.join(valid_sources)}"
            )
        
        # Valider le status
        valid_statuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
        if ride_data.status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Status must be one of: {', '.join(valid_statuses)}"
            )
        
        query = """
        INSERT INTO io_catalog.corail.personal_rides (
            id, driver_id, source,
            pickup_address, dropoff_address,
            scheduled_at, price_cents, distance_km, duration_minutes,
            client_name, client_phone, notes,
            status, created_at, updated_at
        ) VALUES (
            :id, :driver_id, :source,
            :pickup_address, :dropoff_address,
            :scheduled_at, :price_cents, :distance_km, :duration_minutes,
            :client_name, :client_phone, :notes,
            :status, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
        )
        """
        
        db.execute_non_query(query, {
            "id": ride_id,
            "driver_id": current_user_id,
            "source": ride_data.source,
            "pickup_address": ride_data.pickup_address,
            "dropoff_address": ride_data.dropoff_address,
            "scheduled_at": ride_data.scheduled_at,
            "price_cents": ride_data.price_cents,
            "distance_km": ride_data.distance_km,
            "duration_minutes": ride_data.duration_minutes,
            "client_name": ride_data.client_name,
            "client_phone": ride_data.client_phone,
            "notes": ride_data.notes,
            "status": ride_data.status,
        })
        
        # Récupérer la course créée
        get_query = "SELECT * FROM io_catalog.corail.personal_rides WHERE id = :id"
        result = db.execute_query(get_query, {"id": ride_id})
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to retrieve created ride")
        
        return PersonalRide(**result[0])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/v1/personal-rides/stats/summary")
async def get_personal_rides_stats(current_user_id: str = CurrentUser):
    """
    Récupérer les statistiques des courses personnelles du chauffeur
    (revenus, nombre de courses, distance, par source)
    """
    try:
        query = """
        SELECT 
            source,
            COUNT(*) as total_rides,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_rides,
            SUM(CASE WHEN status = 'COMPLETED' THEN price_cents ELSE 0 END) / 100.0 as revenue_eur,
            SUM(CASE WHEN status = 'COMPLETED' THEN distance_km ELSE 0 END) as total_distance_km,
            AVG(CASE WHEN status = 'COMPLETED' THEN price_cents ELSE NULL END) / 100.0 as avg_price_eur
        FROM io_catalog.corail.personal_rides
        WHERE driver_id = :driver_id
        GROUP BY source
        ORDER BY revenue_eur DESC
        """
        
        results = db.execute_query(query, {"driver_id": current_user_id})
        
        # Calculer les totaux globaux
        total_query = """
        SELECT 
            COUNT(*) as total_rides,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_rides,
            SUM(CASE WHEN status = 'COMPLETED' THEN price_cents ELSE 0 END) / 100.0 as total_revenue_eur,
            SUM(CASE WHEN status = 'COMPLETED' THEN distance_km ELSE 0 END) as total_distance_km
        FROM io_catalog.corail.personal_rides
        WHERE driver_id = :driver_id
        """
        
        total_results = db.execute_query(total_query, {"driver_id": current_user_id})
        
        return {
            "by_source": results,
            "totals": total_results[0] if total_results else {}
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/v1/personal-rides")
async def list_personal_rides(
    current_user_id: str = CurrentUser,
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    limit: int = Query(100, le=500)
):
    """
    Liste toutes les courses personnelles du chauffeur connecté
    Filtres optionnels: status, source
    """
    try:
        filters = ["driver_id = :driver_id"]
        params = {"driver_id": current_user_id}
        
        if status:
            filters.append("status = :status")
            params["status"] = status
        
        if source:
            filters.append("source = :source")
            params["source"] = source
        
        where_clause = " AND ".join(filters)
        
        query = f"""
        SELECT * FROM io_catalog.corail.personal_rides
        WHERE {where_clause}
        ORDER BY 
            CASE 
                WHEN scheduled_at IS NOT NULL THEN scheduled_at
                WHEN completed_at IS NOT NULL THEN completed_at
                ELSE created_at
            END DESC
        LIMIT :limit
        """
        
        params["limit"] = limit
        results = db.execute_query(query, params)
        
        return [PersonalRide(**row) for row in results]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/v1/personal-rides/{ride_id}")
async def get_personal_ride(ride_id: str, current_user_id: str = CurrentUser):
    """Récupérer les détails d'une course personnelle"""
    try:
        query = """
        SELECT * FROM io_catalog.corail.personal_rides
        WHERE id = :ride_id AND driver_id = :driver_id
        """
        result = db.execute_query(query, {"ride_id": ride_id, "driver_id": current_user_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Ride not found")
        
        return PersonalRide(**result[0])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.put("/api/v1/personal-rides/{ride_id}")
async def update_personal_ride(
    ride_id: str,
    ride_data: UpdatePersonalRideRequest,
    current_user_id: str = CurrentUser
):
    """Mettre à jour une course personnelle"""
    try:
        # Vérifier que la course existe et appartient au chauffeur
        check_query = """
        SELECT id FROM io_catalog.corail.personal_rides
        WHERE id = :ride_id AND driver_id = :driver_id
        """
        existing = db.execute_query(check_query, {"ride_id": ride_id, "driver_id": current_user_id})
        
        if not existing:
            raise HTTPException(status_code=404, detail="Ride not found")
        
        # Construire la requête UPDATE dynamiquement
        update_fields = []
        params = {"ride_id": ride_id, "driver_id": current_user_id}
        
        if ride_data.source is not None:
            update_fields.append("source = :source")
            params["source"] = ride_data.source
        
        if ride_data.pickup_address is not None:
            update_fields.append("pickup_address = :pickup_address")
            params["pickup_address"] = ride_data.pickup_address
        
        if ride_data.dropoff_address is not None:
            update_fields.append("dropoff_address = :dropoff_address")
            params["dropoff_address"] = ride_data.dropoff_address
        
        if ride_data.scheduled_at is not None:
            update_fields.append("scheduled_at = :scheduled_at")
            params["scheduled_at"] = ride_data.scheduled_at
        
        if ride_data.started_at is not None:
            update_fields.append("started_at = :started_at")
            params["started_at"] = ride_data.started_at
        
        if ride_data.completed_at is not None:
            update_fields.append("completed_at = :completed_at")
            params["completed_at"] = ride_data.completed_at
        
        if ride_data.price_cents is not None:
            update_fields.append("price_cents = :price_cents")
            params["price_cents"] = ride_data.price_cents
        
        if ride_data.distance_km is not None:
            update_fields.append("distance_km = :distance_km")
            params["distance_km"] = ride_data.distance_km
        
        if ride_data.duration_minutes is not None:
            update_fields.append("duration_minutes = :duration_minutes")
            params["duration_minutes"] = ride_data.duration_minutes
        
        if ride_data.client_name is not None:
            update_fields.append("client_name = :client_name")
            params["client_name"] = ride_data.client_name
        
        if ride_data.client_phone is not None:
            update_fields.append("client_phone = :client_phone")
            params["client_phone"] = ride_data.client_phone
        
        if ride_data.notes is not None:
            update_fields.append("notes = :notes")
            params["notes"] = ride_data.notes
        
        if ride_data.status is not None:
            update_fields.append("status = :status")
            params["status"] = ride_data.status
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Toujours mettre à jour updated_at
        update_fields.append("updated_at = CURRENT_TIMESTAMP()")
        
        query = f"""
        UPDATE io_catalog.corail.personal_rides
        SET {', '.join(update_fields)}
        WHERE id = :ride_id AND driver_id = :driver_id
        """
        
        db.execute_non_query(query, params)
        
        # Récupérer la course mise à jour
        get_query = """
        SELECT * FROM io_catalog.corail.personal_rides
        WHERE id = :ride_id AND driver_id = :driver_id
        """
        result = db.execute_query(get_query, {"ride_id": ride_id, "driver_id": current_user_id})
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated ride")
        
        return PersonalRide(**result[0])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/api/v1/personal-rides/{ride_id}")
async def delete_personal_ride(ride_id: str, current_user_id: str = CurrentUser):
    """Supprimer une course personnelle"""
    try:
        # Vérifier que la course existe et appartient au chauffeur
        check_query = """
        SELECT id FROM io_catalog.corail.personal_rides
        WHERE id = :ride_id AND driver_id = :driver_id
        """
        existing = db.execute_query(check_query, {"ride_id": ride_id, "driver_id": current_user_id})
        
        if not existing:
            raise HTTPException(status_code=404, detail="Ride not found")
        
        # Supprimer la course
        delete_query = """
        DELETE FROM io_catalog.corail.personal_rides
        WHERE id = :ride_id AND driver_id = :driver_id
        """
        db.execute_non_query(delete_query, {"ride_id": ride_id, "driver_id": current_user_id})
        
        return {"message": "Ride deleted successfully", "ride_id": ride_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============================================================================
# PLANNING & NOTIFICATIONS
# ============================================================================

class PlanningEvent(BaseModel):
    id: Optional[str] = None
    driver_id: Optional[str] = None
    event_type: str  # 'RIDE', 'BREAK', 'MAINTENANCE', 'PERSONAL'
    ride_id: Optional[str] = None
    ride_source: Optional[str] = None
    start_time: str  # ISO format
    end_time: str
    estimated_duration_minutes: Optional[int] = None
    start_address: Optional[str] = None
    end_address: Optional[str] = None
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None
    end_lat: Optional[float] = None
    end_lng: Optional[float] = None
    status: Optional[str] = "SCHEDULED"
    notes: Optional[str] = None
    color: Optional[str] = "#6366f1"

class NotificationPreferences(BaseModel):
    reminder_30min: bool = True
    reminder_1h: bool = False
    reminder_custom_minutes: int = 15
    reminder_custom_enabled: bool = False
    notify_ride_start: bool = True
    notify_ride_completion: bool = True
    notify_conflicts: bool = True
    notify_marketplace_opportunities: bool = True
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"

# Get planning events
@app.get("/api/v1/planning/events")
async def get_planning_events(
    start_date: Optional[str] = None,  # YYYY-MM-DD
    end_date: Optional[str] = None,
    event_type: Optional[str] = None,
    current_user_id: str = CurrentUser
):
    """Récupérer les événements du planning"""
    try:
        query = f"""
        SELECT 
          id, driver_id, event_type, ride_id, ride_source,
          start_time, end_time, estimated_duration_minutes,
          start_address, end_address,
          start_lat, start_lng, end_lat, end_lng,
          status, notes, color
        FROM io_catalog.corail.planning_events
        WHERE driver_id = '{current_user_id}'
        """
        
        if start_date:
            query += f" AND start_time >= '{start_date} 00:00:00'"
        if end_date:
            query += f" AND start_time <= '{end_date} 23:59:59'"
        if event_type:
            query += f" AND event_type = '{event_type}'"
        
        query += " ORDER BY start_time ASC"
        
        result = await db.fetch_all(query)
        return [dict(row) for row in result]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Create planning event
@app.post("/api/v1/planning/events")
async def create_planning_event(
    event: PlanningEvent,
    current_user_id: str = CurrentUser
):
    """Créer un événement de planning"""
    try:
        from uuid import uuid4
        
        event_id = f"pe-{uuid4()}"
        
        # Vérifier les conflits
        conflicts_query = f"""
        SELECT id, start_time, end_time, start_address, end_address
        FROM io_catalog.corail.planning_events
        WHERE driver_id = '{current_user_id}'
          AND status IN ('SCHEDULED', 'IN_PROGRESS')
          AND (
            (start_time <= '{event.start_time}' AND end_time > '{event.start_time}')
            OR
            (start_time < '{event.end_time}' AND end_time >= '{event.end_time}')
            OR
            (start_time >= '{event.start_time}' AND end_time <= '{event.end_time}')
          )
        """
        
        conflicts = await db.fetch_all(conflicts_query)
        
        if conflicts:
            return {
                "success": False,
                "conflicts": [dict(row) for row in conflicts],
                "message": "Conflit détecté avec une autre course"
            }
        
        query = f"""
        INSERT INTO io_catalog.corail.planning_events
        (id, driver_id, event_type, ride_id, ride_source,
         start_time, end_time, estimated_duration_minutes,
         start_address, end_address,
         start_lat, start_lng, end_lat, end_lng,
         status, notification_30min_sent, notification_1h_sent, notification_custom_sent,
         notes, color, created_at, updated_at)
        VALUES (
          '{event_id}',
          '{current_user_id}',
          '{event.event_type}',
          '{event.ride_id or ""}',
          '{event.ride_source or ""}',
          '{event.start_time}',
          '{event.end_time}',
          {event.estimated_duration_minutes or 0},
          '{event.start_address or ""}',
          '{event.end_address or ""}',
          {event.start_lat or 0.0},
          {event.start_lng or 0.0},
          {event.end_lat or 0.0},
          {event.end_lng or 0.0},
          'SCHEDULED',
          FALSE, FALSE, FALSE,
          '{event.notes or ""}',
          '{event.color}',
          current_timestamp(),
          current_timestamp()
        )
        """
        
        await db.execute(query)
        
        return {"success": True, "event_id": event_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Update planning event
@app.put("/api/v1/planning/events/{event_id}")
async def update_planning_event(
    event_id: str,
    event: PlanningEvent,
    current_user_id: str = CurrentUser
):
    """Mettre à jour un événement"""
    try:
        query = f"""
        UPDATE io_catalog.corail.planning_events
        SET 
          start_time = '{event.start_time}',
          end_time = '{event.end_time}',
          estimated_duration_minutes = {event.estimated_duration_minutes or 0},
          start_address = '{event.start_address or ""}',
          end_address = '{event.end_address or ""}',
          status = '{event.status}',
          notes = '{event.notes or ""}',
          color = '{event.color}',
          updated_at = current_timestamp()
        WHERE id = '{event_id}' AND driver_id = '{current_user_id}'
        """
        
        await db.execute(query)
        return {"success": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Delete planning event
@app.delete("/api/v1/planning/events/{event_id}")
async def delete_planning_event(
    event_id: str,
    current_user_id: str = CurrentUser
):
    """Supprimer un événement"""
    try:
        query = f"""
        DELETE FROM io_catalog.corail.planning_events
        WHERE id = '{event_id}' AND driver_id = '{current_user_id}'
        """
        
        await db.execute(query)
        return {"success": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Check conflicts
@app.get("/api/v1/planning/conflicts")
async def check_conflicts(
    start_time: str,
    end_time: str,
    current_user_id: str = CurrentUser
):
    """Vérifier les conflits d'horaires"""
    try:
        query = f"""
        SELECT id, start_time, end_time, start_address, end_address, event_type
        FROM io_catalog.corail.planning_events
        WHERE driver_id = '{current_user_id}'
          AND status IN ('SCHEDULED', 'IN_PROGRESS')
          AND (
            (start_time <= '{start_time}' AND end_time > '{start_time}')
            OR
            (start_time < '{end_time}' AND end_time >= '{end_time}')
            OR
            (start_time >= '{start_time}' AND end_time <= '{end_time}')
          )
        """
        
        conflicts = await db.fetch_all(query)
        
        return {
            "has_conflicts": len(conflicts) > 0,
            "conflicts": [dict(row) for row in conflicts]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Get notification preferences
@app.get("/api/v1/notifications/preferences")
async def get_notification_preferences(
    current_user_id: str = CurrentUser
):
    """Récupérer les préférences de notification"""
    try:
        query = f"""
        SELECT * FROM io_catalog.corail.notification_preferences
        WHERE driver_id = '{current_user_id}'
        """
        
        result = await db.fetch_one(query)
        
        if not result:
            # Retourner préférences par défaut
            return {
                "reminder_30min": True,
                "reminder_1h": False,
                "reminder_custom_minutes": 15,
                "reminder_custom_enabled": False,
                "notify_ride_start": True,
                "notify_ride_completion": True,
                "notify_conflicts": True,
                "notify_marketplace_opportunities": True,
                "quiet_hours_enabled": False,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "07:00"
            }
        
        return dict(result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Update notification preferences
@app.put("/api/v1/notifications/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user_id: str = CurrentUser
):
    """Mettre à jour les préférences de notification"""
    try:
        from uuid import uuid4
        
        # Vérifier si existe déjà
        check_query = f"""
        SELECT id FROM io_catalog.corail.notification_preferences
        WHERE driver_id = '{current_user_id}'
        """
        
        existing = await db.fetch_one(check_query)
        
        if existing:
            # Update
            query = f"""
            UPDATE io_catalog.corail.notification_preferences
            SET 
              reminder_30min = {preferences.reminder_30min},
              reminder_1h = {preferences.reminder_1h},
              reminder_custom_minutes = {preferences.reminder_custom_minutes},
              reminder_custom_enabled = {preferences.reminder_custom_enabled},
              notify_ride_start = {preferences.notify_ride_start},
              notify_ride_completion = {preferences.notify_ride_completion},
              notify_conflicts = {preferences.notify_conflicts},
              notify_marketplace_opportunities = {preferences.notify_marketplace_opportunities},
              quiet_hours_enabled = {preferences.quiet_hours_enabled},
              quiet_hours_start = '{preferences.quiet_hours_start}',
              quiet_hours_end = '{preferences.quiet_hours_end}',
              updated_at = current_timestamp()
            WHERE driver_id = '{current_user_id}'
            """
        else:
            # Insert
            pref_id = f"np-{uuid4()}"
            query = f"""
            INSERT INTO io_catalog.corail.notification_preferences
            (id, driver_id,
             reminder_30min, reminder_1h, reminder_custom_minutes, reminder_custom_enabled,
             notify_ride_start, notify_ride_completion, notify_conflicts, notify_marketplace_opportunities,
             quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
             created_at, updated_at)
            VALUES (
              '{pref_id}',
              '{current_user_id}',
              {preferences.reminder_30min},
              {preferences.reminder_1h},
              {preferences.reminder_custom_minutes},
              {preferences.reminder_custom_enabled},
              {preferences.notify_ride_start},
              {preferences.notify_ride_completion},
              {preferences.notify_conflicts},
              {preferences.notify_marketplace_opportunities},
              {preferences.quiet_hours_enabled},
              '{preferences.quiet_hours_start}',
              '{preferences.quiet_hours_end}',
              current_timestamp(),
              current_timestamp()
            )
            """
        
        await db.execute(query)
        return {"success": True}
    
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

