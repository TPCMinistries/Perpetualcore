/**
 * Futuristic Library Design Tokens
 * Glassmorphism with glowing accents for a modern AI interface
 */

export const libraryTheme = {
  // Glassmorphism backgrounds
  glass: {
    light: {
      background: "rgba(255, 255, 255, 0.7)",
      border: "rgba(255, 255, 255, 0.3)",
      blur: "20px",
    },
    dark: {
      background: "rgba(15, 23, 42, 0.8)",
      border: "rgba(255, 255, 255, 0.1)",
      blur: "20px",
    },
  },

  // Glowing effects for interactive elements
  glow: {
    primary: {
      color: "59, 130, 246", // Blue
      shadow: "0 0 20px rgba(59, 130, 246, 0.5)",
      shadowStrong: "0 0 30px rgba(59, 130, 246, 0.7)",
    },
    accent: {
      color: "168, 85, 247", // Purple
      shadow: "0 0 20px rgba(168, 85, 247, 0.5)",
      shadowStrong: "0 0 30px rgba(168, 85, 247, 0.7)",
    },
    success: {
      color: "34, 197, 94", // Green
      shadow: "0 0 20px rgba(34, 197, 94, 0.5)",
      shadowStrong: "0 0 30px rgba(34, 197, 94, 0.7)",
    },
    warning: {
      color: "245, 158, 11", // Amber
      shadow: "0 0 20px rgba(245, 158, 11, 0.5)",
      shadowStrong: "0 0 30px rgba(245, 158, 11, 0.7)",
    },
    danger: {
      color: "239, 68, 68", // Red
      shadow: "0 0 20px rgba(239, 68, 68, 0.5)",
      shadowStrong: "0 0 30px rgba(239, 68, 68, 0.7)",
    },
  },

  // Neon colors for graph nodes and accents
  neon: {
    blue: "#3B82F6",
    purple: "#A855F7",
    cyan: "#06B6D4",
    green: "#10B981",
    amber: "#F59E0B",
    pink: "#EC4899",
    red: "#EF4444",
    indigo: "#6366F1",
  },

  // Graph node colors with glow
  graphNodes: {
    document: {
      color: "#3B82F6",
      glow: "0 0 15px rgba(59, 130, 246, 0.6)",
    },
    concept: {
      color: "#A855F7",
      glow: "0 0 15px rgba(168, 85, 247, 0.6)",
    },
    person: {
      color: "#10B981",
      glow: "0 0 15px rgba(16, 185, 129, 0.6)",
    },
    project: {
      color: "#F59E0B",
      glow: "0 0 15px rgba(245, 158, 11, 0.6)",
    },
    space: {
      color: "#06B6D4",
      glow: "0 0 15px rgba(6, 182, 212, 0.6)",
    },
    organization: {
      color: "#EC4899",
      glow: "0 0 15px rgba(236, 72, 153, 0.6)",
    },
    topic: {
      color: "#6366F1",
      glow: "0 0 15px rgba(99, 102, 241, 0.6)",
    },
  },

  // Animation timings
  animation: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    verySlow: "500ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: { type: "spring", stiffness: 300, damping: 30 },
  },

  // Gradients
  gradients: {
    primary: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
    accent: "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)",
    dark: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
    glass: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
    glow: "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
  },
};

// Tailwind-compatible class builders
export const glassClasses = {
  panel: "bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10",
  card: "bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/20 dark:border-white/10",
  subtle: "bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/10 dark:border-white/5",
  overlay: "bg-black/50 backdrop-blur-sm",
};

export const glowClasses = {
  blue: "hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-shadow",
  purple: "hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-shadow",
  cyan: "hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-shadow",
  green: "hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-shadow",
  amber: "hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-shadow",
  pink: "hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-shadow",
};

// Framer Motion variants
export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  glow: {
    initial: { boxShadow: "0 0 0 rgba(59, 130, 246, 0)" },
    animate: {
      boxShadow: [
        "0 0 0 rgba(59, 130, 246, 0)",
        "0 0 20px rgba(59, 130, 246, 0.5)",
        "0 0 0 rgba(59, 130, 246, 0)",
      ],
    },
    transition: { duration: 2, repeat: Infinity },
  },
  pulse: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity },
    },
  },
  float: {
    initial: { y: 0 },
    animate: {
      y: [-5, 5, -5],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  },
};

// Stagger children animation config
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};
