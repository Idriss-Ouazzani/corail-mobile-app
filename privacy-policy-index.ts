import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// HTML de la politique de confidentialité
const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Politique de confidentialité - Corail</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%);
            min-height: 100vh;
            padding: 40px 20px;
            line-height: 1.6;
        }
        
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 800px;
            width: 100%;
            margin: 0 auto;
            padding: 40px;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%);
            border-radius: 20px;
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
        }
        
        h1 {
            color: #0c4a6e;
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
            text-align: center;
        }
        
        .last-updated {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-bottom: 40px;
        }
        
        h2 {
            color: #0c4a6e;
            font-size: 24px;
            margin-top: 30px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        h3 {
            color: #0c4a6e;
            font-size: 18px;
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        p {
            color: #475569;
            font-size: 16px;
            margin-bottom: 15px;
        }
        
        ul {
            color: #475569;
            font-size: 16px;
            margin-left: 20px;
            margin-bottom: 15px;
        }
        
        li {
            margin-bottom: 8px;
        }
        
        .contact {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .contact h3 {
            margin-top: 0;
        }
        
        .email-link {
            display: inline-block;
            background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 10px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .email-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(12, 74, 110, 0.3);
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 14px;
            text-align: center;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">C</div>
        <h1>Politique de confidentialité</h1>
        <p class="last-updated">Dernière mise à jour : Janvier 2025</p>
        
        <h2>1. Introduction</h2>
        <p>
            Corail ("nous", "notre", "l'application") s'engage à protéger votre vie privée. 
            Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles lorsque vous utilisez notre application mobile.
        </p>
        
        <h2>2. Données que nous collectons</h2>
        
        <h3>2.1 Données d'identification</h3>
        <ul>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone (optionnel)</li>
            <li>Photo de profil (optionnelle)</li>
        </ul>
        
        <h3>2.2 Données de localisation</h3>
        <ul>
            <li>Adresses de départ et d'arrivée pour les trajets</li>
            <li>Position géographique (si vous activez la géolocalisation)</li>
        </ul>
        
        <h3>2.3 Données d'utilisation</h3>
        <ul>
            <li>Historique des trajets</li>
            <li>Réservations effectuées</li>
            <li>Interactions avec l'application (analytics anonymes)</li>
            <li>Photos prises via l'application (profil, véhicule)</li>
        </ul>
        
        <h3>2.4 Données techniques</h3>
        <ul>
            <li>Type d'appareil et système d'exploitation</li>
            <li>Identifiant unique de l'appareil</li>
            <li>Données de performance (analytics)</li>
        </ul>
        
        <h2>3. Comment nous utilisons vos données</h2>
        <ul>
            <li><strong>Fournir le service :</strong> Mise en relation entre conducteurs VTC et passagers, gestion des trajets et réservations</li>
            <li><strong>Améliorer l'application :</strong> Analytics anonymes pour mesurer l'usage et améliorer l'expérience utilisateur</li>
            <li><strong>Communication :</strong> Vous contacter concernant vos trajets, notifications importantes</li>
            <li><strong>Sécurité :</strong> Prévenir la fraude et assurer la sécurité de la plateforme</li>
        </ul>
        
        <h2>4. Partage des données</h2>
        <p>
            Nous ne vendons pas vos données personnelles. Nous partageons uniquement les données nécessaires avec :
        </p>
        <ul>
            <li><strong>Autres utilisateurs :</strong> Nom, photo de profil (pour la mise en relation)</li>
            <li><strong>Prestataires de services :</strong> Firebase (authentification, analytics), Supabase (base de données), Sentry (gestion des erreurs)</li>
            <li><strong>Obligations légales :</strong> Si requis par la loi</li>
        </ul>
        
        <h2>5. Stockage et sécurité</h2>
        <ul>
            <li>Vos données sont stockées de manière sécurisée sur des serveurs hébergés en Europe</li>
            <li>Nous utilisons le chiffrement pour protéger vos données en transit</li>
            <li>L'accès aux données est limité aux personnes autorisées</li>
        </ul>
        
        <h2>6. Vos droits (RGPD)</h2>
        <p>Conformément au RGPD, vous avez le droit de :</p>
        <ul>
            <li><strong>Accès :</strong> Consulter vos données personnelles</li>
            <li><strong>Rectification :</strong> Corriger vos données</li>
            <li><strong>Suppression :</strong> Demander la suppression de votre compte et de vos données</li>
            <li><strong>Portabilité :</strong> Récupérer vos données dans un format structuré</li>
            <li><strong>Opposition :</strong> Vous opposer au traitement de vos données</li>
            <li><strong>Limitation :</strong> Limiter le traitement de vos données</li>
        </ul>
        
        <h2>7. Cookies et technologies similaires</h2>
        <p>
            Nous utilisons des technologies similaires aux cookies pour améliorer votre expérience et analyser l'utilisation de l'application. 
            Vous pouvez désactiver l'analytics dans les paramètres de l'application (Paramètres → Confidentialité et données).
        </p>
        
        <h2>8. Conservation des données</h2>
        <p>
            Nous conservons vos données personnelles tant que votre compte est actif. 
            Si vous supprimez votre compte, vos données seront supprimées dans un délai de 30 jours, 
            sauf si la conservation est requise par la loi.
        </p>
        
        <h2>9. Modifications de cette politique</h2>
        <p>
            Nous pouvons modifier cette politique de confidentialité. 
            Les modifications importantes vous seront notifiées via l'application ou par email. 
            La date de dernière mise à jour est indiquée en haut de cette page.
        </p>
        
        <div class="contact">
            <h3>10. Contact</h3>
            <p>Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous :</p>
            <a href="mailto:privacy@corail.app?subject=Question confidentialité" class="email-link">
                privacy@corail.app
            </a>
            <p style="margin-top: 15px;">
                Pour demander la suppression de votre compte, visitez : 
                <a href="https://delete-account-page-drab.vercel.app" style="color: #0c4a6e;">https://delete-account-page-drab.vercel.app</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 Corail. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;

// Route principale - sert le HTML
app.get('/', (req, res) => {
  res.send(htmlContent);
});

// Toutes les autres routes servent aussi le HTML
app.get('*', (req, res) => {
  res.send(htmlContent);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;

