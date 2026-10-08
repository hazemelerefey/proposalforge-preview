// Shared LLM helper for ProposalForge agent endpoints.
// Prefers Groq (free tier) when GROQ_API_KEY is set, falls back to OpenRouter.
// Files prefixed with _ are not treated as serverless functions by Vercel.

function getProvider() {
  if (process.env.GROQ_API_KEY) {
    return {
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      models: {
        planner: process.env.PLANNER_MODEL || 'openai/gpt-oss-20b',
        researcher: process.env.RESEARCHER_MODEL || 'openai/gpt-oss-20b',
        writer: process.env.WRITER_MODEL || 'openai/gpt-oss-120b',
        critic: process.env.CRITIC_MODEL || 'openai/gpt-oss-120b',
      },
    };
  }
  return {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_API_KEY,
    models: {
      planner: process.env.PLANNER_MODEL || 'anthropic/claude-haiku-4.5',
      researcher: process.env.RESEARCHER_MODEL || 'anthropic/claude-haiku-4.5',
      writer: process.env.WRITER_MODEL || 'anthropic/claude-sonnet-4.5',
      critic: process.env.CRITIC_MODEL || 'anthropic/claude-sonnet-4.5',
    },
  };
}

export async function callModel(model, system, user) {
  const provider = getProvider();
  if (!provider.key) {
    const err = new Error('No LLM API key configured');
    err.statusCode = 500;
    throw err;
  }
  const headers = {
    'Authorization': `Bearer ${provider.key}`,
    'Content-Type': 'application/json',
  };
  if (provider.name === 'openrouter') {
    headers['HTTP-Referer'] = 'https://proposalforge-preview.vercel.app';
    headers['X-Title'] = 'ProposalForge';
  }
  const res = await fetch(provider.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const err = new Error(`Model call failed with status ${res.status}`);
    err.statusCode = 502;
    throw err;
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error('Empty response from model');
    err.statusCode = 502;
    throw err;
  }
  return content.trim();
}

export function getModels() {
  return getProvider().models;
}

// Backwards-compatible export; resolved per-request via getModels().
export const MODELS = new Proxy({}, {
  get: (_, prop) => getModels()[prop],
});

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })); }
    });
    req.on('error', reject);
  });
}

export function sendError(res, err) {
  const status = err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Agent run failed. Please try again.' : err.message });
}
