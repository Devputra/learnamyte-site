/* eslint-disable @next/next/no-img-element */

import { useMemo, type ReactNode } from "react";
import { Sparkles, Award, Globe2, Zap } from "lucide-react";

export function Anchor(
  { href = "#", className, children, ...rest }:
  React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}

export const Container = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
);

export const Section = ({
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
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
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

export const Badges = () => (
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
