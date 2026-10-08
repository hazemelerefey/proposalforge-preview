// POST { brief, draft } -> { content, score, verdict, notes }
// Critic agent: senior-partner review with score and section-referenced notes.
import { callModel, MODELS, readJsonBody, sendError } from './_openrouter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { brief, draft } = await readJsonBody(req);
    if (!draft || typeof draft !== 'string' || draft.trim().length < 50) {
      return res.status(400).json({ error: 'A draft is required for review.' });
    }
    const content = await callModel(
      MODELS.critic,
      'You are the Critic, a senior partner reviewing a proposal draft before it goes to the client. Score it 0-100 and give specific notes that reference actual sections. Reply in EXACTLY this format:\nSCORE: <number 0-100>\nVERDICT: PASS or REVISE\nNOTES:\n- <note referencing a specific section>\n- <another note>\nBe demanding but fair. PASS only if the draft is genuinely client-ready.',
      `Client brief:\n${(brief || '').trim()}\n\nDraft:\n${draft.trim()}`
    );
    const scoreMatch = content.match(/SCORE:\s*(\d{1,3})/i);
    const verdictMatch = content.match(/VERDICT:\s*(PASS|REVISE)/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 70;
    const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : (score >= 80 ? 'PASS' : 'REVISE');
    const notesMatch = content.match(/NOTES:\s*([\s\S]*)$/i);
    const notes = notesMatch ? notesMatch[1].trim() : '';
    return res.status(200).json({ content, score, verdict, notes });
  } catch (err) {
    return sendError(res, err);
  }
}
