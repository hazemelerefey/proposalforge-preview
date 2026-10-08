// POST { brief } -> { content: plan }
// Planner agent: structures the client brief into a proposal plan.
import { callModel, MODELS, readJsonBody, sendError } from './_openrouter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { brief } = await readJsonBody(req);
    if (!brief || typeof brief !== 'string' || brief.trim().length < 10) {
      return res.status(400).json({ error: 'A brief of at least 10 characters is required.' });
    }
    const content = await callModel(
      MODELS.planner,
      'You are the Planner agent in a proposal-writing team. Given a client brief, produce a structured plan with: objectives (3-5), six proposal sections each with a one-line description, key constraints, and success criteria. Use the brief\'s own vocabulary. Concise, professional, no fluff.',
      `Client brief:\n${brief.trim()}`
    );
    return res.status(200).json({ content });
  } catch (err) {
    return sendError(res, err);
  }
}
