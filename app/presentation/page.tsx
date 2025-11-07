"use client";

export default function PresentationPage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>What Actually Matters About AI - Lorenzo Daughtry-Chambers</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #ffffff;
            overflow: hidden;
            height: 100vh;
          }

          .presentation-container {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .slide {
            display: none;
            width: 90%;
            max-width: 1100px;
            height: 80vh;
            background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
            border-radius: 24px;
            padding: 80px 100px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 100px rgba(106, 90, 205, 0.15);
            position: relative;
            overflow-y: auto;
            animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .slide.active {
            display: block;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .slide h1 {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 3.2em;
            margin-bottom: 0.6em;
            font-weight: 800;
            line-height: 1.1;
            letter-spacing: -0.03em;
          }

          .slide h2 {
            color: #1e3c72;
            font-size: 1.8em;
            margin-bottom: 0.7em;
            margin-top: 1.5em;
            font-weight: 700;
            letter-spacing: -0.02em;
          }

          .slide h3 {
            color: #2a5298;
            font-size: 1.3em;
            margin-bottom: 0.5em;
            margin-top: 1.2em;
            font-weight: 600;
          }

          .slide p, .slide li {
            color: #2a2a2a;
            font-size: 1.1em;
            line-height: 1.7;
            margin-bottom: 1em;
            font-weight: 400;
          }

          .slide ul, .slide ol {
            margin-left: 1.5em;
            margin-bottom: 1.2em;
          }

          .slide li {
            margin-bottom: 0.7em;
          }

          .slide strong {
            color: #1e3c72;
            font-weight: 700;
          }

          .slide em {
            color: #6b7280;
            font-style: italic;
          }

          .cover-slide {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            text-align: left;
            background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
            position: relative;
            overflow: hidden;
          }

          .cover-slide::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(126, 34, 206, 0.1) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }

          .cover-slide h1 {
            font-size: 4em;
            margin-bottom: 0.4em;
            line-height: 1;
            position: relative;
            z-index: 1;
          }

          .cover-slide .subtitle {
            font-size: 1.6em;
            color: #6b7280;
            margin-bottom: 3em;
            font-weight: 500;
            position: relative;
            z-index: 1;
          }

          .cover-slide .author {
            font-size: 1.1em;
            color: #9ca3af;
            margin-top: auto;
            font-weight: 500;
            position: relative;
            z-index: 1;
          }

          .highlight-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-left: 4px solid #1e3c72;
            padding: 28px 32px;
            margin: 1.5em 0;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(30, 60, 114, 0.08);
          }

          .stat-box {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #ffffff;
            padding: 32px 36px;
            margin: 1.5em 0;
            border-radius: 12px;
            font-weight: 400;
            box-shadow: 0 8px 24px rgba(30, 60, 114, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .stat-box strong {
            color: #ffffff;
            font-weight: 700;
          }

          .stat-box h3 {
            color: #ffffff;
            margin-top: 0;
          }

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
            background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
            color: #1e3c72;
            border: 2px solid rgba(30, 60, 114, 0.2);
            padding: 14px 32px;
            border-radius: 12px;
            font-size: 1em;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
          }

          .nav-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #ffffff;
            border-color: #1e3c72;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(30, 60, 114, 0.3);
          }

          .nav-button:active:not(:disabled) {
            transform: translateY(0);
          }

          .nav-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .progress-bar {
            position: fixed;
            top: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #1e3c72 0%, #7e22ce 100%);
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1001;
            box-shadow: 0 2px 8px rgba(126, 34, 206, 0.4);
          }

          .slide-counter {
            position: fixed;
            top: 50px;
            right: 50px;
            background: linear-gradient(135deg, rgba(30, 60, 114, 0.95) 0%, rgba(42, 82, 152, 0.95) 100%);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 24px;
            font-weight: 600;
            font-size: 0.95em;
            z-index: 1000;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          code {
            background: #f3f4f6;
            padding: 4px 10px;
            border-radius: 6px;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
            color: #1e3c72;
            border: 1px solid #e5e7eb;
          }

          .checklist {
            list-style: none;
            margin-left: 0;
          }

          .checklist li {
            position: relative;
            padding-left: 35px;
          }

          .checklist li:before {
            content: "✓";
            color: #10b981;
            font-weight: 700;
            position: absolute;
            left: 0;
            font-size: 1.3em;
            background: #d1fae5;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          .warning-list {
            list-style: none;
            margin-left: 0;
          }

          .warning-list li {
            position: relative;
            padding-left: 35px;
          }

          .warning-list li:before {
            content: "✗";
            color: #ef4444;
            font-weight: 700;
            position: absolute;
            left: 0;
            font-size: 1.3em;
            background: #fee2e2;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          .slide::-webkit-scrollbar {
            width: 8px;
          }

          .slide::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }

          .slide::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #1e3c72 0%, #7e22ce 100%);
            border-radius: 10px;
          }

          @media (max-width: 768px) {
            .slide {
              padding: 50px 40px;
              width: 95%;
              height: 85vh;
              border-radius: 16px;
            }

            .slide h1 {
              font-size: 2.2em;
            }

            .slide h2 {
              font-size: 1.4em;
            }

            .slide p, .slide li {
              font-size: 1em;
            }

            .cover-slide h1 {
              font-size: 2.8em;
            }

            .nav-button {
              padding: 12px 24px;
              font-size: 0.9em;
            }

            .slide-counter {
              top: 30px;
              right: 30px;
              padding: 10px 20px;
            }

            .navigation {
              bottom: 30px;
              gap: 12px;
            }
          }
        ` }} />
      </head>
      <body>
        <div className="progress-bar" id="progressBar"></div>
        <div className="slide-counter" id="slideCounter">1 / 19</div>

        <div className="presentation-container">
          {/* SLIDE 1: Cover */}
          <div className="slide active cover-slide">
            <h1>What Actually Matters About AI</h1>
            <p className="subtitle">A Guide for Commercial Furniture Operations</p>
            <p className="author">Lorenzo Daughtry-Chambers → Jocelyn Corrigan</p>
          </div>

          {/* SLIDE 2: The Thing Nobody Tells You */}
          <div className="slide">
            <h1>The Thing Nobody Tells You</h1>
            <p>Most people are using AI at like 10% capacity and don't know it.</p>
            <p>I see executives all the time who say "yeah, we're using AI" and when I ask how, it's basically ChatGPT for occasional emails.</p>
            <div className="stat-box">
              <strong>Here's the reality:</strong> There's casual AI usage and then there's operational AI. The gap is massive.
            </div>
            <p><strong>Casual usage:</strong> You save 15 minutes here and there. Nice but not transformative.</p>
            <p><strong>Operational usage:</strong> You 2-3x your capacity in key functions. Actually changes what's possible.</p>
          </div>

          {/* SLIDE 3: How to Actually Use This - Part 1 */}
          <div className="slide">
            <h1>How to Actually Use This Stuff</h1>
            <h2>Stop Treating It Like Google</h2>
            <p>Most people use AI like: Ask question → Get answer → Move on.</p>
            <p><strong>That's not where the value is.</strong></p>
            <div className="highlight-box">
              <h3>What actually works:</h3>
              <p>Give it your full context. Your role. Your priorities. What you're trying to accomplish.</p>
            </div>
            <p>If you're using ChatGPT, set up Custom Instructions:</p>
            <code style={{display: 'block', padding: '20px', margin: '1em 0', lineHeight: '1.6'}}>
I'm COO of a $370M commercial furniture dealership. I oversee
strategy, RFPs, design, marketing, new business development.
Currently targeting $1B.
<br/><br/>
I make decisions about operational efficiency, competitive
positioning, growth. I value data-driven insights with clear
options and trade-offs. Skip the jargon.
            </code>
          </div>

          {/* SLIDE 4: Different AIs */}
          <div className="slide">
            <h2>Use Different AIs for Different Work</h2>
            <p><strong>Claude</strong> - Deep research, complex analysis, anything requiring real thinking</p>
            <p><strong>ChatGPT</strong> - Quick creative, brainstorming</p>
            <p><strong>Perplexity</strong> - Current info (has live web search)</p>
            <p><strong>Gamma</strong> - Presentations (turns outlines into full decks in minutes)</p>
            <div className="highlight-box">
              <p>I use all of these depending on the job. Built myself a system (call it Perpetual Core) that routes work to the right one and keeps context across them.</p>
              <p><strong>Point is: different tools for different jobs.</strong></p>
            </div>
          </div>

          {/* SLIDE 5: Context & Iteration */}
          <div className="slide">
            <h2>Context Is Everything</h2>
            <p><strong>What amateurs do:</strong><br/>"Write a proposal for this client"</p>
            <p><strong>What works:</strong><br/>"Write a proposal for [Client Name], financial services firm, redesigning 3 floors in Chicago. They care about brand consistency, wellness, collaboration, sustainability. Budget $8-12M. Previous vendor was [Competitor]—they complained about slow turnaround. Our differentiator is [X, Y, Z]. July deadline."</p>
            <div className="stat-box">
              More context = exponentially better output
            </div>
            <h2>Never Accept First Draft</h2>
            <p>1. Prompt → Get draft (1 min)<br/>
            2. Review critically (2 min)<br/>
            3. Tell it what's wrong (1 min)<br/>
            4. Regenerate (30 sec)<br/>
            5. Repeat 2-3x</p>
            <p><strong>Total: 10 minutes instead of 45 minutes writing from scratch.</strong></p>
          </div>

          {/* SLIDE 6: Personal vs Operational */}
          <div className="slide">
            <h1>Personal AI vs. Operational AI</h1>
            <h2>The Actual Difference</h2>
            <p><strong>Personal AI</strong> = Everyone at your company uses ChatGPT for their own stuff. Scattered. Inconsistent. No shared context.</p>
            <p>Result: 10-25% individual productivity gains for people who remember to use it.</p>
            <div className="stat-box">
              <p><strong>Operational AI</strong> = AI that actually knows your business. Your past decisions. Your workflows. Your strategic context. Built into how work gets done.</p>
              <p><strong>Result: 50-200% capacity expansion in key functions.</strong></p>
            </div>
          </div>

          {/* SLIDE 7: The Data */}
          <div className="slide">
            <h2>The Data</h2>
            <p>I've studied 50+ enterprise transformations. The pattern is clear:</p>
            <div className="highlight-box">
              <p><strong>Goldman Sachs:</strong> $1B investment. 20-40% productivity gains across functions. Running 1M+ AI prompts monthly enterprise-wide.</p>
              <p><strong>IBM:</strong> $4.5B in documented savings. 3.9M work hours saved annually.</p>
              <p><strong>B2B Sales Operations:</strong> 50-91% time reduction on proposals. Volume increases of 2-10x. 3-15x ROI in first year.</p>
            </div>
            <div className="stat-box">
              Companies that architect AI into operations are creating 12-24 month competitive leads that competitors won't be able to close.
            </div>
          </div>

          {/* SLIDE 8: Commercial Furniture */}
          <div className="slide">
            <h1>Why Commercial Furniture</h1>
            <p>After talking with Erv, I got curious about where AI creates the most leverage.</p>
            <p><strong>Your industry showed up as unusually high-potential.</strong></p>
            <div className="highlight-box">
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
            <div className="stat-box">
              Industry adoption is still under 5%. First-mover window is wide open.
            </div>
          </div>

          {/* SLIDE 9: RFP Operations */}
          <div className="slide">
            <h1>What This Actually Looks Like</h1>
            <h2>RFP Operations</h2>
            <p>Typical dealer at your scale:</p>
            <ul>
              <li>200-300 RFPs annually</li>
              <li>40 hours average per RFP</li>
              <li>$400-600K annual labor cost</li>
            </ul>
            <div className="highlight-box">
              <h3>Real results:</h3>
              <ul>
                <li><strong>Transplace:</strong> 50% time reduction (40 hrs → 20 hrs)</li>
                <li><strong>Alera Group:</strong> 10 RFPs/year → 10 per QUARTER (same team)</li>
                <li><strong>Microsoft RFP team:</strong> $746 return per $1 invested</li>
              </ul>
            </div>
            <div className="stat-box">
              Translation: 2-4x capacity + 15-25% better win rates
            </div>
            <p><strong>While your competitors take 3 weeks to respond, you turn them around in 3 days.</strong></p>
          </div>

          {/* SLIDE 10: Design Services */}
          <div className="slide">
            <h2>Design Services</h2>
            <p>Most dealers: Designers spend 60-70% time on CAD grinding, only 30-40% on actual creative work.</p>
            <h3>AI flips this:</h3>
            <ul>
              <li>Upload floor plan → Get 15-20 layout options in different styles</li>
              <li>Photorealistic renderings in seconds</li>
              <li>Automatic specs and pricing</li>
            </ul>
            <div className="stat-box">
              <p><strong>Impact:</strong></p>
              <ul style={{marginLeft: 0, listStyle: 'none'}}>
                <li>• Concept phase: 10x faster (2-3 days → 4-6 hours)</li>
                <li>• Show clients 15 options instead of 3</li>
                <li>• Designers spend 70% time on strategy/clients, 30% technical</li>
                <li>• 3x capacity per designer</li>
              </ul>
            </div>
            <p><strong>Your designers become the reason clients choose Empire.</strong></p>
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
            <p><strong>Results: 20-40% productivity gain + measurable win rate increases</strong></p>
            <h2>The Bigger Picture</h2>
            <div className="highlight-box">
              <ul>
                <li><strong>RFPs:</strong> 2-4x capacity</li>
                <li><strong>Design:</strong> 3x capacity</li>
                <li><strong>Sales:</strong> 20-40% productivity gain</li>
                <li><strong>Marketing:</strong> 70% faster campaigns</li>
                <li><strong>Project Management:</strong> Predictive issue detection</li>
              </ul>
            </div>
            <div className="stat-box">
              Conservative estimate: $1.5-3M operational value first year. But the real value is strategic—you become the dealer competitors can't keep up with.
            </div>
          </div>

          {/* SLIDE 12: What I've Built */}
          <div className="slide">
            <h1>What I've Actually Built</h1>
            <p>I built Perpetual Core initially to solve my own operational complexity problem—running multiple ventures that needed to work together intelligently.</p>
            <div className="highlight-box">
              <h3>What changed for my operations:</h3>
              <ul>
                <li>Content creation: 60% faster</li>
                <li>Decision-making: 3x faster</li>
                <li>Capacity: Doing what would normally require multiple full operational teams</li>
                <li>Quality: Better decisions because I can analyze more options faster</li>
              </ul>
            </div>
            <h3>Why Empire is interesting:</h3>
            <p>1. Right scale (large enough to justify, agile enough to move fast)<br/>
            2. Complex operations (major impact potential)<br/>
            3. Targeting $1B (need step-change)<br/>
            4. Industry timing perfect (first-mover window open)<br/>
            5. You'd be proving ground for entire commercial furniture industry</p>
          </div>

          {/* SLIDE 13: Strategic Partnership */}
          <div className="slide">
            <div className="stat-box">
              <p>If Empire becomes the first AI-native dealer, that's not just good for you—it validates the model for the whole industry.</p>
              <p><strong>Which means you get the platform build, and I get the case study that opens a $60B market.</strong></p>
            </div>
            <p><strong>That's why I'm selective. I don't want clients. I want strategic partners where success is mutual.</strong></p>
          </div>

          {/* SLIDE 14: What Works vs Fails */}
          <div className="slide">
            <h1>What Actually Works</h1>
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
            <h1>The First-Mover Window</h1>
            <p>Every major tech shift has a 2-3 year window where early movers establish advantages:</p>
            <div className="highlight-box">
              <p><strong>E-commerce (1995-2000):</strong> Amazon moved while Borders studied. Game over.</p>
              <p><strong>Mobile (2010-2015):</strong> Uber, Instagram established before competitors reacted.</p>
              <p><strong>Cloud (2015-2020):</strong> Cloud-native companies scaled faster than legacy.</p>
            </div>
            <div className="stat-box">
              <h3>AI (2024-2027): Window is open RIGHT NOW.</h3>
              <p>By the time laggards move, first movers have refined systems, trained teams, captured market share, built muscle memory.</p>
              <p><strong>Your industry is &lt;5% adoption. In 12-18 months it'll be 30-40%.</strong></p>
            </div>
          </div>

          {/* SLIDE 16: Three Paths */}
          <div className="slide">
            <h2>The Three Paths</h2>
            <div className="highlight-box">
              <p><strong>Wait & See:</strong> Monitor competitors, move when it feels safe</p>
              <p><em>Reality: You'll spend 2x more to get 50% of the advantage</em></p>
            </div>
            <div className="highlight-box">
              <p><strong>Point Solutions:</strong> Buy off-the-shelf RFP tool, design software, CRM add-ons</p>
              <p><em>Reality: Same tools your competitors can buy. No sustainable advantage</em></p>
            </div>
            <div className="stat-box">
              <p><strong>Strategic Build:</strong> Architect AI into operations as proprietary competitive advantage</p>
              <p><em>Reality: Higher upfront investment but 2-3 year lead that's hard to replicate. This is how you go from $370M to $1B</em></p>
            </div>
          </div>

          {/* SLIDE 17: The Downside */}
          <div className="slide">
            <h1>What Happens If You Don't Move</h1>
            <p><strong>12 months from now:</strong></p>
            <ul>
              <li>One of your top 5 competitors deploys comprehensive AI</li>
              <li>They're responding to RFPs 3x faster with better quality</li>
              <li>They're handling 500 RFPs annually while you're at 250</li>
            </ul>
            <p><strong>24 months from now:</strong></p>
            <ul>
              <li>That competitor has captured significant market share</li>
              <li>They're hiring away your best people</li>
              <li>You're playing catch-up at 2x cost</li>
            </ul>
            <p><strong>36 months from now:</strong></p>
            <ul>
              <li>Multiple competitors have AI operations</li>
              <li>You've spent more to catch up than it would have cost to lead</li>
              <li>The path to $1B is harder</li>
            </ul>
          </div>

          {/* SLIDE 18: The FOMO Part */}
          <div className="slide">
            <h1>The FOMO Part (Real Talk)</h1>
            <p>I'm being selective this year. Typically work with 2-3 strategic partnerships annually.</p>
            <div className="stat-box">
              <h3>I've got one slot committed. Two available.</h3>
            </div>
            <div className="highlight-box">
              <p><strong>Empire is at the top of my list because:</strong></p>
              <ul>
                <li>Perfect timing (industry window open)</li>
                <li>Right scale (large enough for impact)</li>
                <li>Strategic goal ($1B requires step-change)</li>
                <li>Strong executive thinking (you're asking right questions)</li>
              </ul>
            </div>
            <p>But I'm also talking to a regional healthcare network and a mid-market logistics company.</p>
            <p><strong>And if one of your competitors comes calling in the next 60 days, I'll have to make a call about who gets the commercial furniture slot.</strong></p>
            <p>I'm not going to work with multiple dealers in the same market. That wouldn't be fair to whoever moves first.</p>
          </div>

          {/* SLIDE 19: Next Steps */}
          <div className="slide">
            <h1>Next Steps</h1>
            <h2>When we meet I can show you:</h2>
            <ul>
              <li>Perpetual Core in action (how it actually works)</li>
              <li>Specific applications to Empire's operations</li>
              <li>Phased implementation plan (pilot → prove → scale)</li>
              <li>Real numbers on investment and ROI</li>
              <li>What the first 90 days would look like</li>
            </ul>
            <div className="stat-box">
              <p>Or we just grab coffee and you decide this isn't the right time. That's fine too.</p>
              <p><strong>But if you're serious about being the first AI-native commercial furniture dealer—about having operational advantages your competitors can't match—then we should talk specifics soon.</strong></p>
            </div>
            <div className="highlight-box" style={{textAlign: 'center', marginTop: '2em'}}>
              <h2 style={{color: '#1e3c72'}}>The window is open. But it won't stay open.</h2>
              <p style={{marginTop: '1em'}}><strong>— Lorenzo</strong></p>
            </div>
          </div>
        </div>

        <div className="navigation">
          <button className="nav-button" id="prevBtn">← Previous</button>
          <button className="nav-button" id="nextBtn">Next →</button>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          let currentSlide = 0;
          const slides = document.querySelectorAll('.slide');
          const totalSlides = slides.length;

          function showSlide(n) {
            slides[currentSlide].classList.remove('active');
            currentSlide = (n + totalSlides) % totalSlides;
            slides[currentSlide].classList.add('active');

            document.getElementById('slideCounter').textContent = \`\${currentSlide + 1} / \${totalSlides}\`;

            const progress = ((currentSlide + 1) / totalSlides) * 100;
            document.getElementById('progressBar').style.width = progress + '%';

            document.getElementById('prevBtn').disabled = currentSlide === 0;
            document.getElementById('nextBtn').disabled = currentSlide === totalSlides - 1;

            slides[currentSlide].scrollTop = 0;
          }

          function changeSlide(direction) {
            showSlide(currentSlide + direction);
          }

          document.getElementById('prevBtn').addEventListener('click', () => changeSlide(-1));
          document.getElementById('nextBtn').addEventListener('click', () => changeSlide(1));

          document.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowLeft') {
              if (currentSlide > 0) changeSlide(-1);
            } else if (event.key === 'ArrowRight' || event.key === ' ') {
              if (currentSlide < totalSlides - 1) changeSlide(1);
              event.preventDefault();
            }
          });

          document.querySelectorAll('.slide').forEach(slide => {
            slide.addEventListener('click', function(event) {
              if (!event.target.closest('.nav-button') && currentSlide < totalSlides - 1) {
                changeSlide(1);
              }
            });
          });

          showSlide(0);
        ` }} />
      </body>
    </html>
  );
}
