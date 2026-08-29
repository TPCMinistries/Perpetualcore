"use client";

import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useState, type PointerEvent } from "react";

const satellites = [
  { id: "kept", name: "KEPT COUNT", role: "CARE OPS", pos: "left-[4%] top-[15%]", color: "bg-white text-black", path: "M390 300 C320 245 250 185 150 126", point: [150,126], signal: "Care evidence moves through an approved boundary—not a shared raw-data pool." },
  { id: "workforce", name: "WORKFORCE", role: "FIELD SYSTEM", pos: "right-[4%] top-[12%]", color: "bg-[#ff6338] text-black", path: "M410 294 C505 240 565 170 665 118", point: [665,118], signal: "Enrollment and placement context stays governed by program authority." },
  { id: "rfp", name: "RFP ENGINE", role: "OPPORTUNITY", pos: "left-[4%] bottom-[29%] sm:bottom-[17%]", color: "bg-[#2457ff] text-white", path: "M390 318 C315 370 245 440 142 500", point: [142,500], signal: "Opportunity intelligence arrives with sources, fit logic, and a human bid decision." },
  { id: "sentinel", name: "SENTINEL", role: "DILIGENCE", pos: "right-[7%] bottom-[29%] sm:bottom-[16%]", color: "bg-white text-black", path: "M414 320 C500 380 575 448 680 492", point: [680,492], signal: "Diligence findings escalate risk; they do not make consequential decisions." },
] as const;

export function SystemField() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<(typeof satellites)[number]>(satellites[0]);
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

  return <motion.div onPointerMove={move} className="relative min-h-[500px] overflow-hidden rounded-[28px] bg-[#131722] text-white shadow-[0_30px_80px_rgba(19,23,34,.22)] sm:min-h-[610px]" initial={reduce ? false : {opacity:0,y:10,filter:"blur(5px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} transition={{type:"spring",duration:.65,bounce:0,delay:.12}}>
    <motion.div className="pointer-events-none absolute inset-0" style={{background:glow}} />
    <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:24px_24px]" />
    <div className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.07]" />
    <div className="absolute left-1/2 top-1/2 h-[39%] w-[39%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2457ff]/45" />

    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="none" aria-hidden="true">
      {satellites.map((node,index) => <g key={node.id}>
        <motion.path d={node.path} fill="none" stroke={active.id===node.id?"rgba(215,255,63,.82)":"rgba(255,255,255,.12)"} strokeWidth={active.id===node.id?2.2:1.2} initial={reduce?false:{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:1}} transition={{duration:reduce?0:.7,delay:reduce?0:.2+index*.08,ease:[.2,.8,.2,1]}} />
        <circle cx={node.point[0]} cy={node.point[1]} r="4" fill={active.id===node.id?"#d7ff3f":"rgba(255,255,255,.25)"}/>
      </g>)}
      <AnimatePresence mode="wait">{!reduce && <motion.circle key={active.id} r="5" fill="#d7ff3f" initial={{opacity:0,scale:.9}} animate={{opacity:[0,1,1,0],offsetDistance:["0%","0%","100%","100%"]}} exit={{opacity:0}} transition={{duration:1.05,times:[0,.08,.88,1],ease:"linear"}} style={{offsetPath:`path('${active.path}')`,filter:"drop-shadow(0 0 8px #d7ff3f)"}} />}</AnimatePresence>
    </svg>

    <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/12 bg-white/[.06] px-3 py-2 text-[10px] font-bold tracking-[.13em] text-white/70"><span className="h-2 w-2 rounded-full bg-[#d7ff3f] shadow-[0_0_12px_#d7ff3f]" /> GOVERNED NETWORK</div>

    <button type="button" onClick={()=>setActive(satellites[0])} className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[18px] bg-[#d7ff3f] p-4 text-left text-black shadow-[0_18px_50px_rgba(215,255,63,.16)] transition-transform duration-200 hover:scale-[1.035] active:scale-[.98] sm:p-5"><p className="text-[9px] font-black tracking-[.14em] opacity-55">SHARED INTELLIGENCE</p><p className="mt-1 text-sm font-black">SAGE</p></button>

    {satellites.map((node,index) => <motion.button type="button" key={node.id} onClick={()=>setActive(node)} aria-pressed={active.id===node.id} whileHover={reduce?undefined:{y:-4,scale:1.025}} whileTap={reduce?undefined:{scale:.98}} transition={{type:"spring",stiffness:300,damping:24,delay:reduce?0:.18+index*.055}} initial={reduce?false:{opacity:0,y:8,filter:"blur(4px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} className={`absolute z-10 ${node.pos} max-w-[138px] cursor-pointer rounded-[16px] border p-3 text-left shadow-2xl transition-[border-color,box-shadow] sm:max-w-none sm:p-4 ${node.color} ${active.id===node.id?"border-[#d7ff3f] shadow-[0_0_0_3px_rgba(215,255,63,.13),0_18px_40px_rgba(0,0,0,.25)]":"border-white/10"}`}><p className="text-[9px] font-black tracking-[.14em] opacity-55">{node.role}</p><p className="mt-1 text-xs font-black tracking-[-.02em] sm:text-sm">{node.name}</p></motion.button>)}

    <div className="absolute inset-x-4 bottom-4 z-20 max-w-[330px] rounded-[16px] border border-white/10 bg-[#202532]/95 p-4 shadow-2xl backdrop-blur sm:left-5 sm:right-auto sm:bottom-5"><div className="flex items-center gap-2 text-[9px] font-black tracking-[.13em] text-[#d7ff3f]"><ShieldCheck className="h-3.5 w-3.5"/> ACTIVE BOUNDARY / {active.role}</div><AnimatePresence mode="wait"><motion.p key={active.id} initial={reduce?false:{opacity:0,y:4,filter:"blur(2px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} exit={{opacity:0,y:-2,filter:"blur(2px)"}} transition={{duration:.18}} className="mt-2 text-xs leading-5 text-white/65">{active.signal}</motion.p></AnimatePresence></div>
  </motion.div>;
}
