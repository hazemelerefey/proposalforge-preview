// Shared OpenRouter helper for ProposalForge agent endpoints.
// Files prefixed with _ are not treated as serverless functions by Vercel.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callModel(model, system, user) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const err = new Error('OPENROUTER_API_KEY is not configured');
    err.statusCode = 500;
    throw err;
  }
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://proposalforge-preview.vercel.app',
      'X-Title': 'ProposalForge',
    },
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

export const MODELS = {
  planner: process.env.PLANNER_MODEL || 'anthropic/claude-haiku-4.5',
  researcher: process.env.RESEARCHER_MODEL || 'anthropic/claude-haiku-4.5',
  writer: process.env.WRITER_MODEL || 'anthropic/claude-sonnet-4.5',
  critic: process.env.CRITIC_MODEL || 'anthropic/claude-sonnet-4.5',
};

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
