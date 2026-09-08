import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

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

serve(async (req) => {
  const { type, email, dropId } = await req.json().catch(() => ({}));

  // TYP 1: Nowy zapis do BubrClub (kod -5% i powitanie)
  if (type === "welcome_code" && email) {
    const cleanEmail = email.trim().toLowerCase();
    const code = generateCode();

    await supabase.from("drop_subscribers").upsert(
      { email: cleanEmail, discount_code: code, drop_settings_id: dropId || 1 },
      { onConflict: "email" }
    );

    await resend.emails.send({
      from: "FootBubr <kontakt@footbubr.pl>",
      to: cleanEmail,
      subject: "Twój kod rabatowy -5% do BubrClub ⚡",
      html: `
        <div style="background:#000;color:#fff;padding:32px 20px;font-family:sans-serif;text-align:center;">
          <h1 style="color:#FF6B00;text-transform:uppercase;">Witaj w BubrClub</h1>
          <p style="color:#bbb;">Będziesz otrzymywać powiadomienia o nowych dropach korków 1 of 1 przed innymi.</p>
          <div style="margin:24px 0;background:#111;border:2px dashed #FF6B00;padding:16px;display:inline-block;">
            <span style="font-size:11px;color:#888;display:block;">TWÓJ JEDNORAZOWY KOD:</span>
            <strong style="font-size:26px;color:#FF6B00;letter-spacing:2px;font-family:monospace;">${code}</strong>
          </div>
          <p style="color:#666;font-size:12px;">Wpisz kod w koszyku na footbubr.pl, aby odebrać 5% zniżki.</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, code }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  // TYP 2: Nowy drop ustawiony w adminie (zapowiedź)
  if (type === "drop_created") {
    const { data: settings } = await supabase.from("drop_settings").select("*").eq("id", 1).single();
    if (!settings || settings.is_tbd) return new Response("Drop TBD", { status: 200 });

    const { data: subs } = await supabase.from("drop_subscribers").select("email");
    if (!subs || subs.length === 0) return new Response("Brak subów", { status: 200 });

    const dropDateFormatted = new Date(settings.drop_date).toLocaleString("pl-PL", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    for (const sub of subs) {
      await resend.emails.send({
        from: "FootBubr <kontakt@footbubr.pl>",
        to: sub.email,
        subject: `⚡ Zapowiedź nowego dropu: ${settings.title}`,
        html: `
          <div style="background:#000;color:#fff;padding:32px 20px;font-family:sans-serif;text-align:center;">
            <h2 style="color:#FF6B00;text-transform:uppercase;">Zapowiedź dropu</h2>
            <p style="font-size:18px;font-weight:bold;">${settings.title}</p>
            <p style="color:#bbb;">${settings.subtitle || "Unikatowe korki 1 of 1 już wkrótce."}</p>
            <p style="margin-top:20px;color:#FF6B00;font-size:16px;">Start: <strong>${dropDateFormatted}</strong></p>
          </div>
        `,
      });
    }

    await supabase.from("drop_settings").update({ announcement_sent: true, reminder_1h_sent: false }).eq("id", 1);
    return new Response("Wysłano zapowiedzi", { status: 200 });
  }

  // TYP 3: Cron (sprawdzenie czy zostało <= 60 minut)
  if (type === "cron_check") {
    const { data: settings } = await supabase.from("drop_settings").select("*").eq("id", 1).single();

    if (!settings || settings.is_tbd || !settings.drop_date || settings.reminder_1h_sent) {
      return new Response("Brak akcji", { status: 200 });
    }

    const dropTime = new Date(settings.drop_date).getTime();
    const now = Date.now();
    const diffMin = (dropTime - now) / 60000;

    if (diffMin > 0 && diffMin <= 60) {
      const { data: subs } = await supabase.from("drop_subscribers").select("email");
      if (subs && subs.length > 0) {
        for (const sub of subs) {
          await resend.emails.send({
            from: "FootBubr <kontakt@footbubr.pl>",
            to: sub.email,
            subject: "🚨 ZA 60 MINUT RUSZA DROP! Bądź gotowy na footbubr.pl",
            html: `
              <div style="background:#000;color:#fff;padding:32px 20px;font-family:sans-serif;text-align:center;">
                <h1 style="color:#FF6B00;text-transform:uppercase;">Została godzina!</h1>
                <p style="font-size:16px;">Korki 1 of 1 wjeżdżają na stronę za 60 minut.</p>
                <a href="https://footbubr.pl" style="background:#FF6B00;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:20px;border-radius:6px;">
                  WEJDŹ NA STRONĘ
                </a>
              </div>
            `,
          });
        }
      }
      await supabase.from("drop_settings").update({ reminder_1h_sent: true }).eq("id", 1);
      return new Response("Wysłano 1h reminder", { status: 200 });
    }

    return new Response("Czekamy na okno 1h", { status: 200 });
  }

  return new Response("Nieznany typ", { status: 400 });
});
