#!/bin/bash

# ============================================================================
# Script de test pour l'Edge Function send-push
# ============================================================================
# Usage: ./test.sh [project-id] [anon-key] [expo-token]
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🧪 Test Edge Function send-push${NC}"
echo ""

# ============================================================================
# Configuration
# ============================================================================

PROJECT_ID="${1:-YOUR_PROJECT_ID}"
ANON_KEY="${2:-YOUR_ANON_KEY}"
EXPO_TOKEN="${3:-ExponentPushToken[test]}"

if [ "$PROJECT_ID" = "YOUR_PROJECT_ID" ]; then
    echo -e "${YELLOW}Usage: ./test.sh [project-id] [anon-key] [expo-token]${NC}"
    echo ""
    read -p "Project ID: " PROJECT_ID
    read -p "Anon Key: " ANON_KEY
    read -p "Expo Token (ou 'test' pour simuler): " EXPO_TOKEN
fi

FUNCTION_URL="https://$PROJECT_ID.supabase.co/functions/v1/send-push"

echo "URL: $FUNCTION_URL"
echo "Token: ${EXPO_TOKEN:0:30}..."
echo ""

# ============================================================================
# Test 1: Notification simple
# ============================================================================

echo -e "${YELLOW}Test 1: Notification simple${NC}"

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"tokens\": [\"$EXPO_TOKEN\"],
    \"title\": \"Test 🧪\",
    \"body\": \"Ceci est un test de notification push depuis le script\"
  }")

echo "Réponse : $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test 1 réussi${NC}"
else
    echo -e "${RED}❌ Test 1 échoué${NC}"
fi

echo ""

# ============================================================================
# Test 2: Notification avec données custom
# ============================================================================

echo -e "${YELLOW}Test 2: Notification avec données custom${NC}"

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"tokens\": [\"$EXPO_TOKEN\"],
    \"title\": \"Course prise 🎉\",
    \"body\": \"Jean Dupont a pris votre course (Paris CDG)\",
    \"data\": {
      \"type\": \"ride_claimed\",
      \"ride_id\": \"test-123\"
    }
  }")

echo "Réponse : $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test 2 réussi${NC}"
else
    echo -e "${RED}❌ Test 2 échoué${NC}"
fi

echo ""

# ============================================================================
# Test 3: Multiple tokens
# ============================================================================

echo -e "${YELLOW}Test 3: Multiple tokens${NC}"

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"tokens\": [\"$EXPO_TOKEN\", \"ExponentPushToken[test2]\"],
    \"title\": \"Broadcast 📢\",
    \"body\": \"Message à plusieurs appareils\"
  }")

echo "Réponse : $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test 3 réussi${NC}"
else
    echo -e "${RED}❌ Test 3 échoué${NC}"
fi

echo ""

# ============================================================================
# Résumé
# ============================================================================

echo -e "${GREEN}🎉 Tests terminés${NC}"
echo ""
echo "Vérifiez votre appareil mobile pour voir si les notifications sont arrivées."
echo ""
echo "Logs de l'Edge Function :"
echo "  supabase functions logs send-push"
echo ""

