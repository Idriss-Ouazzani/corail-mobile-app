"""
Databricks SQL Warehouse Connection
"""
from databricks import sql
from typing import List, Dict, Any
import os
from datetime import datetime

from .config import DATABRICKS_HOST, DATABRICKS_HTTP_PATH, DATABRICKS_TOKEN, CATALOG, SCHEMA


class DatabricksConnection:
    """Gestionnaire de connexion à Databricks SQL Warehouse"""
    
    def __init__(self):
        self.host = DATABRICKS_HOST
        self.http_path = DATABRICKS_HTTP_PATH
        self.token = DATABRICKS_TOKEN
        self.catalog = CATALOG
        self.schema = SCHEMA
    
    def execute_query(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Exécute une requête SQL et retourne les résultats
        """
        try:
            with sql.connect(
                server_hostname=self.host,
                http_path=self.http_path,
                access_token=self.token
            ) as connection:
                with connection.cursor() as cursor:
                    # Utiliser le bon catalog/schema
                    cursor.execute(f"USE CATALOG {self.catalog}")
                    cursor.execute(f"USE SCHEMA {self.schema}")
                    
                    # Exécuter la requête
                    cursor.execute(query, params or {})
                    
                    # Récupérer les résultats
                    columns = [desc[0] for desc in cursor.description] if cursor.description else []
                    rows = cursor.fetchall()
                    
                    # Convertir en liste de dictionnaires
                    results = [dict(zip(columns, row)) for row in rows]
                    
                    # Convertir les datetime en strings pour la sérialisation JSON
                    for result in results:
                        for key, value in result.items():
                            if isinstance(value, datetime):
                                result[key] = value.isoformat()
                    
                    return results
        
        except Exception as e:
            print(f"❌ Erreur Databricks query: {e}")
            raise
    
    def execute_non_query(self, query: str, params: Dict[str, Any] = None) -> int:
        """
        Exécute une requête INSERT/UPDATE/DELETE
        Retourne le nombre de lignes affectées
        """
        try:
            with sql.connect(
                server_hostname=self.host,
                http_path=self.http_path,
                access_token=self.token
            ) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(f"USE CATALOG {self.catalog}")
                    cursor.execute(f"USE SCHEMA {self.schema}")
                    cursor.execute(query, params or {})
                    return cursor.rowcount
        except Exception as e:
            print(f"❌ Erreur Databricks non-query: {e}")
            raise


# Instance globale
db = DatabricksConnection()

