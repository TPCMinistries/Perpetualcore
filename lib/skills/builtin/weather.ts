/**
 * Weather Skill
 *
 * Get current weather and forecasts using wttr.in (no API key required)
 */

import { Skill, ToolContext, ToolResult } from "../types";

async function getWeather(
  params: { location: string; format?: string },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const location = encodeURIComponent(params.location);
    const format = params.format || "json";

    // Use wttr.in for weather (no API key needed)
    const response = await fetch(
      `https://wttr.in/${location}?format=j1`,
      { headers: { "User-Agent": "PerpetualCore/1.0" } }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch weather: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const current = data.current_condition?.[0];
    const forecast = data.weather?.slice(0, 3);

    if (!current) {
      return {
        success: false,
        error: "Weather data not available for this location",
      };
    }

    const result = {
      location: data.nearest_area?.[0]?.areaName?.[0]?.value || params.location,
      current: {
        temp_f: current.temp_F,
        temp_c: current.temp_C,
        feels_like_f: current.FeelsLikeF,
        feels_like_c: current.FeelsLikeC,
        condition: current.weatherDesc?.[0]?.value,
        humidity: current.humidity,
        wind_mph: current.windspeedMiles,
        wind_dir: current.winddir16Point,
      },
      forecast: forecast?.map((day: any) => ({
        date: day.date,
        high_f: day.maxtempF,
        high_c: day.maxtempC,
        low_f: day.mintempF,
        low_c: day.mintempC,
        condition: day.hourly?.[4]?.weatherDesc?.[0]?.value,
        chance_of_rain: day.hourly?.[4]?.chanceofrain,
      })),
    };

    return {
      success: true,
      data: result,
      display: {
        type: "card",
        content: {
          title: `Weather in ${result.location}`,
          description: `${result.current.condition}, ${result.current.temp_f}°F (feels like ${result.current.feels_like_f}°F)`,
          fields: [
            { label: "Humidity", value: `${result.current.humidity}%` },
            { label: "Wind", value: `${result.current.wind_mph} mph ${result.current.wind_dir}` },
          ],
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch weather",
    };
  }
}

async function getForecast(
  params: { location: string; days?: number },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const location = encodeURIComponent(params.location);
    const days = Math.min(params.days || 3, 7);

    const response = await fetch(
      `https://wttr.in/${location}?format=j1`,
      { headers: { "User-Agent": "PerpetualCore/1.0" } }
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch forecast" };
    }

    const data = await response.json();
    const forecast = data.weather?.slice(0, days);

    if (!forecast || forecast.length === 0) {
      return { success: false, error: "Forecast not available" };
    }

    const result = {
      location: data.nearest_area?.[0]?.areaName?.[0]?.value || params.location,
      forecast: forecast.map((day: any) => ({
        date: day.date,
        day: new Date(day.date).toLocaleDateString("en-US", { weekday: "long" }),
        high_f: day.maxtempF,
        low_f: day.mintempF,
        condition: day.hourly?.[4]?.weatherDesc?.[0]?.value,
        sunrise: day.astronomy?.[0]?.sunrise,
        sunset: day.astronomy?.[0]?.sunset,
      })),
    };

    return {
      success: true,
      data: result,
      display: {
        type: "table",
        content: {
          headers: ["Day", "High", "Low", "Conditions"],
          rows: result.forecast.map((day: any) => [
            day.day,
            `${day.high_f}°F`,
            `${day.low_f}°F`,
            day.condition,
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const weatherSkill: Skill = {
  id: "weather",
  name: "Weather",
  description: "Get current weather conditions and forecasts for any location",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "utility",
  tags: ["weather", "forecast", "conditions"],

  icon: "☀️",
  color: "#4A90D9",

  tier: "free",
  isBuiltIn: true,

  tools: [
    {
      name: "get_weather",
      description: "Get current weather conditions for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City name or location (e.g., 'New York', 'London, UK', '10001')",
          },
        },
        required: ["location"],
      },
      execute: getWeather,
    },
    {
      name: "get_forecast",
      description: "Get weather forecast for upcoming days",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City name or location",
          },
          days: {
            type: "number",
            description: "Number of days to forecast (1-7, default 3)",
          },
        },
        required: ["location"],
      },
      execute: getForecast,
    },
  ],

  systemPrompt: `You have access to weather information. When users ask about weather:
- Use get_weather for current conditions
- Use get_forecast for multi-day forecasts
- Always include both temperature and conditions
- Mention relevant details like rain chance if planning activities`,
};
