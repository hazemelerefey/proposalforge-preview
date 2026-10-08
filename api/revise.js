// POST { draft, notes } -> { content: revised markdown draft }
// Writer agent, revision pass: addresses the critic's notes.
import { callModel, MODELS, readJsonBody, sendError } from './_openrouter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { draft, notes } = await readJsonBody(req);
    if (!draft || typeof draft !== 'string' || draft.trim().length < 50) {
      return res.status(400).json({ error: 'A draft is required.' });
    }
    const content = await callModel(
      MODELS.writer,
      'You are the Writer agent. Revise the proposal draft below, addressing every point in the critic\'s notes. Return the FULL revised proposal in Markdown with the same six-section structure. No placeholders.',
      `Critic's notes:\n${(notes || '').trim()}\n\nCurrent draft:\n${draft.trim()}`
    );
    return res.status(200).json({ content });
  } catch (err) {
    return sendError(res, err);
  }
}
