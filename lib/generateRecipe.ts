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

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.').match(/-?\d+(\.\d+)?/)?.[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeSteps(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((step): step is string => typeof step === 'string').map((step) => step.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|\r|\d+\.|•|-/)
      .map((step) => step.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRecipe(value: unknown): GeneratedRecipe | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Record<string, unknown>;
  const title = (data.title ?? data.name ?? data.dish) as unknown;
  const time = (data.time ?? data.prep_time ?? data.cook_time) as unknown;

  const recipe: GeneratedRecipe = {
    title: typeof title === 'string' ? title.trim() : '',
    calories: toNumber(data.calories ?? data.kcal) ?? NaN,
    protein: toNumber(data.protein ?? data.proteins) ?? NaN,
    fat: toNumber(data.fat ?? data.fats) ?? NaN,
    carbs: toNumber(data.carbs ?? data.carbohydrates) ?? NaN,
    time: typeof time === 'string' ? time.trim() : '',
    steps: normalizeSteps(data.steps ?? data.instructions)
  };

  const valid =
    recipe.title.length > 0 &&
    Number.isFinite(recipe.calories) &&
    Number.isFinite(recipe.protein) &&
    Number.isFinite(recipe.fat) &&
    Number.isFinite(recipe.carbs) &&
    recipe.time.length > 0 &&
    recipe.steps.length >= 3;

  if (!valid) {
    return null;
  }

  recipe.steps = recipe.steps.slice(0, 6);
  return recipe;
}

function extractJsonFromText(content: string): unknown {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) {
      try {
        return JSON.parse(fenced.trim());
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }
}

function extractRecipeFromPayload(payload: unknown): unknown {
  const data = (payload as { data?: unknown; recipe?: unknown })?.data ??
    (payload as { recipe?: unknown })?.recipe;

  if (data) {
    return data;
  }

  const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return extractJsonFromText(content);
  }

  if (Array.isArray(content)) {
    const textPart = content.find((item) => typeof item === 'object' && item && 'text' in item) as
      | { text?: string }
      | undefined;

    if (textPart?.text) {
      return extractJsonFromText(textPart.text);
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
            'Ты помощник по завтракам. Верни только JSON без markdown. Поля: title, calories, protein, fat, carbs, time, steps (3-6 шагов). Числа только number, не строка.'
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
  const recipe = normalizeRecipe(data);

  if (!recipe) {
    throw new Error('AI API response does not match recipe format.');
  }

  return recipe;
}
