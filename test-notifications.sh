#!/bin/bash

# ============================================================================
# Script de test interactif - Notifications Push
# ============================================================================
# Ce script vous guide à travers tous les tests de notifications
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}        🧪 TESTS NOTIFICATIONS PUSH - CORAIL APP           ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================================
# MENU PRINCIPAL
# ============================================================================

echo -e "${CYAN}Choisissez le test à effectuer :${NC}"
echo ""
echo "  1. 📊 Vérifier les tokens dans Supabase"
echo "  2. 🧪 Tester l'Edge Function (appel direct)"
echo "  3. 🔄 Tester via SQL (triggers)"
echo "  4. 📈 Voir les statistiques"
echo "  5. 🐛 Debugging (logs)"
echo "  6. 🚀 Test complet (tous les tests)"
echo "  0. ❌ Quitter"
echo ""
read -p "Votre choix (0-6) : " choice

case $choice in
  1) test_tokens ;;
  2) test_edge_function ;;
  3) test_sql ;;
  4) show_stats ;;
  5) show_logs ;;
  6) run_all_tests ;;
  0) exit 0 ;;
  *) echo -e "${RED}Choix invalide${NC}" && exit 1 ;;
esac

# ============================================================================
# TEST 1 : VÉRIFIER LES TOKENS
# ============================================================================

test_tokens() {
  clear
  echo -e "${GREEN}📊 Test 1 : Vérification des tokens dans Supabase${NC}"
  echo ""
  
  echo "Ce test nécessite d'accéder à Supabase Dashboard."
  echo ""
  echo -e "${YELLOW}Ouvrez Supabase Dashboard et exécutez cette requête SQL :${NC}"
  echo ""
  echo -e "${CYAN}SELECT id, user_id, LEFT(push_token, 30) as token_preview,"
  echo "       device_type, is_active, created_at"
  echo "FROM push_tokens"
  echo "ORDER BY created_at DESC"
  echo -e "LIMIT 10;${NC}"
  echo ""
  
  read -p "Appuyez sur Entrée après avoir vérifié..."
  
  echo ""
  echo -e "${GREEN}✅ Questions à vérifier :${NC}"
  echo "  [ ] Au moins 1 token existe"
  echo "  [ ] is_active = true"
  echo "  [ ] Token commence par 'ExponentPushToken[' ou 'ExpoPushToken['"
  echo "  [ ] created_at récent"
  echo ""
  
  read -p "Tous les checks passent ? (o/n) : " check
  
  if [ "$check" = "o" ]; then
    echo -e "${GREEN}✅ Test 1 : RÉUSSI${NC}"
  else
    echo -e "${RED}❌ Test 1 : ÉCHOUÉ${NC}"
    echo ""
    echo "Solutions possibles :"
    echo "  1. Ouvrez l'app mobile et connectez-vous"
    echo "  2. Acceptez les permissions notifications"
    echo "  3. Vérifiez les logs Metro : npx react-native log-ios"
  fi
  
  pause_and_menu
}

# ============================================================================
# TEST 2 : EDGE FUNCTION
# ============================================================================

