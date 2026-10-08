// POST { brief, plan } -> { content: research }
// Researcher agent: gathers facts, assumptions, risks, commercial considerations.
import { callModel, MODELS, readJsonBody, sendError } from './_openrouter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { brief, plan } = await readJsonBody(req);
    if (!brief || typeof brief !== 'string' || brief.trim().length < 10) {
      return res.status(400).json({ error: 'A brief is required.' });
    }
    const content = await callModel(
      MODELS.researcher,
      'You are the Researcher agent in a proposal-writing team. Given the client brief and the plan, list the key facts, assumptions, risks, and commercial considerations the writer must address. Use the brief\'s own vocabulary and stay grounded in what was actually stated. Concise bullet-style prose, no invented statistics.',
      `Client brief:\n${brief.trim()}\n\nPlan:\n${(plan || '').trim()}`
    );
    return res.status(200).json({ content });
  } catch (err) {
    return sendError(res, err);
  }
}
