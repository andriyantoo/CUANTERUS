"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  CTA_LINK,
  SOCIALS,
  HERO,
  FEATURES_SECTION,
  FEATURES,
  PROGRAMS_SECTION,
  PROGRAMS,
  MASTERCLASS,
  MASTERCLASS_FEATURES,
  COMMUNITY,
  ABOUT,
  PRICING_SECTION,
  PRICING_PRODUCTS,
  TESTIMONIALS_SECTION,
  TESTIMONIALS,
  FAQS,
  FINAL_CTA,
} from "@/lib/data";

// ── Colors ──────────────────────────────────────
const LIME = "#96FC03";
const DARK_BG = "#0A0A0F";
const DARK_CARD = "#131318";
const BORDER = "#222229";
const TEXT = "#F0F0F5";
const TEXT_SEC = "#8B949E";
const GOLD = "#F7B731";

// ═══════════════════════════════════════════════
//  HELPER COMPONENTS
// ═══════════════════════════════════════════════

function Section({
  children,
  className = "",
  id,
  style,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section id={id} className={`w-full px-4 md:px-8 ${className}`} style={style}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
      style={{ background: `${LIME}18`, color: LIME, border: `1px solid ${LIME}40` }}
    >
      {children}
    </span>
  );
}

function CTAButton({
  children,
  href = "#",
  secondary,
  small,
}: {
  children: ReactNode;
  href?: string;
  secondary?: boolean;
  small?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 hover:scale-[1.03] ${
        small ? "text-sm px-5 py-2.5" : "text-base px-7 py-3.5"
      }`}
      style={
        secondary
          ? { background: "transparent", color: TEXT, border: `1.5px solid ${BORDER}` }
          : { background: LIME, color: DARK_BG, boxShadow: `0 0 24px ${LIME}30` }
      }
    >
      {children}
    </a>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), {
      threshold: 0.15,
    });
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

function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return (
    <span ref={ref} className="font-mono font-bold" style={{ color: LIME }}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function Placeholder({ label = "", className = "" }: { label?: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl aspect-video ${className}`}
      style={{
        background: `linear-gradient(135deg, ${DARK_CARD} 0%, #1A1A22 100%)`,
        border: `1px solid ${BORDER}`,
        color: TEXT_SEC,
        fontSize: "13px",
      }}
    >
      {label}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b cursor-pointer" style={{ borderColor: BORDER }} onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between py-5">
        <h4 className="font-semibold text-base pr-4" style={{ color: TEXT }}>
          {q}
        </h4>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: TEXT_SEC, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s", flexShrink: 0 }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <div style={{ maxHeight: open ? "300px" : "0", overflow: "hidden", transition: "max-height 0.4s ease" }}>
        <p className="pb-5 text-sm leading-relaxed" style={{ color: TEXT_SEC }}>
          {a}
        </p>
      </div>
    </div>
  );
}

// ── Icon map ────────────────────────────────────
const ICON_MAP: Record<string, ReactNode> = {
  BookOpen: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Signal: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
    </svg>
  ),
  Lightbulb: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  ),
  Video: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  ),
  Users: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  ClipboardList: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  ),
  TrendingUp: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  ),
};

