import axios from 'axios';

/**
 * Sends a system instruction and user prompt to Groq (primary), Gemini, or OpenAI (fallbacks).
 * Groq is free with no card required — ideal for development and personal use.
 */
export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // ── 1. Groq (free, no card required) ──────────────────────────────────────
  if (groqKey) {
    try {
      console.log('🤖 Invoking Groq API (llama-3.3-70b-versatile)...');
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`
          },
          timeout: 15000
        }
      );

      const text = response.data?.choices?.[0]?.message?.content;
      if (text?.trim()) return text.trim();
    } catch (err: any) {
      console.warn('⚠️ Groq API call failed. Trying next provider.', err?.response?.data || err.message);
    }
  } else {
    console.log('ℹ️ GROQ_API_KEY not set. Skipping Groq.');
  }

  // ── 2. Gemini (fallback) ───────────────────────────────────────────────────
  if (geminiKey) {
    try {
      console.log('🤖 Invoking Gemini API (gemini-2.0-flash)...');
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text?.trim()) return text.trim();
    } catch (err: any) {
      console.warn('⚠️ Gemini API call failed. Trying next provider.', err?.response?.data || err.message);
    }
  } else {
    console.log('ℹ️ GEMINI_API_KEY not set. Skipping Gemini.');
  }

  // ── 3. OpenAI (last resort) ────────────────────────────────────────────────
  if (openaiKey) {
    try {
      console.log('🤖 Invoking OpenAI API (gpt-4o-mini)...');
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`
          },
          timeout: 15000
        }
      );

      const text = response.data?.choices?.[0]?.message?.content;
      if (text?.trim()) return text.trim();
    } catch (err: any) {
      console.warn('⚠️ OpenAI API call failed.', err?.response?.data || err.message);
    }
  } else {
    console.log('ℹ️ OPENAI_API_KEY not set. Skipping OpenAI.');
  }

  throw new Error('All configured LLM providers failed or no API keys were set.');
}
