"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { PointerEvent } from "react";

const nodes = [
  ["SAGE", "INTELLIGENCE", "left-[38%] top-[39%]", "bg-[#d7ff3f] text-black"],
  ["KEPT COUNT", "CARE OPS", "left-[18%] top-[16%]", "bg-white text-black"],
  ["WORKFORCE", "FIELD SYSTEM", "right-[5%] top-[12%]", "bg-[#ff6338] text-black"],
  ["RFP ENGINE", "OPPORTUNITY", "left-[17%] bottom-[14%]", "bg-[#2457ff] text-white"],
  ["SENTINEL", "DILIGENCE", "right-[8%] bottom-[16%]", "bg-white text-black"],
] as const;

export function SystemField() {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(50);
  const rawY = useMotionValue(50);
  const x = useSpring(rawX, { stiffness: 220, damping: 30 });
  const y = useSpring(rawY, { stiffness: 220, damping: 30 });
  const glow = useMotionTemplate`radial-gradient(circle at ${x}% ${y}%, rgba(36,87,255,.24), transparent 34%)`;
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    rawX.set(((event.clientX - rect.left) / rect.width) * 100);
    rawY.set(((event.clientY - rect.top) / rect.height) * 100);
  };

  return <motion.div onPointerMove={move} className="relative min-h-[490px] overflow-hidden rounded-[28px] bg-[#131722] text-white shadow-[0_30px_80px_rgba(19,23,34,.22)] sm:min-h-[610px]" initial={reduce ? false : {opacity:0,y:10,filter:"blur(5px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} transition={{type:"spring",duration:.65,bounce:0,delay:.12}}>
    <motion.div className="pointer-events-none absolute inset-0" style={{background:glow}} />
    <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:24px_24px]" />
    <div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
    <div className="absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2457ff]/60" />
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="none" aria-hidden="true"><g stroke="rgba(215,255,63,.42)" strokeWidth="1.5" fill="none"><path d="M390 290 L170 130"/><path d="M410 290 L650 125"/><path d="M385 320 L145 500"/><path d="M420 320 L675 490"/></g></svg>
    <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/12 bg-white/[.06] px-3 py-2 text-[10px] font-bold tracking-[.13em] text-white/70"><span className="h-2 w-2 rounded-full bg-[#d7ff3f] shadow-[0_0_12px_#d7ff3f]" /> NETWORK ACTIVE</div>
    {nodes.map(([name, role, pos, color], index) => <motion.div key={name} whileHover={reduce ? undefined : {y:-4,scale:1.025}} transition={{type:"spring",stiffness:300,damping:24,delay:reduce?0:.18+index*.055}} initial={reduce ? false : {opacity:0,y:8,filter:"blur(4px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} className={`absolute ${pos} max-w-[145px] -translate-x-1/2 cursor-default rounded-[16px] border border-white/10 p-3 shadow-2xl sm:max-w-none sm:p-4 ${color}`}><p className="text-[9px] font-black tracking-[.14em] opacity-55">{role}</p><p className="mt-1 text-xs font-black tracking-[-.02em] sm:text-sm">{name}</p></motion.div>)}
    <div className="absolute bottom-5 left-5 max-w-[250px] rounded-[16px] border border-white/10 bg-white/[.06] p-4 backdrop-blur"><p className="text-[10px] font-bold tracking-[.12em] text-[#d7ff3f]">LIVE SIGNAL</p><p className="mt-2 text-xs leading-5 text-white/60">Context moves through approved lanes. Authority stays with the institution.</p></div>
  </motion.div>;
}
