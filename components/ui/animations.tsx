"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { ReactNode } from "react";

// Fade animations
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeLeftVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeRightVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Scale animations
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  exit: { opacity: 0, scale: 0.8 },
};

// Slide animations
export const slideUpVariants: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
};

export const slideDownVariants: Variants = {
  hidden: { y: "-100%" },
  visible: { y: 0 },
  exit: { y: "-100%" },
};

export const slideLeftVariants: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};

export const slideRightVariants: Variants = {
  hidden: { x: "-100%" },
  visible: { x: 0 },
  exit: { x: "-100%" },
};

// Stagger container
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
};

// List item animations
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

// Card hover animations
export const cardHoverVariants: Variants = {
  rest: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 },
};

// Pulse animation for notifications
export const pulseVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
  },
};

// Shimmer effect for loading
export const shimmerVariants: Variants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: { repeat: Infinity, duration: 1.5, ease: "linear" }
  },
};

// Component wrappers
interface AnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, className, delay = 0, duration = 0.3 }: AnimationProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeVariants}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ children, className, delay = 0, duration = 0.4 }: AnimationProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeUpVariants}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInDown({ children, className, delay = 0, duration = 0.4 }: AnimationProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeDownVariants}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInLeft({ children, className, delay = 0, duration = 0.4 }: AnimationProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeLeftVariants}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInRight({ children, className, delay = 0, duration = 0.4 }: AnimationProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeRightVariants}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0, duration = 0.3 }: AnimationProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleVariants}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PopIn({ children, className, delay = 0 }: AnimationProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={popVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.1 }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Animated list for items that can be added/removed
interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function AnimatedListItem({ children, className, layoutId }: { children: ReactNode; className?: string; layoutId?: string }) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={listItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Hover card wrapper
export function HoverCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={cardHoverVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Skeleton with shimmer
export function AnimatedSkeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted rounded ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
      />
    </div>
  );
}

// Notification badge with pulse
export function PulseBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="initial"
      animate="pulse"
      variants={pulseVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Collapse/Expand animation
export function Collapse({ children, isOpen, className }: { children: ReactNode; isOpen: boolean; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Modal/Dialog animation wrapper
export function ModalAnimation({ children, isOpen, className }: { children: ReactNode; isOpen: boolean; className?: string }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Drawer animation
export function DrawerAnimation({
  children,
  isOpen,
  side = "right",
  className
}: {
  children: ReactNode;
  isOpen: boolean;
  side?: "left" | "right" | "top" | "bottom";
  className?: string
}) {
  const getVariants = () => {
    switch (side) {
      case "left": return slideRightVariants;
      case "right": return slideLeftVariants;
      case "top": return slideDownVariants;
      case "bottom": return slideUpVariants;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getVariants()}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Counter animation for numbers
export function AnimatedCounter({
  value,
  className,
  duration = 0.5
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
      transition={{ duration }}
    >
      {value}
    </motion.span>
  );
}

// Typing animation for text
export function TypeWriter({
  text,
  className,
  speed = 50
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  return (
    <motion.span className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * (speed / 1000) }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Spinner animation
export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="10"
      />
    </motion.svg>
  );
}

// Success checkmark animation
export function SuccessCheck({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
    </motion.svg>
  );
}

// Export AnimatePresence for use in other components
export { AnimatePresence, motion };
