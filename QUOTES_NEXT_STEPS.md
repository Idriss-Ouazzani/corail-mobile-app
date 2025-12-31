# 📋 Système de Devis VTC - Prochaines Étapes

## ✅ Ce qui a été fait

### 1. Base de données Supabase ✅
- ✅ Table `quotes` créée avec tous les champs nécessaires
- ✅ Champ `company_name` ajouté à la table `users`
- ✅ Fonctions SQL : `accept_quote`, `refuse_quote`, `mark_quote_viewed`
- ✅ Row Level Security configurée
- ✅ Token unique généré automatiquement pour chaque devis

**Fichier**: `supabase/migrations/004_quotes_system.sql`

### 2. Backend API ✅
- ✅ `createQuote()` - Créer un nouveau devis
- ✅ `listQuotes()` - Lister les devis du chauffeur
- ✅ `getQuote()` - Récupérer un devis spécifique
- ✅ `getQuoteByToken()` - Accès public au devis via token

**Fichiers**: 
- `src/services/supabaseApi.ts`
- `src/services/api.ts`

### 3. Écran Mobile ✅
Écran complet de création de devis avec :
- Formulaire client (nom, téléphone)
- Détails course (départ, arrivée, date, heure)
- Prix TTC
- Notes optionnelles
- Validation et envoi

**Fichier**: `src/screens/CreateQuoteScreen.tsx`

### 4. Documentation ✅
Guide complet pour créer l'application Next.js sur Vercel avec :
- Structure du projet
- Code des composants
- Configuration Supabase
- Déploiement Vercel
- Options SMS

**Fichier**: `QUOTES_VERCEL_APP.md`

---

## 🔨 Ce qu'il reste à faire

### Étape 1: Appliquer la migration SQL ⚠️ **CRITIQUE**

```bash
# Dans le dashboard Supabase
1. Allez sur https://supabase.com/dashboard/project/qeheawdjlwlkhnwbhqcg/editor
2. Ouvrez le SQL Editor
3. Copiez le contenu de supabase/migrations/004_quotes_system.sql
4. Exécutez la migration
5. Vérifiez que la table `quotes` existe
```

### Étape 2: Ajouter company_name à votre profil

```bash
# Dans Supabase SQL Editor, mettez à jour votre profil:
UPDATE public.users 
SET company_name = 'Nom de votre société VTC' 
WHERE id = 'VOTRE_FIREBASE_UID';
```

### Étape 3: Ajouter la navigation dans l'app mobile

**Ce qui doit être ajouté dans `App.tsx`** :

```typescript
// 1. Import
import CreateQuoteScreen from './src/screens/CreateQuoteScreen';

// 2. State (avec les autres useState)
const [showCreateQuote, setShowCreateQuote] = useState(false);

// 3. Props de ToolsScreen (ligne ~1982)
<ToolsScreen
  onOpenQRCode={() => setShowQRCode(true)}
  onOpenPersonalRides={() => setShowPersonalRides(true)}
  onOpenPlanning={() => setShowPlanning(true)}
  onCreateQuote={() => setShowCreateQuote(true)}  // <-- AJOUTER
/>

// 4. Rendu conditionnel (après les autres modals)
{showCreateQuote && (
  <CreateQuoteScreen
    onBack={() => setShowCreateQuote(false)}
    onQuoteSent={() => {
      setShowCreateQuote(false);
      Alert.alert('✅ Devis envoyé', 'Le devis a été envoyé au client');
    }}
  />
)}
```

**Ce qui doit être ajouté dans `src/screens/ToolsScreen.tsx`** :

```typescript
// 1. Props interface (ligne ~18)
interface ToolsScreenProps {
  onOpenQRCode: () => void;
  onOpenPersonalRides: () => void;
  onOpenPlanning: () => void;
  onCreateQuote: () => void;  // <-- AJOUTER
}

// 2. Props destructuring (ligne ~24)
export default function ToolsScreen({ 
  onOpenQRCode, 
  onOpenPersonalRides, 
  onOpenPlanning,
  onCreateQuote  // <-- AJOUTER
}: ToolsScreenProps) {

// 3. Nouveau bouton (après Planning, avant la fermeture de section)
{/* Créer un devis */}
<TouchableOpacity
  style={styles.toolButton}
  onPress={onCreateQuote}
  activeOpacity={0.8}
>
  <LinearGradient
    colors={['#f59e0b', '#f97316']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.toolGradient}
  >
    <View style={styles.toolLeft}>
      <View style={styles.toolIconContainer}>
        <Ionicons name="document-text" size={28} color="#fff" />
      </View>
      <View>
        <Text style={styles.toolTitle}>Créer un devis</Text>
        <Text style={styles.toolDescription}>Envoyez un devis par SMS</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
  </LinearGradient>
</TouchableOpacity>
```

