"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <motion.div
    className={className}
    initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(5px)" }}
    whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, amount: 0.16 }}
    transition={{ type: "spring", duration: 0.55, bounce: 0, delay }}
  >{children}</motion.div>;
}
