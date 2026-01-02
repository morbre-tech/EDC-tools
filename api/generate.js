import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting storage (in-memory for serverless)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 time
const MAX_REQUESTS_PER_WINDOW = 10;

// Input validation constants
const MAX_PROMPT_LENGTH = 2000;
const ALLOWED_ENVIRONMENTS = ['On-premises', 'M365 / Exchange Online', 'Hybrid'];

// Logging helper
function logRequest(ip, status, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    ip,
    status,
    ...details
  }));
}

export default async function handler(req, res) {
  // CORS headers - kun tillad samme origin
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get client IP
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] ||
                   req.headers['x-real-ip'] ||
                   req.socket.remoteAddress ||
                   'unknown';

  // Rate limiting check
  const now = Date.now();
  const clientRateData = rateLimitMap.get(clientIP) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - clientRateData.windowStart > RATE_LIMIT_WINDOW) {
    clientRateData.count = 0;
    clientRateData.windowStart = now;
  }

  if (clientRateData.count >= MAX_REQUESTS_PER_WINDOW) {
    logRequest(clientIP, 'RATE_LIMITED', {
      requests: clientRateData.count,
      window: RATE_LIMIT_WINDOW
    });
    return res.status(429).json({
      error: 'For mange anmodninger. Prøv igen om en time.',
      retryAfter: Math.ceil((clientRateData.windowStart + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }

  // Increment rate limit counter
  clientRateData.count++;
  rateLimitMap.set(clientIP, clientRateData);

  try {
    const { prompt, environment, options } = req.body;

    // Input validation - prompt
    if (!prompt || prompt.trim().length === 0) {
      logRequest(clientIP, 'VALIDATION_ERROR', { reason: 'empty_prompt' });
      return res.status(400).json({ error: 'Opgavebeskrivelse er påkrævet' });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      logRequest(clientIP, 'VALIDATION_ERROR', {
        reason: 'prompt_too_long',
        length: prompt.length,
        max: MAX_PROMPT_LENGTH
      });
      return res.status(400).json({
        error: `Opgavebeskrivelse er for lang. Max ${MAX_PROMPT_LENGTH} tegn.`
      });
    }

    // Input validation - environment
    if (!ALLOWED_ENVIRONMENTS.includes(environment)) {
      logRequest(clientIP, 'VALIDATION_ERROR', {
        reason: 'invalid_environment',
        provided: environment
      });
      return res.status(400).json({ error: 'Ugyldigt miljø valgt' });
    }

    // Input validation - options
    if (!options || typeof options !== 'object') {
      logRequest(clientIP, 'VALIDATION_ERROR', { reason: 'missing_options' });
      return res.status(400).json({ error: 'Manglende script-indstillinger' });
    }

    // Build options string
    const optionsList = [];
    if (options.whatIf) optionsList.push('-WhatIf og -Confirm support');
    if (options.logging) optionsList.push('Logging til fil');
    if (options.validation) optionsList.push('Parameter-validering');
    if (options.tryCatch) optionsList.push('Try/Catch fejlhåndtering');

    const systemPrompt = `Du er en erfaren PowerShell-ekspert der genererer produktionsklare scripts til enterprise-miljøer.

MILJØ: ${environment}

KRAV TIL SCRIPTET:
${optionsList.map(o => `- ${o}`).join('\n')}

REGLER:
1. Brug kun approved PowerShell verbs (Get-, Set-, New-, Remove-, Start-, Stop-, etc.)
2. Inkludér #Requires statement med nødvendige moduler
3. Tilføj comment-based help (.SYNOPSIS, .DESCRIPTION, .PARAMETER, .EXAMPLE)
4. Brug [CmdletBinding()] for advanced function features
5. Implementér proper error handling med try/catch
6. Brug Write-Verbose for debugging output
7. Valider alle input parametre
8. Brug meaningful variable navne
9. Tilføj kommentarer der forklarer kompleks logik
10. Følg PowerShell best practices og style guide

${environment === 'M365 / Exchange Online' ? `
M365 SPECIFIKKE KRAV:
- Brug Microsoft Graph PowerShell SDK hvor muligt
- Inkludér Connect-MgGraph med passende scopes
- Håndter authentication og token refresh
` : ''}

${environment === 'Hybrid' ? `
HYBRID SPECIFIKKE KRAV:
- Håndter både on-premises og cloud ressourcer
- Inkludér logik til at detektere miljø
- Brug passende cmdlets for hvert miljø
` : ''}

OUTPUT FORMAT:
Returnér KUN PowerShell koden uden markdown code blocks eller anden formatering.
Start direkte med <# comment-based help eller #Requires statement.`;

    const userPrompt = `Generer et PowerShell script til følgende opgave:

${prompt}

Husk at inkludere alle de specificerede features og følge best practices.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const script = completion.choices[0]?.message?.content || '';

    // Generate explanation
    const explanationCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du er en PowerShell-ekspert. Forklar kort (3-5 punkter) hvad scriptet gør. Svar på dansk.'
        },
        {
          role: 'user',
          content: `Forklar kort hvad dette script gør:\n\n${script}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const explanation = explanationCompletion.choices[0]?.message?.content || '';

    // Log successful generation
    logRequest(clientIP, 'SUCCESS', {
      promptLength: prompt.length,
      environment,
      scriptLength: script.length,
      model: 'gpt-4'
    });

    return res.status(200).json({
      script,
      explanation,
      model: 'gpt-4',
      environment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    logRequest(clientIP, 'ERROR', {
      errorCode: error.code,
      errorMessage: error.message
    });

    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'API kvote opbrugt. Prøv igen senere.' });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Ugyldig API nøgle.' });
    }

    return res.status(500).json({
      error: 'Kunne ikke generere script. Prøv igen.',
      details: error.message
    });
  }
}
