"use client";

import { useEffect, useState } from 'react';

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 10;

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: #fafafa;
          color: #2c3e50;
          overflow: hidden;
        }

        .container {
          width: 100vw;
          height: 100vh;
          position: relative;
          background: #fafafa;
        }

        .slide-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .slide-wrap.active {
          opacity: 1;
          pointer-events: auto;
        }

        .slide {
          width: 85%;
          max-width: 900px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 50px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .slide::-webkit-scrollbar {
          width: 8px;
        }

        .slide::-webkit-scrollbar-track {
          background: #f0f0f0;
        }

        .slide::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }

        /* Typography */
        h1 {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          line-height: 1.2;
          color: #1a202c;
          margin-bottom: 1rem;
        }

        h2 {
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          font-weight: 600;
          line-height: 1.3;
          color: #2d3748;
          margin: 2rem 0 1rem;
        }

        h3 {
          font-size: clamp(1.3rem, 2vw, 1.6rem);
          font-weight: 600;
          color: #2d3748;
          margin: 1.5rem 0 0.8rem;
        }

        p {
          font-size: clamp(1.2rem, 2vw, 1.5rem);
          line-height: 1.7;
          color: #4a5568;
          margin-bottom: 1.2rem;
        }

        .subtitle {
          font-size: clamp(1.3rem, 2.5vw, 1.8rem);
          color: #718096;
          line-height: 1.5;
          margin-bottom: 2rem;
        }

        strong {
          color: #2d3748;
          font-weight: 600;
        }

        /* Simple boxes */
        .note {
          background: #f7fafc;
          border-left: 4px solid #4299e1;
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 6px;
        }

        .example {
          background: #fffaf0;
          border-left: 4px solid #ed8936;
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 6px;
        }

        .tip {
          background: #f0fff4;
          border-left: 4px solid #48bb78;
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 6px;
        }

        /* Lists */
        ul, ol {
          margin: 1.5rem 0;
          padding-left: 2rem;
        }

        li {
          font-size: clamp(1.2rem, 2vw, 1.5rem);
          line-height: 1.7;
          color: #4a5568;
          margin-bottom: 0.8rem;
        }

        /* Simple table */
        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .comparison-box {
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
        }

        .number-big {
          font-size: clamp(3rem, 8vw, 5rem);
          font-weight: 700;
          color: #4299e1;
          line-height: 1;
          margin: 1rem 0;
        }

        /* Navigation */
        .nav {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 1rem;
          z-index: 100;
        }

        .btn {
          padding: 0.8rem 2rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          color: #2d3748;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .btn:hover:not(:disabled) {
          background: #4299e1;
          border-color: #4299e1;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
        }

        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Progress */
        .progress {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: #e2e8f0;
          z-index: 101;
        }

        .progress-fill {
          height: 100%;
          background: #4299e1;
          transition: width 0.4s ease;
        }

        .counter {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          padding: 0.6rem 1.2rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          z-index: 100;
          color: #718096;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .slide {
            padding: 30px 25px;
          }

          .comparison {
            grid-template-columns: 1fr;
          }

          .nav {
            bottom: 1.5rem;
          }

          .btn {
            padding: 0.7rem 1.5rem;
            font-size: 1rem;
          }
        }
      `}</style>

      <div className="container">
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="counter">{currentSlide + 1} of {totalSlides}</div>

        {/* SLIDE 1: Intro */}
        <div className={`slide-wrap ${currentSlide === 0 ? 'active' : ''}`}>
          <div className="slide" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <h1>Let's Talk About AI</h1>
            <p className="subtitle">What it actually is, how it works, and what it means for your business</p>
            <p style={{ marginTop: '3rem', color: '#a0aec0' }}>Lorenzo for Jocelyn</p>
          </div>
        </div>

        {/* SLIDE 2: What AI Actually Is */}
        <div className={`slide-wrap ${currentSlide === 1 ? 'active' : ''}`}>
          <div className="slide">
            <h2>First, What Actually Is AI?</h2>

            <p>Forget the hype. Here's the simple version:</p>

            <div className="note">
              <p style={{ marginBottom: 0 }}><strong>AI is software that can read, write, and analyze information the way a smart person would.</strong></p>
            </div>

            <p>Think of it like this:</p>

            <ul>
              <li>You can give it a 50-page document and ask "what are the key points?"</li>
              <li>You can tell it about a client and say "write me a proposal"</li>
              <li>You can show it your company data and ask "what patterns do you see?"</li>
            </ul>

            <div className="tip">
              <p style={{ marginBottom: 0 }}>The breakthrough: It actually understands context. It's not just keyword matching—it "gets" what you're asking for.</p>
            </div>
          </div>
        </div>

        {/* SLIDE 3: Two Ways People Use It */}
        <div className={`slide-wrap ${currentSlide === 2 ? 'active' : ''}`}>
          <div className="slide">
            <h2>There Are Two Ways People Use AI</h2>

            <div className="comparison">
              <div className="comparison-box" style={{ background: '#fef5e7' }}>
                <h3 style={{ marginTop: 0 }}>Casual Use</h3>
                <p>Asking ChatGPT to write an email here and there</p>
                <div className="number-big" style={{ fontSize: '3rem' }}>15 min</div>
                <p>Saved per day</p>
              </div>

              <div className="comparison-box" style={{ background: '#e8f5e9' }}>
                <h3 style={{ marginTop: 0 }}>Built Into Work</h3>
                <p>AI that knows your business and helps with everything</p>
                <div className="number-big" style={{ fontSize: '3rem' }}>3x</div>
                <p>More work done</p>
              </div>
            </div>

            <p>Most people are stuck at the casual level because nobody's shown them the second way.</p>

            <div className="note">
              <p style={{ marginBottom: 0 }}><strong>That second way? That's what I want to explain today.</strong></p>
            </div>
          </div>
        </div>

        {/* SLIDE 4: The Secret */}
        <div className={`slide-wrap ${currentSlide === 3 ? 'active' : ''}`}>
          <div className="slide">
            <h2>The Secret: Give It Context</h2>

            <p>Here's where most people go wrong. They use AI like Google:</p>

            <div className="example">
              <p style={{ fontStyle: 'italic', marginBottom: 0 }}>"Write a proposal for this healthcare client"</p>
            </div>

            <p>That gets you generic garbage. Here's what actually works:</p>

            <div className="tip">
              <p style={{ fontStyle: 'italic' }}>
                "Write a proposal for United Healthcare. They're redesigning 3 floors in Chicago. They care about employee wellness and modern collaboration spaces. Their budget is $8-12M. They had Steelcase before and complained about slow turnaround. We can do design concepts in 48 hours. Deadline is July 15."
              </p>
              <p style={{ marginBottom: 0 }}><strong>Now you get something useful.</strong></p>
            </div>

            <p>The more context you give it, the better it works. It's that simple.</p>
          </div>
        </div>

        {/* SLIDE 5: Why Your Industry */}
        <div className={`slide-wrap ${currentSlide === 4 ? 'active' : ''}`}>
          <div className="slide">
            <h2>Why This Matters for Commercial Furniture</h2>

            <p>After talking with Erv, I looked at your industry. Here's what I found:</p>

            <p><strong>Your business has all the characteristics where AI creates the biggest impact:</strong></p>

            <ul>
              <li>Complex sales with multiple decision-makers</li>
              <li>Tons of RFPs and proposals to write</li>
              <li>Mix of creative design work and technical specs</li>
              <li>Projects that need careful management</li>
              <li>Long-term client relationships</li>
            </ul>

            <div className="note">
              <p>And here's the kicker: <strong>Less than 5% of furniture dealers are actually using AI yet.</strong></p>
              <p style={{ marginBottom: 0 }}>That means the companies who figure this out now get a 2-3 year head start on everyone else.</p>
            </div>
          </div>
        </div>

        {/* SLIDE 6: Real Examples - RFPs */}
        <div className={`slide-wrap ${currentSlide === 5 ? 'active' : ''}`}>
          <div className="slide">
            <h2>Real Example: RFPs</h2>

            <p>Let's talk about something concrete. RFPs are brutal, right?</p>

            <p>A typical dealer your size probably handles:</p>
            <ul>
              <li>250 RFPs per year</li>
              <li>40 hours per RFP (average)</li>
              <li>That's $500K in labor costs annually</li>
            </ul>

            <h3>Here's What Other Companies Are Seeing:</h3>

            <div className="example">
              <p><strong>Transplace (logistics company):</strong> Cut RFP time from 40 hours to 20 hours</p>
            </div>

            <div className="example">
              <p><strong>Alera Group (insurance):</strong> Went from 10 RFPs per year to 10 per quarter with the same team</p>
            </div>

            <div className="tip">
              <p style={{ marginBottom: 0 }}><strong>Translation:</strong> While your competitors are taking 3 weeks to respond, you could be turning proposals around in 3 days.</p>
            </div>
          </div>
        </div>

        {/* SLIDE 7: Design */}
        <div className={`slide-wrap ${currentSlide === 6 ? 'active' : ''}`}>
          <div className="slide">
            <h2>Another Example: Design Work</h2>

            <p>Right now, your designers probably spend most of their time on CAD work, right?</p>

            <div className="comparison">
              <div className="comparison-box" style={{ background: '#fef5e7' }}>
                <h3 style={{ marginTop: 0 }}>Today</h3>
                <p><strong>70%</strong> CAD grinding</p>
                <p><strong>30%</strong> creative work</p>
              </div>

              <div className="comparison-box" style={{ background: '#e8f5e9' }}>
                <h3 style={{ marginTop: 0 }}>With AI</h3>
                <p><strong>30%</strong> technical work</p>
                <p><strong>70%</strong> working with clients</p>
              </div>
            </div>

            <p><strong>What changes:</strong></p>
            <ul>
              <li>Upload a floor plan, get 15-20 layout options instantly</li>
              <li>Generate photorealistic renderings in seconds</li>
              <li>Automatic specs and pricing</li>
              <li>Concept phase: 2-3 days becomes 4-6 hours</li>
            </ul>

            <div className="tip">
              <p style={{ marginBottom: 0 }}>Your designers stop being CAD operators and become strategic advisors. That's what clients actually value.</p>
            </div>
          </div>
        </div>

        {/* SLIDE 8: The Big Picture */}
        <div className={`slide-wrap ${currentSlide === 7 ? 'active' : ''}`}>
          <div className="slide">
            <h2>The Big Picture</h2>

            <p>When you add it all up across your business:</p>

            <div className="note">
              <p><strong>RFPs:</strong> 2-4x more capacity with same team</p>
              <p><strong>Design:</strong> 3x more capacity per designer</p>
              <p><strong>Sales:</strong> 40% productivity improvement</p>
              <p style={{ marginBottom: 0 }}><strong>Marketing:</strong> 70% faster campaign creation</p>
            </div>

            <p>Conservative estimate: <strong>$1.5-3M</strong> in operational value in year one.</p>

            <p>But here's what really matters:</p>

            <div className="tip">
              <p style={{ marginBottom: 0 }}><strong>You become the dealer that can respond faster, design better, and handle more work than your competitors.</strong> That's a competitive advantage they can't easily copy.</p>
            </div>
          </div>
        </div>

        {/* SLIDE 9: What I Built */}
        <div className={`slide-wrap ${currentSlide === 8 ? 'active' : ''}`}>
          <div className="slide">
            <h2>What I Built</h2>

            <p>I built something called Perpetual Core to solve this for my own companies. Here's what it does:</p>

            <h3>Multi-Model Intelligence</h3>
            <p>Uses the right AI for each job—Claude for deep thinking, GPT for speed, Gemini for real-time data.</p>

            <h3>Persistent Memory</h3>
            <p>Remembers everything. Your past decisions, completed projects, strategic priorities. Gets smarter over time.</p>

            <h3>Knowledge Library</h3>
            <p>Upload your RFPs, proposals, contracts. AI learns from your entire history.</p>

            <h3>Team Intelligence</h3>
            <p>Not just individual tools—shared company knowledge that builds up.</p>

            <div className="note">
              <p style={{ marginBottom: 0 }}><strong>For me:</strong> 60% faster content creation, 3x faster decisions, doing what usually takes multiple full teams. And getting better results because I can analyze more options.</p>
            </div>
          </div>
        </div>

        {/* SLIDE 10: Let's Talk */}
        <div className={`slide-wrap ${currentSlide === 9 ? 'active' : ''}`}>
          <div className="slide" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2>Let's Talk About It</h2>

            <p>Look, I'm not here to do a hard sell. I wanted to show you what's actually possible with this technology.</p>

            <p><strong>When we meet, I can show you:</strong></p>
            <ul>
              <li>The platform in action (live demo, not slides)</li>
              <li>How it would work specifically for Empire</li>
              <li>What a pilot program would look like</li>
              <li>Real numbers on cost and return</li>
            </ul>

            <div className="tip">
              <p>I work with 2-3 companies per year. Empire's at the top of my list because:</p>
              <p style={{ marginBottom: 0 }}>• You're the right size (big enough to matter, agile enough to move fast)<br/>• You have clear goals ($1B target)<br/>• The timing is perfect (industry window is open)<br/>• This could validate the model for the entire $60B furniture industry</p>
            </div>

            <p style={{ marginTop: '2rem', textAlign: 'center', color: '#718096' }}>— Lorenzo</p>
          </div>
        </div>

        <div className="nav">
          <button
            className="btn"
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
          >
            ← Back
          </button>
          <button
            className="btn"
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
