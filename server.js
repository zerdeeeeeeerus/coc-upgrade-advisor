require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Load ID mappings
const idMappings = JSON.parse(fs.readFileSync(path.join(__dirname, 'ids.json'), 'utf-8'));

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Translate numeric IDs to readable names
function translateIds(data) {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => translateIds(item));
  }

  const translated = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      translated[key] = translateIds(value);
    } else {
      translated[key] = value;
    }
  }

  // Translate known ID fields - game export uses "data" field, some formats use "id"
  const idField = translated.data !== undefined ? 'data' : (translated.id !== undefined ? 'id' : null);
  if (idField) {
    const idStr = String(translated[idField]);
    const name = findName(idStr);
    if (name) {
      translated.name = name;
    }
    // Mark items with a timer as [UPGRADING]
    if (translated.timer !== undefined) {
      translated.status = '[UPGRADING]';
    }
  }

  return translated;
}

function findName(idStr) {
  for (const category of Object.values(idMappings)) {
    if (category[idStr]) {
      return category[idStr];
    }
  }
  return null;
}

// System prompt for Gemini
const SYSTEM_PROMPT = `You are a Clash of Clans upgrade advisor. You analyze village data and suggest optimal upgrades.

RULES:
1. Only suggest items that are present IN the provided data. Never invent or guess items.
2. Only suggest upgrading to the NEXT level (+1 from current level). Never suggest skipping levels.
3. Skip any item marked as [UPGRADING] - it is already being upgraded.
4. For TH15 and above: suggest upgrading 2 heroes at the same time, because only 4 out of 6 heroes are used in battle, so 2 can always be upgrading.
5. Laboratory can only upgrade 1 troop/spell at a time.
6. Pet House can only upgrade 1 pet at a time.
7. Do NOT guess or assume max levels. Only work with the data provided.
8. Consider the player's play style, builder count, and priority when making suggestions.
9. Format your response clearly with categories (Heroes, Pets, Buildings, Troops, Spells, etc.)
10. Explain WHY each upgrade is recommended based on the player's stated preferences.`;

app.post('/api/advisor', async (req, res) => {
  try {
    const { villageData, playStyle, builderCount, priority, notes } = req.body;

    if (!villageData) {
      return res.status(400).json({ error: 'Village data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    // Translate numeric IDs to names
    const translatedData = translateIds(villageData);

    // Build user prompt
    let userPrompt = `Here is my Clash of Clans village data (translated from game export):\n\n`;
    userPrompt += JSON.stringify(translatedData, null, 2);
    userPrompt += `\n\nPlay Style: ${playStyle || 'balanced'}`;
    userPrompt += `\nAvailable Builders: ${builderCount || 5}`;
    userPrompt += `\nPriority: ${priority || 'efficiency'}`;
    if (notes) {
      userPrompt += `\nAdditional Notes: ${notes}`;
    }
    userPrompt += `\n\nBased on this data and my preferences, what should I upgrade next? Assign each builder a task.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    res.json({ suggestion: text });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to get AI suggestion' });
  }
});

app.listen(PORT, () => {
  console.log(`CoC Upgrade Advisor server running on port ${PORT}`);
});
