"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, CalendarDays, Users, Sparkles, CheckCircle2, PlayCircle,
  Mail, ArrowRight, Shield, BarChart3, Globe2, Zap, Quote
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/* ---------------- Utilities ---------------- */

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

const Badges = () => (
  <div className="flex flex-wrap items-center justify-center gap-3">
    {(
      [
        [Sparkles, "Expert-led"],
        [Shield, "Quality-first"],
        [Globe2, "Global access"],
        [Zap, "Hands-on"],
      ] as const
    ).map(([Icon, label]) => (
      <span
        key={label}
        className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
    ))}
  </div>
);

/* ---------------- Main Page ---------------- */

function LearnamyteLanding() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
const [msg, setMsg] = useState<string | null>(null);

async function handleSubscribe(e: React.FormEvent) {
  e.preventDefault();
  setMsg(null);
  if (!email) return setMsg("Please enter your email.");
  setLoading(true);
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // Read text, then try JSON to avoid parse crashes
    const text = await res.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    const ok = typeof data === "object" && data !== null && "ok" in data && (data as any).ok === true;
    const error =
      typeof data === "object" && data !== null && "error" in data ? (data as any).error : undefined;

    if (res.ok && ok) {
      setMsg("You're on the list! Check your inbox.");
      setEmail("");
    } else {
      setMsg(error || `Request failed (${res.status})`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error.";
    setMsg(message);
  } finally {
    setLoading(false);
  }
}

  const features = [
    { icon: BookOpen, title: "Workshops that work", desc: "Live, cohort-based and on-demand classes designed with measurable outcomes." },
    { icon: Users, title: "Verified experts", desc: "Every instructor is vetted for real-world impact, not just credentials." },
    { icon: CalendarDays, title: "Flexible schedules", desc: "Weekend intensives, evening cohorts, and async modules that fit life." },
    { icon: BarChart3, title: "Trackable progress", desc: "Quizzes, projects, and analytics to prove learning and ROI." },
  ];

  const categories = [
    { title: "AI & Data", copy: "Build AI apps, master analytics, and ship ML projects.", items: ["GenAI apps", "Data Viz", "SQL & Python", "RAG"] },
    { title: "Product & Growth", copy: "Strategy, UX, and growth loops from operators.", items: ["PM", "UX/UI", "A/B Testing", "SEO & Ads"] },
    { title: "Business & Leadership", copy: "Lead teams, scale ops, and communicate with influence.", items: ["Storytelling", "Mgmt 101", "OKRs", "Finance"] },
  ];

  const plans = [
    { name: "Starter", price: "Free", period: "forever", highlights: ["2 free mini-classes", "Community access", "Email lessons"], cta: "Get started", featured: false },
    { name: "Pro Learner", price: "$39", period: "per month", highlights: ["Unlimited workshops", "Certificate paths", "Project feedback", "Progress analytics"], cta: "Start your trial", featured: true },
    { name: "Teams", price: "Custom", period: "annual", highlights: ["Seats & SSO", "Manager analytics", "Private cohorts", "Dedicated success"], cta: "Talk to sales", featured: false },
  ];

  const testimonials = [
    { quote: "The workshop playbooks and hands-on labs helped our team ship an AI prototype in a week.", name: "Priya M.", role: "Head of Product, Fintech" },
    { quote: "Finally a platform that cares about outcomes. Our completion and retention doubled.", name: "Arjun K.", role: "L&D Lead, SaaS" },
    { quote: "Crystal clear content. You feel guided by pros who actually do the work.", name: "Ananya S.", role: "Designer" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <a href="#" className="flex items-center gap-2 font-bold tracking-tight">
              <Sparkles className="h-5 w-5" /> Learnamyte
            </a>
            <nav className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#catalog" className="text-sm text-muted-foreground hover:text-foreground">Catalog</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground">About</a>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button>
              <Button className="inline-flex">Get started</Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(75%_75%_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 py-16 sm:py-24 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badges />
              <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
                Learn from experts. <span className="text-primary">Build what matters.</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Learnamyte is the workshop platform for ambitious learners and teams. Live classes, hands-on projects, and proof of progress.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="gap-2">
                  <PlayCircle className="h-4 w-4" /> Explore workshops
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <CalendarDays className="h-4 w-4" /> Join next cohort
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">No spam. Cancel anytime.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Card className="border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" /> Upcoming Free Class
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Ship Your First AI App (90-min)</h3>
                    <p className="text-sm text-muted-foreground">Live demo • Starter code • Q&A</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Create a prompt-driven UI",
                      "Connect to an embeddings API",
                      "Add analytics to track outcomes",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                  <Input
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                  />
                  <Button type="submit" className="gap-2" disabled={loading}>
                    {loading ? "Sending..." : <>Notify me <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </form>
                {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </Container>
      </section>

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
                <f.icon className="h-5 w-5" />
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
        title="Popular tracks"
        subtitle="Follow a guided path or pick a one-off workshop—your call."
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
                <Button variant="link" className="mt-4 px-0">See classes →</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section id="social-proof" eyebrow="Social proof" title="Loved by learners & teams">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="h-full">
              <CardContent className="pt-6">
                <Quote className="mb-4 h-6 w-6" />
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
        title="Simple, transparent pricing"
        subtitle="Start free. Upgrade when you're ready."
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
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {h}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full">{p.cta}</Button>
              </CardContent>
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
              <p>Manager dashboards to track adoption and ROI.</p>
              <p>Private cohorts tailored to your stack and goals.</p>
              <p>Integrations for SSO, HRIS, and LMS exports.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

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
                <Button size="lg" className="gap-2"><Sparkles className="h-4 w-4" /> Create free account</Button>
                <Button size="lg" variant="outline" className="gap-2"><Mail className="h-4 w-4" /> Talk to sales</Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t py-10 text-sm">
        <Container>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4" /> Learnamyte</div>
              <p className="mt-2 max-w-xs text-muted-foreground">Expert-led workshops that turn knowledge into outcomes.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:col-span-3 md:grid-cols-3">
              <div className="space-y-2">
                <div className="font-semibold">Product</div>
                {["Workshops","Paths","Pricing","For Teams"].map((l)=> (
                  <a key={l} href="#" className="block text-muted-foreground hover:text-foreground">{l}</a>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Company</div>
                {["About","Instructors","Blog","Careers"].map((l)=> (
                  <a key={l} href="#" className="block text-muted-foreground hover:text-foreground">{l}</a>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Legal</div>
                {["Terms","Privacy","Contact"].map((l)=> (
                  <a key={l} href="#" className="block text-muted-foreground hover:text-foreground">{l}</a>
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
