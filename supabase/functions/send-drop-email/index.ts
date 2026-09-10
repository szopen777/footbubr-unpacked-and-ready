import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 4; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BUBR-${token}`;
}

function renderEmailShell(contentHtml: string, unsubscribeEmail?: string): string {
  const unsubUrl = unsubscribeEmail 
    ? `https://kwumqkqnwqbfvpzavclv.supabase.co/functions/v1/send-drop-email?action=unsubscribe&email=${encodeURIComponent(unsubscribeEmail)}`
    : null;

  return `
  <!DOCTYPE html>
  <html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="only dark">
    <title>FootBubr</title>
    <style>
      :root { color-scheme: only dark; }
      body { -webkit-text-size-adjust: none; }
      .brand-title {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        font-size: 28px !important;
        font-weight: 900 !important;
        letter-spacing: -0.5px !important;
        text-transform: uppercase !important;
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #010101 !important; -webkit-text-size-adjust: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #010101 !important; width: 100% !important; margin: 0; padding: 36px 12px;">
      <tr>
        <td align="center" style="background-color: #010101 !important;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #0e0e0e !important; border: 1px solid #222222; border-radius: 20px; overflow: hidden;">
            
            <!-- HEADER -->
            <tr>
              <td align="center" style="padding: 34px 20px 22px 20px; border-bottom: 1px solid #1a1a1a; background-color: #0e0e0e !important;">
                <a href="https://footbubr.pl" target="_blank" style="text-decoration: none; display: inline-block;">
                  <span class="brand-title" style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #ffffff !important;">
                    <span style="color: #ffffff !important;">FOOT</span><span style="color: #FF6B00 !important;">BUBR</span>
                  </span>
                </a>
              </td>
            </tr>

            <!-- TREŚĆ GŁÓWNA -->
            <tr>
              <td style="padding: 36px 24px; background-color: #0e0e0e !important;">
                ${contentHtml}
              </td>
            </tr>

            <!-- STOPKA -->
            <tr>
              <td align="center" style="padding: 22px 20px; background-color: #070707 !important; border-top: 1px solid #161616;">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #666666 !important;">
                  FOOTBUBR · DLA GRACZY, KTÓRZY CENIĄ UNIKALNOŚĆ
                </p>
                <p style="margin: 0; font-size: 11px; color: #444444 !important;">
                  Wiadomość z serwisu <a href="https://footbubr.pl" target="_blank" style="color: #666666 !important; text-decoration: underline;">footbubr.pl</a>
                </p>
                ${
                  unsubUrl
                    ? `
                  <p style="margin: 10px 0 0 0; font-size: 11px; color: #444444 !important;">
                    Nie chcesz otrzymywać powiadomień? 
                    <a href="${unsubUrl}" target="_blank" style="color: #666666 !important; text-decoration: underline;">
                      Wypisz się z BubrClub
                    </a>
                  </p>
                `
                    : ""
                }
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  // BEZPOŚREDNIA OBSŁUGA WYPISU - USUWA Z BAZY I PRZEKIEROWUJE NA STRONĘ GŁÓWNĄ
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("action") === "unsubscribe") {
    const emailToUnsub = url.searchParams.get("email");
    if (emailToUnsub) {
      await supabase.from("drop_subscribers").delete().ilike("email", emailToUnsub.trim());
    }

    return Response.redirect("https://footbubr.pl/?unsubscribed=true", 302);
  }

  try {
    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const { type, email, dropId, orderId, tracking_number } = payload;

    // ==========================================
    // 1. POWITANIE W BUBRCLUB (KOD -5%) - PONOWNY ZAPIS BEZ DRUGIEGO KODU
    // ==========================================
    if (type === "welcome_code" && email) {
      const cleanEmail = String(email).trim().toLowerCase();

      // Sprawdzamy czy ten e-mail kiedykolwiek wcześniej odebrał kod
      const { data: alreadyClaimed } = await supabase
        .from("claimed_discount_emails")
        .select("email")
        .ilike("email", cleanEmail)
        .maybeSingle();

      let codeToReturn = null;
      let isFirstTime = false;

      if (alreadyClaimed) {
        // Osoba wraca po wypisaniu – zapisujemy do subskrybentów na powiadomienia, ale NIE dajemy kodu
        await supabase.from("drop_subscribers").upsert(
          { email: cleanEmail, discount_code: null, drop_settings_id: dropId || 1 },
          { onConflict: "email" }
        );
      } else {
        // Pierwszy raz – generujemy kod i blokujemy na zawsze wclaimed_discount_emails
        codeToReturn = generateCode();
        isFirstTime = true;

        await supabase.from("claimed_discount_emails").insert({ email: cleanEmail });

        await supabase.from("drop_subscribers").upsert(
          { email: cleanEmail, discount_code: codeToReturn, drop_settings_id: dropId || 1 },
          { onConflict: "email" }
        );

        await supabase.from("discount_codes").insert({
          code: codeToReturn,
          discount_type: "percentage",
          discount_value: 5,
          uses_left: 1,
        });

        const emailHtml = renderEmailShell(`
          <div style="text-align: center;">
            <div style="display: inline-block; background-color: #241407 !important; border: 1px solid #FF6B00; border-radius: 9999px; padding: 6px 16px; margin-bottom: 22px;">
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #FF6B00 !important;">
                DOŁĄCZONO DO BUBRCLUB ⚡
              </span>
            </div>

            <h1 style="margin: 0 0 14px 0; font-size: 26px; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.5px; color: #ffffff !important;">
              Witaj w klubie
            </h1>

            <p style="margin: 0 0 28px 0; max-width: 400px; display: inline-block; font-size: 14px; line-height: 1.6; color: #b0b0b0 !important;">
              Będziesz otrzymywać powiadomienia o nowych dropach przed innymi. Na start łap jednorazowy kod rabatowy -5% na całe zamówienie.
            </p>

            <div style="background-color: #141414 !important; border: 2px dashed #FF6B00; border-radius: 14px; padding: 22px 16px; margin: 0 auto 30px auto; max-width: 320px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #888888 !important; display: block; margin-bottom: 6px;">
                TWÓJ KOD RABATOWY -5%
              </span>
              <span style="font-size: 28px; font-weight: 900; letter-spacing: 3px; font-family: monospace; color: #FF6B00 !important;">
                ${codeToReturn}
              </span>
            </div>

            <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #FF6B00 !important;">
                  <a href="https://footbubr.pl" target="_blank" style="display: inline-block; padding: 15px 34px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #000000 !important; text-decoration: none;">
                    Przejdź do sklepu →
                  </a>
                </td>
              </tr>
            </table>
          </div>
        `, cleanEmail);

        await resend.emails.send({
          from: "FootBubr <kontakt@footbubr.pl>",
          to: cleanEmail,
          subject: "Twój kod rabatowy -5% do BubrClub ⚡",
          html: emailHtml,
        });
      }

      return new Response(JSON.stringify({ success: true, isFirstTime, code: codeToReturn }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ==========================================
    // 2. ALERT Z PANELU: ZAPOWIEDŹ DROPU
    // ==========================================
    if (type === "drop_created") {
      const { data: settings } = await supabase.from("drop_settings").select("*").eq("id", 1).single();
      if (!settings || settings.is_tbd) {
        return new Response("Drop TBD", { headers: corsHeaders, status: 200 });
      }

      const { data: subs } = await supabase.from("drop_subscribers").select("email");
      if (!subs || subs.length === 0) {
        return new Response("Brak subskrybentów", { headers: corsHeaders, status: 200 });
      }

      const dropDateFormatted = new Date(settings.drop_date).toLocaleString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const sub of subs) {
        const emailHtml = renderEmailShell(`
          <div style="text-align: center;">
            <div style="display: inline-block; background-color: #241407 !important; border: 1px solid #FF6B00; border-radius: 9999px; padding: 6px 16px; margin-bottom: 22px;">
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #FF6B00 !important;">
                OFICJALNA ZAPOWIEDŹ DROPU ⚡
              </span>
            </div>

            <h1 style="margin: 0 0 12px 0; font-size: 26px; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.5px; color: #ffffff !important;">
              ${settings.title}
            </h1>

            <p style="margin: 0 0 28px 0; max-width: 400px; display: inline-block; font-size: 14px; line-height: 1.6; color: #b0b0b0 !important;">
              ${settings.subtitle || "Nadchodzi nowa pula unikatowych modeli. Liczy się najszybszy klik."}
            </p>

            <div style="background-color: #141414 !important; border: 1px solid #282828; border-radius: 14px; padding: 20px; margin: 0 auto 28px auto; max-width: 340px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #888888 !important; display: block; margin-bottom: 6px;">
                DATA I GODZINA STARTU:
              </span>
              <span style="font-size: 18px; font-weight: 900; text-transform: capitalize; color: #FF6B00 !important;">
                ${dropDateFormatted}
              </span>
            </div>

            <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #FF6B00 !important;">
                  <a href="https://footbubr.pl" target="_blank" style="display: inline-block; padding: 15px 34px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #000000 !important; text-decoration: none;">
                    Zobacz sklep i bądź gotowy →
                  </a>
                </td>
              </tr>
            </table>
          </div>
        `, sub.email);

        await resend.emails.send({
          from: "FootBubr <kontakt@footbubr.pl>",
          to: sub.email,
          subject: `⚡ Zapowiedź nowego dropu: ${settings.title}`,
          html: emailHtml,
        });
      }

      await supabase.from("drop_settings").update({ announcement_sent: true, reminder_1h_sent: false }).eq("id", 1);
      return new Response("Wysłano zapowiedzi", { headers: corsHeaders, status: 200 });
    }

    // ==========================================
    // 3. AUTOMAT CRON: 60 MINUT PRZED DROPEM
    // ==========================================
    if (type === "cron_check") {
      const { data: settings } = await supabase.from("drop_settings").select("*").eq("id", 1).single();

      if (!settings || settings.is_tbd || !settings.drop_date || settings.reminder_1h_sent) {
        return new Response("Brak akcji", { headers: corsHeaders, status: 200 });
      }

      const dropTime = new Date(settings.drop_date).getTime();
      const now = Date.now();
      const diffMin = (dropTime - now) / 60000;

      if (diffMin > 0 && diffMin <= 60) {
        const { data: subs } = await supabase.from("drop_subscribers").select("email");

        if (subs && subs.length > 0) {
          for (const sub of subs) {
            const emailHtml = renderEmailShell(`
              <div style="text-align: center;">
                <div style="display: inline-block; background-color: #2b0b0b !important; border: 1px solid #ef4444; border-radius: 9999px; padding: 6px 16px; margin-bottom: 22px;">
                  <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #ef4444 !important;">
                    🚨 OSTATNIA GODZINA
                  </span>
                </div>

                <h1 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.5px; color: #ffffff !important;">
                  Drop rusza za 60 minut!
                </h1>

                <p style="margin: 0 0 30px 0; max-width: 400px; display: inline-block; font-size: 14px; line-height: 1.6; color: #b0b0b0 !important;">
                  Punktualnie o pełnej godzinie unikatowe pary trafiają do otwartej sprzedaży na stronie. Kto pierwszy, ten lepszy.
                </p>

                <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="border-radius: 12px; background-color: #FF6B00 !important;">
                      <a href="https://footbubr.pl" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #000000 !important; text-decoration: none;">
                        Wbijaj na footbubr.pl →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 22px 0 0 0; font-size: 11px; color: #666666 !important;">
                  Pamiętaj o przygotowaniu adresu i płatności BLIK.
                </p>
              </div>
            `, sub.email);

            await resend.emails.send({
              from: "FootBubr <kontakt@footbubr.pl>",
              to: sub.email,
              subject: "🚨 ZA 60 MINUT RUSZA DROP! Bądź gotowy na footbubr.pl",
              html: emailHtml,
            });
          }
        }

        await supabase.from("drop_settings").update({ reminder_1h_sent: true }).eq("id", 1);
        return new Response("Wysłano reminder 1h", { headers: corsHeaders, status: 200 });
      }

      return new Response(`Poza oknem (minuty: ${diffMin.toFixed(1)})`, { headers: corsHeaders, status: 200 });
    }

    // ==========================================
    // 4. POTWIERDZENIE ZAMÓWIENIA
    // ==========================================
    if (type === "order_confirmed" && orderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("*, product:products(*)")
        .eq("id", orderId)
        .single();

      if (!order || !order.customer_email) {
        return new Response("Nie znaleziono zamówienia", { headers: corsHeaders, status: 404 });
      }

      const rawData = order.shipping_method === "paczkomat" 
        ? (order.paczkomat_code || "") 
        : (order.shipping_address || "");

      const cleanDelivery = typeof rawData === "string" ? rawData.split(" [Wariant:")[0].trim() : "";
      const variantMatch = typeof rawData === "string" ? rawData.match(/\[Wariant:\s*(.*?)\]/) : null;
      const variantText = variantMatch ? variantMatch[1] : null;

      const itemsListHtml = variantText
        ? variantText
            .split("|")
            .map(
              (p: string) => `
                <div style="padding: 8px 12px; background-color: #141414 !important; border: 1px solid #222222; border-radius: 8px; margin-bottom: 6px; font-size: 12px; color: #ffffff !important; font-weight: 700;">
                  <span style="color: #FF6B00 !important; margin-right: 6px;">•</span>${p.trim()}
                </div>
              `
            )
            .join("")
        : `
          <div style="padding: 8px 12px; background-color: #141414 !important; border: 1px solid #222222; border-radius: 8px; font-size: 12px; color: #ffffff !important; font-weight: 700;">
            <span style="color: #FF6B00 !important; margin-right: 6px;">•</span>${order.product?.name || "Produkt"} (Rozmiar: ${order.product?.size_eu || "-"})
          </div>
        `;

      const customerEmailHtml = renderEmailShell(`
        <div style="text-align: center;">
          <div style="display: inline-block; background-color: #0d2818 !important; border: 1px solid #10b981; border-radius: 9999px; padding: 6px 16px; margin-bottom: 22px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #10b981 !important;">
              ZAMÓWIENIE OPŁACONE ✅
            </span>
          </div>

          <h1 style="margin: 0 0 12px 0; font-size: 26px; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.5px; color: #ffffff !important;">
            Dziękujemy za zakupy!
          </h1>

          <p style="margin: 0 0 24px 0; max-width: 420px; display: inline-block; font-size: 14px; line-height: 1.6; color: #b0b0b0 !important;">
            Cześć ${order.customer_name || "Kliencie"}! Twoja wpłata została zaksięgowana. Zaczynamy kompletować Twoje zamówienie.
          </p>

          <div style="background-color: #141414 !important; border: 1px solid #282828; border-radius: 14px; padding: 20px; margin: 0 auto 24px auto; max-width: 380px; text-align: left;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #888888 !important;">
              KWOTA ZAMÓWIENIA: <strong style="color: #FF6B00 !important; font-size: 15px;">${order.total_price || 0} zł</strong>
            </p>
            <p style="margin: 0 0 16px 0; font-size: 12px; color: #888888 !important;">
              DOSTAWA: <strong style="color: #ffffff !important;">${order.shipping_method === "paczkomat" ? `Paczkomat ${cleanDelivery}` : `Kurier: ${cleanDelivery}`}</strong>
            </p>
            
            <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #666666 !important;">
              ZAMÓWIONE POZYCJE:
            </p>
            ${itemsListHtml}
          </div>

          <p style="margin: 0; font-size: 12px; color: #777777 !important;">
            Gdy paczka wyruszy w drogę, wyślemy do Ciebie kolejną wiadomość z numerem śledzenia InPost.
          </p>
        </div>
      `);

      await resend.emails.send({
        from: "FootBubr <kontakt@footbubr.pl>",
        to: order.customer_email,
        subject: `⚡ Potwierdzenie zamówienia FootBubr #${order.id.slice(0, 8).toUpperCase()}`,
        html: customerEmailHtml,
      });

      const adminAlertHtml = renderEmailShell(`
        <div>
          <div style="display: inline-block; background-color: #241407 !important; border: 1px solid #FF6B00; border-radius: 9999px; padding: 4px 12px; margin-bottom: 16px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #FF6B00 !important;">
              NOWE ZAMÓWIENIE W SKLEPIE 🛍️
            </span>
          </div>

          <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 900; color: #ffffff !important;">
            Nowa wpłata: ${order.total_price || 0} zł
          </h2>

          <div style="background-color: #141414 !important; border: 1px solid #282828; border-radius: 12px; padding: 18px; font-size: 13px; line-height: 1.6; color: #cccccc !important; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0;"><strong style="color: #ffffff !important;">Klient:</strong> ${order.customer_name || "-"}</p>
            <p style="margin: 0 0 6px 0;"><strong style="color: #ffffff !important;">Email:</strong> ${order.customer_email}</p>
            <p style="margin: 0 0 6px 0;"><strong style="color: #ffffff !important;">Telefon:</strong> ${order.customer_phone || "-"}</p>
            <p style="margin: 0 0 6px 0;"><strong style="color: #ffffff !important;">Dostawa:</strong> ${order.shipping_method === "paczkomat" ? `Paczkomat: ${cleanDelivery}` : `Kurier: ${cleanDelivery}`}</p>
            <p style="margin: 0;"><strong style="color: #ffffff !important;">Płatność:</strong> ${order.payment_method || "-"}</p>
          </div>

          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #888888 !important;">
            PRODUKTY DO SPAKOWANIA:
          </p>
          ${itemsListHtml}
        </div>
      `);

      await resend.emails.send({
        from: "FootBubr <kontakt@footbubr.pl>",
        to: "kontakt@footbubr.pl",
        subject: `🔥 Nowe zamówienie: ${order.customer_name || "Klient"} (${order.total_price || 0} zł)`,
        html: adminAlertHtml,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ==========================================
    // 5. PACZKA WYSŁANA (INPOST TRACKING)
    // ==========================================
    if (type === "order_shipped" && orderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("*, product:products(*)")
        .eq("id", orderId)
        .single();

      if (!order || !order.customer_email) {
        return new Response("Nie znaleziono zamówienia", { headers: corsHeaders, status: 404 });
      }

      const trackingUrl = tracking_number
        ? `https://inpost.pl/sledzenie-przesylek?number=${tracking_number}`
        : "https://inpost.pl/sledzenie-przesylek";

      const emailHtml = renderEmailShell(`
        <div style="text-align: center;">
          <div style="display: inline-block; background-color: #0d2818 !important; border: 1px solid #10b981; border-radius: 9999px; padding: 6px 16px; margin-bottom: 22px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #10b981 !important;">
              PACZKA W DRODZE 📦
            </span>
          </div>

          <h1 style="margin: 0 0 12px 0; font-size: 26px; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.5px; color: #ffffff !important;">
            Twoje zamówienie zostało wysłane!
          </h1>

          <p style="margin: 0 0 24px 0; max-width: 420px; display: inline-block; font-size: 14px; line-height: 1.6; color: #b0b0b0 !important;">
            Cześć ${order.customer_name || "Kliencie"}! Twoja paczka z FootBubr została spakowana i przekazana do nadania.
          </p>

          ${
            tracking_number
              ? `
            <div style="background-color: #141414 !important; border: 1px solid #282828; border-radius: 14px; padding: 20px; margin: 0 auto 28px auto; max-width: 360px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #888888 !important; display: block; margin-bottom: 6px;">
                NUMER PRZESYŁKI INPOST:
              </span>
              <span style="font-size: 16px; font-weight: 900; font-family: monospace; color: #FF6B00 !important; display: block; margin-bottom: 12px;">
                ${tracking_number}
              </span>
              <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #FF6B00 !important; color: #000000 !important; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; padding: 10px 22px; border-radius: 8px; text-decoration: none;">
                Śledź paczkę InPost →
              </a>
            </div>
          `
              : ""
          }

          <div style="background-color: #0a0a0a !important; border: 1px solid #1c1c1c; border-radius: 12px; padding: 16px; text-align: left; margin: 0 auto; max-width: 360px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: #ffffff !important;">
              ${order.product?.name || "Zamówienie FootBubr"}
            </p>
            <p style="margin: 0; font-size: 11px; color: #777777 !important;">
              Dostawa: ${order.shipping_method === "paczkomat" ? `Paczkomat ${order.paczkomat_code || ""}` : "Kurier"}
            </p>
          </div>
        </div>
      `);

      await resend.emails.send({
        from: "FootRepo <kontakt@footbubr.pl>",
        to: order.customer_email,
        subject: `📦 Twoja paczka z FootBubr jest w drodze! (${order.product?.name || "Zamówienie"})`,
        html: emailHtml,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response("Nieznany typ", { headers: corsHeaders, status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
