import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Menu, X, ArrowRight, Compass, FileCode2, Send, BrainCircuit,
  AlertTriangle, Target, Map, XCircle, ScanSearch, Fingerprint, Sparkles,
  ChevronDown, CheckCircle2, TrendingUp, Brain, MessageSquareText, Lightbulb,
  Activity, Code2, ScanLine, Eye, Clock, LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "./Landing.css";

/* ============================================================
   AlgoAI — Landing Page (single-file version)
   All sections below are plain function declarations (hoisted),
   composed together in the default-exported `Landing` component
   at the very bottom of this file.
   ============================================================ */

// ---------- from ScrollReveal.tsx ----------
interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}

/**
 * Small wrapper that fades + slides content into view as the user scrolls.
 * Respects prefers-reduced-motion via Landing.css (durations collapse to ~0).
 */
function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------- from LandingNavbar.tsx ----------
const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "AI Intelligence", id: "ai-intelligence" },
  { label: "Practice", id: "practice" },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const initial = (user?.name?.trim()?.[0] || user?.email?.trim()?.[0] || "U").toUpperCase();
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Account";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".landing-profile-dropdown-container")) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    setMobileOpen(false);
    logout();
    navigate("/");
  };

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    scrollToId(id);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(5, 7, 13, 0.72)" : "rgba(5, 7, 13, 0.15)",
        backdropFilter: "blur(16px)",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-[1180px] mx-auto px-5 md:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Zap size={20} style={{ color: "#ff6500" }} fill="#ff6500" />
          <span className="font-bold text-[17px] tracking-tight" style={{ color: "#f1f5f9" }}>
            AlgoAI
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="px-4 py-2 text-[13.5px] font-medium rounded-lg transition-colors cursor-pointer"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="relative landing-profile-dropdown-container">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
                  style={{ background: "rgba(0, 212, 255, 0.06)", border: "1px solid rgba(0, 212, 255, 0.25)" }}
                  title={displayName}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px]"
                    style={{
                      background: "linear-gradient(135deg, #ff6500, #a855f7)",
                      color: "#060a12",
                    }}
                  >
                    {initial}
                  </span>
                  <span className="text-[13px] font-medium max-w-[110px] truncate" style={{ color: "#e2e8f0" }}>
                    {displayName}
                  </span>
                  <ChevronDown
                    size={13}
                    style={{
                      color: "#64748b",
                      transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden"
                      style={{
                        background: "rgba(8, 11, 20, 0.98)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 20px 50px -12px rgba(0,0,0,0.6)",
                        zIndex: 100,
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="text-[13.5px] font-semibold truncate" style={{ color: "#f1f5f9" }}>
                          {user?.name || "User"}
                        </div>
                        <div className="text-[11.5px] truncate" style={{ color: "#64748b" }}>
                          {user?.email || "user@example.com"}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors"
                        style={{ fontSize: "13.5px", fontWeight: 500, color: "#cbd5e1" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        Go to Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors"
                        style={{ fontSize: "13.5px", fontWeight: 600, color: "#f87171" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => navigate("/dashboard")} className="landing-btn-primary !py-2.5 !px-5 !text-[13.5px]">
                Go to Dashboard →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-[13.5px] font-semibold rounded-lg transition-colors cursor-pointer"
                style={{ color: "#e2e8f0" }}
              >
                Login
              </button>
              <button onClick={() => navigate("/signup")} className="landing-btn-primary !py-2.5 !px-5 !text-[13.5px]">
                Get Started →
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: "#e2e8f0" }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(5,7,13,0.96)" }}
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className="text-left px-2 py-3 text-[15px] font-medium rounded-lg"
                  style={{ color: "#cbd5e1" }}
                >
                  {link.label}
                </button>
              ))}
              <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.08)" }} />
              {isAuthenticated ? (
                <>
                  <div
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1"
                    style={{ background: "rgba(0, 212, 255, 0.06)", border: "1px solid rgba(0, 212, 255, 0.25)" }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[12px] flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #ff6500, #a855f7)", color: "#060a12" }}
                    >
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate" style={{ color: "#e2e8f0" }}>
                        {displayName}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: "#64748b" }}>
                        {user?.email || ""}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}
                    className="landing-btn-primary w-full"
                  >
                    Go to Dashboard →
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-2 py-3 mt-2 rounded-lg transition-colors"
                    style={{ fontSize: "14px", fontWeight: 600, color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileOpen(false); navigate("/login"); }}
                    className="landing-btn-secondary w-full"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setMobileOpen(false); navigate("/signup"); }}
                    className="landing-btn-primary w-full mt-2"
                  >
                    Get Started →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ---------- from HeroTerminal.tsx ----------
