import { useState, useEffect, useRef } from "react";

const LIME = "#96FC03";
const DARK_BG = "#0A0A0F";
const DARK_CARD = "#131318";
const DARK_CARD2 = "#1A1A22";
const BORDER = "#222229";
const TEXT = "#F0F0F5";
const TEXT_SEC = "#8B949E";
const GOLD = "#F7B731";

/* ── tiny helpers ─────────────────────────────── */
const Section = ({ children, className = "", id, style }) => (
  <section id={id} className={`w-full px-4 md:px-8 ${className}`} style={style}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const Badge = ({ children }) => (
  <span
    className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
    style={{ background: `${LIME}18`, color: LIME, border: `1px solid ${LIME}40` }}
  >
    {children}
  </span>
);

const CTAButton = ({ children, href = "#", secondary, small }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 ${small ? "text-sm px-5 py-2.5" : "text-base px-7 py-3.5"}`}
    style={
      secondary
        ? { background: "transparent", color: TEXT, border: `1.5px solid ${BORDER}` }
        : {
            background: LIME,
            color: "#0A0A0F",
            boxShadow: `0 0 24px ${LIME}30`,
          }
    }
    onMouseOver={(e) => {
      if (!secondary) e.currentTarget.style.boxShadow = `0 0 40px ${LIME}50`;
      else e.currentTarget.style.borderColor = LIME;
    }}
    onMouseOut={(e) => {
      if (!secondary) e.currentTarget.style.boxShadow = `0 0 24px ${LIME}30`;
      else e.currentTarget.style.borderColor = BORDER;
    }}
  >
    {children}
  </a>
);

/* ── animated counter ────────────────────── */
function Counter({ end, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className="font-mono font-bold" style={{ color: LIME, fontFamily: "'JetBrains Mono', monospace" }}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── fade-in on scroll ────────────────────── */
function FadeIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ── icon components (Lucide-style SVG) ────── */
const Icons = {
  BookOpen: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  ),
  Signal: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
  ),
  Lightbulb: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
  ),
  Video: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
  ),
  Users: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  ClipboardList: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
  ),
  TrendingUp: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  ),
  ChevronDown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
  ),
  X: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
};

/* ── FAQ Accordion ────────────────────── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b cursor-pointer"
      style={{ borderColor: BORDER }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between py-5">
        <h4 className="font-semibold text-base pr-4" style={{ color: TEXT }}>{q}</h4>
        <span
          style={{ color: TEXT_SEC, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }}
        >
          <Icons.ChevronDown />
        </span>
      </div>
      <div
        style={{
          maxHeight: open ? "300px" : "0",
          overflow: "hidden",
          transition: "max-height 0.4s ease",
        }}
      >
        <p className="pb-5 text-sm leading-relaxed" style={{ color: TEXT_SEC }}>{a}</p>
      </div>
    </div>
  );
}

/* ── placeholder image helper ────────── */
const Placeholder = ({ w = 400, h = 300, label = "", className = "" }) => (
  <div
    className={`flex items-center justify-center rounded-2xl ${className}`}
    style={{
      width: "100%",
      aspectRatio: `${w}/${h}`,
      background: `linear-gradient(135deg, ${DARK_CARD} 0%, ${DARK_CARD2} 100%)`,
      border: `1px solid ${BORDER}`,
      color: TEXT_SEC,
      fontSize: "13px",
    }}
  >
    {label || `${w}×${h}`}
  </div>
);

/* ══════════════════════════════════════════ */
/*               MAIN COMPONENT              */
/* ══════════════════════════════════════════ */
export default function CuanterusHome() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── data ────────────────────── */
  const features = [
    { icon: <Icons.BookOpen />, label: "Kursus" },
    { icon: <Icons.Signal />, label: "Sinyal" },
    { icon: <Icons.Lightbulb />, label: "Insight" },
    { icon: <Icons.Video />, label: "Webinar" },
    { icon: <Icons.Users />, label: "Komunitas" },
    { icon: <Icons.ClipboardList />, label: "Trading Log" },
  ];

  const programs = [
    {
      title: "Smart Triggers",
      desc: "Sinyal trading otomatis langsung ke HP kamu. Cocok buat yang ga punya waktu mantau chart seharian.",
      tag: "Populer",
    },
    {
      title: "Panen Trading",
      desc: "Belajar strategi trading dari nol sampai bisa profit konsisten. Full video + mentoring.",
      tag: "Best Seller",
    },
    {
      title: "Komplet Trading",
      desc: "Paket lengkap: kursus + sinyal + komunitas + webinar. Semua yang kamu butuhkan dalam satu paket.",
      tag: "Terlengkap",
    },
  ];

  const masterclassFeatures = [
    {
      title: "Komprehensif",
      desc: "Materi trading lengkap dari basic sampai advanced, disusun secara sistematis agar mudah dipahami.",
      icon: <Icons.BookOpen />,
    },
    {
      title: "Sinyal Trading Real-Time",
      desc: "Dapatkan sinyal entry dan exit langsung ke device kamu. Analisa sudah dilakukan oleh tim profesional.",
      icon: <Icons.TrendingUp />,
    },
    {
      title: "Insight dan Analisa yang Mendalam",
      desc: "Update market harian dan analisa teknikal yang membantu kamu mengambil keputusan trading yang tepat.",
      icon: <Icons.Lightbulb />,
    },
    {
      title: "Webinar yang Rutin Diadakan",
      desc: "Sesi live bersama mentor setiap minggu. Tanya jawab langsung dan review trading bersama.",
      icon: <Icons.Video />,
    },
  ];

  const pricingPlans = [
    { name: "1 Bulan", price: "499.000", period: "/bulan", features: ["Akses semua kursus", "Sinyal trading", "Grup komunitas", "Weekly webinar"] },
    { name: "3 Bulan", price: "399.000", period: "/bulan", popular: true, features: ["Semua fitur 1 Bulan", "Hemat 20%", "Priority support", "Bonus materi eksklusif"] },
    { name: "12 Bulan", price: "249.000", period: "/bulan", features: ["Semua fitur 3 Bulan", "Hemat 50%", "1-on-1 mentoring", "Lifetime community access"] },
  ];

  const testimonials = [
    { name: "Andi R.", text: "Awalnya ga ngerti apa-apa soal trading. Setelah ikut program Cuanterus, sekarang udah bisa profit konsisten. Materi dan komunitasnya top banget!", rating: 5 },
    { name: "Dewi S.", text: "Sinyal tradingnya akurat banget. Gua yang kerja kantoran bisa tetap trading tanpa harus mantau chart seharian. Recommended!", rating: 5 },
    { name: "Budi W.", text: "Webinar-nya informatif dan mentornya sabar banget jelasin. Komunitas juga aktif, jadi belajarnya ga sendirian.", rating: 5 },
    { name: "Rina M.", text: "Udah coba beberapa kursus trading lain, tapi Cuanterus yang paling praktikal. Langsung bisa dipake buat trading beneran.", rating: 5 },
  ];

  const faqs = [
    { q: "Apakah cocok untuk pemula yang belum pernah trading?", a: "Sangat cocok! Materi disusun dari nol, mulai dari dasar-dasar trading sampai strategi advanced. Kamu akan dibimbing step by step." },
    { q: "Bagaimana cara mengakses materi setelah mendaftar?", a: "Setelah pembayaran dikonfirmasi, kamu akan langsung mendapat akses ke member area. Semua materi bisa diakses dari HP maupun laptop." },
    { q: "Apakah ada garansi profit?", a: "Tidak ada yang bisa menjamin profit di trading. Yang kami berikan adalah edukasi, strategi, dan tools terbaik agar kamu bisa mengambil keputusan trading yang lebih baik." },
    { q: "Bisa bayar pakai apa saja?", a: "Kami menerima transfer bank, e-wallet (OVO, GoPay, Dana), dan kartu kredit/debit melalui Xendit payment gateway." },
  ];

  const CTA_LINK = "#"; // Replace with actual A Member / Xendit link

  return (
    <div style={{ background: DARK_BG, color: TEXT, fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        ::selection { background: ${LIME}40; color: ${TEXT}; }
        .glow-line { height: 1px; background: linear-gradient(90deg, transparent, ${LIME}60, transparent); }
        .glass-card {
          background: linear-gradient(135deg, ${DARK_CARD}cc, ${DARK_CARD2}99);
          backdrop-filter: blur(12px);
          border: 1px solid ${BORDER};
          border-radius: 16px;
        }
        .glass-card:hover { border-color: ${LIME}30; }
        .gradient-text {
          background: linear-gradient(135deg, ${TEXT} 0%, ${LIME} 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .float-anim { animation: float 4s ease-in-out infinite; }
        .lime-glow { box-shadow: 0 0 60px ${LIME}15, 0 0 120px ${LIME}08; }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? `${DARK_BG}ee` : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? `1px solid ${BORDER}` : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: LIME, color: DARK_BG }}>
              C
            </div>
            <span className="font-bold text-lg" style={{ color: TEXT }}>cuanterus</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Program", "Fitur", "Pricing", "Testimoni", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: TEXT_SEC }}
                onMouseOver={(e) => (e.target.style.color = LIME)}
                onMouseOut={(e) => (e.target.style.color = TEXT_SEC)}
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <CTAButton href={CTA_LINK} small>Daftar Sekarang</CTAButton>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden" style={{ color: TEXT }} onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <Icons.X /> : <Icons.Menu />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenu && (
          <div className="md:hidden px-4 pb-6 flex flex-col gap-4" style={{ background: `${DARK_BG}f5`, backdropFilter: "blur(16px)" }}>
            {["Program", "Fitur", "Pricing", "Testimoni", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-base font-medium py-2" style={{ color: TEXT_SEC }} onClick={() => setMobileMenu(false)}>
                {item}
              </a>
            ))}
            <CTAButton href={CTA_LINK} small>Daftar Sekarang</CTAButton>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <Section className="pt-32 md:pt-40 pb-16 md:pb-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${LIME}30 0%, transparent 70%)` }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <FadeIn>
            <Badge>Trading Education Platform #1</Badge>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mt-6 mb-6 tracking-tight">
              Strategi Profit Konsisten dari Trading{" "}
              <span style={{ color: LIME }}>Meskipun Market Sedang Merah</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: TEXT_SEC }}>
              Cuanterus bantu kamu belajar trading dari nol, dengan kurikulum terstruktur, sinyal real-time, dan komunitas trader yang aktif.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <CTAButton href={CTA_LINK}>Mulai Belajar Sekarang</CTAButton>
              <CTAButton href="#program" secondary>Lihat Program →</CTAButton>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <Placeholder w={900} h={480} label="📺 Hero Image / Video Preview" className="lime-glow mx-auto max-w-3xl" />
          </FadeIn>

          {/* Social proof strip */}
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-10">
              {[
                { label: "Followers", val: "100K+" },
                { label: "Students", val: "5,000+" },
                { label: "Rating", val: "4.9/5" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl md:text-2xl font-bold" style={{ color: LIME, fontFamily: "'JetBrains Mono', monospace" }}>{item.val}</div>
                  <div className="text-xs mt-1" style={{ color: TEXT_SEC }}>{item.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </Section>

      <div className="glow-line" />

      {/* ═══ FEATURES ICONS ═══ */}
      <Section className="py-16 md:py-24">
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>Platform</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">
              Platform untuk Kamu yang Siap Belajar Menjadi{" "}
              <span style={{ color: LIME }}>Trader Profesional</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="glass-card p-4 md:p-6 text-center transition-all duration-300 cursor-default">
                <div className="flex justify-center mb-3">{f.icon}</div>
                <div className="text-xs md:text-sm font-semibold" style={{ color: TEXT }}>{f.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ PROGRAMS ═══ */}
      <Section id="program" className="py-16 md:py-24" style={{ background: DARK_CARD }}>
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>Program</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">
              Kita Menyediakan Program yang Sesuai{" "}
              <span style={{ color: LIME }}>dengan Kebutuhan Kamu</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {programs.map((p, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div className="glass-card p-6 md:p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="text-xs font-bold uppercase px-2.5 py-1 rounded-md"
                    style={{
                      background: i === 1 ? LIME : `${LIME}15`,
                      color: i === 1 ? DARK_BG : LIME,
                    }}
                  >
                    {p.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: TEXT_SEC }}>{p.desc}</p>
                <div className="mt-6">
                  <CTAButton href={CTA_LINK} small secondary={i !== 1}>
                    {i === 1 ? "Daftar Sekarang" : "Lihat Detail"}
                  </CTAButton>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ MASTERCLASS / FEATURES ═══ */}
      <Section id="fitur" className="py-16 md:py-24">
        <FadeIn>
          <div className="text-center mb-4">
            <Badge>Masterclass</Badge>
            <h2 className="text-2xl md:text-4xl font-extrabold mt-4 tracking-tight">
              CUANTERUS TRADING<br />
              <span className="gradient-text">MASTERCLASS</span>
            </h2>
          </div>
        </FadeIn>

        <div className="mt-16 space-y-20">
          {masterclassFeatures.map((f, i) => (
            <FadeIn key={i} delay={0.1}>
              <div className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8 md:gap-12`}>
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: `${LIME}15` }}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3">{f.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: TEXT_SEC }}>{f.desc}</p>
                </div>
                <div className="flex-1 w-full">
                  <Placeholder w={500} h={320} label={`📸 ${f.title}`} />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <div className="glow-line" />

      {/* ═══ COMMUNITY ═══ */}
      <Section className="py-16 md:py-24" style={{ background: DARK_CARD }}>
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 w-full">
              <Placeholder w={500} h={350} label="📸 Komunitas Preview" />
            </div>
            <div className="flex-1">
              <Badge>Komunitas</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-4">
                Komunitas Eksklusif <span style={{ color: LIME }}>Khusus Member</span>
              </h2>
              <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
                Gabung dengan ribuan trader aktif. Diskusi market, sharing strategi, dan belajar bareng setiap hari di grup eksklusif Cuanterus.
              </p>
              <CTAButton href={CTA_LINK} small>Gabung Komunitas</CTAButton>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ═══ CREDIBILITY / ABOUT ═══ */}
      <Section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle, ${LIME} 0%, transparent 70%)` }} />
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 relative z-10">
            <div className="flex-1">
              <Badge>Mentor</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-4">
                Belajar dari <span style={{ color: LIME }}>8+ Tahun Pengalaman</span> di Dunia Trading
              </h2>
              <p className="text-sm md:text-base leading-relaxed mb-4" style={{ color: TEXT_SEC }}>
                Andriyanto — Financial Educator & Professional Trader. Certified Futures Advisor dengan pengalaman trading di crypto, forex, dan futures sejak 2017.
              </p>
              <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
                Misi gua sederhana: bikin trading itu accessible dan gampang dipahami buat siapa aja, terutama pemula yang baru mulai.
              </p>
              <div className="flex gap-6">
                {[
                  { val: <Counter end={8} suffix="+" />, label: "Tahun Trading" },
                  { val: <Counter end={5000} suffix="+" />, label: "Students" },
                  { val: <Counter end={100} suffix="K+" />, label: "Followers" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl">{s.val}</div>
                    <div className="text-xs mt-1" style={{ color: TEXT_SEC }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full max-w-sm">
              <Placeholder w={400} h={500} label="📸 Foto Andriyanto" className="float-anim" />
            </div>
          </div>
        </FadeIn>
      </Section>

      <div className="glow-line" />

      {/* ═══ PRICING ═══ */}
      <Section id="pricing" className="py-16 md:py-24" style={{ background: `linear-gradient(180deg, ${DARK_CARD} 0%, ${DARK_BG} 100%)` }}>
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>Pricing</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">
              Join dan <span style={{ color: LIME }}>Daftar Sekarang!</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div
                className="glass-card p-6 md:p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 relative"
                style={plan.popular ? { border: `2px solid ${LIME}`, boxShadow: `0 0 40px ${LIME}15` } : {}}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase px-4 py-1 rounded-full"
                    style={{ background: LIME, color: DARK_BG }}
                  >
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-xs" style={{ color: TEXT_SEC }}>Rp</span>
                  <span className="text-3xl font-extrabold" style={{ fontFamily: "'JetBrains Mono', monospace", color: plan.popular ? LIME : TEXT }}>
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: TEXT_SEC }}>{plan.period}</span>
                </div>
                <div className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feat, fi) => (
                    <div key={fi} className="flex items-center gap-2">
                      <Icons.Check />
                      <span className="text-sm" style={{ color: TEXT_SEC }}>{feat}</span>
                    </div>
                  ))}
                </div>
                <CTAButton href={CTA_LINK} small secondary={!plan.popular}>
                  Daftar Sekarang
                </CTAButton>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ TESTIMONIALS ═══ */}
      <Section id="testimoni" className="py-16 md:py-24">
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>Testimoni</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">
              Dengar Apa Kata Mereka{" "}
              <span style={{ color: LIME }}>Setelah Bergabung</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="glass-card p-6 md:p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Icons.Star key={si} />
                  ))}
                </div>
                <p className="text-sm md:text-base leading-relaxed mb-5" style={{ color: TEXT_SEC }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: `${LIME}15`, color: LIME }}
                  >
                    {t.name[0]}
                  </div>
                  <span className="font-semibold text-sm">{t.name}</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <div className="glow-line" />

      {/* ═══ FAQ ═══ */}
      <Section id="faq" className="py-16 md:py-24" style={{ background: DARK_CARD }}>
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>FAQ</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">Frequently Asked Questions</h2>
          </div>
        </FadeIn>
        <div className="max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <FAQItem q={faq.q} a={faq.a} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ FINAL CTA ═══ */}
      <Section className="py-16 md:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${LIME}08 0%, transparent 60%)` }} />
        <FadeIn>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4">
              Jadi Trader Profesional dan<br />
              <span style={{ color: LIME }}>Raih Profit Konsisten</span>
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto mb-8" style={{ color: TEXT_SEC }}>
              Gabung sekarang bersama ribuan trader lainnya yang sudah membuktikan hasilnya bersama Cuanterus.
            </p>
            <CTAButton href={CTA_LINK}>Daftar Sekarang</CTAButton>
          </div>
        </FadeIn>
      </Section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t" style={{ borderColor: BORDER, background: DARK_CARD }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: LIME, color: DARK_BG }}>C</div>
                <span className="font-bold text-lg">cuanterus</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: TEXT_SEC }}>
                Platform edukasi trading terlengkap di Indonesia. Belajar dari mentor berpengalaman dengan kurikulum terstruktur.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: LIME }}>Quick Links</h4>
              <div className="space-y-2">
                {["Program", "Fitur", "Pricing", "Testimoni", "FAQ"].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="block text-sm transition-colors" style={{ color: TEXT_SEC }}>{item}</a>
                ))}
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: LIME }}>Connect</h4>
              <div className="space-y-2">
                {[
                  { label: "YouTube", url: "https://youtube.com/cuanterus" },
                  { label: "TikTok", url: "https://tiktok.com/@andricuanterus" },
                  { label: "Instagram", url: "https://instagram.com/andriyantoo" },
                  { label: "Discord", url: "https://discord.gg/cuanterus" },
                ].map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="block text-sm transition-colors" style={{ color: TEXT_SEC }}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t text-center text-xs" style={{ borderColor: BORDER, color: TEXT_SEC }}>
            © 2026 Cuanterus. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
