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

def get_databricks_secret_via_sdk(scope: str, key: str) -> Optional[str]:
    """
    Lit un secret Databricks via le SDK
    Utilise l'authentification automatique dans Databricks Apps
    """
    try:
        from databricks.sdk import WorkspaceClient
        
        # Dans Databricks Apps, l'authentification est automatique
        w = WorkspaceClient()
        
        print(f"🔍 Tentative de lecture du secret: {scope}/{key}")
        
        # Utiliser l'API Secrets
        secret_response = w.secrets.get_secret(scope=scope, key=key)
        
        # Le secret est dans l'attribut 'value'
        if hasattr(secret_response, 'value') and secret_response.value:
            secret_str = secret_response.value
            print(f"✅ Secret lu avec succès via SDK, longueur: {len(secret_str)}")
            return secret_str
        
        print(f"⚠️ Secret vide ou inaccessible: {scope}/{key}")
        print(f"   Response: {secret_response}")
        return None
        
    except ImportError as e:
        print(f"⚠️ databricks-sdk non disponible: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Erreur lecture secret {scope}/{key}: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None

def init_firebase():
    """Initialise Firebase Admin SDK"""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    print("🔥 Initialisation Firebase...")
    
    try:
        # Priorité 1 : Lire depuis Databricks Secret (App resources)
        print("📍 Tentative 1: Lecture depuis Databricks Secrets API")
        firebase_secret_json = get_databricks_secret_via_sdk("corail-firebase-app", "secret-firebase")
        
        if firebase_secret_json:
            try:
                cred_dict = json.loads(firebase_secret_json)
                cred = credentials.Certificate(cred_dict)
                initialize_app(cred)
                _firebase_initialized = True
                print("✅ Firebase initialisé avec Databricks Secret (sécurisé)")
                return
            except json.JSONDecodeError as e:
                print(f"❌ Erreur parsing JSON du secret: {e}")
                print(f"   Contenu (premiers 100 chars): {firebase_secret_json[:100]}")
        
        # Priorité 2 : Fichier local (dev uniquement)
        print("📍 Tentative 2: Fichier local")
        if os.path.exists(FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            initialize_app(cred)
            _firebase_initialized = True
            print(f"✅ Firebase initialisé avec fichier local: {FIREBASE_CREDENTIALS_PATH}")
            return
        
        # Aucune credential trouvée
        print("⚠️ Firebase credentials non trouvées")
        print("   - Secret Databricks non accessible")
        print(f"   - Pas de fichier local: {FIREBASE_CREDENTIALS_PATH}")
        print("   ⚠️ L'app fonctionnera en mode dev sans auth")
        print("   ⚠️ Tous les endpoints seront accessibles sans authentification")
        
    except Exception as e:
        print(f"❌ Erreur Firebase init: {e}")
        import traceback
        traceback.print_exc()
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

