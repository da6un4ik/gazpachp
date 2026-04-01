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
const AI_PROVIDER = process.env.AI_PROVIDER ?? 'generic';
const HF_MODEL = process.env.HF_MODEL ?? 'meta-llama/Llama-3.1-8B-Instruct';

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

function extractRecipeFromPayload(payload: unknown): unknown {
  const data = (payload as { data?: unknown; recipe?: unknown })?.data ??
    (payload as { recipe?: unknown })?.recipe;

  if (data) {
    return data;
  }

  const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  if (Array.isArray(content)) {
    const textPart = content.find((item) => typeof item === 'object' && item && 'text' in item) as
      | { text?: string }
      | undefined;

    if (textPart?.text) {
      try {
        return JSON.parse(textPart.text);
      } catch {
        return textPart.text;
      }
    }
  }

  return payload;
}

function buildHuggingFaceRequest(mode: string) {
  const endpoint = AI_API_URL ?? 'https://router.huggingface.co/v1/chat/completions';

  return {
    endpoint,
    body: {
      model: HF_MODEL,
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content:
            'Ты помощник по завтракам. Верни только JSON без markdown. Поля: title, calories, protein, fat, carbs, time, steps (3-6 шагов).'
        },
        {
          role: 'user',
          content: `Подбери один рецепт завтрака для режима: ${mode}.`
        }
      ],
      response_format: {
        type: 'json_object'
      }
    }
  };
}

function buildGenericRequest(mode: string) {
  if (!AI_API_URL) {
    throw new Error('AI_API_URL is not configured.');
  }

  return {
    endpoint: AI_API_URL,
    body: {
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
    }
  };
}

export async function generateRecipe(mode: string): Promise<GeneratedRecipe> {
  if (!mode || typeof mode !== 'string') {
    throw new Error('Mode is required and must be a string.');
  }

  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured.');
  }

  const requestConfig = AI_PROVIDER === 'huggingface' ? buildHuggingFaceRequest(mode) : buildGenericRequest(mode);

  let response: Response;

  try {
    response = await fetch(requestConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify(requestConfig.body)
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

  const data = extractRecipeFromPayload(payload);

  if (!isGeneratedRecipe(data)) {
    throw new Error('AI API response does not match recipe format.');
  }

  return data;
}
