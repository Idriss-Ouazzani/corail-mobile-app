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

def get_firebase_credentials_from_env() -> Optional[str]:
    """
    Lit les credentials Firebase depuis la variable d'environnement
    (Utilisé sur Render.com)
    """
    try:
        firebase_secret = os.getenv("FIREBASE_SECRET")
        if firebase_secret:
            print(f"✅ FIREBASE_SECRET trouvé dans env vars, longueur: {len(firebase_secret)}")
            return firebase_secret
        print("⚠️ Variable FIREBASE_SECRET non trouvée")
        return None
    except Exception as e:
        print(f"⚠️ Erreur lecture FIREBASE_SECRET: {e}")
        return None

def init_firebase():
    """Initialise Firebase Admin SDK"""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    print("🔥 Initialisation Firebase...")
    
    try:
        # Priorité 1 : Variable d'environnement FIREBASE_SECRET (Render.com)
        print("📍 Tentative 1: Lecture depuis variable d'environnement FIREBASE_SECRET")
        firebase_secret_json = get_firebase_credentials_from_env()
        
        if firebase_secret_json:
            try:
                cred_dict = json.loads(firebase_secret_json)
                cred = credentials.Certificate(cred_dict)
                initialize_app(cred)
                _firebase_initialized = True
                print("✅ Firebase initialisé avec FIREBASE_SECRET (Render)")
                return
            except json.JSONDecodeError as e:
                print(f"❌ Erreur parsing JSON du secret: {e}")
                print(f"   Contenu (premiers 100 chars): {firebase_secret_json[:100]}")
        
        # Priorité 2 : Fichier secret (Render Secret Files ou local)
        print("📍 Tentative 2: Fichier credentials")
        if os.path.exists(FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            initialize_app(cred)
            _firebase_initialized = True
            print(f"✅ Firebase initialisé avec fichier: {FIREBASE_CREDENTIALS_PATH}")
            return
        
        # Aucune credential trouvée
        print("⚠️ Firebase credentials non trouvées")
        print(f"   - Variable FIREBASE_SECRET: Non trouvée")
        print(f"   - Fichier {FIREBASE_CREDENTIALS_PATH}: Non trouvé")
        print("   ⚠️ L'app fonctionnera en mode dev sans auth")
        
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
    print(f"🔍 [AUTH] Firebase initialized: {_firebase_initialized}")
    print(f"🔍 [AUTH] Authorization header: {authorization[:50] if authorization else 'None'}...")
    
    # Mode dev sans Firebase
    if not _firebase_initialized:
        print("⚠️ [AUTH] Mode dev - pas d'auth Firebase")
        return "dev-user-001"
    
    # Vérifier le header Authorization
    if not authorization:
        print("❌ [AUTH] Header Authorization manquant")
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )
    
    # Extraire le token
    if not authorization.startswith("Bearer "):
        print(f"❌ [AUTH] Format invalide: {authorization[:50]}")
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Use: Bearer <token>"
        )
    
    token = authorization.replace("Bearer ", "")
    print(f"🔍 [AUTH] Token reçu, longueur: {len(token)}")
    
    try:
        # Vérifier le token Firebase
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        print(f"✅ [AUTH] Token valide, user_id: {user_id}")
        return user_id
    except auth.ExpiredIdTokenError:
        print("❌ [AUTH] Token expiré")
        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )
    except auth.RevokedIdTokenError:
        print("❌ [AUTH] Token révoqué")
        raise HTTPException(
            status_code=401,
            detail="Token revoked"
        )
    except Exception as e:
        print(f"❌ [AUTH] Erreur validation token: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )


# Dependency pour les routes protégées
CurrentUser = Depends(get_current_user)

