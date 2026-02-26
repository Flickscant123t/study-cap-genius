import { Suspense, lazy, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Crown, GraduationCap, Sparkles } from "lucide-react";

const LandingBelowFold = lazy(() => import("@/components/landing/LandingBelowFold"));

export default function Landing() {
  const navigate = useNavigate();
  const [showBelowFold, setShowBelowFold] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let idleCallbackId: number | undefined;
    let timeoutId: number | undefined;
    const revealBelowFold = () => setShowBelowFold(true);
    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(revealBelowFold, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(revealBelowFold, 300);
    }
    return () => {
      if (idleCallbackId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .landing-root {
          --ink: #0f0e0d;
          --paper: #faf8f5;
          --accent: #c8622a;
          --accent-light: #e8835010;
          --muted: #7a756e;
          --border: #e2ddd7;
          --card: #ffffff;
          font-family: 'DM Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
        }

        .landing-root * { box-sizing: border-box; }

        /* Nav */
        .lp-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          background: rgba(250, 248, 245, 0.88);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          height: 64px;
          display: flex;
          align-items: center;
        }
        .lp-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 32px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--ink);
        }
        .lp-logo-mark {
          width: 34px;
          height: 34px;
          background: var(--ink);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-logo-mark svg { color: var(--paper); }
        .lp-logo-name {
          font-family: 'Instrument Serif', serif;
          font-size: 1.3rem;
          letter-spacing: -0.01em;
        }
        .lp-nav-actions { display: flex; align-items: center; gap: 8px; }
        .btn-ghost-nav {
          background: none;
          border: none;
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--muted);
          cursor: pointer;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-ghost-nav:hover { color: var(--ink); background: var(--accent-light); }
        .btn-primary-nav {
          background: var(--ink);
          color: var(--paper);
          border: none;
          padding: 9px 20px;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-primary-nav:hover { background: #2a2825; transform: translateY(-1px); }

        /* Hero */
        .lp-hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 32px 80px;
          position: relative;
          overflow: hidden;
        }

        /* Decorative background elements */
        .lp-bg-circle-1 {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, #e8835018 0%, transparent 70%);
          top: -100px; right: -150px;
          pointer-events: none;
        }
        .lp-bg-circle-2 {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, #0f0e0d08 0%, transparent 70%);
          bottom: 0px; left: -100px;
          pointer-events: none;
        }
        .lp-bg-line {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, var(--border) 30%, var(--border) 70%, transparent);
          opacity: 0.4;
          pointer-events: none;
        }

        .lp-hero-inner {
          max-width: 760px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .lp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border: 1px solid var(--border);
          border-radius: 100px;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 32px;
          background: white;
          opacity: 0;
          animation: fadeUp 0.6s ease forwards;
          animation-delay: 0.1s;
        }
        .lp-eyebrow svg { width: 13px; height: 13px; }

        .lp-headline {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(3rem, 7vw, 5.5rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin: 0 0 24px;
          opacity: 0;
          animation: fadeUp 0.7s ease forwards;
          animation-delay: 0.2s;
        }
        .lp-headline em {
          font-style: italic;
          color: var(--accent);
        }

        .lp-subhead {
          font-size: 1.1rem;
          line-height: 1.65;
          color: var(--muted);
          max-width: 500px;
          margin: 0 auto 44px;
          font-weight: 400;
          opacity: 0;
          animation: fadeUp 0.7s ease forwards;
          animation-delay: 0.3s;
        }

        .lp-cta-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          opacity: 0;
          animation: fadeUp 0.7s ease forwards;
          animation-delay: 0.4s;
        }

        .btn-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--ink);
          color: var(--paper);
          border: none;
          padding: 14px 28px;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
        }
        .btn-cta-primary:hover {
          background: #2a2825;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15,14,13,0.18);
        }
        .btn-cta-primary svg { transition: transform 0.18s ease; }
        .btn-cta-primary:hover svg { transform: translateX(3px); }

        .btn-cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: var(--ink);
          border: 1px solid var(--border);
          padding: 14px 28px;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
        }
        .btn-cta-secondary:hover {
          border-color: var(--ink);
          background: var(--ink);
          color: var(--paper);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15,14,13,0.12);
        }
        .btn-cta-secondary svg { color: #c8a355; }
        .btn-cta-secondary:hover svg { color: #c8a355; }

        .lp-footnote {
          margin-top: 28px;
          font-size: 0.8rem;
          color: var(--muted);
          opacity: 0;
          animation: fadeUp 0.6s ease forwards;
          animation-delay: 0.55s;
        }
        .lp-footnote span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .lp-footnote span::before {
          content: '';
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #6dbb7a;
        }

        /* Social proof strip */
        .lp-social-proof {
          margin-top: 72px;
          padding-top: 40px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 32px;
          justify-content: center;
          flex-wrap: wrap;
          opacity: 0;
          animation: fadeUp 0.7s ease forwards;
          animation-delay: 0.65s;
        }
        .lp-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .lp-stat-num {
          font-family: 'Instrument Serif', serif;
          font-size: 1.8rem;
          letter-spacing: -0.02em;
          color: var(--ink);
        }
        .lp-stat-label {
          font-size: 0.78rem;
          color: var(--muted);
          letter-spacing: 0.02em;
        }
        .lp-stat-divider {
          width: 1px;
          height: 36px;
          background: var(--border);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .lp-nav-inner { padding: 0 20px; }
          .lp-hero { padding: 90px 20px 60px; }
          .lp-cta-group { flex-direction: column; align-items: center; }
          .btn-cta-primary, .btn-cta-secondary { width: 100%; justify-content: center; }
          .lp-stat-divider { display: none; }
        }
      `}</style>

      <div className="landing-root">
        {/* Navigation */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <a className="lp-logo" href="#">
              <div className="lp-logo-mark">
                <GraduationCap size={18} />
              </div>
              <span className="lp-logo-name">StudyCap</span>
            </a>
            <div className="lp-nav-actions">
              <button className="btn-ghost-nav" onClick={() => navigate("/auth")}>Sign in</button>
              <button className="btn-primary-nav" onClick={() => navigate("/auth")}>Get started</button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-bg-circle-1" />
          <div className="lp-bg-circle-2" />
          <div className="lp-bg-line" />

          <div className="lp-hero-inner">
            <div className="lp-eyebrow">
              <Sparkles />
              AI-Powered Learning
            </div>

            <h1 className="lp-headline">
              The smarter way<br />
              to <em>actually</em> learn
            </h1>

            <p className="lp-subhead">
              StudyCap is your AI study partner — ask questions, get clear explanations,
              and build real understanding. Not just memorization.
            </p>

            <div className="lp-cta-group">
              <button className="btn-cta-primary" onClick={() => navigate("/auth")}>
                Start for free
                <ArrowRight size={17} />
              </button>
              <button className="btn-cta-secondary" onClick={() => navigate("/auth?upgrade=true")}>
                <Crown size={16} />
                Upgrade to Premium
              </button>
            </div>

            <p className="lp-footnote">
              <span>15 free questions per day — no credit card required</span>
            </p>

            <div className="lp-social-proof">
              <div className="lp-stat">
                <span className="lp-stat-num">50k+</span>
                <span className="lp-stat-label">Active students</span>
              </div>
              <div className="lp-stat-divider" />
              <div className="lp-stat">
                <span className="lp-stat-num">2M+</span>
                <span className="lp-stat-label">Questions answered</span>
              </div>
              <div className="lp-stat-divider" />
              <div className="lp-stat">
                <span className="lp-stat-num">4.9★</span>
                <span className="lp-stat-label">Avg. rating</span>
              </div>
            </div>
          </div>
        </section>

        {showBelowFold && (
          <Suspense fallback={null}>
            <LandingBelowFold />
          </Suspense>
        )}
      </div>
    </>
  );
}
