"use client";

import { type ReactNode, useRef } from "react";
import { useSectionActivation } from "@/animation/use-section-activation";

/** TEMPORARY. A plain section that reports itself as active while centered. */
export function DemoSection({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useSectionActivation(ref, id);
  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  );
}
