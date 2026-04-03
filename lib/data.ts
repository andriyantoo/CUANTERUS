// ============================================================
// CUANTERUS — SEMUA KONTEN WEBSITE
// Edit file ini untuk ganti teks, harga, link, dll.
// Ga perlu sentuh file component-nya.
// ============================================================

// ── Link CTA utama ──────────────────────────────
// Ganti "#" ke URL A Member / Xendit lo yang beneran
export const CTA_LINK = "#";

// ── Social media links ──────────────────────────
export const SOCIALS = {
  youtube: "https://youtube.com/cuanterus",
  tiktok: "https://tiktok.com/@andricuanterus",
  instagram: "https://instagram.com/andriyantoo",
  discord: "https://discord.gg/cuanterus",
  whatsapp: "#", // Ganti ke link WA group
  telegram: "#", // Ganti ke link Telegram
};

// ── Hero section ────────────────────────────────
export const HERO = {
  badge: "Trading Education Platform #1",
  headline: "Strategi Profit Konsisten dari Trading",
  headlineAccent: "Meskipun Market Sedang Merah",
  subtitle:
    "Cuanterus bantu kamu belajar trading dari nol, dengan kurikulum terstruktur, sinyal real-time, dan komunitas trader yang aktif.",
  ctaPrimary: "Mulai Belajar Sekarang",
  ctaSecondary: "Lihat Program →",
  stats: [
    { label: "Followers", value: "100K+" },
    { label: "Students", value: "5,000+" },
    { label: "Rating", value: "4.9/5" },
  ],
};

// ── Feature icons section ───────────────────────
export const FEATURES_SECTION = {
  badge: "Platform",
  headline: "Platform untuk Kamu yang Siap Belajar Menjadi",
  headlineAccent: "Trader Profesional",
};

export const FEATURES = [
  { icon: "BookOpen", label: "Kursus" },
  { icon: "Signal", label: "Sinyal" },
  { icon: "Lightbulb", label: "Insight" },
  { icon: "Video", label: "Webinar" },
  { icon: "Users", label: "Komunitas" },
  { icon: "ClipboardList", label: "Trading Log" },
];

// ── Programs section ────────────────────────────
export const PROGRAMS_SECTION = {
  badge: "Program",
  headline: "Kita Menyediakan Program yang Sesuai",
  headlineAccent: "dengan Kebutuhan Kamu",
};

export const PROGRAMS = [
  {
    title: "Smart Triggers",
    desc: "Sinyal trading otomatis langsung ke HP kamu. Cocok buat yang ga punya waktu mantau chart seharian.",
    tag: "Populer",
    ctaText: "Lihat Detail",
    ctaLink: CTA_LINK,
  },
  {
    title: "Panen Trading",
    desc: "Belajar strategi trading dari nol sampai bisa profit konsisten. Full video + mentoring.",
    tag: "Best Seller",
    ctaText: "Daftar Sekarang",
    ctaLink: CTA_LINK,
    highlighted: true,
  },
  {
    title: "Komplet Trading",
    desc: "Paket lengkap: kursus + sinyal + komunitas + webinar. Semua yang kamu butuhkan dalam satu paket.",
    tag: "Terlengkap",
    ctaText: "Lihat Detail",
    ctaLink: CTA_LINK,
  },
];

// ── Masterclass features ────────────────────────
export const MASTERCLASS = {
  badge: "Masterclass",
  title: "CUANTERUS TRADING",
  titleAccent: "MASTERCLASS",
};

export const MASTERCLASS_FEATURES = [
  {
    icon: "BookOpen",
    title: "Komprehensif",
    desc: "Materi trading lengkap dari basic sampai advanced, disusun secara sistematis agar mudah dipahami.",
  },
  {
    icon: "TrendingUp",
    title: "Sinyal Trading Real-Time",
    desc: "Dapatkan sinyal entry dan exit langsung ke device kamu. Analisa sudah dilakukan oleh tim profesional.",
  },
  {
    icon: "Lightbulb",
    title: "Insight dan Analisa yang Mendalam",
    desc: "Update market harian dan analisa teknikal yang membantu kamu mengambil keputusan trading yang tepat.",
  },
  {
    icon: "Video",
    title: "Webinar yang Rutin Diadakan",
    desc: "Sesi live bersama mentor setiap minggu. Tanya jawab langsung dan review trading bersama.",
  },
];

// ── Community section ───────────────────────────
export const COMMUNITY = {
  badge: "Komunitas",
  headline: "Komunitas Eksklusif",
  headlineAccent: "Khusus Member",
  desc: "Gabung dengan ribuan trader aktif. Diskusi market, sharing strategi, dan belajar bareng setiap hari di grup eksklusif Cuanterus.",
  cta: "Gabung Komunitas",
};