test_edge_function() {
  clear
  echo -e "${GREEN}🧪 Test 2 : Test de l'Edge Function${NC}"
  echo ""
  
  # Configuration
  read -p "Project ID Supabase : " PROJECT_ID
  read -p "Anon Key : " ANON_KEY
  
  echo ""
  echo "Récupérer un token depuis Supabase :"
  echo -e "${CYAN}SELECT push_token FROM push_tokens WHERE is_active = true LIMIT 1;${NC}"
  echo ""
  read -p "Push Token : " PUSH_TOKEN
  
  if [ -z "$PROJECT_ID" ] || [ -z "$ANON_KEY" ] || [ -z "$PUSH_TOKEN" ]; then
    echo -e "${RED}❌ Informations manquantes${NC}"
    pause_and_menu
    return
  fi
  
  FUNCTION_URL="https://$PROJECT_ID.supabase.co/functions/v1/send-push"
  
  echo ""
  echo -e "${YELLOW}Envoi de la notification test...${NC}"
  echo ""
  
  RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"tokens\": [\"$PUSH_TOKEN\"],
      \"title\": \"Test Script 🧪\",
      \"body\": \"Notification envoyée depuis le script de test\",
      \"data\": {\"type\": \"test\", \"timestamp\": \"$(date +%s)\"}
    }")
  
  echo "Réponse de l'API :"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  echo ""
  
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test 2 : RÉUSSI${NC}"
    echo ""
    echo "Vérifiez votre téléphone, vous devriez recevoir une notification !"
  else
    echo -e "${RED}❌ Test 2 : ÉCHOUÉ${NC}"
    echo ""
    echo "Solutions possibles :"
    echo "  1. Vérifier que l'Edge Function est déployée : supabase functions list"
    echo "  2. Vérifier les secrets : Dashboard > Edge Functions > send-push > Secrets"
    echo "  3. Vérifier les logs : supabase functions logs send-push"
  fi
  
  pause_and_menu
}

# ============================================================================
# TEST 3 : SQL TRIGGERS
# ============================================================================

test_sql() {
  clear
  echo -e "${GREEN}🔄 Test 3 : Test des triggers SQL${NC}"
  echo ""
  
  echo "Ce test simule une course prise via SQL pour déclencher un trigger."
  echo ""
  echo -e "${YELLOW}Étape 1 : Créer une course test${NC}"
  echo ""
  echo -e "${CYAN}INSERT INTO rides (creator_id, pickup_address, dropoff_address,"
  echo "                   scheduled_at, price_cents, status, visibility)"
  echo "VALUES ('USER_A_ID', 'Paris CDG', 'Paris Centre',"
  echo "        NOW() + INTERVAL '1 day', 10000, 'PUBLISHED', 'PUBLIC')"
  echo -e "RETURNING id;${NC}"
  echo ""
  
  read -p "ID de la course créée : " RIDE_ID
  
  if [ -z "$RIDE_ID" ]; then
    echo -e "${RED}❌ ID manquant${NC}"
    pause_and_menu
    return
  fi
  
  echo ""
  echo -e "${YELLOW}Étape 2 : Simuler que quelqu'un prend la course${NC}"
  echo ""
  echo -e "${CYAN}UPDATE rides"
  echo "SET status = 'CLAIMED', picker_id = 'USER_B_ID'"
  echo "WHERE id = '$RIDE_ID'"
  echo -e "  AND status = 'PUBLISHED';${NC}"
  echo ""
  
  read -p "Appuyez sur Entrée après avoir exécuté la requête..."
  
  echo ""
  echo -e "${YELLOW}Étape 3 : Vérifier que la notification est partie${NC}"
  echo ""
  echo -e "${CYAN}SELECT status_code, content::text, created_at"
  echo "FROM net._http_response"
  echo "ORDER BY created_at DESC"
  echo -e "LIMIT 1;${NC}"
  echo ""
  
  read -p "Status code reçu (ex: 200) : " STATUS_CODE
  
  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Test 3 : RÉUSSI${NC}"
    echo ""
    echo "Le trigger a fonctionné ! L'utilisateur devrait avoir reçu une notification."
  else
    echo -e "${RED}❌ Test 3 : ÉCHOUÉ${NC}"
    echo ""
    echo "Solutions possibles :"
    echo "  1. Vérifier que pg_net est activé : SELECT * FROM pg_extension WHERE extname = 'pg_net';"
    echo "  2. Vérifier que les triggers sont actifs (voir ACTIVATE_NOTIFICATION_TRIGGERS.sql)"
    echo "  3. Vérifier l'URL dans call_send_push_function (remplacer YOUR_PROJECT_ID)"
    echo "  4. Vérifier l'Anon Key : ALTER DATABASE postgres SET app.settings.supabase_anon_key = '...';"
  fi
  
  pause_and_menu
}