### Étape 4: Créer l'app Next.js sur Vercel

**Suivez le guide complet dans `QUOTES_VERCEL_APP.md`**

Résumé rapide :
```bash
cd ~/Cursor
npx create-next-app@latest corail-quotes-web --typescript --tailwind --app --no-src-dir
cd corail-quotes-web
npm install @supabase/supabase-js

# Suivez ensuite les instructions du guide pour:
# - Créer lib/supabase.ts
# - Créer app/q/[token]/page.tsx
# - Créer components/QuoteCard.tsx
# - Déployer sur Vercel
```

### Étape 5: Configurer l'envoi SMS

**Options recommandées** :

#### Option A: Twilio (le plus simple)
```bash
# 1. Créer compte sur https://twilio.com
# 2. Obtenir numéro français
# 3. Créer Edge Function Supabase:
```

```typescript
// supabase/functions/send-quote-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { phone, message } = await req.json()
  
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        From: twilioPhone,
        Body: message,
      }),
    }
  )

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

#### Option B: OVH SMS API
- API simple et fiable
- Prix compétitifs en France
- Documentation: https://docs.ovh.com/fr/sms/

#### Option C: Brevo (SendinBlue)
- Solution française
- API SMS incluse
- Dashboard en français

### Étape 6: Intégrer l'envoi SMS

Une fois le service SMS configuré, modifiez `src/services/supabaseApi.ts` :

```typescript
export const createQuote = async (quoteData: { ... }) => {
  // ... code existant ...
  
  // Après création du devis
  console.log('✅ Quote created:', data.id);
  
  // 🆕 AJOUTER l'envoi SMS
  try {
    const smsMessage = `Bonjour,\nVoici votre devis VTC pour le ${formatDate(data.scheduled_date)} à ${data.scheduled_time.slice(0, 5)}.\nMontant : ${(data.price_cents / 100).toFixed(2)} €.\n\n👉 Consulter et valider :\nhttps://corail-quotes.vercel.app/q/${data.token}`;
    
    // Appel à votre Edge Function ou API SMS
    await fetch('YOUR_SMS_ENDPOINT', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: quoteData.client_phone,
        message: smsMessage,
      }),
    });
    
    console.log('📱 SMS envoyé au client');
  } catch (smsError) {
    console.error('❌ Erreur envoi SMS:', smsError);
    // Ne pas bloquer si SMS échoue
  }
  
  return data;
};
```

---

## 🧪 Tests à effectuer

### Test 1: Migration SQL
- [ ] Migration exécutée sans erreur
- [ ] Table `quotes` visible dans Supabase
- [ ] Fonctions SQL créées (accept_quote, refuse_quote)

### Test 2: Écran mobile
- [ ] Bouton "Créer un devis" visible dans Outils
- [ ] Formulaire de création s'ouvre
- [ ] Validation des champs fonctionne
- [ ] Devis créé en base

### Test 3: App Vercel
- [ ] Page https://corail-quotes.vercel.app/q/TOKEN accessible
- [ ] Informations chauffeur affichées
- [ ] Boutons Accepter/Refuser fonctionnent
- [ ] Confirmation affichée après action

### Test 4: SMS
- [ ] SMS reçu après création devis
- [ ] Lien cliquable
- [ ] Lien ouvre la page correcte

### Test 5: End-to-end
- [ ] Créer devis depuis mobile
- [ ] Client reçoit SMS
- [ ] Client accepte devis
- [ ] Notification reçue par chauffeur (activity_log)

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que la migration SQL est appliquée
2. Vérifiez les logs Supabase
3. Vérifiez les logs Vercel
4. Testez chaque étape individuellement

**Les fichiers créés sont maintenant sur GitHub** : https://github.com/Idriss-Ouazzani/corail-mobile-app

Bonne chance ! 🚀

