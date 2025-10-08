"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen, CalendarDays, Users, Sparkles, CheckCircle2,
  Mail, ArrowRight, BarChart3, Globe2, Zap, Quote, Clock, Award, GraduationCap, ShieldCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/* ---------------- Utilities ---------------- */

function Anchor(
  { href = "#", className, children, ...rest }:
  React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}

const Container = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
);

const Section = ({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id?: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) => (
  <section id={id} className="py-16 sm:py-24">
    <Container>
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary/80">
            {eyebrow}
          </p>
        )}
        {title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>}
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="mt-10 sm:mt-14">{children}</div>
    </Container>
  </section>
);

// Lightweight, dependency-free fade-in on mount
function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const style = useMemo(() => ({ transitionDelay: `${delay}ms` }), [delay]);
  return (
    <div
      style={style}
      className={[
        "transform transition duration-700 ease-out will-change-transform will-change-opacity",
        "opacity-100 translate-y-0",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

const Badges = () => (
  <div className="flex flex-wrap items-center justify-center gap-3" aria-label="Key benefits">
    {(
      [
        [Sparkles, "Expert-led"],
        [Award, "Certificate"],
        [Globe2, "Live online"],
        [Zap, "Hands-on"],
      ] as const
    ).map(([Icon, label]) => (
      <span
        key={label}
        className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
      </span>
    ))}
  </div>
);

/* ---------------- Main Page ---------------- */

type LeadResponse = { ok: boolean; error?: string; downloadUrl?: string; requireConfirm?: boolean };
type ApiResponse = { ok: boolean; error?: string };

function LearnamyteLanding() {
  // “Notify me” form
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Honeypot shared by forms
  const [hp, setHp] = useState("");

  // Brochure form state (modal-like overlay)
  const [brochureOpen, setBrochureOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<null | "FOQIC" | "Python">(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadMsg, setLeadMsg] = useState<string | null>(null);
  const [leadBusy, setLeadBusy] = useState(false);

  function isApiResponse(x: unknown): x is ApiResponse {
    return typeof x === "object" && x !== null && "ok" in x && typeof (x as { ok: unknown }).ok === "boolean";
    }

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!email) return setMsg("Please enter your email.");
    if (hp) return; // bot
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(text); } catch { /* ignore */ }

      const payload: ApiResponse | null = isApiResponse(parsed) ? parsed : null;

      if (res.ok && payload?.ok) {
        setMsg("You're on the list! Check your inbox to confirm.");
        setEmail("");
      } else {
        const errMsg = payload?.error || `Request failed (${res.status})`;
        setMsg(errMsg);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error.";
      setMsg(message);
    } finally {
      setLoading(false);
    }
  }

  async function submitBrochure(course: "FOQIC" | "Python", e: React.FormEvent) {
    e.preventDefault();
    setLeadMsg(null);
    if (!leadEmail || !leadPhone) {
      setLeadMsg("Please enter your email and mobile number.");
      return;
    }
    if (hp) return; // bot

    setLeadBusy(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: leadEmail, phone: leadPhone, course }),
      });

      const data = (await res.json().catch(() => ({}))) as LeadResponse;

      if (res.status === 202 || data.requireConfirm) {
        setLeadMsg("Almost there! Please confirm your email from your inbox, then click “Get PDF” again.");
        return;
      }

      if (!res.ok || !data.ok || !data.downloadUrl) {
        setLeadMsg(data?.error || `Request failed (${res.status})`);
        return;
      }

      // success: trigger download
      setLeadEmail("");
      setLeadPhone("");
      setBrochureOpen(false);
      setSelectedCourse(null);
      setSelectedTitle(null);
      window.location.href = data.downloadUrl;
    } catch (err) {
      const m = err instanceof Error ? err.message : "Network error";
      setLeadMsg(m);
    } finally {
      setLeadBusy(false);
    }
  }

  const features = [
    { icon: BookOpen, title: "Workshops that work", desc: "Live, cohort-based classes designed with measurable outcomes." },
    { icon: Users, title: "Verified experts", desc: "We vet instructors for real-world impact, not just credentials." },
    { icon: CalendarDays, title: "Weekend Sessions", desc: "Sat–Sun, 8–10/11 AM IST plus weekday projects and support." },
    { icon: BarChart3, title: "Trackable progress", desc: "Capstone projects, and analytics to prove learning and reviews." },
  ] as const;

  const categories = [
    {
      title: "Prompt Engineering",
      copy: "Master prompt engineering to unlock the full potential of AI tools and workflows.",
      items: ["Prompt basics", "Advanced prompting techniques", "Real-world use cases", "Hands-on labs & projects"],
    },
    {
      title: "Power BI",
      copy: "Transform raw data into insights with Microsoft Power BI.",
      items: ["Data modeling & cleaning", "Interactive dashboards", "DAX formulas & calculations", "Business-ready reports"],
    },
    {
      title: "Data Optimization with Python",
      copy: "Develop complete optimization tools using Python, pandas, and tkinter.",
      items: ["Pandas for data handling", "Pivot tables & summaries", "Visualization with Matplotlib", "Tkinter for UI design", "Regex for text processing", "OOPs in Python", "SMTP for automation"],
    },
    {
      title: "SQL and Database",
      copy: "Learn SQL & DBMS from fundamentals to practical applications.",
      items: ["Basic queries", "Advance Functions & Joins", "Constraints", "Subqueries", "Transactions", "Indexes, Views & Normalization"],
    },
    {
      title: "Fundamentals of Quantum Information and Computing",
      copy: "Learn quantum computing from the principles of quantum mechanics to hands-on circuits and algorithms.",
      items: ["Qubits & superposition", "Quantum gates & circuits", "Entanglement & teleportation", "Grover’s & Deutsch–Jozsa algorithms", "Quantum Fourier Transform (QFT)", "Error correction basics", "Intro to Qiskit programming"],
    },
  ] as const;

  const plans = [
    {
      name: "Single Course",
      price: "₹4,499",
      period: "per course",
      highlights: ["Access to one full workshop", "Live expert-led sessions", "Hands-on projects", "Certificate of completion"],
      href: "/enroll/single",
      featured: false,
    },
    {
      name: "Bundle (2 Courses)",
      price: "₹7,499",
      period: "one-time",
      highlights: ["Choose any 2 courses", "Structured learning path", "Project feedback from instructors", "Save ₹1,500 vs buying separately"],
      href: "/enroll/bundle",
      featured: false,
    },
    {
      name: "Teams & Corporates",
      price: "Custom",
      period: "contact us",
      highlights: ["Understanding the requirements for your team", "Private workshops tailored to your needs", "Manager dashboards to track progress", "Dedicated support & Q&A"],
      href: "/sales",
      featured: false,
    },
  ] as const;

  const faqs = [
    { q: "When are the classes?", a: "Weekend sessions run Sat–Sun, 8–10 or 8–11 AM IST for 4–6 weeks." },
    { q: "Do I get a certificate?", a: "Yes. Complete the course and Capstone projects to earn a certificate." },
    { q: "Is there a refund policy?", a: "Full refund before the 2nd live session. Transfers allowed to later sessions." },
    { q: "Do you provide 24/7 support?", a: "Yes, we provide 24/7 support during the course period." },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" style={{ color: "#193CB8" }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to content</a>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50" role="banner">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Anchor href="/" className="flex items-center gap-2 font-bold tracking-tight" aria-label="Learnamyte home">
              <img src="/Official_Logo.png" alt="Learnamyte Logo" className="h-15 w-15 object-contain" />
              Learnamyte
            </Anchor>
            <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#catalog" className="text-sm text-muted-foreground hover:text-foreground">Catalog</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground">About</a>
            </nav>
            <div className="flex items-center gap-2" />
          </div>
        </Container>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(75%_75%_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 py-16 sm:py-24 md:grid-cols-2">
            <FadeIn>
              <Badges />
              <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
                Learn from experts. <span className="text-primary">Build what matters.</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                “Weekend workshops for professionals and students. Expert-led hands-on projects & Corporate training workshops.”
              </p>
              <ul className="mt-4 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden /> Sat–Sun · 8–10/11 AM IST · 16–24 hours total</li>
                <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4" aria-hidden /> Capstone projects, reviews, and weekday support</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden /> Course completion certificate</li>
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Anchor href="/workshops">{/* CTA reserved */}</Anchor>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">No spam. No sales call.</p>
            </FadeIn>

            <FadeIn delay={150}>
              <Card className="border-primary/20 shadow-lg" aria-labelledby="upcoming-class-title">
                <CardHeader>
                  <CardTitle id="upcoming-class-title" className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" aria-hidden /> Upcoming Class
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">FOQIC (16 hours) @ ₹3999</h3>
                    <p className="text-sm text-muted-foreground">Live session • Q&A • Hands-on labs (Qiskit)</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Build & simulate quantum circuits",
                      "Implement Deutsch–Jozsa, Grover, QFT, QPE",
                      "Explore entanglement, teleportation, error correction",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden /> {t}
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={handleSubscribe} className="flex flex-col gap-2" aria-label="Notify me form">
                    <label htmlFor="email" className="sr-only">Email</label>
                    <Input
                      id="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                      autoComplete="email"
                      aria-required
                    />
                    {/* honeypot */}
                    <input type="text" value={hp} onChange={(e)=>setHp(e.target.value)} className="hidden" tabIndex={-1} aria-hidden />
                    <Button type="submit" className="gap-2" disabled={loading} aria-busy={loading} aria-live="polite">
                      {loading ? "Sending..." : <>Notify me <ArrowRight className="h-4 w-4" aria-hidden /></>}
                    </Button>
                    {msg && <p className="text-xs text-muted-foreground" role="status">{msg}</p>}
                  </form>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </Container>
      </section>

      <main id="main">
        {/* Features */}
        <Section
          id="features"
          eyebrow="Why Learnamyte"
          title="Designed for outcomes"
          subtitle="Everything we build reinforces expert credibility, quality, and innovation."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="h-full">
                <CardHeader>
                  <f.icon className="h-5 w-5" aria-hidden />
                  <CardTitle className="mt-2 text-xl">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Catalog */}
        <Section
          id="catalog"
          eyebrow="What you can learn"
          title="Our Courses"
          subtitle="Follow a guided path or pick a one-off workshop, your call."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {categories.map((c) => {
              const isPython = c.title === "Data Optimization with Python";
              const isFOQIC = c.title === "Fundamentals of Quantum Information and Computing";
              const brochureCourse: "Python" | "FOQIC" | null = isPython ? "Python" : isFOQIC ? "FOQIC" : null;

              return (
                <Card key={c.title} className="h-full">
                  <CardHeader>
                    <CardTitle>{c.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{c.copy}</p>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {c.items.map((i) => (
                        <span key={i} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                          {i}
                        </span>
                      ))}
                    </div>

                    {brochureCourse ? (
                      <Button
                        type="button"
                        className="mt-4 bg-black text-white hover:bg-[#193BC8]"
                        disabled={leadBusy}
                        onClick={() => {
                          setSelectedCourse(brochureCourse);
                          setSelectedTitle(c.title);
                          setLeadEmail("");
                          setLeadPhone("");
                          setLeadMsg(null);
                          setBrochureOpen(true);
                        }}
                      >
                        Download brochure
                      </Button>
                    ) : (
                      <Button className="mt-4 text-[#193BC8]" variant="outline" disabled>
                        Coming soon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* Simple modal for brochure form (no external UI lib) */}
        {brochureOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                if (!leadBusy) {
                  setBrochureOpen(false);
                  setSelectedCourse(null);
                  setSelectedTitle(null);
                }
              }}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold">
                {selectedTitle ?? "Download brochure"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and mobile number to get the PDF.
              </p>

              <form className="mt-4 space-y-2" onSubmit={(e) => {
                if (!selectedCourse) return;
                submitBrochure(selectedCourse, e);
              }}>
                <Input
                  type="email"
                  placeholder="Your email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Input
                  type="tel"
                  placeholder="Mobile number"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />

                {/* honeypot */}
                <input
                  type="text"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden
                />

                <div className="mt-2 flex gap-2">
                  <Button type="submit" disabled={leadBusy} className="bg-black text-white hover:bg-[#193BC8]">
                    {leadBusy ? "Preparing..." : "Get PDF"}
                  </Button>
                  <Button
                    type="button"
                    className="bg-white text-black hover:text-[#CF0000]"
                    variant="outline"
                    onClick={() => {
                      if (leadBusy) return;
                      setBrochureOpen(false);
                      setSelectedCourse(null);
                      setSelectedTitle(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                {leadMsg && <p className="text-xs text-muted-foreground mt-2">{leadMsg}</p>}
              </form>
            </div>
          </div>
        )}

        {/* Testimonials */}
        <Section id="social-proof" eyebrow="Social proof" title="Loved by learners & teams">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { quote: "The workshop playbooks and hands-on labs helped our team ship a Python tool in a week.", name: "Aravind", role: "Business Analyst, E-commerce" },
              { quote: "Finally a platform that cares about outcomes. Our completion and retention doubled.", name: "Amarnath", role: "Application Engineer, SaaS" },
              { quote: "Crystal clear content. You feel guided by pros who actually do the work.", name: "Kavi", role: "Analyst, Apparel" },
            ].map((t) => (
              <Card key={t.name} className="h-full">
                <CardContent className="pt-6">
                  <Quote className="mb-4 h-6 w-6" aria-hidden />
                  <p className="text-sm">{t.quote}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t.name} • {t.role}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Pricing */}
        <Section
          id="pricing"
          eyebrow="Plans"
          title="Choose your course plan"
          subtitle="Pay once per course or choose a bundle."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.name} className={p.featured ? "border-primary shadow-lg" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between">
                    <span>{p.name}</span>
                    <span className="text-2xl font-extrabold">{p.price}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{p.period}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden /> {h}
                      </li>
                    ))}
                  </ul>
                  <Anchor href={p.href} className="mt-6 block" />
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" eyebrow="FAQ" title="Common questions">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <Card key={f.q}>
                <CardHeader>
                  <CardTitle className="text-base">{f.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.a}</CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* About */}
        <Section
          id="about"
          eyebrow="Our approach"
          title="Learning, engineered"
          subtitle="We combine subject-matter expertise, instructional design, and analytics to deliver real outcomes."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>For learners</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Structured paths with projects and checkpoints.</p>
                <p>Live sessions for accountability and feedback.</p>
                <p>Portfolio-ready artifacts to showcase skills.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>For teams</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Instructor-led live virtual or in-person sessions</p>
                <p>Personal training tailored to your stack and goals.</p>
                <p>Integrations for LMS exports.</p>
              </CardContent>
            </Card>
          </div>
        </Section>
      </main>

      {/* CTA */}
      <section className="relative">
        <Container>
          <div className="overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 to-primary/5 p-8 shadow-sm sm:p-10">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold">Ready to learn by doing?</h3>
                <p className="mt-2 text-muted-foreground">Join thousands leveling up with expert-led workshops.</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Anchor href="mailto:team@learnamyte.com?subject=Learnamyte%20Course%20Inquiry&body=Hello%20Team%2C%0D%0A%0AI%20would%20like%20to%20know%20more%20about%20your%20workshops.">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" aria-hidden /> Talk to support
                  </Button>
                </Anchor>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t py-10 text-sm" role="contentinfo">
        <Container>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4" aria-hidden /> Learnamyte</div>
              <p className="mt-2 max-w-xs text-muted-foreground">Expert-led workshops that turn knowledge into outcomes.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:col-span-3 md:grid-cols-3">
              <div className="space-y-2">
                <div className="font-semibold">Product</div>
                {[{ label: "Workshops", href: "/workshops"},{ label: "Paths", href: "/paths"},{ label: "Pricing", href: "/#pricing"},{ label: "For Teams", href: "/#about"},].map((l)=> (
                  <Anchor key={l.label} href={l.href} className="block text-muted-foreground hover:text-foreground">{l.label}</Anchor>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Company</div>
                {[{ label: "About", href: "/#about"},{ label: "Instructors", href: "/#instructors"},{ label: "Blog", href: "/blog"},{ label: "Careers", href: "/careers"},].map((l)=> (
                  <Anchor key={l.label} href={l.href} className="block text-muted-foreground hover:text-foreground">{l.label}</Anchor>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Legal</div>
                {[{ label: "Terms", href: "/terms"},{ label: "Privacy", href: "/privacy"},{ label: "Contact", href: "/contact"},].map((l)=> (
                  <Anchor key={l.label} href={l.href} className="block text-muted-foreground hover:text-foreground">{l.label}</Anchor>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t pt-6 sm:flex-row">
            <p className="text-muted-foreground">© {new Date().getFullYear()} Learnamyte. All rights reserved.</p>
            <p className="text-muted-foreground">Made with care for curious minds.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default LearnamyteLanding;
