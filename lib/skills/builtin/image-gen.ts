/**
 * Image Generation Skill
 *
 * Generate images using DALL-E or other AI image generators.
 * Requires OpenAI API key.
 */

import { Skill, ToolContext, ToolResult } from "../types";

const OPENAI_API = "https://api.openai.com/v1";

function getOpenAIApiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

type ImageSize = "1024x1024" | "1792x1024" | "1024x1792" | "512x512" | "256x256";
type ImageQuality = "standard" | "hd";
type ImageStyle = "natural" | "vivid";

async function generateImage(
  params: {
    prompt: string;
    size?: ImageSize;
    quality?: ImageQuality;
    style?: ImageStyle;
    n?: number;
  },
  context: ToolContext
): Promise<ToolResult> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "OpenAI API key not configured. Please add OPENAI_API_KEY to use image generation.",
    };
  }

  try {
    const requestBody = {
      model: "dall-e-3",
      prompt: params.prompt,
      n: 1, // DALL-E 3 only supports n=1
      size: params.size || "1024x1024",
      quality: params.quality || "standard",
      style: params.style || "vivid",
      response_format: "url",
    };

    const response = await fetch(`${OPENAI_API}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Failed to generate image",
      };
    }

    const result = await response.json();
    const image = result.data[0];

    return {
      success: true,
      data: {
        url: image.url,
        revisedPrompt: image.revised_prompt,
        originalPrompt: params.prompt,
        size: params.size || "1024x1024",
        quality: params.quality || "standard",
        style: params.style || "vivid",
      },
      display: {
        type: "image",
        content: {
          url: image.url,
          alt: params.prompt,
          caption: image.revised_prompt || params.prompt,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function generateVariation(
  params: {
    imageUrl: string;
    n?: number;
    size?: "1024x1024" | "512x512" | "256x256";
  },
  context: ToolContext
): Promise<ToolResult> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "OpenAI API key not configured",
    };
  }

  try {
    // Fetch the image and convert to base64
    const imageResponse = await fetch(params.imageUrl);
    if (!imageResponse.ok) {
      return { success: false, error: "Failed to fetch source image" };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");

    // Create form data for the variation request
    const formData = new FormData();

    // Convert base64 to Blob
    const imageBlob = new Blob([Buffer.from(base64, "base64")], { type: "image/png" });
    formData.append("image", imageBlob, "image.png");
    formData.append("n", String(params.n || 1));
    formData.append("size", params.size || "1024x1024");
    formData.append("response_format", "url");

    const response = await fetch(`${OPENAI_API}/images/variations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Failed to create variation",
      };
    }

    const result = await response.json();
    const images = result.data;

    return {
      success: true,
      data: {
        variations: images.map((img: any) => ({
          url: img.url,
        })),
        sourceUrl: params.imageUrl,
        count: images.length,
      },
      display: {
        type: "image",
        content: {
          url: images[0].url,
          alt: "Image variation",
          caption: `Variation of source image (${images.length} generated)`,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function editImage(
  params: {
    imageUrl: string;
    prompt: string;
    maskUrl?: string;
    size?: "1024x1024" | "512x512" | "256x256";
  },
  context: ToolContext
): Promise<ToolResult> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "OpenAI API key not configured",
    };
  }

  try {
    // Fetch the source image
    const imageResponse = await fetch(params.imageUrl);
    if (!imageResponse.ok) {
      return { success: false, error: "Failed to fetch source image" };
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    const formData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: "image/png" });
    formData.append("image", imageBlob, "image.png");
    formData.append("prompt", params.prompt);
    formData.append("size", params.size || "1024x1024");
    formData.append("response_format", "url");

    // Add mask if provided
    if (params.maskUrl) {
      const maskResponse = await fetch(params.maskUrl);
      if (maskResponse.ok) {
        const maskBuffer = await maskResponse.arrayBuffer();
        const maskBlob = new Blob([maskBuffer], { type: "image/png" });
        formData.append("mask", maskBlob, "mask.png");
      }
    }

    const response = await fetch(`${OPENAI_API}/images/edits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Failed to edit image",
      };
    }

    const result = await response.json();
    const image = result.data[0];

    return {
      success: true,
      data: {
        url: image.url,
        prompt: params.prompt,
        sourceUrl: params.imageUrl,
      },
      display: {
        type: "image",
        content: {
          url: image.url,
          alt: params.prompt,
          caption: `Edited: ${params.prompt}`,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function analyzeImage(
  params: { imageUrl: string; question?: string },
  context: ToolContext
): Promise<ToolResult> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "OpenAI API key not configured",
    };
  }

  try {
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: params.imageUrl,
            },
          },
          {
            type: "text",
            text: params.question || "Describe this image in detail. What do you see?",
          },
        ],
      },
    ];

    const response = await fetch(`${OPENAI_API}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Failed to analyze image",
      };
    }

    const result = await response.json();
    const analysis = result.choices[0]?.message?.content || "No analysis available";

    return {
      success: true,
      data: {
        imageUrl: params.imageUrl,
        question: params.question || "General description",
        analysis,
      },
      display: {
        type: "text",
        content: analysis,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const imageGenSkill: Skill = {
  id: "image-gen",
  name: "Image Generation",
  description: "Generate and analyze images using AI (DALL-E & GPT-4 Vision)",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "creative",
  tags: ["image", "art", "dall-e", "generation", "ai", "vision"],

  icon: "🎨",
  color: "#10B981",

  tier: "free", // Uses user's own API key
  isBuiltIn: true,

  requiredEnvVars: ["OPENAI_API_KEY"],

  tools: [
    {
      name: "generate",
      description: "Generate an image from a text prompt using DALL-E 3",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Description of the image to generate",
          },
          size: {
            type: "string",
            enum: ["1024x1024", "1792x1024", "1024x1792"],
            description: "Image size (default: 1024x1024)",
          },
          quality: {
            type: "string",
            enum: ["standard", "hd"],
            description: "Image quality (default: standard)",
          },
          style: {
            type: "string",
            enum: ["natural", "vivid"],
            description: "Image style (default: vivid)",
          },
        },
        required: ["prompt"],
      },
      execute: generateImage,
    },
    {
      name: "variation",
      description: "Create variations of an existing image",
      parameters: {
        type: "object",
        properties: {
          imageUrl: {
            type: "string",
            description: "URL of the source image",
          },
          size: {
            type: "string",
            enum: ["1024x1024", "512x512", "256x256"],
            description: "Output size (default: 1024x1024)",
          },
        },
        required: ["imageUrl"],
      },
      execute: generateVariation,
    },
    {
      name: "edit",
      description: "Edit an image with a text prompt (inpainting)",
      parameters: {
        type: "object",
        properties: {
          imageUrl: {
            type: "string",
            description: "URL of the image to edit",
          },
          prompt: {
            type: "string",
            description: "Description of the edit to make",
          },
          maskUrl: {
            type: "string",
            description: "URL of mask image (transparent areas will be edited)",
          },
          size: {
            type: "string",
            enum: ["1024x1024", "512x512", "256x256"],
            description: "Output size",
          },
        },
        required: ["imageUrl", "prompt"],
      },
      execute: editImage,
    },
    {
      name: "analyze",
      description: "Analyze and describe an image using GPT-4 Vision",
      parameters: {
        type: "object",
        properties: {
          imageUrl: {
            type: "string",
            description: "URL of the image to analyze",
          },
          question: {
            type: "string",
            description: "Specific question about the image (optional)",
          },
        },
        required: ["imageUrl"],
      },
      execute: analyzeImage,
    },
  ],

  systemPrompt: `You can generate and analyze images. Capabilities:
- generate: Create images from text descriptions using DALL-E 3
- variation: Create variations of existing images
- edit: Edit/inpaint images with text prompts
- analyze: Describe and answer questions about images using GPT-4 Vision

Tips for better generation:
- Be specific and descriptive in prompts
- Include style, lighting, and composition details
- Use "hd" quality for detailed images
- Use "natural" style for realistic images`,
};
