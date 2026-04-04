// ============================================================
// CUANTERUS — SEMUA KONTEN WEBSITE
// Edit file ini untuk ganti teks, harga, link, dll.
// Ga perlu sentuh file component-nya.
// ============================================================

// ── Link CTA utama ──────────────────────────────
// Ganti "#" ke URL A Member / Xendit lo yang beneran
export const CTA_LINK = "/register";

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
  badge: "Dipercaya 5,000+ Trader Indonesia",
  headline: "Belajar Trading yang",
  headlineAccent: "Terstruktur & Terbukti.",
  subtitle:
    "Dari nol jadi trader yang percaya diri ambil keputusan sendiri — dengan edukasi, mentor, dan komunitas yang mendukung.",
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
  { icon: "BookOpen", label: "Edukasi" },
  { icon: "Signal", label: "Market Outlook" },
  { icon: "Lightbulb", label: "Insight" },
  { icon: "Video", label: "Moonbag Live" },
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
    title: "Crypto Trader",
    desc: "Kuasai market crypto dari nol. Belajar analisa, strategi entry-exit, dan manajemen risiko khusus crypto.",
    audience: "Cocok buat: yang mau fokus belajar di market crypto.",
    tag: "Populer",
    ctaText: "Lihat Harga & Benefit",
    pricingTab: 1, // index of "Crypto Trading" tab
  },
  {
    title: "Forex Trader",
    desc: "Pelajari strategi trading forex yang proven. Dari reading chart sampai paham analisa di pair mayor.",
    audience: "Cocok buat: yang mau trading di market forex global.",
    tag: "Terlaris",
    ctaText: "Lihat Harga & Benefit",
    pricingTab: 0, // index of "Forex Trading" tab
    highlighted: true,
  },
  {
    title: "Cuantroopers",
    desc: "Paket lengkap: kursus crypto + forex, sinyal real-time, komunitas eksklusif, dan webinar mingguan.",
    audience: "Cocok buat: yang mau all-in dan serius jadi full-time trader.",
    tag: "Terlengkap",
    ctaText: "Lihat Harga & Benefit",
    pricingTab: 2, // index of "Cuantroopers" tab
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
    title: "Market Outlook Harian",
    desc: "Dapatkan analisa market dan outlook harian langsung ke device kamu. Disusun oleh tim analis profesional.",
  },
  {
    icon: "Lightbulb",
    title: "Insight dan Analisa yang Mendalam",
    desc: "Update market harian dan analisa teknikal yang membantu kamu mengambil keputusan trading yang tepat.",
    image: "/images/Image 04-04-26 at 12.00.jpeg",
  },
  {
    icon: "Video",
    title: "MOONBAG PRIVATE Live",
    desc: "Sesi live trading setiap weekdays, eksklusif untuk member Crypto Trader & Cuantroopers. Analisa market real-time bareng mentor.",
    image: "/images/private live.png",
  },
];