function Icon({ name }: { name: string }) {
  return <>{ICON_MAP[name] || null}</>;
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ═══════════════════════════════════════════════
//  PRICING SECTION (tabbed per product)
// ═══════════════════════════════════════════════

function PricingSection({ activeTab, setActiveTab }: { activeTab: number; setActiveTab: (i: number) => void }) {
  const activeProduct = PRICING_PRODUCTS[activeTab];

  return (
    <Section
      id="pricing"
      className="py-16 md:py-24"
      style={{ background: `linear-gradient(180deg, ${DARK_CARD} 0%, ${DARK_BG} 100%)` }}
    >
      <FadeIn>
        <div className="text-center mb-10">
          <Badge>{PRICING_SECTION.badge}</Badge>
          <h2 className="text-2xl md:text-3xl font-bold mt-4">
            {PRICING_SECTION.headline} <span style={{ color: LIME }}>{PRICING_SECTION.headlineAccent}</span>
          </h2>
        </div>
      </FadeIn>

      {/* ── Product tabs ── */}
      <FadeIn delay={0.1}>
        <div className="flex justify-center mb-10">
          <div
            className="inline-flex rounded-xl p-1 gap-1"
            style={{ background: DARK_CARD, border: `1px solid ${BORDER}` }}
          >
            {PRICING_PRODUCTS.map((product, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className="px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 uppercase tracking-wide"
                style={
                  activeTab === i
                    ? { background: LIME, color: DARK_BG }
                    : { background: "transparent", color: TEXT_SEC }
                }
              >
                {product.tab}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Plan cards ── */}
      <div
        className={`grid gap-6 max-w-5xl mx-auto ${
          activeProduct.plans.length === 2
            ? "md:grid-cols-2 max-w-3xl"
            : activeProduct.plans.length === 3
            ? "md:grid-cols-3 max-w-4xl"
            : "md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {activeProduct.plans.map((plan, i) => (
          <FadeIn key={`${activeTab}-${i}`} delay={i * 0.1}>
            <div
              className="glass-card p-6 md:p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 relative"
              style={
                plan.popular
                  ? { border: `2px solid ${LIME}`, boxShadow: `0 0 40px ${LIME}15` }
                  : {}
              }
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase px-4 py-1 rounded-full whitespace-nowrap"
                  style={{ background: LIME, color: DARK_BG }}
                >
                  Best Value
                </div>
              )}
              <h3 className="text-lg font-bold mb-4 uppercase">{plan.name}</h3>

              <div className="space-y-3 flex-1 mb-6">
                {plan.features.map((feat, fi) => (
                  <div key={fi} className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                      <CheckIcon />
                    </div>
                    <span className="text-sm" style={{ color: TEXT_SEC }}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              {/* original price (strikethrough) */}
              <div className="mb-1">
                <span
                  className="inline-block text-sm font-semibold line-through px-2 py-0.5 rounded"
                  style={{ background: "#dc262622", color: "#f87171" }}
                >
                  Rp. {plan.originalPrice}
                </span>
              </div>

              {/* actual price */}
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-xs font-medium" style={{ color: TEXT_SEC }}>
                  Rp.
                </span>
                <span
                  className="text-2xl sm:text-3xl font-extrabold font-mono"
                  style={{ color: plan.popular ? LIME : TEXT }}
                >
                  {plan.price}
                </span>
              </div>

              <CTAButton href={plan.ctaLink} small secondary={!plan.popular}>
                Daftar Sekarang
              </CTAButton>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════
//  MAIN HOMEPAGE
// ═══════════════════════════════════════════════

export default function Homepage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = ["Program", "Fitur", "Pricing", "Testimoni", "FAQ"];

  return (
    <div className="min-h-screen" style={{ background: DARK_BG, color: TEXT }}>
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
          <div className="flex items-center gap-2">
            <img
              src="/images/logo horizontal.png"
              alt="Cuanterus"
              className="h-10 md:h-12"
            />
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium transition-colors duration-200 hover:text-lime"
                style={{ color: TEXT_SEC }}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="text-sm font-medium transition-colors duration-200 hover:text-white"
              style={{ color: TEXT_SEC }}
            >
              Masuk
            </a>
            <CTAButton href={CTA_LINK} small>
              Daftar Sekarang
            </CTAButton>
          </div>

          <button
            className="md:hidden"
            style={{ color: TEXT }}
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {mobileMenu && (
          <div
            className="md:hidden px-4 pb-6 flex flex-col gap-4"
            style={{ background: `${DARK_BG}f5`, backdropFilter: "blur(16px)" }}
          >
            {navLinks.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-base font-medium py-2"
                style={{ color: TEXT_SEC }}
                onClick={() => setMobileMenu(false)}
              >
                {item}
              </a>
            ))}
            <a
              href="/login"
              className="text-base font-medium py-2"
              style={{ color: LIME }}
              onClick={() => setMobileMenu(false)}
            >
              Masuk
            </a>
            <CTAButton href={CTA_LINK} small>
              Daftar Sekarang
            </CTAButton>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <Section className="pt-32 md:pt-40 pb-16 md:pb-24 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${LIME}30 0%, transparent 70%)` }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <FadeIn>
            <Badge>{HERO.badge}</Badge>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mt-6 mb-6 tracking-tight">
              {HERO.headline} <span style={{ color: LIME }}>{HERO.headlineAccent}</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: TEXT_SEC }}>
              {HERO.subtitle}
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <CTAButton href={CTA_LINK}>{HERO.ctaPrimary}</CTAButton>
              <CTAButton href="#program" secondary>
                {HERO.ctaSecondary}
              </CTAButton>
            </div>
          </FadeIn>
          <FadeIn delay={0.4}>
            <div
              className="lime-glow max-w-3xl mx-auto rounded-2xl overflow-hidden flex items-center justify-center aspect-video"
              style={{
                background: `linear-gradient(135deg, ${DARK_CARD} 0%, #1A1A22 100%)`,
                border: `1px solid ${BORDER}`,
              }}
            >
              <div className="text-center px-8">
                <img src="/images/logo horizontal.png" alt="Cuanterus" className="h-12 md:h-16 mx-auto mb-4 opacity-60" />
                <p className="text-sm md:text-base" style={{ color: TEXT_SEC }}>
                  Platform Edukasi Trading Terlengkap di Indonesia
                </p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-10">
              {HERO.stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl md:text-2xl font-bold font-mono" style={{ color: LIME }}>
                    {s.value}
                  </div>
                  <div className="text-xs mt-1" style={{ color: TEXT_SEC }}>
                    {s.label}
                  </div>
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
            <Badge>{FEATURES_SECTION.badge}</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">
              {FEATURES_SECTION.headline} <span style={{ color: LIME }}>{FEATURES_SECTION.headlineAccent}</span>
            </h2>
          </div>
        </FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-6">
          {FEATURES.map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="glass-card p-4 md:p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Icon name={f.icon} />
                </div>
                <div className="text-xs md:text-sm font-semibold">{f.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ ABOUT / CREDIBILITY ═══ */}
      <Section className="py-16 md:py-24 relative overflow-hidden" style={{ background: DARK_CARD }}>
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${LIME} 0%, transparent 70%)` }}
        />
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 relative z-10">
            <div className="flex-1">
              <Badge>{ABOUT.badge}</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-4">
                {ABOUT.headline} <span style={{ color: LIME }}>{ABOUT.headlineAccent}</span> {ABOUT.headlineSuffix}
              </h2>
              <p className="text-sm md:text-base leading-relaxed mb-4" style={{ color: TEXT_SEC }}>
                {ABOUT.bio}
              </p>
              <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
                {ABOUT.bio2}
              </p>
              <div className="flex gap-6">
                {ABOUT.stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl">
                      <Counter end={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-xs mt-1" style={{ color: TEXT_SEC }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              {/* Social buttons */}
              <div className="flex items-center gap-3 mt-6 flex-wrap">
                <a href="http://instagram.com/andriyantoo" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]" style={{ background: "#E1306C15", color: "#E1306C", border: "1px solid #E1306C30" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                  Instagram
                </a>
                <a href="https://x.com/andricuanterus" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]" style={{ background: "#F0F0F515", color: "#F0F0F5", border: "1px solid #22222980" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter
                </a>
              </div>
            </div>
            <div className="flex-1 w-full max-w-sm">
              <img
                src="/images/Andriyanto.jpg"
                alt="Andriyanto — Financial Educator & Professional Trader"
                className="w-full rounded-2xl float-anim"
                style={{ border: `1px solid ${BORDER}` }}
              />
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ═══ PROGRAMS ═══ */}
      <Section id="program" className="py-16 md:py-24" style={{ background: DARK_CARD }}>
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>{PROGRAMS_SECTION.badge}</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">
              {PROGRAMS_SECTION.headline} <span style={{ color: LIME }}>{PROGRAMS_SECTION.headlineAccent}</span>
            </h2>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {PROGRAMS.map((p, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div className="glass-card p-6 md:p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1">
                <span
                  className="inline-block self-start text-xs font-bold uppercase px-2.5 py-1 rounded-md mb-4"
                  style={{
                    background: p.highlighted ? LIME : `${LIME}15`,
                    color: p.highlighted ? DARK_BG : LIME,
                  }}
                >
                  {p.tag}
                </span>
                <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>
                  {p.desc}
                </p>
                {p.audience && (
                  <p className="text-xs mt-2 font-medium flex-1" style={{ color: LIME, opacity: 0.8 }}>
                    {p.audience}
                  </p>
                )}
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setActiveTab(p.pricingTab);
                      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 hover:scale-[1.03] text-sm px-5 py-2.5`}
                    style={
                      p.highlighted
                        ? { background: LIME, color: DARK_BG, boxShadow: `0 0 24px ${LIME}30` }
                        : { background: "transparent", color: TEXT, border: `1.5px solid ${BORDER}` }
                    }
                  >
                    {p.ctaText}
                  </button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ MASTERCLASS ═══ */}
      <Section id="fitur" className="py-16 md:py-24">
        <FadeIn>
          <div className="text-center mb-4">
            <Badge>{MASTERCLASS.badge}</Badge>
            <h2 className="text-2xl md:text-4xl font-extrabold mt-4 tracking-tight">
              {MASTERCLASS.title}
              <br />
              <span className="gradient-text">{MASTERCLASS.titleAccent}</span>
            </h2>
          </div>
        </FadeIn>
        <div className="mt-16 space-y-20">
          {MASTERCLASS_FEATURES.map((f, i) => (
            <FadeIn key={i} delay={0.1}>
              <div
                className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8 md:gap-12`}
              >
                <div className="flex-1">
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                    style={{ background: `${LIME}15` }}
                  >
                    <Icon name={f.icon} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3">{f.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: TEXT_SEC }}>
                    {f.desc}
                  </p>
                </div>
                <div className="flex-1 w-full">
                  {f.image ? (
                    <img src={f.image} alt={f.title} className="w-full rounded-2xl" style={{ border: `1px solid ${BORDER}` }} />
                  ) : f.title === "Komprehensif" ? (
                    <div className="rounded-2xl p-6 md:p-8" style={{ background: `linear-gradient(135deg, ${DARK_CARD} 0%, #1A1A22 100%)`, border: `1px solid ${BORDER}` }}>
                      <div className="space-y-3">
                        {[
                          { level: "Basic", topics: "Pengenalan Trading, Cara Baca Chart, Candlestick Pattern", pct: "30%" },
                          { level: "Intermediate", topics: "Risk Management, Technical Analysis, Support & Resistance", pct: "65%" },
                          { level: "Advanced", topics: "Price Action, Multi-Timeframe, Trading Psychology", pct: "100%" },
                        ].map((item, idx) => (
                          <div key={idx}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${LIME}15`, color: LIME }}>{item.level}</span>
                                <span className="text-xs" style={{ color: TEXT_SEC }}>{item.topics}</span>
                              </div>
                            </div>
                            <div className="w-full bg-[#222229] rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: item.pct, background: `linear-gradient(90deg, ${LIME}, #3B82F6)` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex items-center gap-4 flex-wrap">
                        {["Video", "PDF", "Quiz", "Live Session"].map((tag) => (
                          <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: `${LIME}10`, color: LIME, border: `1px solid ${LIME}20` }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  ) : f.title === "Market Outlook Harian" ? (
                    <div className="rounded-2xl p-6 md:p-8" style={{ background: `linear-gradient(135deg, ${DARK_CARD} 0%, #1A1A22 100%)`, border: `1px solid ${BORDER}` }}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-bold" style={{ color: LIME }}>DAILY UPDATE</span>
                        <span className="text-[10px]" style={{ color: TEXT_SEC }}>Setiap hari kerja</span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { pair: "BTC/USDT", dir: "Bullish", color: "#22C55E" },
                          { pair: "ETH/USDT", dir: "Bearish", color: "#EF4444" },
                          { pair: "EUR/USD", dir: "Bullish", color: "#22C55E" },
                          { pair: "XAU/USD", dir: "Neutral", color: "#F59E0B" },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b" style={{ borderColor: BORDER }}>
                            <span className="text-sm font-semibold" style={{ color: TEXT }}>{item.pair}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-4 rounded-sm overflow-hidden flex items-end gap-px">
                                {Array.from({ length: 8 }).map((_, bi) => (
                                  <div key={bi} className="flex-1 rounded-t-sm" style={{
                                    height: `${Math.random() * 100}%`,
                                    minHeight: "20%",
                                    background: item.color + "60",
                                  }} />
                                ))}
                              </div>
                              <span className="text-xs font-bold" style={{ color: item.color }}>{item.dir}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] mt-4" style={{ color: TEXT_SEC }}>Analisa lengkap tersedia di member area</p>
                    </div>
                  ) : (
                    <Placeholder label={`📸 ${f.title}`} />
                  )}
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
              <div
                className="rounded-2xl overflow-hidden flex items-center justify-center aspect-video"
                style={{
                  background: `linear-gradient(135deg, #5865F2 0%, #3B82F6 100%)`,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div className="text-center px-8">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="white" className="mx-auto mb-3 opacity-90">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <p className="text-white font-bold text-lg">5,000+ Trader Aktif</p>
                  <p className="text-white/70 text-sm mt-1">Diskusi & belajar bareng setiap hari</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <Badge>{COMMUNITY.badge}</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-4">
                {COMMUNITY.headline} <span style={{ color: LIME }}>{COMMUNITY.headlineAccent}</span>
              </h2>
              <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
                {COMMUNITY.desc}
              </p>
              <CTAButton href={CTA_LINK} small>
                {COMMUNITY.cta}
              </CTAButton>
            </div>
          </div>
        </FadeIn>
      </Section>

      <div className="glow-line" />

      {/* ═══ TRADING TOOLS ═══ */}
      <Section className="py-16 md:py-24">
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>Premium Tools</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-4">
              Trading Tools yang Bikin Kamu{" "}
              <span style={{ color: LIME }}>Lebih Profitable</span>
            </h2>
            <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
              Akses tools premium yang dirancang khusus untuk membantu kamu mengambil keputusan trading lebih cerdas dan terukur.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
                  </svg>
                ),
                title: "Position Sizing Calculator",
                desc: "Hitung lot size yang tepat berdasarkan balance, risk %, dan stop loss. Tidak perlu kalkulasi manual lagi.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                ),
                title: "Trading Journal",
                desc: "Catat setiap trade, lacak win rate, P&L, dan analisa performa kamu. Terintegrasi dengan chart TradingView.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
                  </svg>
                ),
                title: "Compound Calculator",
                desc: "Simulasi pertumbuhan akun dengan compounding. Auto-import data dari Trading Journal untuk proyeksi realistis.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ),
                title: "Economic Calendar",
                desc: "Jadwal rilis data ekonomi high-impact: NFP, FOMC, CPI, dan 30+ event penting lainnya. Filter by currency & impact.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
                title: "Currency Strength Meter",
                desc: "Lihat kekuatan relatif 8 mata uang utama secara real-time. Temukan pair terbaik untuk di-trade hari ini.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                  </svg>
                ),
                title: "Live TradingView Chart",
                desc: "Chart TradingView terintegrasi langsung di Trading Journal. Analisa chart sambil catat trade tanpa buka tab baru.",
              },
            ].map((tool, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: DARK_CARD,
                  border: `1px solid ${BORDER}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${LIME}30`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${LIME}12`, color: LIME }}
                >
                  {tool.icon}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: TEXT }}>
                  {tool.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <CTAButton href={CTA_LINK} small>
              Akses Semua Tools
            </CTAButton>
          </div>
        </FadeIn>
      </Section>

      <div className="glow-line" />

      {/* ═══ PRICING ═══ */}
      <PricingSection activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ═══ TESTIMONIALS ═══ */}
      <Section id="testimoni" className="py-16 md:py-24">
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>{TESTIMONIALS_SECTION.badge}</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">
              {TESTIMONIALS_SECTION.headline}{" "}
              <span style={{ color: LIME }}>{TESTIMONIALS_SECTION.headlineAccent}</span>
            </h2>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="glass-card p-6 md:p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <StarIcon key={si} />
                  ))}
                </div>
                <p className="text-sm md:text-base leading-relaxed mb-5" style={{ color: TEXT_SEC }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: `${LIME}15`, color: LIME }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <span className="font-semibold text-sm">{t.name}</span>
                    {t.duration && (
                      <div className="text-xs" style={{ color: TEXT_SEC }}>{t.duration}</div>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Discord Testimonial Button */}
        <FadeIn delay={0.3}>
          <div className="text-center mt-10">
            <a
              href="https://discord.gg/qSD3aHYp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 rounded-2xl font-bold text-base md:text-lg transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: LIME,
                color: DARK_BG,
                boxShadow: `0 4px 24px ${LIME}30`,
              }}
            >
              Lihat Testimoni Member Sepenuhnya Disini
            </a>
          </div>
        </FadeIn>
      </Section>

      <div className="glow-line" />

      {/* ═══ FAQ ═══ */}
      <Section id="faq" className="py-16 md:py-24" style={{ background: DARK_CARD }}>
        <FadeIn>
          <div className="text-center mb-12">
            <Badge>FAQ</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4">Pertanyaan yang Sering Ditanyakan</h2>
          </div>
        </FadeIn>
        <div className="max-w-2xl mx-auto">
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <FAQItem q={faq.q} a={faq.a} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ QUOTE ═══ */}
      <Section className="py-16 md:py-24" style={{ background: DARK_CARD }}>
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="relative px-8 py-12 md:px-16 md:py-16 rounded-2xl"
              style={{ border: `1px solid ${BORDER}`, background: `linear-gradient(135deg, ${DARK_BG} 0%, ${DARK_CARD} 100%)` }}
            >
              <div
                className="absolute top-4 left-6 text-6xl md:text-8xl font-serif leading-none opacity-20"
                style={{ color: LIME }}
              >
                &ldquo;
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold leading-snug mb-6" style={{ color: TEXT }}>
                If you don&apos;t find a way to{" "}
                <span style={{ color: LIME }}>make money while you sleep</span>,
                you will work until you die.
              </p>
              <p className="text-base md:text-lg font-medium" style={{ color: TEXT_SEC }}>
                — Warren Buffett
              </p>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ═══ FINAL CTA ═══ */}
      <Section className="py-16 md:py-24 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${LIME}08 0%, transparent 60%)` }}
        />
        <FadeIn>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4">
              {FINAL_CTA.headline}
              <br />
              <span style={{ color: LIME }}>{FINAL_CTA.headlineAccent}</span>
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto mb-8" style={{ color: TEXT_SEC }}>
              {FINAL_CTA.desc}
            </p>
            <CTAButton href={CTA_LINK}>{FINAL_CTA.cta}</CTAButton>
          </div>
        </FadeIn>
      </Section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t" style={{ borderColor: BORDER, background: DARK_CARD }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <img
                  src="/images/logo horizontal.png"
                  alt="Cuanterus"
                  className="h-8"
                />
              </div>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: TEXT_SEC }}>
                Platform edukasi trading terlengkap di Indonesia. Belajar dari mentor berpengalaman dengan kurikulum
                terstruktur.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: LIME }}>
                Menu
              </h4>
              <div className="space-y-2">
                {navLinks.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block text-sm"
                    style={{ color: TEXT_SEC }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: LIME }}>
                Sosial Media
              </h4>
              <div className="space-y-3">
                <a href={SOCIALS.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm hover:text-[#F0F0F5] transition-colors" style={{ color: TEXT_SEC }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </a>
                <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm hover:text-[#F0F0F5] transition-colors" style={{ color: TEXT_SEC }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                  Instagram
                </a>
                <a href={SOCIALS.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm hover:text-[#F0F0F5] transition-colors" style={{ color: TEXT_SEC }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  TikTok
                </a>
                <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm hover:text-[#F0F0F5] transition-colors" style={{ color: TEXT_SEC }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.373-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  Discord
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t" style={{ borderColor: BORDER }}>
            <p className="text-[10px] leading-relaxed mb-4" style={{ color: TEXT_SEC }}>
              Cuanterus adalah platform edukasi dan komunitas seputar investasi, crypto, forex, dan makroekonomi. Kami tidak menyediakan layanan pinjaman, P2P lending, pengelolaan dana, maupun jasa keuangan berizin. Seluruh informasi yang diberikan bersifat edukasi dan bukan merupakan saran investasi personal. Kami juga tidak pernah menawarkan produk pinjaman, investasi, ataupun profit secara pribadi. Apabila ada pihak yang menghubungi Anda dan mengaku dari Cuanterus untuk tujuan tersebut, berarti itu adalah pihak yang mengatasnamakan kami.
            </p>
            <p className="text-center text-xs" style={{ color: TEXT_SEC }}>
              © {new Date().getFullYear()} Cuanterus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ═══ FLOATING DISCORD BUTTON ═══ */}
      <a
        href={SOCIALS.discord}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 pl-3.5 pr-5 py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg"
        style={{
          background: "#5865F2",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(88, 101, 242, 0.4)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        Gabung Komunitas
      </a>
    </div>
  );
}
