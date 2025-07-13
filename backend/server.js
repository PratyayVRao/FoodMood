import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Helper to call OpenRouter AI Chat API
async function callOpenRouter(messages, maxTokens = 300, temperature = 0.5) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim();
}

// Utility: strip markdown-like formatting
function cleanFormatting(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/##+\s?(.*)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// POST /analyze: returns organ scores
app.post('/analyze', async (req, res) => {
  try {
    const { food, condition } = req.body;
    if (!food) return res.status(400).json({ error: 'No food provided' });

    const prompt = `
Is "${food}" a real and recognized food item? Respond only "Yes" or "No".
    `.trim();

    const validationResponse = await callOpenRouter([{ role: 'user', content: prompt }], 10);
    if (!/yes/i.test(validationResponse)) {
      return res.status(400).json({ error: 'Unrecognized food item. Please enter a real food.' });
    }

    const scorePrompt = `
For someone with ${condition || 'no specific health conditions'}, rate the impact of the food "${food}" on each human organ using a numeric scale from 0 to 100:
- 0 = very healthy for the organ
- 50 = neutral
- 100 = very harmful to the organ

Output only a JSON object in this format:
{
  "Heart": 70,
  "Liver": 40,
  "Pancreas": 90,
  ...
}

Include values for the following organs: Heart, Liver, Lungs, Stomach, Pancreas, Intestines, SmallIntestine, LargeIntestine, Spleen, Brain, Thymus, Thyroid, UrinarySystem, MaleReproductiveSystem, FemaleReproductiveSystem.
Do not include any text, explanation, or formatting—only JSON.
    `.trim();

    const aiText = await callOpenRouter([{ role: 'user', content: scorePrompt }]);
    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response JSON', raw: aiText });
    }

    res.json(parsed);

  } catch (error) {
    console.error('Error in /analyze:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /organ-explanation
app.post('/organ-explanation', async (req, res) => {
  try {
    const { food, organ, condition } = req.body;
    if (!food || !organ) return res.status(400).json({ error: 'Missing food or organ' });

    const prompt = `
In simple, friendly, and medically grounded terms, explain how the food "${food}" affects the human organ "${organ}" in someone with ${condition || 'no specific health conditions'}.
Then recommend 2–3 specific foods that could help balance out the effects of eating "${food}" regularly.

Do not use markdown, asterisks (**), bold, italics, or special formatting.
Limit your answer to 200 words.
    `.trim();

    const raw = await callOpenRouter([{ role: 'user', content: prompt }], 300, 0.7);
    const cleaned = cleanFormatting(raw);
    res.json({ explanation: cleaned });

  } catch (error) {
    console.error('Error in /organ-explanation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /chat
app.post('/chat', async (req, res) => {
  try {
    const { prompt, condition } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const instruction = `
You are a friendly, medically informed assistant. The user may have ${condition || 'no health condition'}.
Answer the user's question clearly and informatively.
Avoid markdown or formatting characters like **, _, or ##.
Limit your answer to 200 words.
    `.trim();

    const messages = [
      { role: 'system', content: instruction },
      { role: 'user', content: prompt }
    ];

    const raw = await callOpenRouter(messages, 350, 0.8);
    const cleaned = cleanFormatting(raw);
    res.json({ response: cleaned });

  } catch (error) {
    console.error('Error in /chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('✅ FoodMood Backend API is running!');
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