type LineKind = "command" | "success" | "warn" | "label" | "value" | "arrow" | "final";

interface TerminalLine {
  kind: LineKind;
  text: string;
}

const SCRIPT: TerminalLine[] = [
  { kind: "command", text: "> analyze(user_attempts)" },
  { kind: "success", text: "✓ Solution submitted" },
  { kind: "success", text: "✓ Complexity analyzed" },
  { kind: "success", text: "✓ 82 problems analyzed" },
  { kind: "warn", text: "⚠ Weak pattern detected" },
  { kind: "label", text: "Topic:" },
  { kind: "value", text: "Sliding Window" },
  { kind: "label", text: "Recurring mistake:" },
  { kind: "value", text: "Boundary condition handling" },
  { kind: "label", text: "AI recommendation:" },
  { kind: "value", text: "Practice 3 targeted problems" },
  { kind: "arrow", text: "→ Personalized roadmap generated" },
  { kind: "final", text: "✦ AI recommendation ready" },
];

const COLORS: Record<LineKind, string> = {
  command: "#00d4ff",
  success: "#22c55e",
  warn: "#f59e0b",
  label: "#64748b",
  value: "#f1f5f9",
  arrow: "#a855f7",
  final: "#ff9500",
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function HeroTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisibleCount(SCRIPT.length);
      return;
    }

    let cancelled = false;
    let lineIndex = 0;
    let charIndex = 0;

    const typeNext = () => {
      if (cancelled) return;
      const line = SCRIPT[lineIndex];
      if (!line) {
        // Full sequence complete — hold, then restart for a "live" feel.
        const timeout = setTimeout(() => {
          if (cancelled) return;
          setVisibleCount(0);
          setTypedChars(0);
          lineIndex = 0;
          charIndex = 0;
          setTimeout(typeNext, 500);
        }, 4200);
        return () => clearTimeout(timeout);
      }

      if (charIndex <= line.text.length) {
        setVisibleCount(lineIndex + 1);
        setTypedChars(charIndex);
        charIndex += 2;
        const delay = line.kind === "command" ? 28 : 14;
        setTimeout(typeNext, delay);
      } else {
        lineIndex += 1;
        charIndex = 0;
        const pause = line.kind === "warn" || line.kind === "final" ? 420 : 160;
        setTimeout(typeNext, pause);
      }
    };

    const startTimeout = setTimeout(typeNext, 500);
    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
    };
  }, []);

  return (
    <div className="landing-terminal w-full max-w-[520px]">
      <div className="landing-terminal-header">
        <div className="landing-terminal-dots">
          <span style={{ background: "#ff5f57" }} />
          <span style={{ background: "#febc2e" }} />
          <span style={{ background: "#28c840" }} />
        </div>
        <div
          className="font-mono text-[11px]"
          style={{ color: "#64748b" }}
        >
          algoai://intelligence-engine
        </div>
        <div className="flex items-center gap-1.5">
          <span className="landing-live-dot" />
          <span
            className="font-mono text-[10px] font-bold tracking-widest"
            style={{ color: "#22c55e" }}
          >
            LIVE
          </span>
        </div>
      </div>

      <div className="landing-terminal-body" ref={containerRef}>
        {SCRIPT.slice(0, visibleCount).map((line, i) => {
          const isLast = i === visibleCount - 1;
          const displayText = isLast ? line.text.slice(0, typedChars) : line.text;
          const indent = line.kind === "label" || line.kind === "value";
          return (
            <div
              key={i}
              style={{
                color: COLORS[line.kind],
                fontWeight: line.kind === "final" || line.kind === "command" ? 700 : 500,
                paddingLeft: indent ? 14 : 0,
                opacity: line.kind === "label" ? 0.85 : 1,
                minHeight: "1.2em",
              }}
            >
              {displayText}
              {isLast && <span className="landing-cursor" />}
            </div>
          );
        })}
        {visibleCount === 0 && <span className="landing-cursor" />}
      </div>
    </div>
  );
}

