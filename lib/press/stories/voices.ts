// Voice bibles ported from creator-studio/data/voice-bibles (2026-07-12). Edit there and re-port, or edit here.
export type PressStoryVoiceKey = "perpetual-core" | "iha-academy" | "lorenzodc" | "uplift" | "tpc-ministries" | "streams-of-grace" | "default";

export type PressStoryVoice = {
  key: PressStoryVoiceKey;
  name: string;
  toneRules: string[];
  exemplars: { platform: string; text: string }[];
  hooks: string[];
  antiPatterns: string[];
  bannedPhrases: string[];
  notes: string[];
};

export const PRESS_STORY_VOICE_KEYS: readonly PressStoryVoiceKey[] = ["perpetual-core", "iha-academy", "lorenzodc", "uplift", "tpc-ministries", "streams-of-grace", "default"] as const;

export const PRESS_STORY_VOICES: Record<PressStoryVoiceKey, PressStoryVoice> = {
  "perpetual-core": {
    "key": "perpetual-core",
    "name": "Perpetual Core",
    "toneRules": [
      "Operating-company authority. Speaks as builders who run real systems, not a SaaS pitching features.",
      "Confident, concrete, numbers over adjectives.",
      "Never salesy, never 'limited time' tactics.",
      "Scale is the frame, not SaaS growth-hack tactics — Perpetual Core talks like an operating company, not a startup chasing signups."
    ],
    "exemplars": [
      {
        "platform": "linkedin",
        "text": "So we built the bridge — and then we built the thing that keeps building bridges. It's called the Perpetual Engine: Educate, Deploy, Capitalize, Scale. We educate people with real, certifying skills. We deploy them into real jobs and real ventures. We capitalize what works. And a structural share of every commercial dollar — ten percent, written into the architecture — flows back to fund the next person's crossing. Permanently. This isn't charity. It's architecture."
      },
      {
        "platform": "linkedin",
        "text": "And the same engine we run for communities, we install inside companies — an AI operating system across your sales, ops, and knowledge. If you want your organization to cross into this era instead of being dragged, that's the work."
      }
    ],
    "hooks": [
      "Here's what most people get wrong about this moment.",
      "This isn't a concept deck.",
      "This isn't charity. It's architecture."
    ],
    "antiPatterns": [
      "Never salesy, never 'limited time'/scarcity SaaS tactics — Perpetual Core sells on scale and systems, not urgency (standing rule: PC positioning is scale, not SaaS tactics).",
      "Never lead with pain before architecture — Perpetual Core leads with the system already running, not a problem to be agitated.",
      "Never claim a CinqCare partnership.",
      "Never name UN-Africa/AU principals in writing.",
      "This rule applies to perpetualcore.com surfaces specifically — do not over-apply the anti-scarcity rule to other brands' promotions."
    ],
    "bannedPhrases": [
      "limited time",
      "act now",
      "game-changer",
      "revolutionize",
      "disrupt",
      "10x your"
    ],
    "notes": [
      "Perpetual Core is the commercial/operating-company arm of the Perpetual Engine (Educate -> Deploy -> Capitalize -> Scale)."
    ]
  },
  "iha-academy": {
    "key": "iha-academy",
    "name": "IHA AI Academy",
    "toneRules": [
      "Warm institutional. Practical AI skills for nonprofit, community, and business leaders.",
      "Outcome-first framing (what you'll be able to DO), plain language.",
      "Encouraging but never condescending.",
      "NO equity framing — Academy was repositioned away from equity language in 2026-06; lead with skills and outcomes, not gaps."
    ],
    "exemplars": [
      {
        "platform": "linkedin",
        "text": "We develop people and systems for an intelligent future — and we build the engine that funds the next cohort from the last one."
      },
      {
        "platform": "linkedin",
        "text": "There is no shortage of analysis about what holds communities back. There is a shortage of working, measured, replicable models. We build the models — then stand behind them for decades."
      }
    ],
    "hooks": [
      "Humanity is advancing faster than ever. We built the institution to match.",
      "Here's what most people get wrong about this moment."
    ],
    "antiPatterns": [
      "NEVER use equity-gap framing ('equity gap', 'closing the gap', 'underserved communities') — repositioned 2026-06 to skills/outcome framing instead.",
      "NEVER name UN-Africa/AU principals in writing.",
      "Never claim a CinqCare partnership.",
      "Never condescend — 'you'll be able to DO X' outcome framing, not 'we're helping you catch up'."
    ],
    "bannedPhrases": [
      "equity gap",
      "underserved communities",
      "closing the gap",
      "marginalized",
      "at-risk"
    ],
    "notes": [
      "IHA AI Academy = Advance (free) + Academy (paid cert) dual ladder — keep the two ladders' messaging distinct, do not reconcile into one CTA.",
      "Do not confuse with 'IHA' the parent institute voice, which is broader (institution/engine framing) — Academy content should stay skills/outcome-specific."
    ]
  },
  "lorenzodc": {
    "key": "lorenzodc",
    "name": "Lorenzo Daughtry-Chambers (personal)",
    "toneRules": [
      "First-person thought leader. Systems thinker who builds in public.",
      "Direct, generous with specifics, contrarian when earned.",
      "Short sentences. No guru tone."
    ],
    "exemplars": [
      {
        "platform": "linkedin",
        "text": "Lorenzo Daughtry-Chambers builds the architecture of human advancement — institutions, workforce pipelines, and AI operating systems that help people and organizations cross into their next season."
      },
      {
        "platform": "x",
        "text": "Founder, Institute for Human Advancement · Creator of the Perpetual Engine · AI operating systems @ Perpetual Core · Workforce @ Uplift · Sixth-generation Brooklyn minister · Build what scales without losing your soul."
      },
      {
        "platform": "linkedin",
        "text": "Three years ago I wouldn't have imagined this room. We've taken this work from Brooklyn to the world — and our first deployment, in Kenya, served thousands, trained workforces, built health and enterprise where people said it couldn't hold. And the one thing I keep learning: advancement isn't a program. It's people, built up and sent out."
      }
    ],
    "hooks": [
      "Build what scales without losing your soul.",
      "This isn't charity. It's architecture.",
      "Here's what most people get wrong about this moment."
    ],
    "antiPatterns": [
      "No guru tone, no engagement-bait ('thoughts?', 'agree?', 'drop a comment').",
      "No corporate filler, no hype words, no hashtag spam.",
      "Never name UN-Africa/AU principals in writing.",
      "Never claim a CinqCare partnership."
    ],
    "bannedPhrases": [
      "thoughts?",
      "agree?",
      "hustle",
      "10x",
      "game-changer"
    ],
    "notes": [
      "lorenzodc.com is the umbrella/thought-leader surface — 'in front of a CEO you are the AI operating system, in front of DYCD you are workforce' (focus in the pitch, breadth in the architecture); pick ONE lane per post, don't try to cover all five crossings at once."
    ]
  },
  "uplift": {
    "key": "uplift",
    "name": "Uplift Communities",
    "toneRules": [
      "Mission-forward and plain-spoken. Workforce and community outcomes, real people and real placements.",
      "Dignity-first language, evidence over slogans.",
      "Workforce is the beachhead, not the identity — stay concrete and program-specific."
    ],
    "exemplars": [
      {
        "platform": "linkedin",
        "text": "In Brooklyn, Uplift Communities runs healthcare workforce training with DYCD — five clinical tracks, train, certify, 300-hour internship, place, with employers at the table."
      },
      {
        "platform": "linkedin",
        "text": "I'm asking you to be a hiring partner — take our certified, internship-tested graduates into your open roles. You have vacancies; we have a pipeline built for them."
      }
    ],
    "hooks": [
      "Workforce development is the beachhead, not the identity."
    ],
    "antiPatterns": [
      "Measured Uplift numbers only — never inflate placement/graduate stats.",
      "Dignity-first language — never reduce students/graduates to statistics without a name or story where possible.",
      "Never claim a CinqCare partnership.",
      "Never name UN-Africa/AU principals in writing."
    ],
    "bannedPhrases": [
      "underserved communities",
      "at-risk",
      "disadvantaged"
    ],
    "notes": [
      "Uplift Communities is the operating arm — healthcare workforce training with DYCD/KBCC in Brooklyn; the Kenya deployment is IHA/coalition-level, not an Uplift-specific claim."
    ]
  },
  "tpc-ministries": {
    "key": "tpc-ministries",
    "name": "TPC Ministries",
    "toneRules": [
      "Pastoral and invitational. Faith-filled, community-centered, hopeful.",
      "Speaks to the congregation and the seeker alike.",
      "Warm, never performative."
    ],
    "exemplars": [],
    "hooks": [],
    "antiPatterns": [
      "Never performative — warmth must read as sincere, not staged for engagement.",
      "Never transactional CTAs.",
      "Keep this voice distinct from streams-of-grace: TPC is congregational/pastoral (speaks to a gathered community); Streams of Grace is personal/devotional (individual daily practice)."
    ],
    "bannedPhrases": [
      "don't miss out",
      "limited spots",
      "click now",
      "act now"
    ],
    "notes": []
  },
  "streams-of-grace": {
    "key": "streams-of-grace",
    "name": "Streams of Grace",
    "toneRules": [
      "Devotional and calm. Scripture-anchored, reflective.",
      "Gentle invitation over urgency. Quotable single lines.",
      "Never transactional."
    ],
    "exemplars": [
      {
        "platform": "reels",
        "text": "Daily Grace. Anywhere."
      }
    ],
    "hooks": [
      "Daily Grace. Anywhere."
    ],
    "antiPatterns": [
      "Never transactional, no urgency CTAs ('sale ends', 'limited spots').",
      "Never scripture-detached — anchor in a specific verse or spiritual practice, not generic inspiration.",
      "Keep this voice distinct from tpc-ministries: Streams of Grace is personal/devotional (individual daily practice); TPC is congregational/pastoral."
    ],
    "bannedPhrases": [
      "swipe up now",
      "limited spots",
      "don't miss out",
      "sale",
      "act now"
    ],
    "notes": []
  },
  "default": {
    "key": "default",
    "name": "Default (neutral, warm, concrete)",
    "toneRules": [
      "Direct, warm, substantive. First person.",
      "No corporate filler, no hype words, no hashtag spam.",
      "Say the specific thing, not the general thing."
    ],
    "exemplars": [
      {
        "platform": "linkedin",
        "text": "Lorenzo Daughtry-Chambers builds the architecture of human advancement — institutions, workforce pipelines, and AI operating systems that help people and organizations cross into their next season."
      }
    ],
    "hooks": [
      "Build what scales without losing your soul.",
      "This isn't charity. It's architecture."
    ],
    "antiPatterns": [
      "Never corporate filler, never hype words ('game-changer', 'revolutionize').",
      "Never hashtag spam.",
      "Client faith-based work (e.g. Mission Faith Equity) is faith-framed, never 'DEI' — this default bible is the fallback for that framing guidance until MFE gets its own brands.json key."
    ],
    "bannedPhrases": [
      "DEI",
      "diversity, equity, and inclusion",
      "game-changer",
      "revolutionize",
      "disrupt",
      "hustle culture"
    ],
    "notes": [
      "Default is the fallback voice bible: used for unprefixed inbox drops (no `<brand>--` filename prefix) and by any brand key that lacks its own voice-bibles/<brand>.json file.",
      "Mission Faith Equity (Danielle Harrison site, client work) is not yet a brands.json key — when it becomes one, split this DEI/faith-framing note into its own bible."
    ]
  }
};

export function getPressStoryVoice(key: string | null | undefined): PressStoryVoice {
  return (key && key in PRESS_STORY_VOICES) ? PRESS_STORY_VOICES[key as PressStoryVoiceKey] : PRESS_STORY_VOICES["default"];
}
