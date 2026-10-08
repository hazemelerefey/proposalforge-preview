// POST { brief, plan, research } -> { content: markdown draft }
// Writer agent: drafts the full client-ready proposal.
import { callModel, MODELS, readJsonBody, sendError } from './_openrouter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { brief, plan, research } = await readJsonBody(req);
    if (!brief || typeof brief !== 'string' || brief.trim().length < 10) {
      return res.status(400).json({ error: 'A brief is required.' });
    }
    const content = await callModel(
      MODELS.writer,
      'You are the Writer agent. Write a complete, client-ready business proposal in Markdown from the brief, plan, and research. Structure: # title, then ## Executive Summary, ## Objectives, ## Approach, ## Timeline, ## Investment, ## Terms. Write in the client\'s domain language. Every figure and date must be justified from the brief. No placeholders, no lorem ipsum, no "TBD". Professional tone throughout.',
      `Client brief:\n${brief.trim()}\n\nPlan:\n${(plan || '').trim()}\n\nResearch:\n${(research || '').trim()}`
    );
    return res.status(200).json({ content });
  } catch (err) {
    return sendError(res, err);
  }
}
