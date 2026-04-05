import { sendEmail } from "./mailketing";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cuanterus.vercel.app";

function wrap(content: string): string {
  return `<div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0A0F;border:1px solid #222229;border-radius:16px;overflow:hidden;">
  <div style="padding:32px 24px;text-align:center;">
    <div style="margin-bottom:24px;font-size:24px;font-weight:800;color:#96FC03;letter-spacing:1px;">CUANTERUS</div>
    ${content}
    <hr style="border:none;border-top:1px solid #222229;margin:24px 0;" />
    <p style="color:#8B949E;font-size:11px;margin:0;">Email ini dikirim otomatis oleh Cuanterus. Jangan reply email ini.</p>
  </div>
</div>`;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#96FC03;color:#0A0A0F;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">${text}</a>`;
}

/**
 * Sent after user confirms email and enters the platform
 */
export function sendWelcomeEmail(email: string, firstName: string) {
  return sendEmail({
    fromName: "Cuanterus",
    fromEmail: "noreply@cuanterus.in",
    recipient: email,
    subject: "Selamat Datang di Cuanterus!",
    content: wrap(`
      <h1 style="color:#F0F0F5;font-size:20px;margin:0 0 8px;">Hai ${firstName || "Trader"}!</h1>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 24px;">Selamat datang di Cuanterus. Akun kamu sudah aktif dan siap digunakan.</p>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 24px;">Langkah selanjutnya: pilih paket membership untuk mengakses semua materi edukasi, sinyal trading, dan tools premium.</p>
      ${button("Pilih Paket Sekarang", `${BASE_URL}/billing`)}
    `),
  });
}

/**
 * Sent after payment is confirmed (Xendit/MesinOtomatis/Manual)
 */
export function sendPaymentSuccessEmail(email: string, firstName: string, productName: string, planName: string) {
  return sendEmail({
    fromName: "Cuanterus",
    fromEmail: "noreply@cuanterus.in",
    recipient: email,
    subject: `Pembayaran Berhasil - ${productName}`,
    content: wrap(`
      <h1 style="color:#F0F0F5;font-size:20px;margin:0 0 8px;">Pembayaran Berhasil!</h1>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 8px;">Hai ${firstName || "Trader"},</p>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 24px;">Paket <strong style="color:#F0F0F5;">${productName} - ${planName}</strong> kamu sudah aktif. Selamat belajar!</p>
      <div style="background:#131318;border:1px solid #222229;border-radius:12px;padding:16px;margin-bottom:24px;text-align:left;">
        <p style="color:#96FC03;font-size:12px;font-weight:700;margin:0 0 8px;">YANG BISA KAMU AKSES:</p>
        <p style="color:#8B949E;font-size:13px;margin:0;line-height:1.8;">
          ✅ Kursus & Materi Edukasi<br/>
          ✅ Sinyal Trading Real-time<br/>
          ✅ Market Insight & Outlook<br/>
          ✅ Premium Trading Tools<br/>
          ✅ Komunitas Discord Eksklusif
        </p>
      </div>
      ${button("Mulai Belajar", `${BASE_URL}/dashboard`)}
    `),
  });
}

/**
 * Sent 7 days before subscription expires
 */
export function sendExpiryWarningEmail(email: string, firstName: string, daysLeft: number) {
  return sendEmail({
    fromName: "Cuanterus",
    fromEmail: "noreply@cuanterus.in",
    recipient: email,
    subject: `Membership Kamu Berakhir dalam ${daysLeft} Hari`,
    content: wrap(`
      <h1 style="color:#F0F0F5;font-size:20px;margin:0 0 8px;">Membership Segera Berakhir</h1>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 8px;">Hai ${firstName || "Trader"},</p>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 24px;">Membership Cuanterus kamu akan berakhir dalam <strong style="color:#F7B731;">${daysLeft} hari</strong>. Perpanjang sekarang agar tidak kehilangan akses ke semua fitur dan role Discord.</p>
      <div style="background:#131318;border:1px solid #F7B731;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="color:#F7B731;font-size:13px;margin:0;">⚠️ Setelah expired, kamu tidak bisa mengakses kursus, sinyal, tools, dan role Discord akan dicopot otomatis.</p>
      </div>
      ${button("Perpanjang Sekarang", `${BASE_URL}/billing`)}
    `),
  });
}

/**
 * Sent when subscription has expired
 */
export function sendExpiredEmail(email: string, firstName: string) {
  return sendEmail({
    fromName: "Cuanterus",
    fromEmail: "noreply@cuanterus.in",
    recipient: email,
    subject: "Membership Cuanterus Kamu Sudah Berakhir",
    content: wrap(`
      <h1 style="color:#F0F0F5;font-size:20px;margin:0 0 8px;">Membership Expired</h1>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 8px;">Hai ${firstName || "Trader"},</p>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 24px;">Membership Cuanterus kamu sudah berakhir. Akses ke kursus, sinyal, dan tools premium sudah dinonaktifkan. Role Discord juga sudah dicopot otomatis.</p>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 24px;">Kamu tetap bisa login dan lihat dashboard, tapi fitur premium tidak bisa diakses sampai perpanjang membership.</p>
      ${button("Perpanjang Membership", `${BASE_URL}/billing`)}
      <p style="color:#8B949E;font-size:12px;margin-top:24px;">Ada pertanyaan? Hubungi kami di Discord.</p>
    `),
  });
}

/**
 * Sent 3 days after registration if user hasn't purchased yet (follow-up)
 */
export function sendFollowUpEmail(email: string, firstName: string) {
  return sendEmail({
    fromName: "Cuanterus",
    fromEmail: "noreply@cuanterus.in",
    recipient: email,
    subject: "Sudah Siap Mulai Belajar Trading?",
    content: wrap(`
      <h1 style="color:#F0F0F5;font-size:20px;margin:0 0 8px;">Hai ${firstName || "Trader"}!</h1>
      <p style="color:#8B949E;font-size:14px;line-height:1.6;margin:0 0 24px;">Kami lihat kamu sudah daftar di Cuanterus tapi belum pilih paket. Jangan lewatkan kesempatan belajar trading dari materi yang terstruktur dan mentor berpengalaman.</p>
      <div style="background:#131318;border:1px solid #222229;border-radius:12px;padding:16px;margin-bottom:24px;text-align:left;">
        <p style="color:#96FC03;font-size:12px;font-weight:700;margin:0 0 8px;">KENAPA CUANTERUS?</p>
        <p style="color:#8B949E;font-size:13px;margin:0;line-height:1.8;">
          📚 Materi dari basic sampai advanced<br/>
          📊 Sinyal trading real-time<br/>
          🛠️ Tools premium (Position Sizing, Journal, dll)<br/>
          👥 Komunitas 5,000+ trader aktif<br/>
          🎯 Mentor 8+ tahun pengalaman
        </p>
      </div>
      ${button("Lihat Paket & Harga", `${BASE_URL}/billing`)}
    `),
  });
}
