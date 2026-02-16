"use client";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Visible color mesh — these need to be seen through glass panels */}
      <div className="absolute inset-0">
        {/* Large violet wash - top right */}
        <div
          className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full animate-float-slow"
          style={{
            background: "radial-gradient(circle, hsl(256 70% 80% / 0.25) 0%, transparent 65%)",
          }}
        />
        {/* Warm peach wash - left center */}
        <div
          className="absolute top-[10%] -left-[15%] w-[60%] h-[60%] rounded-full animate-float animation-delay-2000"
          style={{
            background: "radial-gradient(circle, hsl(25 90% 80% / 0.2) 0%, transparent 65%)",
          }}
        />
        {/* Cyan accent - bottom right */}
        <div
          className="absolute -bottom-[10%] right-[5%] w-[50%] h-[50%] rounded-full animate-float-slower animation-delay-4000"
          style={{
            background: "radial-gradient(circle, hsl(190 70% 75% / 0.18) 0%, transparent 65%)",
          }}
        />
        {/* Soft pink - bottom left */}
        <div
          className="absolute bottom-[5%] -left-[10%] w-[45%] h-[45%] rounded-full animate-float-slow animation-delay-6000"
          style={{
            background: "radial-gradient(circle, hsl(330 60% 80% / 0.15) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Dark mode: stronger violet center glow + deep blue mesh */}
      <div className="absolute inset-0 hidden dark:block">
        {/* Override light orbs with dark-appropriate ones */}
        <div
          className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full animate-float-slow"
          style={{
            background: "radial-gradient(circle, hsl(256 80% 50% / 0.2) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute top-[20%] -left-[10%] w-[55%] h-[55%] rounded-full animate-float animation-delay-2000"
          style={{
            background: "radial-gradient(circle, hsl(220 80% 45% / 0.15) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute top-[30%] left-[30%] w-[50%] h-[50%] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(256 80% 60% / 0.08) 0%, transparent 50%)",
          }}
        />
      </div>
    </div>
  );
}
