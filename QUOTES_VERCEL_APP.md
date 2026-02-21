# 📋 Devis VTC - App Web Vercel

Cette documentation décrit comment créer et déployer l'application Next.js pour afficher les devis publics sur Vercel.

## 🎯 Objectif

Créer une page web publique où les clients peuvent :
- Consulter un devis VTC via un lien unique
- Accepter ou refuser le devis
- Voir confirmation de leur action

## 📦 Ce qui est déjà fait

✅ **Base de données** : Table `quotes` créée dans Supabase  
✅ **API Backend** : Fonctions créées dans `supabaseApi.ts`  
✅ **Écran Mobile** : `CreateQuoteScreen.tsx` pour créer des devis  
✅ **Migration SQL** : `supabase/migrations/004_quotes_system.sql`

## 🚀 Prochaines étapes

### 1. Créer l'app Next.js

Créez un nouveau projet Next.js séparé :

```bash
# Dans un nouveau dossier (PAS dans Corail-mobileapp)
cd ~/Cursor
npx create-next-app@latest corail-quotes-web --typescript --tailwind --app --no-src-dir
cd corail-quotes-web
```

### 2. Installer les dépendances

```bash
npm install @supabase/supabase-js
```

### 3. Structure du projet

```
corail-quotes-web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (page d'accueil/info)
│   └── q/
│       └── [token]/
│           └── page.tsx (page devis)
├── lib/
│   └── supabase.ts
├── components/
│   └── QuoteCard.tsx
└── .env.local
```

### 4. Configuration Supabase

Créez `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://qeheawdjlwlkhnwbhqcg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 5. Créer `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 6. Créer la page devis `app/q/[token]/page.tsx`

```typescript
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import QuoteCard from '@/components/QuoteCard';

export default async function QuotePage({ params }: { params: { token: string } }) {
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      users!quotes_driver_id_fkey (
        full_name,
        company_name,
        phone
      )
    `)
    .eq('token', params.token)
    .single();

  if (error || !quote) {
    notFound();
  }

  // Marquer comme vu
  await supabase.rpc('mark_quote_viewed', { p_token: params.token });

  return <QuoteCard quote={quote} />;
}
```

### 7. Créer le composant `components/QuoteCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function QuoteCard({ quote }: { quote: any }) {
  const [status, setStatus] = useState(quote.status);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('accept_quote', {
      p_token: quote.token,
      p_ip: 'client_ip', // TODO: Récupérer la vraie IP
      p_user_agent: navigator.userAgent,
    });

    if (!error) {
      setStatus('ACCEPTED');
    }
    setLoading(false);
  };

  const handleRefuse = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('refuse_quote', {
      p_token: quote.token,
    });

    if (!error) {
      setStatus('REFUSED');
    }
    setLoading(false);
  };

  if (status === 'ACCEPTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h1>
          <p className="text-gray-600 mb-4">
            Votre accord a été transmis au chauffeur.
          </p>
          <p className="text-sm text-gray-500">
            Vous pouvez le contacter directement pour toute question.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'REFUSED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Devis refusé</h1>
          <p className="text-gray-600">
            Le chauffeur a été informé de votre décision.
          </p>
        </div>
      </div>
    );
  }

  const driver = quote.users;
  const price = (quote.price_cents / 100).toFixed(2);
  const date = new Date(quote.scheduled_date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Devis de Transport VTC
          </h1>
          <div className="w-20 h-1 bg-orange-500 mx-auto rounded-full"></div>
        </div>

        {/* Prestataire */}
        <div className="mb-8 bg-gray-50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Prestataire</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Chauffeur:</span>
              <span className="text-gray-900">{driver?.full_name || 'N/A'}</span>
            </div>
            {driver?.company_name && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Société:</span>
                <span className="text-gray-900">{driver.company_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Téléphone:</span>
              <span className="text-gray-900">{driver?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Détails course */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Détails de la course</h2>
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-700">Départ:</span>
              <p className="text-gray-900 mt-1">{quote.pickup_address}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Arrivée:</span>
              <p className="text-gray-900 mt-1">{quote.dropoff_address}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="font-semibold text-gray-700">Date:</span>
                <p className="text-gray-900 mt-1">{date}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Heure:</span>
                <p className="text-gray-900 mt-1">{quote.scheduled_time.slice(0, 5)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prix */}
        <div className="mb-8 bg-orange-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Prix total TTC:</span>
            <span className="text-3xl font-bold text-orange-600">{price} €</span>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-2">Notes:</h3>
            <p className="text-gray-600 italic">{quote.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'J\'accepte ce devis'}
          </button>
          <button
            onClick={handleRefuse}
            disabled={loading}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            Je refuse
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center">
          Ce devis est émis par le chauffeur mentionné ci-dessus.
          Corail fournit un outil logiciel et n'est pas partie au contrat.
        </p>
      </div>
    </div>
  );
}
```

### 8. Déployer sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com)
2. Importez votre repository GitHub `corail-quotes-web`
3. Configurez les variables d'environnement dans Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déployez !

Votre app sera accessible sur : `https://corail-quotes.vercel.app`

### 9. Configurer les Row Level Security dans Supabase

Ajoutez cette policy pour accès public aux quotes via token :

```sql
-- Permettre lecture publique des quotes avec token
CREATE POLICY "Public read access with token" 
  ON public.quotes 
  FOR SELECT 
  TO anon
  USING (true);
```

## 📱 Envoi SMS (À configurer)

Pour l'envoi SMS, plusieurs options :

### Option 1: Twilio (Recommandé)
- Créer compte sur [twilio.com](https://twilio.com)
- Obtenir numéro français
- Ajouter Edge Function Supabase pour envoyer SMS

### Option 2: OVH SMS
- API simple et fiable
- Prix compétitifs en France

### Option 3: SendinBlue (Brevo)
- Solution française
- API SMS incluse

**Le SMS sera envoyé automatiquement depuis l'app mobile lors de la création du devis.**

## ✅ Checklist finale

- [ ] Migration SQL exécutée dans Supabase
- [ ] App Next.js créée et déployée sur Vercel
- [ ] Variables d'environnement configurées
- [ ] RLS policy ajoutée pour accès public
- [ ] Service SMS configuré (Twilio/OVH/Brevo)
- [ ] Navigation ajoutée dans l'app mobile
- [ ] Tests end-to-end effectués

## 📞 Support

Pour toute question, contactez l'équipe de développement Corail.