// ---------- from Hero.tsx ----------
const CODE_FRAGMENTS = [
  { text: "if (nums[left] > target)", top: "14%", left: "4%", delay: "0s" },
  { text: "while (window.size < k)", top: "62%", left: "2%", delay: "3s" },
  { text: "dp[i][j] = dp[i-1][j-1]", top: "30%", right: "3%", delay: "5s" },
  { text: "mistake_signal.push(attempt)", top: "78%", right: "6%", delay: "8s" },
];

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  top: `${(i * 37) % 90}%`,
  left: `${(i * 53) % 96}%`,
  delay: `${(i % 6) * 1.4}s`,
}));

function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStartCoding = () => {
    navigate(isAuthenticated ? "/dashboard" : "/signup");
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-5 md:px-6 overflow-hidden">
      <div className="landing-hero-bg">
        <div className="landing-radial-glow" />
        <div className="landing-perspective-grid" />
        <div className="landing-beam" />
        <div className="landing-beam beam-2" />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="landing-particle"
            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
          />
        ))}
        {CODE_FRAGMENTS.map((f, i) => (
          <span
            key={i}
            className="landing-code-fragment hidden md:block"
            style={{ top: f.top, left: f.left, right: f.right, animationDelay: f.delay }}
          >
            {f.text}
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-[1180px] mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="landing-eyebrow mb-7"
          >
            <span className="landing-live-dot" />
            AI Intelligence Engine · Online
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="font-extrabold tracking-tight leading-[1.05] text-[42px] sm:text-[52px] lg:text-[60px]"
            style={{ color: "#f8fafc" }}
          >
            MASTER DSA.
            <br />
            <span className="landing-gradient-text">THINK LIKE AN AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-6 text-[16px] md:text-[17px] leading-relaxed max-w-[520px]"
            style={{ color: "#94a3b8" }}
          >
            Stop solving problems blindly. AlgoAI understands your mistakes, detects your weak patterns, and builds a learning path around you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <button onClick={handleStartCoding} className="landing-btn-primary cyber-btn">
              Start Coding <ArrowRight size={16} />
            </button>
            <button onClick={scrollToFeatures} className="landing-btn-secondary">
              <Compass size={16} />
              Explore Platform
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex items-center gap-6 font-mono text-[12px]"
            style={{ color: "#475569" }}
          >
            <span>82+ problems</span>
            <span style={{ color: "#1e293b" }}>/</span>
            <span>mistake pattern detection</span>
            <span style={{ color: "#1e293b" }}>/</span>
            <span>adaptive roadmap</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center lg:justify-end"
        >
          <HeroTerminal />
        </motion.div>
      </div>
    </section>
  );
}

// ---------- from StatsStrip.tsx ----------
const STATS = [
  { value: "82+", label: "DSA Problems", color: "#ff6500" },
  { value: "AI", label: "Smart Analysis", color: "#00d4ff" },
  { value: "24/7", label: "Practice", color: "#a855f7" },
  { value: "∞", label: "Personalized Learning", color: "#22c55e" },
];

function StatsStrip() {
  return (
    <section
      className="relative px-5 md:px-6 py-14"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-[1180px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
        {STATS.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.08} y={14}>
            <div className="text-center md:text-left">
              <div
                className="font-mono font-extrabold text-[30px] md:text-[36px] leading-none"
                style={{ color: s.color, textShadow: `0 0 24px ${s.color}40` }}
              >
                {s.value}
              </div>
              <div className="mt-2 text-[12.5px] font-medium tracking-wide" style={{ color: "#64748b" }}>
                {s.label}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
      <p className="text-center mt-8 text-[11px] font-mono" style={{ color: "#334155" }}>
        Live from AlgoAI's own problem bank &amp; intelligence engine
      </p>
    </section>
  );
}

// ---------- from CoreStory.tsx ----------
const NODES = [
  { icon: FileCode2, label: "PROBLEM", color: "#00d4ff" },
  { icon: Send, label: "YOUR ATTEMPT", color: "#00d4ff" },
  { icon: BrainCircuit, label: "AI ANALYSIS", color: "#a855f7" },
  { icon: AlertTriangle, label: "MISTAKE DETECTION", color: "#f59e0b" },
  { icon: Target, label: "WEAK TOPIC", color: "#f59e0b" },
  { icon: Map, label: "PERSONALIZED ROADMAP", color: "#ff6500" },
];

function CoreStory() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const interval = setInterval(() => {
      setActive((a) => (a + 1) % NODES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="landing-section">
      <div className="landing-container">
        <ScrollReveal className="text-center mb-16">
          <span className="landing-eyebrow mb-5">Core Intelligence</span>
          <h2
            className="mt-5 font-extrabold tracking-tight text-[30px] md:text-[42px] leading-tight"
            style={{ color: "#f8fafc" }}
          >
            YOUR CODE TELLS A STORY.
            <br />
            <span className="landing-gradient-text">ALGOAI READS IT.</span>
          </h2>
        </ScrollReveal>

        {/* Desktop: horizontal pipeline */}
        <div className="hidden lg:flex items-center justify-between">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            const isActive = i === active;
            return (
              <div key={node.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500"
                    style={{
                      background: isActive ? `${node.color}1a` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? node.color + "80" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: isActive ? `0 0 30px -6px ${node.color}` : "none",
                    }}
                  >
                    <Icon size={24} style={{ color: isActive ? node.color : "#64748b" }} />
                  </div>
                  <span
                    className="font-mono text-[10.5px] font-bold tracking-wider text-center whitespace-nowrap"
                    style={{ color: isActive ? node.color : "#475569" }}
                  >
                    {node.label}
                  </span>
                </div>
                {i < NODES.length - 1 && (
                  <div
                    className="landing-pipeline-connector h-px flex-1 mx-3 mb-6"
                    style={{ opacity: i < active ? 1 : i === active ? 0.6 : 0.25 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical pipeline */}
        <div className="lg:hidden flex flex-col gap-3">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            const isActive = i === active;
            return (
              <div key={node.label} className={`landing-pipeline-node ${isActive ? "is-active" : ""}`}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isActive ? `${node.color}1a` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive ? node.color + "80" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? node.color : "#64748b" }} />
                </div>
                <span
                  className="font-mono text-[12px] font-bold tracking-wide"
                  style={{ color: isActive ? node.color : "#64748b" }}
                >
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- from MistakeIntelligence.tsx ----------
const MISTAKE_STEPS = [
  { icon: XCircle, label: "Wrong Answer", color: "#ef4444" },
  { icon: ScanSearch, label: "AI analyzes attempt", color: "#00d4ff" },
  { icon: AlertTriangle, label: "Mistake detected", color: "#f59e0b" },
  { icon: Fingerprint, label: "Pattern recognized", color: "#a855f7" },
  { icon: Target, label: "Weak topic identified", color: "#ff6500" },
  { icon: Sparkles, label: "Next problem recommended", color: "#22c55e" },
];

function MistakeIntelligence() {
  return (
    <section className="landing-section" style={{ background: "radial-gradient(circle at 80% 20%, rgba(168,85,247,0.06), transparent 45%)" }}>
      <div className="landing-container">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <ScrollReveal>
            <span className="landing-eyebrow mb-5">The Differentiator</span>
            <h2
              className="mt-5 font-extrabold tracking-tight text-[30px] md:text-[40px] leading-tight"
              style={{ color: "#f8fafc" }}
            >
              EVERY WRONG ANSWER
              <br />
              <span className="landing-gradient-text">MAKES YOU BETTER.</span>
            </h2>
            <p className="mt-6 text-[15.5px] leading-relaxed max-w-[440px]" style={{ color: "#94a3b8" }}>
              AlgoAI doesn't just mark your answer wrong. It reads why — turning every failed attempt into a signal that sharpens your roadmap.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div
              className="rounded-2xl p-6 md:p-7"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {MISTAKE_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label}>
                    <div className="flex items-center gap-4 py-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${step.color}18`, border: `1px solid ${step.color}40` }}
                      >
                        <Icon size={17} style={{ color: step.color }} />
                      </div>
                      <span className="font-medium text-[14.5px]" style={{ color: "#e2e8f0" }}>
                        {step.label}
                      </span>
                    </div>
                    {i < MISTAKE_STEPS.length - 1 && (
                      <div className="flex justify-start pl-5">
                        <ChevronDown size={14} style={{ color: "#334155" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ---------- from ProductShowcase.tsx ----------
const SUMMARY_TILES = [
  { label: "Problems Attempted", value: "58", icon: TrendingUp, color: "#00d4ff" },
  { label: "Unsolved / Mistakes", value: "17", icon: XCircle, color: "#ef4444" },
  { label: "Weak Topics", value: "3", icon: AlertTriangle, color: "#f59e0b" },
  { label: "Overall Solve Rate", value: "71%", icon: CheckCircle2, color: "#22c55e" },
];

const WEAK_AREAS = [
  { topic: "Sliding Window", pct: 42, color: "#ef4444" },
  { topic: "Binary Search", pct: 58, color: "#f59e0b" },
  { topic: "Dynamic Programming", pct: 61, color: "#f59e0b" },
];

function ProductShowcase() {
  return (
    <section id="practice" className="landing-section">
      <div className="landing-container">
        <ScrollReveal className="text-center mb-14">
          <span className="landing-eyebrow mb-5">Product Preview</span>
          <h2
            className="mt-5 font-extrabold tracking-tight text-[30px] md:text-[42px] leading-tight"
            style={{ color: "#f8fafc" }}
          >
            SEE WHAT <span className="landing-gradient-text">ALGOAI SEES.</span>
          </h2>
          <p className="mt-4 text-[15px] max-w-[520px] mx-auto" style={{ color: "#64748b" }}>
            A demo view of the Mistake Pattern intelligence inside your dashboard.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10, 14, 26, 0.75)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 40px 100px -30px rgba(0,0,0,0.6)",
            }}
          >
            {/* fake browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
              <span className="ml-3 font-mono text-[11px]" style={{ color: "#475569" }}>
                algoai.app/mistakes
              </span>
            </div>

            <div className="p-5 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                {SUMMARY_TILES.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <div
                      key={tile.label}
                      className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <Icon size={16} style={{ color: tile.color }} />
                      <div className="mt-3 font-mono font-bold text-[22px]" style={{ color: "#f1f5f9" }}>
                        {tile.value}
                      </div>
                      <div className="mt-1 text-[11.5px]" style={{ color: "#64748b" }}>
                        {tile.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6">
                <div>
                  <div className="text-[12px] font-mono font-bold tracking-widest mb-4" style={{ color: "#94a3b8" }}>
                    WEAK AREAS
                  </div>
                  <div className="flex flex-col gap-4">
                    {WEAK_AREAS.map((area) => (
                      <div key={area.topic}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13.5px] font-medium" style={{ color: "#e2e8f0" }}>
                            {area.topic}
                          </span>
                          <span className="font-mono text-[13px] font-bold" style={{ color: area.color }}>
                            {area.pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${area.pct}%`, background: area.color, boxShadow: `0 0 10px ${area.color}80` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-xl p-5 flex flex-col justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,212,255,0.06))",
                    border: "1px solid rgba(168,85,247,0.25)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={15} style={{ color: "#a855f7" }} />
                    <span className="font-mono text-[11px] font-bold tracking-widest" style={{ color: "#a855f7" }}>
                      AI INSIGHT
                    </span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed italic" style={{ color: "#cbd5e1" }}>
                    "You're repeatedly struggling with boundary conditions in Sliding Window problems."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------- from Features.tsx ----------
const FEATURES = [
  {
    icon: Brain,
    color: "#f59e0b",
    title: "MISTAKE PATTERN AI",
    desc: "Your wrong submissions become learning signals. AlgoAI detects recurring mistakes and weak topics.",
  },
  {
    icon: Target,
    color: "#00d4ff",
    title: "SMART PRACTICE",
    desc: "Practice problems based on your current skill level.",
  },
  {
    icon: Map,
    color: "#ff6500",
    title: "PERSONALIZED ROADMAP",
    desc: "Get a learning path that adapts to your progress.",
  },
  {
    icon: MessageSquareText,
    color: "#a855f7",
    title: "AI-POWERED FEEDBACK",
    desc: "Understand why your solution failed and what to improve.",
  },
  {
    icon: Lightbulb,
    color: "#ec4899",
    title: "SMART AI HINTS",
    desc: "Get useful hints without immediately revealing the solution.",
  },
  {
    icon: Activity,
    color: "#22c55e",
    title: "PROGRESS INTELLIGENCE",
    desc: "Understand your growth through meaningful learning metrics.",
  },
];

function Features() {
  return (
    <section id="features" className="landing-section">
      <div className="landing-container">
        <ScrollReveal className="text-center mb-14">
          <span className="landing-eyebrow mb-5">Platform</span>
          <h2 className="mt-5 font-extrabold tracking-tight text-[30px] md:text-[42px]" style={{ color: "#f8fafc" }}>
            Built for how you <span className="landing-gradient-text">actually learn.</span>
          </h2>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <ScrollReveal key={f.title} delay={(i % 3) * 0.08}>
                <div
                  className="landing-feature-card h-full"
                  style={{ ["--spot-color" as any]: `${f.color}22` }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${f.color}66`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                >
                  <div
                    className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${f.color}18`, border: `1px solid ${f.color}40` }}
                  >
                    <Icon size={20} style={{ color: f.color }} />
                  </div>
                  <h3
                    className="relative z-10 font-mono font-bold text-[13.5px] tracking-wider mb-2.5"
                    style={{ color: f.color }}
                  >
                    {f.title}
                  </h3>
                  <p className="relative z-10 text-[14px] leading-relaxed" style={{ color: "#94a3b8" }}>
                    {f.desc}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- from HowItWorks.tsx ----------
const STEPS = [
  { num: "01", icon: Code2, title: "SOLVE", desc: "Pick a DSA problem and submit your solution.", color: "#00d4ff" },
  { num: "02", icon: ScanLine, title: "ANALYZE", desc: "AlgoAI evaluates your attempt.", color: "#a855f7" },
  { num: "03", icon: Eye, title: "UNDERSTAND", desc: "Discover mistakes and weak patterns.", color: "#f59e0b" },
  { num: "04", icon: TrendingUp, title: "IMPROVE", desc: "Follow a personalized learning path.", color: "#ff6500" },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-section" style={{ background: "rgba(255,255,255,0.012)" }}>
      <div className="landing-container">
        <ScrollReveal className="text-center mb-16">
          <span className="landing-eyebrow mb-5">Process</span>
          <h2 className="mt-5 font-extrabold tracking-tight text-[30px] md:text-[42px]" style={{ color: "#f8fafc" }}>
            How <span className="landing-gradient-text">AlgoAI</span> works.
          </h2>
        </ScrollReveal>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          <div
            className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
            style={{ background: "linear-gradient(90deg, #00d4ff, #a855f7, #f59e0b, #ff6500)", opacity: 0.3 }}
          />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.num} delay={i * 0.1}>
                <div className="relative flex flex-col items-start">
                  <div
                    className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: "rgba(10,14,26,0.9)",
                      border: `1px solid ${step.color}55`,
                      boxShadow: `0 0 24px -8px ${step.color}`,
                    }}
                  >
                    <Icon size={22} style={{ color: step.color }} />
                  </div>
                  <span
                    className="font-mono text-[12px] font-bold tracking-widest mb-1"
                    style={{ color: step.color }}
                  >
                    {step.num}
                  </span>
                  <h3 className="font-bold text-[16px] tracking-wide mb-2" style={{ color: "#f1f5f9" }}>
                    {step.title}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: "#64748b" }}>
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- from AIIntelligenceSection.tsx ----------
const CARDS = [
  { icon: AlertTriangle, label: "Mistake Pattern", color: "#f59e0b", pos: "top-[4%] left-[6%]" },
  { icon: Target, label: "Weak Topic", color: "#ff6500", pos: "top-[6%] right-[4%]" },
  { icon: Clock, label: "Time Analysis", color: "#00d4ff", pos: "bottom-[10%] left-[2%]" },
  { icon: TrendingUp, label: "Success Rate", color: "#22c55e", pos: "bottom-[6%] right-[8%]" },
  { icon: Sparkles, label: "Next Recommendation", color: "#a855f7", pos: "top-[42%] left-[-2%]" },
];

function AIIntelligenceSection() {
  return (
    <section id="ai-intelligence" className="landing-section overflow-hidden">
      <div className="landing-container">
        <ScrollReveal className="text-center mb-16">
          <span className="landing-eyebrow mb-5">Intelligence Core</span>
          <h2 className="mt-5 font-extrabold tracking-tight text-[30px] md:text-[42px]" style={{ color: "#f8fafc" }}>
            AI THAT LEARNS <span className="landing-gradient-text">HOW YOU LEARN.</span>
          </h2>
          <p className="mt-4 text-[15px] max-w-[520px] mx-auto" style={{ color: "#64748b" }}>
            Every signal feeds one engine — constantly re-evaluating what you know and what to practice next.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="relative mx-auto max-w-[720px] h-[380px] md:h-[420px] hidden md:block">
            {/* Orbit rings */}
            <div className="landing-orbit-ring" style={{ inset: "18%" }} />
            <div className="landing-orbit-ring" style={{ inset: "6%" }} />

            {/* Connecting lines (svg) */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              <defs>
                <linearGradient id="ai-line" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {CARDS.map((_, i) => (
                <line
                  key={i}
                  x1="50%"
                  y1="50%"
                  x2={`${20 + i * 15}%`}
                  y2={`${20 + ((i * 23) % 60)}%`}
                  stroke="url(#ai-line)"
                  strokeWidth="1"
                />
              ))}
            </svg>

            {/* Core */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full flex items-center justify-center z-10"
              style={{
                background: "radial-gradient(circle, rgba(168,85,247,0.25), rgba(0,212,255,0.1))",
                border: "1px solid rgba(168,85,247,0.4)",
                boxShadow: "0 0 60px -10px rgba(168,85,247,0.6)",
              }}
            >
              <BrainCircuit size={30} style={{ color: "#e2e8f0" }} />
            </div>

            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={`landing-float-card absolute ${card.pos} z-10`}
                  style={{ animationDelay: `${card.label.length % 5}s` }}
                >
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(10,14,26,0.85)",
                      border: `1px solid ${card.color}40`,
                      boxShadow: `0 10px 30px -10px ${card.color}50`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Icon size={16} style={{ color: card.color }} />
                    <span className="font-mono text-[12px] font-semibold whitespace-nowrap" style={{ color: "#e2e8f0" }}>
                      {card.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: simple stacked list */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${card.color}35` }}
                >
                  <Icon size={15} style={{ color: card.color }} />
                  <span className="font-mono text-[11.5px] font-semibold" style={{ color: "#e2e8f0" }}>
                    {card.label}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------- from FinalCTA.tsx ----------
function FinalCTA() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative landing-section overflow-hidden">
      <div className="absolute inset-0 landing-perspective-grid" style={{ opacity: 0.35 }} />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(255,101,0,0.14), transparent 55%)",
        }}
      />
      <div className="relative z-10 landing-container text-center">
        <ScrollReveal>
          <h2
            className="font-extrabold tracking-tight text-[32px] md:text-[48px] leading-[1.1]"
            style={{ color: "#f8fafc" }}
          >
            YOUR NEXT BREAKTHROUGH
            <br />
            <span className="landing-gradient-text">STARTS WITH ONE PROBLEM.</span>
          </h2>
          <p className="mt-6 text-[16px] max-w-[440px] mx-auto leading-relaxed" style={{ color: "#94a3b8" }}>
            Stop guessing what to practice next.
            <br />
            Let AlgoAI figure it out.
          </p>
          <div className="mt-10">
            <button
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/signup")}
              className="landing-btn-primary !text-[16px] !px-8 !py-4"
            >
              Enter AlgoAI <ArrowRight size={18} />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------- from LandingFooter.tsx ----------
const LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Practice", id: "practice" },
];

function LandingFooter() {
  const navigate = useNavigate();

  const goToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="relative px-5 md:px-6 py-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-[1180px] mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Zap size={17} style={{ color: "#ff6500" }} fill="#ff6500" />
            <span className="font-bold text-[15px]" style={{ color: "#f1f5f9" }}>
              AlgoAI
            </span>
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#475569" }}>
            Built for developers who want to think better.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[13.5px]">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => goToSection(l.id)}
              className="transition-colors"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => navigate("/login")}
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            Signup
          </button>
        </div>
      </div>

      <p className="text-center mt-10 text-[11.5px] font-mono" style={{ color: "#1e293b" }}>
        © {new Date().getFullYear()} AlgoAI. All systems operational.
      </p>
    </footer>
  );
}
// ---------- Landing (composes everything above) ----------
export default function Landing() {
  return (
    <div className="landing-root min-h-screen">
      <LandingNavbar />
      <main>
        <Hero />
        <StatsStrip />
        <CoreStory />
        <MistakeIntelligence />
        <ProductShowcase />
        <Features />
        <HowItWorks />
        <AIIntelligenceSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