// ── Community section ───────────────────────────
export const COMMUNITY = {
  badge: "Komunitas",
  headline: "Komunitas Eksklusif",
  headlineAccent: "Khusus Member",
  desc: "Gabung dengan ribuan trader aktif. Diskusi market, sharing strategi, dan belajar bareng setiap hari di grup eksklusif Cuanterus.",
  cta: "Gabung Diskusi",
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
// GANTI HARGA & LINK DI SINI
export const PRICING_SECTION = {
  badge: "Harga",
  headline: "Investasi di Skill yang",
  headlineAccent: "Bertahan Seumur Hidup",
};

export const PRICING_PRODUCTS = [
  {
    tab: "Forex Trading",
    plans: [
      {
        name: "1 Bulan",
        originalPrice: "750.000",
        price: "700.000",
        popular: false,
        features: [
          "Market Outlook",
          "Discord Access to Forex Signal",
          "Discord Voice Chat Access",
          "Free Consultation",
        ],
        ctaLink: "/register",
      },
      {
        name: "3 Bulan",
        originalPrice: "2.150.000",
        price: "1.750.000",
        popular: false,
        features: [
          "Market Outlook",
          "Discord Access to Forex Signal",
          "Discord Voice Chat Access",
          "Free Consultation",
        ],
        ctaLink: "/register",
      },
      {
        name: "6 Bulan",
        originalPrice: "3.600.000",
        price: "2.950.000",
        popular: true,
        features: [
          "Market Outlook",
          "Discord Access to Forex Signal",
          "Discord Voice Chat Access",
          "Free Consultation",
        ],
        ctaLink: "/register",
      },
      {
        name: "12 Bulan",
        originalPrice: "6.600.000",
        price: "5.400.000",
        popular: false,
        features: [
          "Market Outlook",
          "Discord Access to Forex Signal",
          "Discord Voice Chat Access",
          "Free Consultation",
        ],
        ctaLink: "/register",
      },
    ],
  },
  {
    tab: "Crypto Trading",
    plans: [
      {
        name: "6 Bulan",
        originalPrice: "5.500.000",
        price: "4.500.000",
        popular: true,
        features: [
          "Market Outlook",
          "Discord Access to Crypto Signal",
          "Discord Voice Chat Access",
          "Access on Crypto Live Trading",
          "Free Consultation",
        ],
        ctaLink: "/register",
      },
      {
        name: "12 Bulan",
        originalPrice: "9.500.000",
        price: "7.700.000",
        popular: false,
        features: [
          "Market Outlook",
          "Discord Access to Crypto Signal",
          "Discord Voice Chat Access",
          "Access on Crypto Live Trading",
          "Free Consultation",
        ],
        ctaLink: "/register",
      },
    ],
  },
  {
    tab: "Cuantroopers",
    plans: [
      {
        name: "3 Bulan",
        originalPrice: "5.000.000",
        price: "4.200.000",
        popular: false,
        features: [
          "Market Outlook",
          "Discord Access to Forex & Crypto Signal",
          "Discord Voice Chat Access",
          "Access on Crypto & Forex Live Trading",
          "Monthly Webinar",
        ],
        ctaLink: "/register",
      },
      {
        name: "6 Bulan",
        originalPrice: "7.500.000",
        price: "6.300.000",
        popular: true,
        features: [
          "Market Outlook",
          "Discord Access to Forex & Crypto Signal",
          "Discord Voice Chat Access",
          "Access on Crypto & Forex Live Trading",
          "Monthly Webinar",
        ],
        ctaLink: "/register",
      },
      {
        name: "12 Bulan",
        originalPrice: "13.000.000",
        price: "10.500.000",
        popular: false,
        features: [
          "Market Outlook",
          "Discord Access to Forex & Crypto Signal",
          "Discord Voice Chat Access",
          "Access on Crypto & Forex Live Trading",
          "Monthly Webinar",
        ],
        ctaLink: "/register",
      },
    ],
  },
];

// ── Testimonials ────────────────────────────────
// GANTI KE TESTIMONIAL ASLI
export const TESTIMONIALS_SECTION = {
  badge: "Testimoni",
  headline: "Kata Mereka yang Sudah",
  headlineAccent: "Bergabung",
};

// GANTI KE TESTIMONIAL ASLI dengan foto & nama lengkap
export const TESTIMONIALS = [
  {
    name: "Andi Raharjo",
    duration: "Member 6 bulan",
    text: "Awalnya ga ngerti apa-apa soal trading. Setelah ikut Cuanterus, sekarang udah jauh lebih paham cara baca chart dan manage risiko. Materi dan komunitasnya top banget!",
    rating: 5,
  },
  {
    name: "Dewi Santika",
    duration: "Member 1 tahun",
    text: "Sinyal tradingnya membantu banget buat belajar. Gua yang kerja kantoran bisa tetap belajar trading tanpa harus mantau chart seharian.",
    rating: 5,
  },
  {
    name: "Budi Wicaksono",
    duration: "Member 4 bulan",
    text: "Webinar-nya informatif dan mentornya sabar banget jelasin. Komunitas juga aktif, jadi belajarnya ga sendirian. Sekarang udah berani open posisi sendiri.",
    rating: 4,
  },
  {
    name: "Rina Maharani",
    duration: "Member 8 bulan",
    text: "Udah coba beberapa kursus trading lain, tapi Cuanterus yang paling praktikal. Materinya langsung bisa dipahami dan diterapkan.",
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
    q: "Apa bedanya Crypto Trader, Forex Trader, dan Cuantroopers?",
    a: "Crypto Trader fokus ke edukasi dan sinyal di market crypto. Forex Trader fokus ke market forex. Cuantroopers adalah paket terlengkap yang mencakup keduanya plus akses live trading dan webinar bulanan.",
  },
  {
    q: "Bagaimana cara mengakses materi setelah mendaftar?",
    a: "Setelah pembayaran dikonfirmasi, kamu akan langsung mendapat akses ke member area dan Discord. Semua materi bisa diakses dari HP maupun laptop.",
  },
  {
    q: "Apakah ada garansi profit?",
    a: "Tidak. Cuanterus adalah platform edukasi, bukan layanan investasi. Kami tidak menjanjikan profit atau hasil tertentu. Yang kami berikan adalah edukasi, strategi, dan tools agar kamu bisa mengambil keputusan trading yang lebih baik.",
  },
  {
    q: "Berapa lama akses materinya?",
    a: "Akses materi mengikuti durasi paket yang kamu pilih (1, 3, 6, atau 12 bulan). Selama masa aktif, kamu bisa akses semua materi tanpa batas.",
  },
  {
    q: "Bisa bayar pakai apa saja?",
    a: "Kami menerima transfer bank, e-wallet (OVO, GoPay, Dana), dan kartu kredit/debit melalui Xendit payment gateway.",
  },
  {
    q: "Apakah bisa upgrade paket di tengah jalan?",
    a: "Bisa! Kamu bisa upgrade ke paket yang lebih tinggi kapan saja. Hubungi tim kami melalui Discord untuk info lebih lanjut.",
  },
];

// ── Final CTA section ───────────────────────────
export const FINAL_CTA = {
  headline: "Siap Belajar Trading",
  headlineAccent: "dengan Cara yang Benar?",
  desc: "Gabung sekarang bersama 5,000+ trader lainnya yang sudah belajar dan berkembang bersama Cuanterus.",
  cta: "Mulai Belajar Sekarang",
};
