"use client";

import { useEffect } from 'react';

export default function PresentationPage() {
  useEffect(() => {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    function showSlide(n: number) {
      slides[currentSlide].classList.remove('active');
      currentSlide = (n + totalSlides) % totalSlides;
      slides[currentSlide].classList.add('active');

      const slideCounter = document.getElementById('slideCounter');
      if (slideCounter) {
        slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;
      }

      const progress = ((currentSlide + 1) / totalSlides) * 100;
      const progressBar = document.getElementById('progressBar');
      if (progressBar) {
        progressBar.style.width = progress + '%';
      }

      const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
      const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
      if (prevBtn) prevBtn.disabled = currentSlide === 0;
      if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;

      (slides[currentSlide] as HTMLElement).scrollTop = 0;
    }

    function changeSlide(direction: number) {
      showSlide(currentSlide + direction);
    }

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        if (currentSlide > 0) changeSlide(-1);
      } else if (event.key === 'ArrowRight' || event.key === ' ') {
        if (currentSlide < totalSlides - 1) changeSlide(1);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', keyHandler);

    showSlide(0);

    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #000000;
          color: #ffffff;
          overflow: hidden;
          height: 100vh;
          width: 100vw;
        }

        .presentation-wrapper {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: radial-gradient(ellipse at center, #0f0f0f 0%, #000000 100%);
        }

        .slide {
          display: none;
          width: 100%;
          max-width: 1400px;
          height: 100vh;
          padding: 80px 120px;
          position: relative;
          overflow-y: auto;
          animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide.active {
          display: flex;
          flex-direction: column;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Typography */
        .slide h1 {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.04em;
          word-wrap: break-word;
        }

        .slide h2 {
          font-size: clamp(1.5rem, 3vw, 2.5rem);
          font-weight: 800;
          margin: 2.5rem 0 1.5rem 0;
          color: #ffffff;
          letter-spacing: -0.03em;
          word-wrap: break-word;
        }

        .slide h3 {
          font-size: clamp(1.2rem, 2vw, 1.8rem);
          font-weight: 700;
          margin: 2rem 0 1rem 0;
          color: #e0e0e0;
          letter-spacing: -0.02em;
          word-wrap: break-word;
        }

        .slide p {
          font-size: clamp(1rem, 1.5vw, 1.25rem);
          line-height: 1.8;
          color: #b0b0b0;
          margin-bottom: 1.2rem;
          font-weight: 400;
          word-wrap: break-word;
        }

        .slide ul, .slide ol {
          margin: 1.5rem 0 1.5rem 2rem;
        }

        .slide li {
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          line-height: 1.8;
          color: #b0b0b0;
          margin-bottom: 1rem;
          word-wrap: break-word;
        }

        .slide strong {
          color: #ffffff;
          font-weight: 700;
        }

        .slide em {
          color: #888888;
          font-style: italic;
        }

        /* Cover Slide */
        .cover-slide {
          justify-content: center;
          align-items: flex-start;
          position: relative;
          padding: 100px 120px !important;
        }

        .cover-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 50%, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
          pointer-events: none;
          animation: ambientGlow 8s ease-in-out infinite;
        }

        @keyframes ambientGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        .cover-slide h1 {
          font-size: clamp(3rem, 7vw, 6rem);
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .cover-slide .subtitle {
          font-size: clamp(1.3rem, 2.5vw, 2rem);
          color: #888888;
          font-weight: 500;
          margin-bottom: 4rem;
          position: relative;
          z-index: 1;
          word-wrap: break-word;
        }

        .cover-slide .author {
          font-size: clamp(1rem, 1.5vw, 1.3rem);
          color: #666666;
          font-weight: 400;
          margin-top: auto;
          position: relative;
          z-index: 1;
        }

        /* Card Components */
        .info-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 2rem 2.5rem;
          margin: 2rem 0;
          position: relative;
          overflow: hidden;
          word-wrap: break-word;
        }

        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #4f46e5 0%, #a855f7 100%);
        }

        .highlight-card {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
          border: 1px solid rgba(79, 70, 229, 0.3);
          border-radius: 16px;
          padding: 2rem 2.5rem;
          margin: 2rem 0;
          backdrop-filter: blur(10px);
          word-wrap: break-word;
        }

        .stat-card {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem 2.5rem;
          margin: 2rem 0;
          box-shadow: 0 20px 60px rgba(79, 70, 229, 0.3);
          position: relative;
          overflow: hidden;
          word-wrap: break-word;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .stat-card p, .stat-card li, .stat-card strong, .stat-card h3 {
          color: #ffffff;
          position: relative;
          z-index: 1;
        }

        .warning-card {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 2rem 2.5rem;
          margin: 2rem 0;
          word-wrap: break-word;
        }

        /* Code blocks */
        code {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          padding: 1.5rem 2rem;
          border-radius: 12px;
          font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
          font-size: clamp(0.85rem, 1.2vw, 1rem);
          color: #a0a0a0;
          display: block;
          line-height: 1.8;
          margin: 1.5rem 0;
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        /* Lists */
        .checklist {
          list-style: none;
          margin-left: 0;
        }

        .checklist li {
          position: relative;
          padding-left: 2.5rem;
          margin-bottom: 1rem;
        }

        .checklist li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: 700;
          font-size: 1.2em;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .warning-list {
          list-style: none;
          margin-left: 0;
        }

        .warning-list li {
          position: relative;
          padding-left: 2.5rem;
          margin-bottom: 1rem;
        }

        .warning-list li::before {
          content: "✗";
          position: absolute;
          left: 0;
          color: #ef4444;
          font-weight: 700;
          font-size: 1.2em;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        /* Navigation */
        .navigation {
          position: fixed;
          bottom: 50px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 20px;
          z-index: 1000;
        }

        .nav-button {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Inter', sans-serif;
        }

        .nav-button:hover:not(:disabled) {
          background: rgba(79, 70, 229, 0.8);
          border-color: rgba(79, 70, 229, 1);
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(79, 70, 229, 0.4);
        }

        .nav-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .nav-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Progress & Counter */
        .progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #4f46e5 0%, #a855f7 100%);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1001;
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.6);
        }

        .slide-counter {
          position: fixed;
          top: 50px;
          right: 50px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          z-index: 1000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: 'Inter', sans-serif;
        }

        /* Scrollbar */
        .slide::-webkit-scrollbar {
          width: 8px;
        }

        .slide::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .slide::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.5);
          border-radius: 4px;
        }

        .slide::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 70, 229, 0.8);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .slide {
            padding: 60px 60px;
          }

          .cover-slide {
            padding: 80px 60px !important;
          }
        }

        @media (max-width: 768px) {
          .slide {
            padding: 40px 30px;
          }

          .cover-slide {
            padding: 60px 30px !important;
          }

          .info-card, .highlight-card, .stat-card, .warning-card {
            padding: 1.5rem;
          }

          .navigation {
            bottom: 30px;
            gap: 12px;
          }

          .nav-button {
            padding: 12px 24px;
            font-size: 0.9rem;
          }

          .slide-counter {
            top: 30px;
            right: 30px;
            padding: 10px 20px;
            font-size: 0.9rem;
          }
        }

        .divider {
          width: 60px;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5 0%, #a855f7 100%);
          margin: 2rem 0;
          border-radius: 2px;
        }

        .section-label {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #666666;
          margin-bottom: 1rem;
        }

        .big-number {
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 900;
          background: linear-gradient(135deg, #4f46e5 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin: 1rem 0;
        }
      `}</style>

      <div className="progress-bar" id="progressBar"></div>
      <div className="slide-counter" id="slideCounter">1 / 19</div>

      <div className="presentation-wrapper">
        {/* SLIDE 1: Cover */}
        <div className="slide active cover-slide">
          <h1>What Actually Matters About AI</h1>
          <p className="subtitle">A Guide for Commercial Furniture Operations</p>
          <p className="author">Lorenzo Daughtry-Chambers → Jocelyn Corrigan</p>
        </div>

        {/* SLIDE 2: The Thing Nobody Tells You */}
        <div className="slide">
          <div className="section-label">The Reality</div>
          <h1>The Thing Nobody Tells You</h1>
          <div className="divider"></div>

          <p>Most people are using AI at like 10% capacity and don't know it.</p>
          <p>I see executives all the time who say "yeah, we're using AI" and when I ask how, it's basically ChatGPT for occasional emails.</p>

          <div className="stat-card">
            <strong>Here's the reality:</strong> There's casual AI usage and then there's operational AI. The gap is massive.
          </div>

          <div className="info-card">
            <p><strong>Casual usage:</strong> You save 15 minutes here and there. Nice but not transformative.</p>
          </div>

          <div className="highlight-card">
            <p><strong>Operational usage:</strong> You 2-3x your capacity in key functions. Actually changes what's possible.</p>
          </div>
        </div>

        {/* SLIDE 3: How to Actually Use This */}
        <div className="slide">
          <h1>How to Actually Use This Stuff</h1>
          <div className="divider"></div>

          <h2>Stop Treating It Like Google</h2>
          <p>Most people use AI like: Ask question → Get answer → Move on.</p>
          <p><strong>That's not where the value is.</strong></p>

          <div className="highlight-card">
            <h3>What actually works:</h3>
            <p>Give it your full context. Your role. Your priorities. What you're trying to accomplish.</p>
          </div>

          <p>If you're using ChatGPT, set up Custom Instructions:</p>
          <code>{`I'm COO of a $370M commercial furniture dealership. I oversee
strategy, RFPs, design, marketing, new business development.
Currently targeting $1B.

I make decisions about operational efficiency, competitive
positioning, growth. I value data-driven insights with clear
options and trade-offs. Skip the jargon.`}</code>
        </div>

        {/* SLIDE 4: Different AIs */}
        <div className="slide">
          <h2>Use Different AIs for Different Work</h2>

          <div className="info-card">
            <p><strong>Claude</strong> - Deep research, complex analysis, anything requiring real thinking</p>
          </div>

          <div className="info-card">
            <p><strong>ChatGPT</strong> - Quick creative, brainstorming</p>
          </div>

          <div className="info-card">
            <p><strong>Perplexity</strong> - Current info (has live web search)</p>
          </div>

          <div className="info-card">
            <p><strong>Gamma</strong> - Presentations (turns outlines into full decks in minutes)</p>
          </div>

          <div className="highlight-card">
            <p>I use all of these depending on the job. Built myself a system (call it Perpetual Core) that routes work to the right one and keeps context across them.</p>
            <p><strong>Point is: different tools for different jobs.</strong></p>
          </div>
        </div>

        {/* SLIDE 5: Context & Iteration */}
        <div className="slide">
          <h2>Context Is Everything</h2>

          <div className="warning-card">
            <p><strong>What amateurs do:</strong><br/>"Write a proposal for this client"</p>
          </div>

          <div className="highlight-card">
            <p><strong>What works:</strong><br/>"Write a proposal for [Client Name], financial services firm, redesigning 3 floors in Chicago. They care about brand consistency, wellness, collaboration, sustainability. Budget $8-12M. Previous vendor was [Competitor]—they complained about slow turnaround. Our differentiator is [X, Y, Z]. July deadline."</p>
          </div>

          <div className="stat-card">
            More context = exponentially better output
          </div>

          <h2>Never Accept First Draft</h2>
          <p>1. Prompt → Get draft (1 min)<br/>
          2. Review critically (2 min)<br/>
          3. Tell it what's wrong (1 min)<br/>
          4. Regenerate (30 sec)<br/>
          5. Repeat 2-3x</p>

          <div className="big-number">10 min</div>
          <p><strong>Total: 10 minutes instead of 45 minutes writing from scratch.</strong></p>
        </div>

        {/* SLIDE 6: Personal vs Operational */}
        <div className="slide">
          <div className="section-label">The Difference</div>
          <h1>Personal AI vs. Operational AI</h1>
          <div className="divider"></div>

          <div className="info-card">
            <h3>Personal AI</h3>
            <p>Everyone at your company uses ChatGPT for their own stuff. Scattered. Inconsistent. No shared context.</p>
            <p><strong>Result:</strong> 10-25% individual productivity gains for people who remember to use it.</p>
          </div>

          <div className="stat-card">
            <h3>Operational AI</h3>
            <p>AI that actually knows your business. Your past decisions. Your workflows. Your strategic context. Built into how work gets done.</p>
            <div className="big-number">50-200%</div>
            <p><strong>Result: Capacity expansion in key functions.</strong></p>
          </div>
        </div>

        {/* SLIDE 7: The Data */}
        <div className="slide">
          <div className="section-label">Evidence</div>
          <h2>The Data</h2>
          <div className="divider"></div>

          <p>I've studied 50+ enterprise transformations. The pattern is clear:</p>

          <div className="info-card">
            <p><strong>Goldman Sachs:</strong> $1B investment. 20-40% productivity gains across functions. Running 1M+ AI prompts monthly enterprise-wide.</p>
          </div>

          <div className="info-card">
            <p><strong>IBM:</strong> $4.5B in documented savings. 3.9M work hours saved annually.</p>
          </div>

          <div className="info-card">
            <p><strong>B2B Sales Operations:</strong> 50-91% time reduction on proposals. Volume increases of 2-10x. 3-15x ROI in first year.</p>
          </div>

          <div className="stat-card">
            Companies that architect AI into operations are creating 12-24 month competitive leads that competitors won't be able to close.
          </div>
        </div>

        {/* SLIDE 8: Commercial Furniture */}
        <div className="slide">
          <div className="section-label">Your Industry</div>
          <h1>Why Commercial Furniture</h1>
          <div className="divider"></div>

          <p>After talking with Erv, I got curious about where AI creates the most leverage.</p>
          <p><strong>Your industry showed up as unusually high-potential.</strong></p>

          <div className="highlight-card">
            <h3>The sectors seeing biggest AI impact share these traits:</h3>
            <ul>
              <li>Complex multi-stakeholder sales cycles ✓</li>
              <li>Proposal/RFP-intensive processes ✓</li>
              <li>Mix of creative and technical work ✓</li>
              <li>Project management complexity ✓</li>
              <li>Long-term relationship management ✓</li>
            </ul>
            <p><strong>Commercial furniture has all five.</strong></p>
          </div>

          <div className="stat-card">
            <div className="big-number">&lt;5%</div>
            <p>Industry adoption is still under 5%. First-mover window is wide open.</p>
          </div>
        </div>

        {/* SLIDE 9: RFP Operations */}
        <div className="slide">
          <div className="section-label">Applications</div>
          <h1>What This Actually Looks Like</h1>
          <div className="divider"></div>

          <h2>RFP Operations</h2>
          <p>Typical dealer at your scale:</p>
          <ul>
            <li>200-300 RFPs annually</li>
            <li>40 hours average per RFP</li>
            <li>$400-600K annual labor cost</li>
          </ul>

          <div className="highlight-card">
            <h3>Real results:</h3>
            <ul>
              <li><strong>Transplace:</strong> 50% time reduction (40 hrs → 20 hrs)</li>
              <li><strong>Alera Group:</strong> 10 RFPs/year → 10 per QUARTER (same team)</li>
              <li><strong>Microsoft RFP team:</strong> $746 return per $1 invested</li>
            </ul>
          </div>

          <div className="stat-card">
            <div className="big-number">2-4x</div>
            <p>Translation: 2-4x capacity + 15-25% better win rates</p>
            <p><strong>While your competitors take 3 weeks to respond, you turn them around in 3 days.</strong></p>
          </div>
        </div>

        {/* SLIDE 10: Design Services */}
        <div className="slide">
          <h2>Design Services</h2>
          <div className="divider"></div>

          <p>Most dealers: Designers spend 60-70% time on CAD grinding, only 30-40% on actual creative work.</p>

          <h3>AI flips this:</h3>
          <ul>
            <li>Upload floor plan → Get 15-20 layout options in different styles</li>
            <li>Photorealistic renderings in seconds</li>
            <li>Automatic specs and pricing</li>
          </ul>

          <div className="stat-card">
            <h3>Impact:</h3>
            <ul style={{marginLeft: 0, listStyle: 'none'}}>
              <li>• Concept phase: 10x faster (2-3 days → 4-6 hours)</li>
              <li>• Show clients 15 options instead of 3</li>
              <li>• Designers spend 70% time on strategy/clients, 30% technical</li>
            </ul>
            <div className="big-number">3x</div>
            <p><strong>3x capacity per designer</strong></p>
          </div>

          <div className="highlight-card">
            <p><strong>Your designers become the reason clients choose Empire.</strong></p>
          </div>
        </div>

        {/* SLIDE 11: Sales & Bigger Picture */}
        <div className="slide">
          <h2>Sales/CRM</h2>
          <p>AI transforms admin-heavy work:</p>
          <ul>
            <li>Meetings transcribed and summarized automatically</li>
            <li>CRM updates itself</li>
            <li>System tells you who to follow up with and why</li>
            <li>Predicts which leads will close</li>
          </ul>

          <div className="highlight-card">
            <p><strong>Results: 20-40% productivity gain + measurable win rate increases</strong></p>
          </div>

          <h2>The Bigger Picture</h2>
          <div className="info-card">
            <ul>
              <li><strong>RFPs:</strong> 2-4x capacity</li>
              <li><strong>Design:</strong> 3x capacity</li>
              <li><strong>Sales:</strong> 20-40% productivity gain</li>
              <li><strong>Marketing:</strong> 70% faster campaigns</li>
              <li><strong>Project Management:</strong> Predictive issue detection</li>
            </ul>
          </div>

          <div className="stat-card">
            <p>Conservative estimate: $1.5-3M operational value first year.</p>
            <p><strong>But the real value is strategic—you become the dealer competitors can't keep up with.</strong></p>
          </div>
        </div>

        {/* SLIDE 12: What I've Built */}
        <div className="slide">
          <div className="section-label">My Platform</div>
          <h1>What I've Actually Built</h1>
          <div className="divider"></div>

          <p>I built Perpetual Core initially to solve my own operational complexity problem—running multiple ventures that needed to work together intelligently.</p>

          <div className="highlight-card">
            <h3>What changed for my operations:</h3>
            <ul>
              <li>Content creation: 60% faster</li>
              <li>Decision-making: 3x faster</li>
              <li>Capacity: Doing what would normally require multiple full operational teams</li>
              <li>Quality: Better decisions because I can analyze more options faster</li>
            </ul>
          </div>

          <h3>Why Empire is interesting:</h3>
          <div className="info-card">
            <p>1. Right scale (large enough to justify, agile enough to move fast)</p>
            <p>2. Complex operations (major impact potential)</p>
            <p>3. Targeting $1B (need step-change)</p>
            <p>4. Industry timing perfect (first-mover window open)</p>
            <p>5. You'd be proving ground for entire commercial furniture industry</p>
          </div>
        </div>

        {/* SLIDE 13: Strategic Partnership */}
        <div className="slide">
          <div className="stat-card">
            <p>If Empire becomes the first AI-native dealer, that's not just good for you—it validates the model for the whole industry.</p>
            <div className="big-number">$60B</div>
            <p><strong>Which means you get the platform build, and I get the case study that opens a $60B market.</strong></p>
          </div>

          <div className="highlight-card">
            <p><strong>That's why I'm selective. I don't want clients. I want strategic partners where success is mutual.</strong></p>
          </div>
        </div>

        {/* SLIDE 14: What Works vs Fails */}
        <div className="slide">
          <div className="section-label">Implementation</div>
          <h1>What Actually Works</h1>
          <div className="divider"></div>

          <h2>What Works:</h2>
          <ul className="checklist">
            <li>Start with highest-pain function (prove value fast)</li>
            <li>Executive owns it (dies if it's an IT project)</li>
            <li>Measure everything (time, quality, adoption)</li>
            <li>Build internal champions</li>
            <li>Phase it: Pilot → Prove → Scale</li>
          </ul>

          <h2>What Fails:</h2>
          <ul className="warning-list">
            <li>Generic ChatGPT training</li>
            <li>Buying AI tools nobody asked for</li>
            <li>Big-bang "we're going AI!" announcements</li>
            <li>No executive ownership</li>
            <li>Starting with technology instead of problems</li>
          </ul>
        </div>

        {/* SLIDE 15: First-Mover Window */}
        <div className="slide">
          <div className="section-label">Timing</div>
          <h1>The First-Mover Window</h1>
          <div className="divider"></div>

          <p>Every major tech shift has a 2-3 year window where early movers establish advantages:</p>

          <div className="info-card">
            <p><strong>E-commerce (1995-2000):</strong> Amazon moved while Borders studied. Game over.</p>
          </div>

          <div className="info-card">
            <p><strong>Mobile (2010-2015):</strong> Uber, Instagram established before competitors reacted.</p>
          </div>

          <div className="info-card">
            <p><strong>Cloud (2015-2020):</strong> Cloud-native companies scaled faster than legacy.</p>
          </div>

          <div className="stat-card">
            <h3>AI (2024-2027): Window is open RIGHT NOW.</h3>
            <p>By the time laggards move, first movers have refined systems, trained teams, captured market share, built muscle memory.</p>
            <div className="big-number">5%</div>
            <p><strong>Your industry is &lt;5% adoption. In 12-18 months it'll be 30-40%.</strong></p>
          </div>
        </div>

        {/* SLIDE 16: Three Paths */}
        <div className="slide">
          <div className="section-label">Your Options</div>
          <h2>The Three Paths</h2>
          <div className="divider"></div>

          <div className="info-card">
            <h3>Wait & See</h3>
            <p>Monitor competitors, move when it feels safe</p>
            <p><em>Reality: You'll spend 2x more to get 50% of the advantage</em></p>
          </div>

          <div className="info-card">
            <h3>Point Solutions</h3>
            <p>Buy off-the-shelf RFP tool, design software, CRM add-ons</p>
            <p><em>Reality: Same tools your competitors can buy. No sustainable advantage</em></p>
          </div>

          <div className="stat-card">
            <h3>Strategic Build</h3>
            <p>Architect AI into operations as proprietary competitive advantage</p>
            <p><em>Reality: Higher upfront investment but 2-3 year lead that's hard to replicate.</em></p>
            <div className="big-number">$1B</div>
            <p><strong>This is how you go from $370M to $1B</strong></p>
          </div>
        </div>

        {/* SLIDE 17: The Downside */}
        <div className="slide">
          <div className="section-label">The Risk</div>
          <h1>What Happens If You Don't Move</h1>
          <div className="divider"></div>

          <div className="warning-card">
            <p><strong>12 months from now:</strong></p>
            <ul>
              <li>One of your top 5 competitors deploys comprehensive AI</li>
              <li>They're responding to RFPs 3x faster with better quality</li>
              <li>They're handling 500 RFPs annually while you're at 250</li>
            </ul>
          </div>

          <div className="warning-card">
            <p><strong>24 months from now:</strong></p>
            <ul>
              <li>That competitor has captured significant market share</li>
              <li>They're hiring away your best people</li>
              <li>You're playing catch-up at 2x cost</li>
            </ul>
          </div>

          <div className="warning-card">
            <p><strong>36 months from now:</strong></p>
            <ul>
              <li>Multiple competitors have AI operations</li>
              <li>You've spent more to catch up than it would have cost to lead</li>
              <li>The path to $1B is harder</li>
            </ul>
          </div>
        </div>

        {/* SLIDE 18: The FOMO Part */}
        <div className="slide">
          <div className="section-label">Real Talk</div>
          <h1>The FOMO Part</h1>
          <div className="divider"></div>

          <p>I'm being selective this year. Typically work with 2-3 strategic partnerships annually.</p>

          <div className="stat-card">
            <div className="big-number">2</div>
            <h3>I've got one slot committed. Two available.</h3>
          </div>

          <div className="highlight-card">
            <p><strong>Empire is at the top of my list because:</strong></p>
            <ul>
              <li>Perfect timing (industry window open)</li>
              <li>Right scale (large enough for impact)</li>
              <li>Strategic goal ($1B requires step-change)</li>
              <li>Strong executive thinking (you're asking right questions)</li>
            </ul>
          </div>

          <p>But I'm also talking to a regional healthcare network and a mid-market logistics company.</p>

          <div className="info-card">
            <p><strong>And if one of your competitors comes calling in the next 60 days, I'll have to make a call about who gets the commercial furniture slot.</strong></p>
            <p>I'm not going to work with multiple dealers in the same market. That wouldn't be fair to whoever moves first.</p>
          </div>
        </div>

        {/* SLIDE 19: Next Steps */}
        <div className="slide">
          <div className="section-label">Let's Talk</div>
          <h1>Next Steps</h1>
          <div className="divider"></div>

          <h2>When we meet I can show you:</h2>
          <ul>
            <li>Perpetual Core in action (how it actually works)</li>
            <li>Specific applications to Empire's operations</li>
            <li>Phased implementation plan (pilot → prove → scale)</li>
            <li>Real numbers on investment and ROI</li>
            <li>What the first 90 days would look like</li>
          </ul>

          <div className="info-card">
            <p>Or we just grab coffee and you decide this isn't the right time. That's fine too.</p>
            <p><strong>But if you're serious about being the first AI-native commercial furniture dealer—about having operational advantages your competitors can't match—then we should talk specifics soon.</strong></p>
          </div>

          <div className="stat-card" style={{textAlign: 'center', marginTop: '3rem'}}>
            <h2>The window is open.<br/>But it won't stay open.</h2>
            <p style={{marginTop: '1.5rem', fontSize: '1.2rem'}}><strong>— Lorenzo</strong></p>
          </div>
        </div>
      </div>

      <div className="navigation">
        <button className="nav-button" id="prevBtn">← Previous</button>
        <button className="nav-button" id="nextBtn">Next →</button>
      </div>
    </>
  );
}
