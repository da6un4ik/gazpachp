export type GeneratedRecipe = {
  title: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
  servingSize: string;
  ingredients: string[];
  steps: string[];
};

type GenerateRecipeOptions = {
  nonce?: string;
  excludeTitle?: string;
  favoriteIngredients?: string[];
  favoriteRecipe?: string;
};

const AI_API_URL = process.env.AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER ?? 'generic';
const HF_MODEL = process.env.HF_MODEL ?? 'meta-llama/Llama-3.1-8B-Instruct';


function mapModeToGoal(mode: string): string {
  const goalByMode: Record<string, string> = {
    'weight-loss': 'Похудение',
    protein: 'Высокобелковый завтрак',
    kids: 'Детский сбалансированный завтрак',
    quick: 'Максимально быстрый завтрак',
    random: 'Сбалансированный универсальный завтрак'
  };

  return goalByMode[mode] ?? goalByMode.random;
}

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

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(/\n|\r|,|•|-/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
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
  const servingSize = (data.servingSize ?? data.serving_size ?? data.portion ?? data.portion_size) as unknown;

  const recipe: GeneratedRecipe = {
    title: typeof title === 'string' ? title.trim() : '',
    calories: toNumber(data.calories ?? data.kcal) ?? NaN,
    protein: toNumber(data.protein ?? data.proteins) ?? NaN,
    fat: toNumber(data.fat ?? data.fats) ?? NaN,
    carbs: toNumber(data.carbs ?? data.carbohydrates) ?? NaN,
    time: typeof time === 'string' ? time.trim() : '',
    servingSize: typeof servingSize === 'string' ? servingSize.trim() : '1 порция (~300 г)',
    ingredients: normalizeStringList(data.ingredients),
    steps: normalizeSteps(data.steps ?? data.instructions)
  };

  const valid =
    recipe.title.length > 0 &&
    Number.isFinite(recipe.calories) &&
    Number.isFinite(recipe.protein) &&
    Number.isFinite(recipe.fat) &&
    Number.isFinite(recipe.carbs) &&
    recipe.time.length > 0 &&
    recipe.ingredients.length >= 3 &&
    recipe.steps.length >= 3;

  if (!valid) {
    return null;
  }

  recipe.ingredients = recipe.ingredients.slice(0, 20);
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

  const generatedText = (payload as Array<{ generated_text?: unknown }>)?.[0]?.generated_text;
  if (typeof generatedText === 'string') {
    return extractJsonFromText(generatedText);
  }

  return payload;
}

function buildHuggingFaceRequest(mode: string, options: GenerateRecipeOptions = {}) {
  const endpoint = AI_API_URL ?? 'https://router.huggingface.co/v1/chat/completions';
  const goal = mapModeToGoal(mode);
  const nonce = options.nonce ?? String(Date.now());
  const excludeTitle = options.excludeTitle ? `\n- Не повторяй рецепт с названием: ${options.excludeTitle}` : "";
  const favoriteIngredients = options.favoriteIngredients?.length
    ? `\n- Используй в первую очередь эти любимые ингредиенты: ${options.favoriteIngredients.join(', ')}`
    : "";
  const favoriteRecipe = options.favoriteRecipe
    ? `\n- Пользователь отметил любимый рецепт: ${options.favoriteRecipe}. Учитывай его вкусовой профиль.`
    : "";

  return {
    endpoint,
    body: {
      model: HF_MODEL,
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content:
            'Ты — профессиональный нутрициолог и шеф-повар. Отвечай только валидным JSON без markdown и без лишнего текста.'
        },
        {
          role: 'user',
          content:
            `Создай рецепт завтрака на основе заданной цели.

` +
            `Цель: ${goal}

` +
            `Требования:
` +
            `- Рецепт должен быть реалистичным и простым для приготовления дома
` +
            `- Время приготовления: до 20 минут
` +
            `- Ингредиенты — доступные (обычный супермаркет)
` +
            `- Укажи точные граммовки
` +
            `- Укажи калории и БЖУ (белки, жиры, углеводы)
` +
            `- Опиши вкус и текстуру блюда
` +
            `- Добавь 1–2 вариации рецепта${excludeTitle}${favoriteIngredients}${favoriteRecipe}\n` +
            `- Сделай вариант отличающимся от прошлых. Технический nonce: ${nonce}\n\n` +
            `Верни строго JSON со структурой:
` +
            `{
` +
            `  "title": string,
` +
            `  "description": string,
` +
            `  "ingredients": string[],
` +
            `  "servingSize": string,
` +
            `  "steps": string[],
` +
            `  "calories": number,
` +
            `  "protein": number,
` +
            `  "fat": number,
` +
            `  "carbs": number,
` +
            `  "time": string,
` +
            `  "whyFitsGoal": string,
` +
            `  "variations": string[]
` +
            `}`
        }
      ],
      response_format: {
        type: 'json_object'
      }
    }
  };
}

function buildGenericRequest(mode: string, options: GenerateRecipeOptions = {}) {
  if (!AI_API_URL) {
    throw new Error('AI_API_URL is not configured.');
  }

  return {
    endpoint: AI_API_URL,
    body: {
      mode,
      goal: mapModeToGoal(mode),
      nonce: options.nonce ?? String(Date.now()),
      excludeTitle: options.excludeTitle ?? null,
      favoriteIngredients: options.favoriteIngredients ?? [],
      favoriteRecipe: options.favoriteRecipe ?? null,
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
              description: { type: 'string' },
              ingredients: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3
              },
              servingSize: { type: 'string' },
              steps: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 6
              },
              whyFitsGoal: { type: 'string' },
              variations: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
                maxItems: 2
              }
            },
            required: ['title', 'description', 'ingredients', 'servingSize', 'calories', 'protein', 'fat', 'carbs', 'time', 'steps', 'whyFitsGoal', 'variations'],
            additionalProperties: false
          }
        }
      }
    }
  };
}


function fallbackRecipe(mode: string): GeneratedRecipe {
  const labels: Record<string, string> = {
    'weight-loss': 'Легкий омлет со шпинатом',
    protein: 'Протеиновый тост с творогом',
    kids: 'Банановые мини-панкейки',
    quick: 'Йогурт-боул за 5 минут',
    random: 'Овсянка с орехами и ягодами'
  };

  return {
    title: labels[mode] ?? labels.random,
    calories: 360,
    protein: 24,
    fat: 14,
    carbs: 32,
    time: '8-10 минут',
    servingSize: '1 порция (~300 г)',
    ingredients: ['Яйца — 2 шт (100 г)', 'Творог — 80 г', 'Хлеб цельнозерновой — 60 г', 'Овощи — 80 г'],
    steps: [
      'Подготовь ингредиенты и разогрей сковороду или сотейник.',
      'Смешай основные ингредиенты до однородности.',
      'Готовь 5–7 минут на среднем огне, периодически помешивая.',
      'Подавай сразу, добавив топпинг по вкусу.'
    ]
  };
}

export async function generateRecipe(mode: string, options: GenerateRecipeOptions = {}): Promise<GeneratedRecipe> {
  if (!mode || typeof mode !== 'string') {
    throw new Error('Mode is required and must be a string.');
  }

  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured.');
  }

  const requestConfig = AI_PROVIDER === 'huggingface' ? buildHuggingFaceRequest(mode, options) : buildGenericRequest(mode, options);

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
    return fallbackRecipe(mode);
  }

  return recipe;
}