# ============================================================================
# STATISTIQUES
# ============================================================================

show_stats() {
  clear
  echo -e "${GREEN}📈 Statistiques notifications${NC}"
  echo ""
  
  echo "Exécutez ces requêtes dans Supabase SQL Editor :"
  echo ""
  
  echo -e "${CYAN}-- Tokens actifs par plateforme${NC}"
  echo "SELECT device_type, COUNT(*) as total,"
  echo "       COUNT(*) FILTER (WHERE is_active = true) as active"
  echo "FROM push_tokens"
  echo "GROUP BY device_type;"
  echo ""
  
  echo -e "${CYAN}-- Notifications envoyées aujourd'hui${NC}"
  echo "SELECT COUNT(*) as total,"
  echo "       COUNT(*) FILTER (WHERE status_code = 200) as success"
  echo "FROM net._http_response"
  echo "WHERE created_at > CURRENT_DATE;"
  echo ""
  
  echo -e "${CYAN}-- Dernières notifications${NC}"
  echo "SELECT status_code, created_at"
  echo "FROM net._http_response"
  echo "ORDER BY created_at DESC"
  echo "LIMIT 5;"
  echo ""
  
  pause_and_menu
}

# ============================================================================
# LOGS
# ============================================================================

show_logs() {
  clear
  echo -e "${GREEN}🐛 Debugging - Logs${NC}"
  echo ""
  
  echo -e "${CYAN}Choisissez les logs à voir :${NC}"
  echo ""
  echo "  1. Logs Edge Function (supabase)"
  echo "  2. Logs Metro (React Native)"
  echo "  3. Logs iOS (device)"
  echo "  4. Logs SQL (pg_net)"
  echo "  0. Retour"
  echo ""
  read -p "Votre choix : " log_choice
  
  case $log_choice in
    1)
      echo ""
      echo "Commande pour voir les logs en temps réel :"
      echo -e "${YELLOW}supabase functions logs send-push --follow${NC}"
      ;;
    2)
      echo ""
      echo "Commande pour voir les logs Metro :"
      echo -e "${YELLOW}npx react-native start${NC}"
      ;;
    3)
      echo ""
      echo "Commande pour voir les logs iOS :"
      echo -e "${YELLOW}npx react-native log-ios${NC}"
      ;;
    4)
      echo ""
      echo "Requête SQL pour voir les logs pg_net :"
      echo -e "${CYAN}SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;${NC}"
      ;;
  esac
  
  echo ""
  pause_and_menu
}

# ============================================================================
# TEST COMPLET
# ============================================================================

run_all_tests() {
  clear
  echo -e "${GREEN}🚀 Test complet${NC}"
  echo ""
  echo "Ce mode va exécuter tous les tests dans l'ordre."
  echo ""
  read -p "Continuer ? (o/n) : " confirm
  
  if [ "$confirm" != "o" ]; then
    main_menu
    return
  fi
  
  test_tokens
  test_edge_function
  test_sql
  show_stats
  
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}                    ✅ TESTS TERMINÉS                        ${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Consultez GUIDE_TESTS_NOTIFICATIONS.md pour plus de détails."
  echo ""
}

# ============================================================================
# UTILITAIRES
# ============================================================================

pause_and_menu() {
  echo ""
  read -p "Appuyez sur Entrée pour revenir au menu..."
  main_menu
}

main_menu() {
  exec "$0"
}

# ============================================================================
# AIDE
# ============================================================================

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Usage: ./test-notifications.sh"
  echo ""
  echo "Script interactif pour tester les notifications push."
  echo ""
  echo "Tests disponibles :"
  echo "  1. Vérifier les tokens dans Supabase"
  echo "  2. Tester l'Edge Function"
  echo "  3. Tester les triggers SQL"
  echo "  4. Voir les statistiques"
  echo "  5. Voir les logs"
  echo "  6. Test complet"
  echo ""
  echo "Documentation complète : GUIDE_TESTS_NOTIFICATIONS.md"
  exit 0
fi

