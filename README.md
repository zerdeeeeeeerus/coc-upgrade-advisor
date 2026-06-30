# CoC Upgrade Advisor

An AI-powered Clash of Clans upgrade advisor that analyzes your village data and suggests optimal upgrades using Google Gemini AI.

## Features

- **AI-Powered Suggestions**: Uses Google Gemini to analyze your village and recommend upgrades
- **Multi-Account Support**: Save and load multiple village configurations via localStorage
- **Smart ID Translation**: Translates raw game JSON (numeric IDs) to readable names
- **Customizable Preferences**: Set play style, builder count, and upgrade priority
- **Village Preview**: See heroes, pets, and TH level at a glance when data is pasted
- **Dark Theme**: CoC-themed UI with gold accents

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/zerdeeeeeeerus/coc-upgrade-advisor.git
   cd coc-upgrade-advisor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Add your Google Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your-actual-api-key
   PORT=3000
   ```

5. Start the server:
   ```bash
   npm start
   ```

6. Open `http://localhost:3000` in your browser.

## How It Works

1. Export your village data as JSON from the game
2. Paste the JSON into the text area
3. Select your play style, available builders, and priority
4. Click "Get Upgrade Advice"
5. The server translates numeric IDs (e.g., `28000000` → `Barbarian King`) and sends the readable data to Gemini AI
6. AI responds with personalized upgrade suggestions

## AI Rules

The AI follows strict rules:
- Only suggests items present in your data
- Only recommends +1 level upgrades
- Skips items already upgrading
- For TH15+: suggests 2 heroes upgrading simultaneously (only 4 of 6 used in battle)
- Lab upgrades 1 troop/spell at a time
- Pet House upgrades 1 pet at a time
- Never guesses max levels

## Tech Stack

- **Backend**: Node.js, Express
- **AI**: Google Gemini (@google/genai)
- **Frontend**: Vanilla HTML/CSS/JS
- **Storage**: localStorage for saved accounts

## License

MIT
