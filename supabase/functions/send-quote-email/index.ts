/**
 * Edge Function : send-quote-email
 * 
 * Envoie un devis VTC par email via Resend.io
 * 
 * Usage :
 *   POST /functions/v1/send-quote-email
 *   Body: {
 *     clientEmail: string,
 *     clientName: string,
 *     quoteUrl: string,
 *     price: string,
 *     date: string,
 *     time: string,
 *     pickupAddress: string,
 *     dropoffAddress: string
 *   }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration pour désactiver l'authentification par défaut
// Car l'envoi d'email n'expose pas de données sensibles
export const config = {
  auth: false,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier que la clé API Resend est configurée
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY non configuré dans les secrets Supabase');
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parser le body
    const { clientEmail, clientName, quoteUrl, price, date, time, pickupAddress, dropoffAddress, driverName } = await req.json();

    // Validation
    if (!clientEmail || !clientName || !quoteUrl || !price) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📧 Envoi email devis:', { clientEmail, clientName, price });

    // Logo URL Corail (sans fond)
    const logoUrl = 'https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/public-assets/corail_logo.png';
    
    // Icônes SVG inline pour un rendu parfait
    const iconClock = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="#6366f1" stroke-width="2"/><path d="M12 7V12L15 15" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/></svg>`;
    const iconPin = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z" stroke="#6366f1" stroke-width="2"/><circle cx="12" cy="10" r="2" fill="#6366f1"/></svg>`;
    const iconFlag = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 21V4M5 4L19 9L5 14" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const iconUser = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" stroke="#64748b" stroke-width="2"/><path d="M6 21C6 17.134 8.686 14 12 14C15.314 14 18 17.134 18 21" stroke="#64748b" stroke-width="2" stroke-linecap="round"/></svg>`;
    
    // Template HTML de l'email - Design ultra élégant et moderne
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre devis - Corail</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Container principal -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); overflow: hidden; max-width: 100%;">
          
          <!-- Header compact avec gradient subtil -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.3px;">
                      Votre devis
                    </p>
                    <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px; font-weight: 400;">
                      Service de chauffeur privé
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenu -->
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Salutation avec logo -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0; color: #0f172a; font-size: 22px; line-height: 1.3; font-weight: 600;">
                      Bonjour ${clientName},
                    </p>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 15px; line-height: 1.5;">
                      Voici le détail de votre trajet.
                    </p>
                  </td>
                  <td style="vertical-align: middle; text-align: right; padding-left: 16px;" width="200">
                    <img src="${logoUrl}" alt="Corail" style="width: 200px; height: auto; display: block;" />
                  </td>
                </tr>
              </table>

              <!-- Prix en évidence -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #e0e7ff;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Montant total</p>
                    <p style="margin: 0; color: #6366f1; font-size: 48px; font-weight: 700; letter-spacing: -2px; line-height: 1;">${price} €</p>
                  </td>
                </tr>
              </table>

              <!-- Date et heure -->
              ${date ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px 20px; background-color: #fafafa; border-radius: 12px; border-left: 4px solid #6366f1;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;" width="20">
                          ${iconClock}
                        </td>
                        <td style="vertical-align: middle;">
                          <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Date et heure</p>
                          <p style="margin: 0; color: #0f172a; font-size: 17px; font-weight: 600;">${date}${time ? ` à ${time}` : ''}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Trajet dans une boîte élégante -->
              ${pickupAddress || dropoffAddress ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 24px; border: 2px solid #e2e8f0;">
                    ${pickupAddress ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: ${dropoffAddress ? '20px' : '0'};">
                      <tr>
                        <td style="vertical-align: top; padding-right: 14px;" width="22">
                          ${iconPin}
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Départ</p>
                          <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 600; line-height: 1.5;">${pickupAddress}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    ${pickupAddress && dropoffAddress ? `
                    <!-- Ligne de séparation avec flèche -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px 0;">
                      <tr>
                        <td style="padding-left: 22px;">
                          <div style="height: 40px; width: 2px; background: linear-gradient(to bottom, #6366f1, #8b5cf6); margin: 0 9px; position: relative;">
                          </div>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    ${dropoffAddress ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: top; padding-right: 14px;" width="22">
                          ${iconFlag}
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Arrivée</p>
                          <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 600; line-height: 1.5;">${dropoffAddress}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Chauffeur -->
              ${driverName ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px 20px; background-color: #fafafa; border-radius: 12px; border-left: 4px solid #8b5cf6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;" width="20">
                          ${iconUser}
                        </td>
                        <td style="vertical-align: middle;">
                          <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Votre chauffeur</p>
                          <p style="margin: 0; color: #0f172a; font-size: 17px; font-weight: 600;">${driverName}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${quoteUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.25);">
                      Consulter mon devis
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Note importante -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 16px 20px; border-radius: 10px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5; font-weight: 500;">
                      Ce devis est valable 48 heures. Pour confirmer votre réservation, cliquez sur le bouton ci-dessus.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 28px 32px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px; text-align: center; line-height: 1.5;">
                Pour toute question, répondez directement à cet email.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; font-weight: 600;">
                L'équipe Corail
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer légal -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin-top: 24px; max-width: 100%;">
          <tr>
            <td style="padding: 0 20px;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center;">
                Cet email a été envoyé par Corail. Si vous l'avez reçu par erreur, vous pouvez l'ignorer.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Envoyer l'email via Resend
    // Note: Utilise 'onboarding@resend.dev' par défaut si pas de domaine custom configuré
    // Pour configurer un domaine custom (ex: devis@corail.app), voir SETUP_RESEND_EMAIL.md
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Corail App <onboarding@resend.dev>';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [clientEmail],
        subject: `Votre devis - ${clientName}`,
        html: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur Resend:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Email envoyé avec succès:', data);

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erreur send-quote-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

