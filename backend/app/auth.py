"""
Firebase Authentication Middleware
"""
import os
import json
from fastapi import Header, HTTPException, Depends
from firebase_admin import credentials, auth, initialize_app
from pathlib import Path
from typing import Optional

from .config import FIREBASE_CREDENTIALS_PATH

# Initialiser Firebase Admin SDK
_firebase_initialized = False

def init_firebase():
    """Initialise Firebase Admin SDK"""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    try:
        # Priorité 1 : Secret Databricks (depuis variable d'environnement)
        firebase_secret = os.getenv("FIREBASE_SECRET")
        if firebase_secret:
            # Le secret contient le JSON complet
            cred_dict = json.loads(firebase_secret)
            cred = credentials.Certificate(cred_dict)
            initialize_app(cred)
            _firebase_initialized = True
            print("✅ Firebase initialisé avec Databricks Secret")
            return
        
        # Priorité 2 : Fichier local (dev uniquement)
        if os.path.exists(FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            initialize_app(cred)
            _firebase_initialized = True
            print(f"✅ Firebase initialisé avec fichier local: {FIREBASE_CREDENTIALS_PATH}")
            return
        
        # Aucune credential trouvée
        print("⚠️ Firebase credentials non trouvées")
        print("   - Pas de variable FIREBASE_SECRET")
        print(f"   - Pas de fichier local: {FIREBASE_CREDENTIALS_PATH}")
        print("   L'app fonctionnera en mode dev sans auth")
        
    except json.JSONDecodeError as e:
        print(f"❌ Erreur parsing Firebase secret JSON: {e}")
        print("   L'app fonctionnera en mode dev sans auth")
    except Exception as e:
        print(f"❌ Erreur Firebase init: {e}")
        print("   L'app fonctionnera en mode dev sans auth")


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Vérifie le token Firebase et retourne le user_id
    
    En dev (sans Firebase configuré), retourne un user_id de test
    """
    # Mode dev sans Firebase
    if not _firebase_initialized:
        return "dev-user-001"
    
    # Vérifier le header Authorization
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )
    
    # Extraire le token
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Use: Bearer <token>"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Vérifier le token Firebase
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        return user_id
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token revoked"
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )


# Dependency pour les routes protégées
CurrentUser = Depends(get_current_user)

