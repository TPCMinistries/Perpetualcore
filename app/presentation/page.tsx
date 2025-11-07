"use client";

import { useEffect, useState } from 'react';

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 12;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const progress = ((currentSlide + 1) / totalSlides) * 100;

  return (
    <div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800;900&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: #ffffff;
          color: #1a1a1a;
          overflow: hidden;
        }

        .presentation-container {
          width: 100vw;
          height: 100vh;
          position: relative;
          background: #ffffff;
        }

        /* Subtle pattern background */
        .bg-pattern {
          position: fixed;
          inset: 0;
          opacity: 0.03;
          background-image: radial-gradient(circle at 1px 1px, #1a1a1a 1px, transparent 0);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .slide-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 0.5s ease, transform 0.5s ease;
          pointer-events: none;
        }

        .slide-wrapper.active {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        }

        .slide-content {
          width: 90%;
          max-width: 1100px;
          height: 85vh;
          overflow-y: auto;
          padding: 60px;
        }

        .slide-content::-webkit-scrollbar {
          width: 6px;
        }

        .slide-content::-webkit-scrollbar-track {
          background: #f5f5f5;
        }

        .slide-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        /* Typography */
        .display-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 7vw, 6rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
          color: #1a1a1a;
        }

        .display-subtitle {
          font-size: clamp(1.5rem, 3vw, 2.5rem);
          font-weight: 300;
          color: #6b7280;
          margin-bottom: 3rem;
          line-height: 1.4;
        }

        .section-label {
          display: inline-block;
          padding: 6px 18px;
          background: #f3f4f6;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          line-height: 1.3;
          margin: 2.5rem 0 1.5rem;
          color: #1a1a1a;
        }

        h3 {
          font-size: clamp(1.4rem, 2.5vw, 1.8rem);
          font-weight: 600;
          margin: 2rem 0 1rem;
          color: #1a1a1a;
        }

        p {
          font-size: clamp(1.15rem, 1.8vw, 1.35rem);
          line-height: 1.75;
          color: #4b5563;
          margin-bottom: 1.5rem;
        }

        strong {
          color: #1a1a1a;
          font-weight: 600;
        }

        /* Clean cards */
        .info-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-left: 4px solid #3b82f6;
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
        }

        .highlight-box {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #3b82f6;
          border-radius: 16px;
          padding: 2.5rem;
          margin: 2rem 0;
        }

        .success-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #22c55e;
          border-radius: 16px;
          padding: 2.5rem;
          margin: 2rem 0;
        }

        .warning-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 4px solid #ef4444;
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
        }

        .stat-large {
          font-family: 'Playfair Display', serif;
          font-size: clamp(4rem, 10vw, 7rem);
          font-weight: 800;
          line-height: 1;
          color: #3b82f6;
          margin: 1.5rem 0;
        }

        /* Lists */
        ul {
          margin: 1.5rem 0;
          padding-left: 0;
          list-style: none;
        }

        li {
          position: relative;
          padding-left: 2rem;
          margin-bottom: 1rem;
          font-size: clamp(1.15rem, 1.8vw, 1.3rem);
          line-height: 1.7;
          color: #4b5563;
        }

        li::before {
          content: '•';
          position: absolute;
          left: 0.5rem;
          color: #3b82f6;
          font-weight: 700;
          font-size: 1.5em;
        }

        .check-list li::before {
          content: '✓';
          color: #22c55e;
          font-size: 1.2em;
        }

        .cross-list li::before {
          content: '×';
          color: #ef4444;
          font-size: 1.2em;
        }

        /* Grid layouts */
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .grid-item {
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 2rem;
          transition: all 0.3s ease;
        }

        .grid-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 10px 40px rgba(59, 130, 246, 0.1);
          transform: translateY(-4px);
        }

        /* Comparison side by side */
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin: 2.5rem 0;
        }

        .comparison-before {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          padding: 2rem;
        }

        .comparison-after {
          background: #f0fdf4;
          border: 2px solid #bbf7d0;
          border-radius: 12px;
          padding: 2rem;
        }

        /* Quote styling */
        .quote-box {
          border-left: 6px solid #3b82f6;
          background: #f9fafb;
          padding: 2rem 2rem 2rem 2.5rem;
          margin: 3rem 0;
          font-size: clamp(1.3rem, 2vw, 1.7rem);
          font-style: italic;
          color: #374151;
          line-height: 1.6;
        }

        /* Navigation */
        .nav-buttons {
          position: fixed;
          bottom: 3rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 1rem;
          z-index: 100;
        }

        .nav-btn {
          padding: 1rem 2.5rem;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 100px;
          color: #1a1a1a;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .nav-btn:hover:not(:disabled) {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
        }

        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Progress bar */
        .progress-track {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          z-index: 101;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
          transition: width 0.5s ease;
        }

        .slide-counter {
          position: fixed;
          top: 2rem;
          right: 2rem;
          padding: 0.75rem 1.5rem;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 100px;
          font-weight: 600;
          font-size: 0.95rem;
          z-index: 100;
          color: #6b7280;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        /* Emphasis text */
        .emphasis {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          padding: 0.2em 0.6em;
          border-radius: 6px;
          font-weight: 600;
          color: #1e40af;
        }

        /* Divider */
        .divider {
          width: 80px;
          height: 4px;
          background: #3b82f6;
          margin: 2rem 0;
          border-radius: 2px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .slide-content {
            padding: 40px 30px;
          }

          .comparison-grid, .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }

          .nav-buttons {
            bottom: 2rem;
            gap: 0.5rem;
          }

          .nav-btn {
            padding: 0.8rem 1.5rem;
            font-size: 0.9rem;
          }

          .slide-counter {
            top: 1.5rem;
            right: 1.5rem;
            padding: 0.6rem 1.2rem;
            font-size: 0.85rem;
          }
        }
      `}</style>

      <div className="presentation-container">
        <div className="bg-pattern"></div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="slide-counter">{currentSlide + 1} of {totalSlides}</div>

        {/* SLIDE 1: Cover */}
        <div className={`slide-wrapper ${currentSlide === 0 ? 'active' : ''}`}>
          <div className="slide-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h1 className="display-title">The Real AI Opportunity</h1>
            <p className="display-subtitle">How Commercial Furniture Dealers Can Use AI to Create Unbeatable Competitive Advantages</p>
            <p style={{ marginTop: '3rem', fontSize: '1.1rem', color: '#9ca3af' }}>
              Lorenzo Daughtry-Chambers for Jocelyn Corrigan
            </p>
          </div>
        </div>

        {/* SLIDE 2: The Gap */}
        <div className={`slide-wrapper ${currentSlide === 1 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">The Reality</span>
            <h2>Most Companies Are Using AI at 10% Capacity</h2>
            <div className="divider"></div>

            <p style={{ fontSize: '1.4rem', marginTop: '2rem' }}>There's a massive gap between casual AI usage and operational AI integration.</p>

            <div className="comparison-grid" style={{ marginTop: '3rem' }}>
              <div className="comparison-before">
                <h3 style={{ marginTop: 0 }}>Casual Usage</h3>
                <p style={{ fontSize: '1.1rem' }}>Using ChatGPT for occasional emails and quick questions</p>
                <div className="stat-large" style={{ fontSize: '4rem' }}>15%</div>
                <p><strong>Result:</strong> Save 15-20 minutes per day</p>
              </div>

              <div className="comparison-after">
                <h3 style={{ marginTop: 0 }}>Operational AI</h3>
                <p style={{ fontSize: '1.1rem' }}>AI that knows your business, workflows, and history</p>
                <div className="stat-large" style={{ fontSize: '4rem' }}>3x</div>
                <p><strong>Result:</strong> Triple your capacity in key functions</p>
              </div>
            </div>

            <div className="highlight-box" style={{ marginTop: '3rem' }}>
              <p style={{ fontSize: '1.35rem', marginBottom: 0 }}><strong>The difference is transformational.</strong> One saves you time. The other changes what's possible for your business.</p>
            </div>
          </div>
        </div>

        {/* SLIDE 3: Context Matters */}
        <div className={`slide-wrapper ${currentSlide === 2 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">How To Use AI</span>
            <h2>The Secret: Context Is Everything</h2>
            <div className="divider"></div>

            <div className="warning-box">
              <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#dc2626' }}>WHAT DOESN'T WORK</p>
              <p style={{ fontSize: '1.4rem', marginBottom: 0 }}>"Write a proposal for this client"</p>
            </div>

            <div className="success-box" style={{ marginTop: '2rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#16a34a' }}>WHAT ACTUALLY WORKS</p>
              <p style={{ fontSize: '1.2rem', lineHeight: 1.7 }}>
                "Write a proposal for <span className="emphasis">United Healthcare</span>, redesigning <span className="emphasis">3 floors</span> in Chicago. They care about <span className="emphasis">wellness, collaboration, brand consistency</span>. Budget <span className="emphasis">$8-12M</span>. Previous vendor was Steelcase—they complained about <span className="emphasis">slow turnaround</span>. Our differentiator is <span className="emphasis">48-hour design concepts</span>. Deadline <span className="emphasis">July 15</span>."
              </p>
            </div>

            <p style={{ marginTop: '3rem', fontSize: '1.4rem', textAlign: 'center' }}><strong>More context = exponentially better output.</strong></p>
          </div>
        </div>

        {/* SLIDE 4: Why Commercial Furniture */}
        <div className={`slide-wrapper ${currentSlide === 3 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">Your Industry</span>
            <h2>Why Commercial Furniture Is Perfect for AI</h2>
            <div className="divider"></div>

            <p style={{ fontSize: '1.3rem', marginTop: '2rem' }}>Industries seeing the biggest AI impact share these characteristics:</p>

            <ul className="check-list" style={{ fontSize: '1.25rem', marginTop: '2.5rem' }}>
              <li>Complex multi-stakeholder sales cycles</li>
              <li>Proposal and RFP-intensive processes</li>
              <li>Mix of creative and technical work</li>
              <li>Project management complexity</li>
              <li>Long-term relationship management</li>
            </ul>

            <div className="highlight-box" style={{ marginTop: '3rem' }}>
              <h3 style={{ marginTop: 0 }}>Commercial furniture has all five.</h3>
              <div className="stat-large">5%</div>
              <p style={{ fontSize: '1.25rem', marginBottom: 0 }}>But industry adoption is still under 5%. <strong>The first-mover advantage is available right now.</strong></p>
            </div>
          </div>
        </div>

        {/* SLIDE 5: RFP Operations */}
        <div className={`slide-wrapper ${currentSlide === 4 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">Real Applications</span>
            <h2>RFP Operations: Where AI Shows Immediate ROI</h2>
            <div className="divider"></div>

            <p style={{ fontSize: '1.25rem' }}>Typical dealer at Empire's scale:</p>

            <div className="grid-3" style={{ marginTop: '2rem' }}>
              <div className="grid-item">
                <div className="stat-large" style={{ fontSize: '3.5rem' }}>250</div>
                <p style={{ marginBottom: 0 }}>RFPs annually</p>
              </div>
              <div className="grid-item">
                <div className="stat-large" style={{ fontSize: '3.5rem' }}>40h</div>
                <p style={{ marginBottom: 0 }}>Per RFP average</p>
              </div>
              <div className="grid-item">
                <div className="stat-large" style={{ fontSize: '3.5rem' }}>$500K</div>
                <p style={{ marginBottom: 0 }}>Annual labor cost</p>
              </div>
            </div>

            <h3 style={{ marginTop: '3rem' }}>Documented Results from Similar Companies:</h3>

            <div className="info-box">
              <p><strong>Transplace (Logistics):</strong> Reduced RFP time from 40 hours to 20 hours</p>
            </div>
            <div className="info-box">
              <p><strong>Alera Group (Insurance):</strong> Went from 10 RFPs per year to 10 per quarter with the same team</p>
            </div>
            <div className="info-box">
              <p><strong>Microsoft RFP Team:</strong> Generated $746 return for every $1 invested</p>
            </div>

            <div className="success-box" style={{ marginTop: '3rem' }}>
              <div className="stat-large">2-4x</div>
              <p style={{ fontSize: '1.3rem', marginBottom: 0 }}>While competitors take 3 weeks to respond, <strong>you can turn proposals around in 3 days.</strong></p>
            </div>
          </div>
        </div>

        {/* SLIDE 6: Design Services */}
        <div className={`slide-wrapper ${currentSlide === 5 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">Design Impact</span>
            <h2>Design Services: Elevating Your Team</h2>
            <div className="divider"></div>

            <div className="comparison-grid">
              <div className="comparison-before">
                <h3 style={{ marginTop: 0 }}>Current State</h3>
                <p><strong>60-70%</strong> of time spent on CAD work</p>
                <p><strong>30-40%</strong> on creative and client strategy</p>
                <p style={{ marginTop: '2rem', fontStyle: 'italic', opacity: 0.8 }}>Designers as CAD operators</p>
              </div>

              <div className="comparison-after">
                <h3 style={{ marginTop: 0 }}>With AI</h3>
                <p><strong>30%</strong> of time on technical work</p>
                <p><strong>70%</strong> on strategy and client relationships</p>
                <p style={{ marginTop: '2rem', fontStyle: 'italic' }}><strong>Designers as strategic advisors</strong></p>
              </div>
            </div>

            <h3 style={{ marginTop: '3rem' }}>What Changes:</h3>
            <ul style={{ fontSize: '1.2rem' }}>
              <li>Upload floor plans, instantly generate 15-20 layout options</li>
              <li>Create photorealistic renderings in seconds</li>
              <li>Automatic specifications and pricing</li>
              <li>Concept phase: 2-3 days reduced to 4-6 hours</li>
            </ul>

            <div className="success-box" style={{ marginTop: '3rem' }}>
              <div className="stat-large">3x</div>
              <p style={{ fontSize: '1.25rem', marginBottom: 0 }}><strong>Triple your design capacity.</strong> Show clients 15 options instead of 3.</p>
            </div>
          </div>
        </div>

        {/* SLIDE 7: Total Impact */}
        <div className={`slide-wrapper ${currentSlide === 6 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">Complete Picture</span>
            <h2>The Full Business Impact</h2>
            <div className="divider"></div>

            <div className="grid-2" style={{ marginTop: '3rem' }}>
              <div className="grid-item">
                <h3 style={{ marginTop: 0 }}>RFP Operations</h3>
                <div className="stat-large" style={{ fontSize: '3rem' }}>2-4x</div>
                <p>Capacity increase with same team</p>
              </div>

              <div className="grid-item">
                <h3 style={{ marginTop: 0 }}>Design Services</h3>
                <div className="stat-large" style={{ fontSize: '3rem' }}>3x</div>
                <p>Capacity per designer</p>
              </div>

              <div className="grid-item">
                <h3 style={{ marginTop: 0 }}>Sales Operations</h3>
                <div className="stat-large" style={{ fontSize: '3rem' }}>40%</div>
                <p>Productivity improvement</p>
              </div>

              <div className="grid-item">
                <h3 style={{ marginTop: 0 }}>Marketing</h3>
                <div className="stat-large" style={{ fontSize: '3rem' }}>70%</div>
                <p>Faster campaign execution</p>
              </div>
            </div>

            <div className="highlight-box" style={{ marginTop: '3rem' }}>
              <p style={{ fontSize: '1.4rem' }}>Conservative first-year operational value:</p>
              <div className="stat-large">$1.5-3M</div>
              <p style={{ fontSize: '1.2rem', marginBottom: 0 }}>But the real value is strategic—<strong>becoming the dealer that competitors can't match.</strong></p>
            </div>
          </div>
        </div>

        {/* SLIDE 8: The Evidence */}
        <div className={`slide-wrapper ${currentSlide === 7 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">Proof Points</span>
            <h2>This Isn't Theory—It's Happening Now</h2>
            <div className="divider"></div>

            <p style={{ fontSize: '1.3rem', marginBottom: '3rem' }}>I've analyzed 50+ enterprise AI transformations. Here's what the data shows:</p>

            <div className="info-box">
              <h3 style={{ marginTop: 0 }}>Goldman Sachs</h3>
              <p><strong>$1 billion investment.</strong> Achieving 20-40% productivity gains across multiple functions. Running over 1 million AI prompts monthly enterprise-wide.</p>
            </div>

            <div className="info-box">
              <h3 style={{ marginTop: 0 }}>IBM</h3>
              <p><strong>$4.5 billion in documented savings.</strong> Saving 3.9 million work hours annually through AI integration.</p>
            </div>

            <div className="info-box">
              <h3 style={{ marginTop: 0 }}>B2B Sales Operations</h3>
              <p><strong>50-91% time reduction</strong> on proposal creation. Volume increases of 2-10x. ROI of 3-15x in the first year.</p>
            </div>

            <div className="quote-box" style={{ marginTop: '3rem' }}>
              Companies that integrate AI into their operations are building 12-24 month competitive leads that late adopters won't be able to close.
            </div>
          </div>
        </div>

        {/* SLIDE 9: Three Paths */}
        <div className={`slide-wrapper ${currentSlide === 8 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">Your Decision</span>
            <h2>Three Paths Forward</h2>
            <div className="divider"></div>

            <div style={{ marginTop: '3rem' }}>
              <div className="info-box" style={{ opacity: 0.6 }}>
                <h3 style={{ marginTop: 0 }}>Option 1: Wait and See</h3>
                <p>Monitor what competitors do, move when it feels safe.</p>
                <p style={{ color: '#dc2626', marginBottom: 0 }}><strong>Reality:</strong> You'll spend twice as much to get half the advantage.</p>
              </div>

              <div className="info-box" style={{ opacity: 0.8, marginTop: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Option 2: Point Solutions</h3>
                <p>Purchase off-the-shelf RFP software, design tools, CRM add-ons.</p>
                <p style={{ color: '#ea580c', marginBottom: 0 }}><strong>Reality:</strong> Same tools available to all competitors. No sustainable differentiation.</p>
              </div>

              <div className="success-box" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Option 3: Strategic Build</h3>
                <p>Architect AI into your operations as a proprietary competitive advantage.</p>
                <p style={{ color: '#16a34a', fontSize: '1.15rem' }}><strong>Reality:</strong> Higher initial investment, but creates a 2-3 year lead that's extremely difficult to replicate.</p>
                <div className="stat-large" style={{ marginTop: '2rem' }}>$1B</div>
                <p style={{ fontSize: '1.25rem', marginBottom: 0 }}>This is how you go from $370M to $1B.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 10: What I Built */}
        <div className={`slide-wrapper ${currentSlide === 9 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">The Platform</span>
            <h2>What I've Built: Perpetual Core</h2>
            <div className="divider"></div>

            <p style={{ fontSize: '1.25rem', marginTop: '2rem' }}>I built Perpetual Core to solve my own operational challenges across multiple ventures.</p>

            <div className="grid-2" style={{ marginTop: '3rem' }}>
              <div className="grid-item">
                <h3 style={{ marginTop: 0 }}>Multi-Model Intelligence</h3>
                <p>Automatically routes work to the right AI model—Claude for deep analysis, GPT for speed, Gemini for real-time data.</p>
              </div>

              <div className="grid-item">
                <h3 style={{ marginTop: 0 }}>Persistent Memory</h3>
                <p>Remembers all decisions, past projects, and strategic context. Gets smarter with every interaction.</p>
              </div>

              <div className="grid-item">
                <h3 style={{ marginTop: 0 }}>Knowledge Library</h3>
                <p>Upload your RFPs, proposals, contracts, and specifications. AI learns from your entire history.</p>
              </div>

              <div className="grid-item">
                <h3 style={{ marginTop: 0 }}>Team Intelligence</h3>
                <p>Not individual productivity tools—shared organizational intelligence that compounds over time.</p>
              </div>
            </div>

            <div className="highlight-box" style={{ marginTop: '3rem' }}>
              <h3 style={{ marginTop: 0 }}>Results for my operations:</h3>
              <ul>
                <li>Content creation: 60% faster</li>
                <li>Decision-making: 3x faster with better outcomes</li>
                <li>Capacity: Accomplishing what typically requires multiple full teams</li>
                <li>Quality: Better decisions through rapid analysis of more options</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SLIDE 11: Why Empire */}
        <div className={`slide-wrapper ${currentSlide === 10 ? 'active' : ''}`}>
          <div className="slide-content">
            <span className="section-label">Strategic Fit</span>
            <h2>Why Empire Office Furniture</h2>
            <div className="divider"></div>

            <ul style={{ fontSize: '1.25rem', marginTop: '3rem' }}>
              <li><strong>Right scale:</strong> Large enough to justify the investment, agile enough to move quickly</li>
              <li><strong>Complex operations:</strong> Significant impact potential across multiple business functions</li>
              <li><strong>Clear ambition:</strong> Your $1B goal requires step-change capacity, not incremental improvements</li>
              <li><strong>Market timing:</strong> The first-mover window in your industry is wide open</li>
              <li><strong>Industry impact:</strong> You'd be the proving ground for the entire $60B commercial furniture industry</li>
            </ul>

            <div className="highlight-box" style={{ marginTop: '3rem' }}>
              <p style={{ fontSize: '1.35rem' }}>If Empire becomes the first AI-native commercial furniture dealer, that success isn't just good for you—<strong>it validates the approach for the entire industry.</strong></p>
              <div className="stat-large" style={{ margin: '2rem 0' }}>$60B</div>
              <p style={{ fontSize: '1.25rem', marginBottom: 0 }}>You get the custom platform. I get the case study that opens a $60 billion market. <strong>That's genuine mutual success.</strong></p>
            </div>
          </div>
        </div>

        {/* SLIDE 12: Next Steps */}
        <div className={`slide-wrapper ${currentSlide === 11 ? 'active' : ''}`}>
          <div className="slide-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="section-label">Next Steps</span>
            <h2>Let's Explore This Together</h2>
            <div className="divider"></div>

            <div className="info-box" style={{ marginTop: '3rem' }}>
              <h3 style={{ marginTop: 0 }}>When we meet, I'll show you:</h3>
              <ul style={{ fontSize: '1.2rem' }}>
                <li>Perpetual Core in action—live demonstration, not slides</li>
                <li>Specific applications for Empire's operations</li>
                <li>Phased implementation roadmap: pilot, prove value, scale</li>
                <li>Detailed investment analysis and ROI projections</li>
                <li>What your first 90 days would look like</li>
              </ul>
            </div>

            <div className="highlight-box" style={{ marginTop: '2rem' }}>
              <p style={{ fontSize: '1.3rem' }}>I'm selective about partnerships. I work with 2-3 strategic partners annually. <strong>I'm not looking for clients—I'm looking for partners where we both succeed.</strong></p>
              <div className="stat-large" style={{ margin: '1.5rem 0', fontSize: '5rem' }}>2</div>
              <p style={{ fontSize: '1.15rem' }}>One partnership committed. Two slots available. Empire is at the top of my list.</p>
            </div>

            <div className="quote-box" style={{ marginTop: '3rem', borderColor: '#3b82f6' }}>
              The first-mover window is open now. But it won't stay open for long.
            </div>

            <p style={{ textAlign: 'center', marginTop: '3rem', fontSize: '1.2rem', color: '#6b7280' }}>— Lorenzo Daughtry-Chambers</p>
          </div>
        </div>

        <div className="nav-buttons">
          <button
            className="nav-btn"
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
          >
            ← Previous
          </button>
          <button
            className="nav-btn"
            onClick={() => setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1))}
            disabled={currentSlide === totalSlides - 1}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
