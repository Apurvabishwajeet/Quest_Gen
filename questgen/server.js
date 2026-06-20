require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ── GENERATE PLAN ENDPOINT ──
app.post('/api/generate', async (req, res) => {
  const { name, goal, focus, level, weeks, hours, style, constraint } = req.body;

  if (!goal || !weeks) {
    return res.status(400).json({ error: 'Missing required fields: goal and weeks.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured.' });
  }

  const totalDays = parseInt(weeks) * 7;

  // Parse goals — frontend sends multiple goals joined by " | "
  const goalsArr = goal ? goal.split(' | ').map(g => g.trim()).filter(Boolean) : [];
  const hasMultiGoals = goalsArr.length > 1;

  const categoryInstruction = hasMultiGoals
    ? 'The user has ' + goalsArr.length + ' distinct goals. Use EXACTLY these as your category names (you may shorten each to a few words, but keep them distinct and recognizable):\n'
      + goalsArr.map((g, i) => 'Category ' + (i + 1) + ': "' + g.slice(0, 50) + '"').join('\n')
      + '\nEach day should have ONE primary category (the one taking the most time/focus that day), but the day\'s tasks can naturally blend in work toward other goals too. Distribute days across categories based on what each goal realistically needs — you decide the split.'
    : 'Pick up to 4 short category names that fit the goal — be consistent across all days.';

  const prompt = `You are a personal coach. Create a day-by-day quest plan for someone with these details:

Name: ${name || 'User'}
Goal: ${goalsArr.length ? goalsArr.join(', ') : goal}
Focus areas: ${focus || 'General'}
Current level: ${level || 'intermediate'}
Duration: ${weeks} weeks (${totalDays} days)
Hours per day: ${hours || 3}
Plan style: ${style || 'balanced'}
Constraints: ${constraint || 'None'}

${categoryInstruction}

Return ONLY a valid JSON array (no markdown, no explanation, just raw JSON) with exactly ${totalDays} objects.
Each object must have:
- "title": string (short day title, max 8 words)
- "tasks": string (2-3 specific actionable tasks for the day, separated by ". ")
- "category": string (one of the defined categories above — exact match required for consistency across days)
- "isReview": boolean (true for every 7th day)
- "xp": number (50 for review days, 75 or 100 for regular days)

Make the plan progressive: easier in week 1, harder in later weeks. Include review days every 7th day. Be specific and actionable.

Return raw JSON array only. No text before or after.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      return res.status(502).json({ error: err.error?.message || 'Gemini API error' });
    }

    const data = await geminiRes.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

    let days;
    try {
      days = JSON.parse(raw);
    } catch (e) {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) days = JSON.parse(match[0]);
      else return res.status(502).json({ error: 'Could not parse AI response. Please try again.' });
    }

    if (!Array.isArray(days) || days.length === 0) {
      return res.status(502).json({ error: 'AI returned an empty plan. Please try again.' });
    }

    res.json({ days });

  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'gemini-2.5-flash-lite' });
});

// ── SERVE FRONTEND ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`QuestGen server running on http://localhost:${PORT}`);
});