// ── Credibility / About section ─────────────────
export const ABOUT = {
  badge: "Mentor",
  headline: "Belajar dari",
  headlineAccent: "8+ Tahun Pengalaman",
  headlineSuffix: "di Dunia Trading",
  bio: "Andriyanto — Financial Educator & Professional Trader. Certified Futures Advisor dengan pengalaman trading di crypto, forex, dan futures sejak 2017.",
  bio2: "Misi gua sederhana: bikin trading itu accessible dan gampang dipahami buat siapa aja, terutama pemula yang baru mulai.",
  stats: [
    { value: 8, suffix: "+", label: "Tahun Trading" },
    { value: 5000, suffix: "+", label: "Students" },
    { value: 100, suffix: "K+", label: "Followers" },
  ],
};

// ── Pricing section ─────────────────────────────
// GANTI HARGA DI SINI
export const PRICING_SECTION = {
  badge: "Pricing",
  headline: "Join dan",
  headlineAccent: "Daftar Sekarang!",
};

export const PRICING_PLANS = [
  {
    name: "1 Bulan",
    price: "499.000",
    period: "/bulan",
    popular: false,
    features: [
      "Akses semua kursus",
      "Sinyal trading",
      "Grup komunitas",
      "Weekly webinar",
    ],
    ctaLink: CTA_LINK,
  },
  {
    name: "3 Bulan",
    price: "399.000",
    period: "/bulan",
    popular: true,
    features: [
      "Semua fitur 1 Bulan",
      "Hemat 20%",
      "Priority support",
      "Bonus materi eksklusif",
    ],
    ctaLink: CTA_LINK,
  },
  {
    name: "12 Bulan",
    price: "249.000",
    period: "/bulan",
    popular: false,
    features: [
      "Semua fitur 3 Bulan",
      "Hemat 50%",
      "1-on-1 mentoring",
      "Lifetime community access",
    ],
    ctaLink: CTA_LINK,
  },
];

// ── Testimonials ────────────────────────────────
// GANTI KE TESTIMONIAL ASLI
export const TESTIMONIALS_SECTION = {
  badge: "Testimoni",
  headline: "Dengar Apa Kata Mereka",
  headlineAccent: "Setelah Bergabung",
};

export const TESTIMONIALS = [
  {
    name: "Andi R.",
    text: "Awalnya ga ngerti apa-apa soal trading. Setelah ikut program Cuanterus, sekarang udah bisa profit konsisten. Materi dan komunitasnya top banget!",
    rating: 5,
  },
  {
    name: "Dewi S.",
    text: "Sinyal tradingnya akurat banget. Gua yang kerja kantoran bisa tetap trading tanpa harus mantau chart seharian. Recommended!",
    rating: 5,
  },
  {
    name: "Budi W.",
    text: "Webinar-nya informatif dan mentornya sabar banget jelasin. Komunitas juga aktif, jadi belajarnya ga sendirian.",
    rating: 5,
  },
  {
    name: "Rina M.",
    text: "Udah coba beberapa kursus trading lain, tapi Cuanterus yang paling praktikal. Langsung bisa dipake buat trading beneran.",
    rating: 5,
  },
];

// ── FAQ ─────────────────────────────────────────
export const FAQS = [
  {
    q: "Apakah cocok untuk pemula yang belum pernah trading?",
    a: "Sangat cocok! Materi disusun dari nol, mulai dari dasar-dasar trading sampai strategi advanced. Kamu akan dibimbing step by step.",
  },
  {
    q: "Bagaimana cara mengakses materi setelah mendaftar?",
    a: "Setelah pembayaran dikonfirmasi, kamu akan langsung mendapat akses ke member area. Semua materi bisa diakses dari HP maupun laptop.",
  },
  {
    q: "Apakah ada garansi profit?",
    a: "Tidak ada yang bisa menjamin profit di trading. Yang kami berikan adalah edukasi, strategi, dan tools terbaik agar kamu bisa mengambil keputusan trading yang lebih baik.",
  },
  {
    q: "Bisa bayar pakai apa saja?",
    a: "Kami menerima transfer bank, e-wallet (OVO, GoPay, Dana), dan kartu kredit/debit melalui Xendit payment gateway.",
  },
];

// ── Final CTA section ───────────────────────────
export const FINAL_CTA = {
  headline: "Jadi Trader Profesional dan",
  headlineAccent: "Raih Profit Konsisten",
  desc: "Gabung sekarang bersama ribuan trader lainnya yang sudah membuktikan hasilnya bersama Cuanterus.",
  cta: "Daftar Sekarang",
};
