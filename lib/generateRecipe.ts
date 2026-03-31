export type GeneratedRecipe = {
  title: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
  steps: string[];
};

const AI_API_URL = process.env.AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY;

function isGeneratedRecipe(value: unknown): value is GeneratedRecipe {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.title === 'string' &&
    typeof data.calories === 'number' &&
    typeof data.protein === 'number' &&
    typeof data.fat === 'number' &&
    typeof data.carbs === 'number' &&
    typeof data.time === 'string' &&
    Array.isArray(data.steps) &&
    data.steps.length >= 3 &&
    data.steps.length <= 6 &&
    data.steps.every((step) => typeof step === 'string')
  );
}

export async function generateRecipe(mode: string): Promise<GeneratedRecipe> {
  if (!mode || typeof mode !== 'string') {
    throw new Error('Mode is required and must be a string.');
  }

  if (!AI_API_URL) {
    throw new Error('AI_API_URL is not configured.');
  }

  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured.');
  }

  let response: Response;

  try {
    response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        mode,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'recipe',
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                calories: { type: 'number' },
                protein: { type: 'number' },
                fat: { type: 'number' },
                carbs: { type: 'number' },
                time: { type: 'string' },
                steps: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 3,
                  maxItems: 6
                }
              },
              required: ['title', 'calories', 'protein', 'fat', 'carbs', 'time', 'steps'],
              additionalProperties: false
            }
          }
        }
      })
    });
  } catch {
    throw new Error('Failed to connect to AI API.');
  }

  if (!response.ok) {
    throw new Error(`AI API returned status ${response.status}.`);
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error('AI API returned invalid JSON.');
  }

  const data = (payload as { data?: unknown; recipe?: unknown })?.data ??
    (payload as { recipe?: unknown })?.recipe ??
    payload;

  if (!isGeneratedRecipe(data)) {
    throw new Error('AI API response does not match recipe format.');
  }

  return data;
}
