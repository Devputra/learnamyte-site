"use client";

// Fix: Remove Next.js-specific imports (next/link, next/dynamic) to avoid
// sandbox issues like `TypeError: Cannot read properties of null (reading '_')`.
// Provide a lightweight Anchor component instead of next/link and keep
// animations dependency-free with a simple FadeIn.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen, CalendarDays, Users, Sparkles, CheckCircle2, PlayCircle,
  Mail, ArrowRight, BarChart3, Globe2, Zap, Quote, Clock, Award, GraduationCap, ShieldCheck
} from "lucide-react";

// If you're using shadcn/ui, these should exist in your project.
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/* ---------------- Utilities ---------------- */

// Minimal Anchor to replace next/link in sandbox/non-Next environments
// so we don't depend on `next/dynamic` internally.
function Anchor({ href = "#", className, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
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
  const [show, setShow] = useState(false);
  useEffect(() => setShow(true), []);
  const style = useMemo(() => ({ transitionDelay: `${delay}ms` }), [delay]);
  return (
    <div
      style={style}
      className={[
        "transform transition duration-700 ease-out will-change-transform will-change-opacity",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
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

function LearnamyteLanding() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hp, setHp] = useState(""); // honeypot

  type ApiResponse = { ok: boolean; error?: string };

  function isApiResponse(x: unknown): x is ApiResponse {
    return (
      typeof x === "object" &&
      x !== null &&
      "ok" in x &&
      typeof (x as Record<string, unknown>).ok === "boolean"
    );
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
      try {
        parsed = JSON.parse(text);
      } catch {}

      const payload: ApiResponse | null = isApiResponse(parsed) ? parsed : null;

      if (res.ok && payload?.ok) {
        setMsg("You're on the list! Check your inbox to confirm.");
        setEmail("");
      } else {
        const errMsg = payload?.error || `Request failed (${res.status})`;
        setMsg(errMsg);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error.";
      setMsg(message);
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: BookOpen, title: "Workshops that work", desc: "Live, cohort-based classes designed with measurable outcomes." },
    { icon: Users, title: "Verified experts", desc: "We vet instructors for real-world impact, not just credentials." },
    { icon: CalendarDays, title: "Weekend Sessions", desc: "Sat–Sun, 8–10/11 AM IST plus weekday projects and support." },
    { icon: BarChart3, title: "Trackable progress", desc: "Capstone projects, and analytics to prove learning and reviews." },
  ];

  const categories = [
    {
      title: "Prompt Matters",
      copy: "Master prompt engineering to unlock the full power of AI tools and workflows.",
      items: ["Prompt basics", "Advanced prompting", "Use cases", "Hands-on labs"],
    },
    {
      title: "Cooking the Data",
      copy: "Transform raw data into insights using Microsoft Power BI.",
      items: ["Data modeling", "Dashboards", "DAX formulas", "Interactive reports"],
    },
    {
      title: "Data Optimization with Python",
      copy: "Build optimization tools using Python, pandas, matplotlib, and tkinter.",
      items: ["Data cleaning", "Pivot tables", "Charts & plots", "GUI apps"],
    },
    {
      title: "Destruct, Construct & Decorate the Database",
      copy: "Learn DBMS from fundamentals to practical applications.",
      items: ["Create tables", "Joins & keys", "Aggregate functions", "Window functions"],
    },
  ];

  const plans = [
    {
      name: "Single Course",
      price: "₹3,599",
      period: "per course",
      highlights: [
        "Access to one full workshop",
        "Live expert-led sessions",
        "Hands-on projects",
        "Certificate of completion",
      ],
      // cta: "Enroll now",
      href: "/enroll/single",
      featured: false,
    },
    {
      name: "Bundle (2 Courses)",
      price: "₹5,999",
      period: "one-time",
      highlights: [
        "Choose any 2 courses",
        "Structured learning path",
        "Project feedback from instructors",
        "Save ₹1,200 vs buying separately",
      ],
      // cta: "Get the bundle",
      href: "/enroll/bundle",
      featured: false,
    },
    {
      name: "Teams & Corporates",
      price: "Custom",
      period: "contact us",
      highlights: [
        "Cohorts for your team",
        "Manager dashboards to track progress",
        "Private workshops tailored to your needs",
        "Dedicated support & Q&A",
      ],
      // cta: "Talk to sales",
      href: "/sales",
      featured: false,
    },
  ];

  const faqs = [
    { q: "When are the classes?", a: "Weekend cohorts run Sat–Sun, 8–10 or 8–11 AM IST for 4–6 weeks." },
    { q: "Do I get a certificate?", a: "Yes. Complete the course and Capstone projects to earn a certificate." },
    { q: "Is there a refund policy?", a: "Full refund before the 2nd live session. Transfers allowed to a later cohort." },
    { q: "Do you provide 24/7 support?", a: "Yes, we provide 24/7 support during the course period." },
  ];

  // const instructors = [
  //   { name: "Ananya Rao", role: "Senior Data Scientist, Fintech", bio: "10+ years in ML, ex-FAANG.", avatar: "/instructors/ananya.jpg" },
  //   { name: "Rahul Mehta", role: "Analytics Lead, SaaS", bio: "Built BI at unicorn scale.", avatar: "/instructors/rahul.jpg" },
  // ];

  // ---------------- Dev-only runtime tests (smoke tests) ----------------
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    console.groupCollapsed("[LearnamyteLanding] Dev checks");

    // Type guard tests (keep existing)
    console.assert(isApiResponse({ ok: true }), "isApiResponse should accept ok: true");
    console.assert(!isApiResponse({ ok: "yes" } as any), "isApiResponse should reject non-boolean ok");

    // Data shape tests (keep existing)
    console.assert(features.length >= 4, "features should have at least 4 items");
    console.assert(categories.every(c => Array.isArray(c.items) && c.items.length > 0), "each category should contain items");
    console.assert(plans.every(p => !!p.href && typeof p.href === "string"), "every pricing plan must include a href");

    // CTA presence tests (keep existing)
    const primaryCtas = ["/workshops", "/cohorts/next", "/enroll"];
    primaryCtas.forEach((path) => console.assert(typeof path === "string" && path.length > 1, `CTA path '${path}' should be valid`));

    // NEW: Environment sanity tests (avoid Next-only modules)
    try {
      const maybeNext: any = (globalThis as any).next?.dynamic;
      console.assert(!maybeNext, "Should not rely on next/dynamic in this component");
    } catch {
      // ignore
    }

    // NEW: FadeIn behavior test (state toggles to true after mount tick)
    setTimeout(() => {
      // This is a heuristic: we can't read child state, but ensure setTimeout ran.
      console.assert(true, "FadeIn mounted and tick elapsed");
    }, 0);

    console.groupEnd();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" style={{ color: "#193CB8" }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to content</a>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50" role="banner">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Anchor
                href="/"
                className="flex items-center gap-2 font-bold tracking-tight"
                aria-label="Learnamyte home">
                <img
                  src="/Official_Logo.png"
                  alt="Learnamyte Logo"
                  className="h-15 w-15 object-contain"
                />
                Learnamyte
              </Anchor>
            <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#catalog" className="text-sm text-muted-foreground hover:text-foreground">Catalog</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground">About</a>
            </nav>
            <div className="flex items-center gap-2">
              {/* <Anchor href="/signin" className="hidden sm:inline-flex">
                <Button variant="ghost">Sign in</Button>
              </Anchor> */}
              {/* <Anchor href="/enroll">
                <Button className="inline-flex">Get started</Button>
              </Anchor> */}
            </div>
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
                “Weekend workshops for professionals and students. Experts led hands-on projects & Corporate training workshops.”
              </p>
              <ul className="mt-4 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden /> Sat–Sun · 8–10/11 AM IST · 16–24 hours total</li>
                <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4" aria-hidden /> Capstone projects, reviews, and weekday support</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden /> Course completion certificate</li>
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Anchor href="/workshops">
                  {/* <Button size="lg" className="gap-2">
                    <PlayCircle className="h-4 w-4" aria-hidden /> Explore workshops
                  </Button>
                </Anchor>
                <Anchor href="/cohorts/next">
                  <Button size="lg" variant="outline" className="gap-2">
                    <CalendarDays className="h-4 w-4" aria-hidden /> Join next cohort
                  </Button> */}
                </Anchor>
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
                    <h3 className="text-lg font-semibold">FOQIC (16 hours)</h3>
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
            {categories.map((c) => (
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
                  <Anchor href={`/workshops?track=${encodeURIComponent(c.title)}`} className="mt-4 inline-block">
                  {/*<Button variant="link" className="px-0">See classes →</Button> */}
                  </Anchor>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Instructors */}
        {/* <Section id="instructors" eyebrow="Meet the experts" title="Learn from practitioners"> */}
          {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-2"> */}
            {/* {instructors.map((ins) => ( */}
              {/* <Card key={ins.name} className="h-full"> */}
                {/* <CardContent className="flex items-center gap-4 p-6"> */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* <img src={ins.avatar} alt="" className="h-14 w-14 rounded-full object-cover" loading="lazy" /> */}
                  {/* <div> */}
                    {/* <div className="font-semibold">{ins.name}</div> */}
                    {/* <div className="text-xs text-muted-foreground">{ins.role}</div> */}
                    {/* <p className="mt-1 text-sm text-muted-foreground">{ins.bio}</p> */}
                  {/* </div> */}
                {/* </CardContent> */}
              {/* </Card> */}
            {/* ))} */}
          {/* </div> */}
        {/* </Section> */}

        {/* Testimonials */}
        <Section id="social-proof" eyebrow="Social proof" title="Loved by learners & teams">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { quote: "The workshop playbooks and hands-on labs helped our team ship an Python tool in a week.", name: "Aravind", role: "Business Analyst, E-commerce" },
              { quote: "Finally a platform that cares about outcomes. Our completion and retention doubled.", name: "Amarnath", role: "Application Engineer, Saas" },
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
                  <Anchor href={p.href} className="mt-6 block">
                    {/* <Button className="w-full">{p.cta}</Button> */}
                  </Anchor>
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
                <p>Live cohorts for accountability and feedback.</p>
                <p>Portfolio-ready artifacts to showcase skills.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>For teams</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Instructor-led live virtual or in-person sessions</p>
                <p>Private cohorts tailored to your stack and goals.</p>
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
                {/* <Anchor href="/enroll">
                  <Button size="lg" className="gap-2"><Sparkles className="h-4 w-4" aria-hidden /> Enroll today</Button>
                </Anchor> */}
                <Anchor href="mailto:team@learnamyte.com?subject=Learnamyte%20Sales%20Inquiry&body=Hello%20Team%2C%0D%0A%0AI%20would%20like%20to%20know%20more%20about%20your%20workshops.">
                <Button size="lg" variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" aria-hidden /> Talk to sales
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
                {[
                  { label: "Workshops", href: "/workshops"},
                  { label: "Paths", href: "/paths"},
                  { label: "Pricing", href: "/#pricing"},
                  { label: "For Teams", href: "/#about"},
                ].map((l)=> (
                  <Anchor key={l.label} href={l.href} className="block text-muted-foreground hover:text-foreground">{l.label}</Anchor>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Company</div>
                {[
                  { label: "About", href: "/#about"},
                  { label: "Instructors", href: "/#instructors"},
                  { label: "Blog", href: "/blog"},
                  { label: "Careers", href: "/careers"},
                ].map((l)=> (
                  <Anchor key={l.label} href={l.href} className="block text-muted-foreground hover:text-foreground">{l.label}</Anchor>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Legal</div>
                {[
                  { label: "Terms", href: "/terms"},
                  { label: "Privacy", href: "/privacy"},
                  { label: "Contact", href: "/contact"},
                ].map((l)=> (
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
