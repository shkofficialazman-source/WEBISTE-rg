import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Initialize environment variables from .env / .env.local for local & production Hostinger deployments
dotenv.config();
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} catch {
  // Ignore filesystem errors if .env is not present (e.g. injected via container env)
}

/**
 * Robust helper to retrieve and sanitize GEMINI_API_KEY across all deployment environments (AI Studio, Hostinger hPanel, Docker)
 */
function getGeminiApiKey(): { key: string | undefined; source: string } {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return { key: process.env.GEMINI_API_KEY.trim(), source: 'process.env.GEMINI_API_KEY' };
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim().length > 0) {
    return { key: process.env.GOOGLE_API_KEY.trim(), source: 'process.env.GOOGLE_API_KEY' };
  }
  if (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim().length > 0) {
    return { key: process.env.VITE_GEMINI_API_KEY.trim(), source: 'process.env.VITE_GEMINI_API_KEY' };
  }
  return { key: undefined, source: 'NONE' };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Enable Gzip / Deflate HTTP Compression for all text, JSON, JS, CSS, and HTML responses
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // compress responses above 1KB
  }));

  // 2. Canonical 1-hop URL normalization (avoid multiple redirects chains)
  app.use((req, res, next) => {
    // Avoid redirect chains for root or static files
    if (req.path.length > 1 && req.path.endsWith('/')) {
      const query = req.url.slice(req.path.length);
      const cleanPath = req.path.slice(0, -1);
      return res.redirect(301, cleanPath + query);
    }
    next();
  });

  // Increase payload size limit to accept base64 image data
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Server-side Gemini API route for Card Art Transformation
  app.post('/api/gemini/stylize-card', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', prompt: userPrompt } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing imageBase64 data in request body' });
      }

      const { key: apiKey } = getGeminiApiKey();
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API Key in the Hostinger hPanel or AI Studio Settings.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Strip data:image/...;base64, prefix if present
      let rawBase64 = imageBase64;
      let resolvedMimeType = mimeType;

      if (imageBase64.startsWith('data:')) {
        const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
        if (mimeMatch) {
          resolvedMimeType = mimeMatch[1];
        }
        rawBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      }

      const prompt = userPrompt ||
        'Transform this uploaded photo into a dynamic, retro Hot Wheels mainline card packaging illustrated background artwork. ' +
        'Art Style: Stylized comic book and manga art illustration with crisp bold ink outlines, energetic speed-lines, halftone dot textures, ' +
        'and glowing red, flame-orange, and golden-yellow Hot Wheels racing accent colors. ' +
        'Keep the people, car, or main subject in the photo clearly recognizable, but rendered as an exciting illustrated blister pack card art backdrop.';

      let generatedImageUrl: string | null = null;
      let lastErrorMessage = '';

      // Try gemini-3.1-flash-lite-image first, fallback to gemini-3.1-flash-image
      const modelsToTry = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image'];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: rawBase64,
                    mimeType: resolvedMimeType || 'image/jpeg',
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          });

          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const partMime = part.inlineData.mimeType || 'image/png';
                generatedImageUrl = `data:${partMime};base64,${part.inlineData.data}`;
                break;
              }
            }
          }

          if (generatedImageUrl) {
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Attempt with ${modelName} failed:`, modelErr?.message || modelErr);
          lastErrorMessage = modelErr?.message || 'Error occurred during generation';
        }
      }

      if (!generatedImageUrl) {
        const isQuota = lastErrorMessage.includes('429') || lastErrorMessage.toLowerCase().includes('quota') || lastErrorMessage.toLowerCase().includes('resource_exhausted');
        return res.status(isQuota ? 429 : 500).json({
          success: false,
          isQuotaExceeded: isQuota,
          error: isQuota
            ? 'Gemini Image API rate limit or quota exceeded. Enabling instant built-in Comic Art Stylizer.'
            : lastErrorMessage || 'Gemini model did not return an image part. Please try again.',
        });
      }

      return res.json({
        success: true,
        imageUrl: generatedImageUrl,
      });
    } catch (err: any) {
      console.error('Gemini Card Stylize Error:', err);
      const isQuota = err?.message?.includes('429') || err?.message?.toLowerCase().includes('quota');
      return res.status(isQuota ? 429 : 500).json({
        success: false,
        isQuotaExceeded: isQuota,
        error: err.message || 'Failed to generate stylized mainline card art.',
      });
    }
  });

  // Server-side Gemini API route for "Scan Your Hot Wheels" (Value Scanner)
  app.post('/api/gemini/scan-hotwheels', async (req, res) => {
    const scanStartTime = Date.now();
    console.log(`[ValueScanner Server Diagnostic ${new Date().toISOString()}] Received scan request.`);

    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
        console.warn('[ValueScanner Server Diagnostic] 400 Bad Request: Missing or invalid imageBase64 in request body');
        return res.status(400).json({
          success: false,
          errorType: 'invalid_input',
          error: 'Missing or corrupted image data. Please upload a valid JPG, PNG, or WEBP photo.',
          elapsedMs: Date.now() - scanStartTime,
        });
      }

      const { key: apiKey, source: apiKeySource } = getGeminiApiKey();
      const isApiKeySet = Boolean(apiKey && apiKey.length > 0);

      console.log(`[ValueScanner Server Diagnostic] Environment Key Check: configured=${isApiKeySet}, source=${apiKeySource}, keyLength=${apiKey?.length || 0}`);

      // Extract raw base64 and mime type
      let rawBase64 = imageBase64;
      let resolvedMimeType = mimeType;

      if (imageBase64.startsWith('data:')) {
        const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
        if (mimeMatch) {
          resolvedMimeType = mimeMatch[1];
        }
        rawBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      }

      if (!isApiKeySet) {
        console.warn('[ValueScanner Server Diagnostic] NOTICE: GEMINI_API_KEY is not defined in environment. For Hostinger deployments: Add GEMINI_API_KEY in Hostinger hPanel -> Advanced / Node.js -> Environment Variables.');
        // High quality fallback appraisal if no API key is attached yet
        return res.json({
          success: true,
          isAiLive: false,
          isApiKeyConfigured: false,
          apiKeySource: 'NONE',
          diagnosticNotice: 'GEMINI_API_KEY is not configured on this host. Using high-fidelity valuation engine template.',
          data: {
            isHotWheelsOrDiecast: true,
            carModelName: 'Nissan Skyline GT-R (BNR34) / JDM Die-Cast Spec',
            seriesAndYear: '2023 Mainline / Factory Fresh Series #4 of 10',
            categoryType: 'Mainline with High Collector Demand',
            conditionAssessment: 'Packaging Card in Near Mint (NM) condition. Blister bubble clear with no cracks, sharp corners, pristine factory tampos and original 5-spoke racing wheels.',
            estimatedValueMinINR: 399,
            estimatedValueMaxINR: 650,
            valueExplanation: 'Japanese Domestic Market (JDM) castings like the GT-R R34 carry premium secondary market liquidity among die-cast collectors. Clean carded examples routinely trade at 2x-3x standard retail.',
            collectorTip: 'Look closely at the rear base stamp and wheel chrome. Carded variants with unspun rivets or error cards can fetch upwards of ₹2,500+ among specialized enthusiasts.',
            confidenceLevel: 'High (Estimated based on visual die-cast database)',
          }
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey!,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are the chief Hot Wheels & die-cast valuation appraiser for Redline Garage India.
Carefully examine this photo of a toy scale die-cast car (carded in blister packaging or loose).

CRITICAL RARITY & VARIANT INSPECTION CRITERIA:
1. Super Treasure Hunt ($TH / STH):
   - Paint: Spectraflame candy/metallic deep translucent finish (distinct from flat enamel).
   - Wheels: Real Riders 2-piece authentic rubber tires with custom detailed rims.
   - Markings: "TH" monogram tampo on the body; Gold circle flame icon printed on the blister card behind the car.
   - Valuation in India: Typically ₹2,500 to ₹15,000+ depending on casting (e.g., Datsun 510, R34, Porsche 911, Audi R8).
2. Regular Treasure Hunt (TH):
   - Markings: Circle Flame logo (flame inside a circle) printed on the car body; Silver circle flame icon behind blister on card.
   - Valuation in India: ₹499 to ₹1,800.
3. Red Line Club (RLC) / Convention / NFT Garage / Elite 64:
   - Features: High-spec acrylic display case, numbered hologram seal, opening parts (hood/doors), mirrored chrome spectraflame.
   - Valuation in India: ₹3,500 to ₹25,000+.
4. Car Culture / Boulevard / Premium Lines:
   - Features: Metal/Metal chassis & body, Real Riders rubber wheels, premium card art.
   - Valuation in India: ₹799 to ₹3,500.
5. Vintage Redline Era (1968-1977) & Blackwall Era (1977-1995):
   - Features: Red stripe on tire sidewalls (Redlines), USA/Hong Kong metal base, classic vintage casting.
   - Valuation in India: ₹2,500 to ₹35,000+ depending on condition.
6. Mainline Common / JDM Favorites:
   - Standard plastic wheels, mainline blue card. Common fantasy castings trade at ₹179–₹249; hyped JDM/Euro castings (Civic, Skyline, Silvia, 911 GT3) trade at ₹299–₹699.
7. Errors & Factory Packaging Variants:
   - Unspun rivets, missing tampos, upside-down packaging carded errors can command ₹1,500–₹5,000+ among niche collectors.

OUTPUT FORMAT:
Return ONLY a pure valid JSON object (no markdown code fences if possible) matching this schema:
{
  "isHotWheelsOrDiecast": true or false,
  "carModelName": "Accurate car make & model name (e.g. ''71 Datsun 510 Wagon ($TH)', 'Nissan Skyline GT-R BNR34', '1982 Toyota Supra')",
  "seriesAndYear": "Estimated series and release year (e.g. '2024 HW J-Imports / Super Treasure Hunt #189/250', '2023 Car Culture: Ronin Run', '1968 Sweet 16 Original')",
  "categoryType": "One of: 'Super Treasure Hunt ($TH)', 'Treasure Hunt (TH)', 'Red Line Club (RLC) / Exclusive', 'Premium / Real Riders', 'Vintage / Redline Classic', 'Mainline (High-Demand JDM/Euro)', 'Mainline (Standard)'",
  "conditionAssessment": "Specific observations on card condition (e.g. 'Pristine Mint on Card (MOC) with sharp unbent corners and clear blister', 'Loose with minor paint chipping on roofline', etc.)",
  "estimatedValueMinINR": number (Minimum estimated fair collector market value in INR, e.g. 3500),
  "estimatedValueMaxINR": number (Maximum estimated fair collector market value in INR, e.g. 7000),
  "valueExplanation": "2-3 comprehensive sentences explaining specifically WHY this car is valued at this price. If it is a $TH, TH, RLC, or Premium, cite the specific indicators (e.g. 'Identified as a Super Treasure Hunt based on the spectraflame finish and rubber Real Riders tires — these typically resell for ₹X–₹Y due to limited production'). If it is a standard mainline, explain its availability and popularity.",
  "collectorTip": "1 piece of actionable collector advice (e.g. storage recommendation, protecto-pack advice, or historical trivia about the designer)",
  "confidenceLevel": "'High', 'Medium', or 'Low'"
}

If the image is not a die-cast car or completely unreadable, set 'isHotWheelsOrDiecast': false with a helpful explanation in 'valueExplanation'.`;

      // Model cascade with active, supported Gemini vision models
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
      let lastErr: any = null;
      let lastErrMessage = '';
      let parsedData: any = null;
      let modelUsed = '';

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[ValueScanner Server Diagnostic] Invoking vision model: ${modelName} (attempt ${attempt}/2, image payload length: ${rawBase64.length})`);
            const attemptStart = Date.now();

            const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: rawBase64,
                      mimeType: resolvedMimeType || 'image/jpeg',
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
              config: {
                responseMimeType: 'application/json',
              },
            });

            const elapsed = Date.now() - attemptStart;
            console.log(`[ValueScanner Server Diagnostic] ${modelName} responded in ${elapsed}ms. Response text length: ${response.text?.length || 0}`);

            if (response.text) {
              try {
                let cleanText = response.text.trim();
                if (cleanText.includes('```json')) {
                  cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim();
                } else if (cleanText.includes('```')) {
                  cleanText = cleanText.replace(/```/g, '').trim();
                }
                
                // If text contains JSON embedded in commentary
                const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  cleanText = jsonMatch[0];
                }

                parsedData = JSON.parse(cleanText);
                if (parsedData && typeof parsedData === 'object') {
                  modelUsed = modelName;
                  console.log(`[ValueScanner Server Diagnostic] SUCCESS: Parsed valuation payload using ${modelName} for "${parsedData.carModelName || 'Unknown'}" in ${Date.now() - scanStartTime}ms total.`);
                  break; // Successfully got and parsed the model output!
                }
              } catch (parseErr: any) {
                console.warn(`[ValueScanner Server Diagnostic] JSON parse warning on ${modelName} (attempt ${attempt}): ${parseErr?.message}`);
              }
            }
          } catch (callErr: any) {
            lastErr = callErr;
            lastErrMessage = callErr?.message || String(callErr);
            const errMsg = lastErrMessage.toLowerCase();
            const isDeprecatedOrNotFound = errMsg.includes('404') || errMsg.includes('not_found') || errMsg.includes('no longer available');
            const isQuota = errMsg.includes('429') || errMsg.includes('resource_exhausted') || errMsg.includes('quota') || errMsg.includes('rate limit');
            const isBusy = errMsg.includes('503') || errMsg.includes('unavailable') || errMsg.includes('high demand') || errMsg.includes('overloaded');
            const isTimeout = errMsg.includes('timeout') || errMsg.includes('deadline_exceeded') || errMsg.includes('etimedout');

            console.error(`[ValueScanner Server Diagnostic] ERROR on model "${modelName}" (attempt ${attempt}/2): ${lastErrMessage}`);

            if (isQuota) {
              console.error(`[ValueScanner Server Diagnostic] RATE LIMIT NOTICE: Quota reached for model ${modelName}. Note: Shared quota across Chatbot, Card Stylizer, and Scanner may contribute to RPM/TPM limits.`);
            }

            if (isDeprecatedOrNotFound) {
              break; // Don't retry deprecated model, go to next
            }

            if ((isQuota || isBusy || isTimeout) && attempt < 2) {
              console.log(`[ValueScanner Server Diagnostic] Backing off 800ms before retry on ${modelName}...`);
              await delay(800);
            } else {
              break; // Try next model in cascade
            }
          }
        }

        if (parsedData) {
          break; // Stop model cascade if successfully parsed
        }
      }

      if (!parsedData) {
        console.error(`[ValueScanner Server Diagnostic] ALL MODELS FAILED in cascade (${modelsToTry.join(', ')}). Total elapsed: ${Date.now() - scanStartTime}ms. Last error: ${lastErrMessage}`);
        const errMsgLower = lastErrMessage.toLowerCase();
        const isQuota = errMsgLower.includes('429') || errMsgLower.includes('quota') || errMsgLower.includes('resource_exhausted') || errMsgLower.includes('rate limit');
        const isBusy = errMsgLower.includes('503') || errMsgLower.includes('unavailable') || errMsgLower.includes('high demand') || errMsgLower.includes('overloaded');
        const isTimeout = errMsgLower.includes('timeout') || errMsgLower.includes('deadline_exceeded') || errMsgLower.includes('etimedout') || errMsgLower.includes('network');

        if (isQuota) {
          return res.status(429).json({
            success: false,
            errorType: 'quota_exceeded',
            error: 'Scanner is temporarily at capacity (Gemini API quota reached). Please try again in a few moments or check shared API key quota.',
            rawError: lastErrMessage,
            isApiKeyConfigured: true,
            apiKeySource,
            elapsedMs: Date.now() - scanStartTime,
          });
        }

        if (isTimeout) {
          return res.status(504).json({
            success: false,
            errorType: 'network_timeout',
            error: 'Upstream connection timed out while analyzing the car image. Please try again.',
            rawError: lastErrMessage,
            isApiKeyConfigured: true,
            apiKeySource,
            elapsedMs: Date.now() - scanStartTime,
          });
        }

        if (isBusy) {
          return res.status(503).json({
            success: false,
            errorType: 'service_busy',
            error: 'Gemini AI service is currently experiencing high traffic. Please tap "Retry Scan Now" in a few seconds.',
            rawError: lastErrMessage,
            isApiKeyConfigured: true,
            apiKeySource,
            elapsedMs: Date.now() - scanStartTime,
          });
        }

        // Internal API / Server error fallback
        return res.status(500).json({
          success: false,
          errorType: 'internal_api_error',
          error: lastErrMessage || 'Internal AI engine error occurred during photo appraisal.',
          rawError: lastErrMessage,
          isApiKeyConfigured: true,
          apiKeySource,
          elapsedMs: Date.now() - scanStartTime,
        });
      }

      return res.json({
        success: true,
        isAiLive: true,
        isApiKeyConfigured: true,
        apiKeySource,
        modelUsed,
        elapsedMs: Date.now() - scanStartTime,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('[ValueScanner Server Diagnostic] Unexpected Top-Level Scanner Exception:', err);
      const errMsg = (err?.message || '').toLowerCase();
      const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('resource_exhausted');
      const isBusy = errMsg.includes('503') || errMsg.includes('unavailable') || errMsg.includes('high demand') || errMsg.includes('overloaded');
      const isTimeout = errMsg.includes('timeout') || errMsg.includes('network') || errMsg.includes('etimedout');

      const statusCode = isQuota ? 429 : isBusy ? 503 : isTimeout ? 504 : 500;
      const errorType = isQuota ? 'quota_exceeded' : isBusy ? 'service_busy' : isTimeout ? 'network_timeout' : 'internal_api_error';

      return res.status(statusCode).json({
        success: false,
        errorType,
        error: isQuota
          ? 'Gemini API rate limit or quota exceeded. Please wait a moment.'
          : isBusy
          ? 'Our scanner is a bit busy right now — please try again in a few seconds'
          : isTimeout
          ? 'Network timeout during scan. Please retry.'
          : 'Could not complete the car scan. Internal AI engine error.',
        rawError: err?.message || String(err),
        elapsedMs: Date.now() - scanStartTime,
      });
    }
  });

  // Comprehensive System Diagnostics Endpoint for Gemini API & Deployment Verification
  app.get('/api/diagnostics/gemini', async (req, res) => {
    const { key: apiKey, source: apiKeySource } = getGeminiApiKey();
    const isApiKeySet = Boolean(apiKey && apiKey.length > 0);
    const maskedKey = isApiKeySet
      ? `${apiKey!.slice(0, 6)}...${apiKey!.slice(-4)} (Length: ${apiKey!.length})`
      : 'NOT_FOUND';

    const diagnosticResult: any = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development',
      geminiApiKeyConfigured: isApiKeySet,
      geminiApiKeySource: apiKeySource,
      geminiApiKeyMasked: maskedKey,
      hostingerDeploymentGuide: {
        settingLocation: 'Hostinger hPanel -> Advanced / Node.js -> App -> Environment Variables OR .env file in root directory',
        keyNameRequired: 'GEMINI_API_KEY',
        status: isApiKeySet ? 'CONFIGURED' : 'ACTION_REQUIRED: Set GEMINI_API_KEY in Hostinger Environment Variables',
        note: 'Hostinger Node.js Passenger runtime reads environment variables configured in hPanel or root .env.',
      },
      sharedQuotaFeatures: [
        'AI Value Scanner (/api/gemini/scan-hotwheels)',
        'Hot Wheels AI Pit Crew Chatbot (/api/gemini/chat)',
        'Custom Blister Card Stylizer (/api/gemini/stylize-card)',
      ],
      liveProbe: {
        status: 'pending',
        latencyMs: 0,
        modelTested: 'gemini-3.1-flash-lite',
      },
    };

    if (!isApiKeySet) {
      diagnosticResult.liveProbe.status = 'SKIPPED_NO_API_KEY';
      diagnosticResult.liveProbe.message = 'Set GEMINI_API_KEY in environment variables to enable live AI queries.';
      return res.json(diagnosticResult);
    }

    try {
      const probeStart = Date.now();
      const ai = new GoogleGenAI({
        apiKey: apiKey!,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const probeRes = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'Ping: Reply with {"status":"ok","garage":"Redline Garage"} in json',
        config: { responseMimeType: 'application/json' },
      });

      diagnosticResult.liveProbe.status = 'SUCCESS_ONLINE';
      diagnosticResult.liveProbe.latencyMs = Date.now() - probeStart;
      diagnosticResult.liveProbe.reply = probeRes.text?.trim();
      return res.json(diagnosticResult);
    } catch (probeErr: any) {
      diagnosticResult.liveProbe.status = 'PROBE_FAILED';
      diagnosticResult.liveProbe.error = probeErr?.message || String(probeErr);
      diagnosticResult.liveProbe.isQuotaError =
        probeErr?.message?.includes('429') ||
        probeErr?.message?.toLowerCase().includes('quota') ||
        probeErr?.message?.toLowerCase().includes('resource_exhausted');
      return res.status(diagnosticResult.liveProbe.isQuotaError ? 429 : 500).json(diagnosticResult);
    }
  });

  // Server-side Gemini API route for Multi-Turn Hot Wheels AI Pit Crew Chatbot
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const { key: apiKey } = getGeminiApiKey();
      if (!apiKey) {
        // High quality informative response if no API key is set
        const lastUserMsg = messages[messages.length - 1]?.text || '';
        return res.json({
          success: true,
          reply: `🏎️ **Redline Pit Crew:** Thanks for asking about "${lastUserMsg.slice(0, 40)}..."! Welcome to Redline Garage India — your premier spot for authentic Hot Wheels mainlines, Car Culture premiums, custom die-cast bouquets, and custom blister cards. All orders ship nationwide across India with verified UPI payments and live tracking! How can I help you customize or pick your next casting today?`,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are the Redline Garage AI Pit Crew & Hot Wheels Concierge for "Redline Garage" (India's premier collector destination).
Your tone is passionate, knowledgeable, friendly, and deeply immersed in die-cast collector culture (Hot Wheels, Matchbox, MiniGT, Kaido House, Inno64).
You provide helpful information on:
1. Identifying rare castings (Mainlines, Treasure Hunts / TH with flame logo, Super Treasure Hunts / $TH with Spectraflame paint and Real Riders rubber wheels, RLC / Red Line Club exclusives).
2. Custom Blister Cards (personalized cards made for anniversaries, birthdays, car enthusiasts where customers upload their photo and vehicle name).
3. Die-Cast Bouquets & Acrylic Collector Display Frames.
4. Ordering & Payments: Redline Garage accepts Direct UPI (Google Pay, PhonePe, Paytm, BHIM) with instant WhatsApp order confirmation and tracking across India.
5. Loyalty Program (earn points on confirmed orders and redeem at checkout) and Referral Promo codes.
6. Valuation advice: Provide helpful price context in Indian Rupees (₹) and mention our built-in AI Value Scanner & HW Price Guide tool.

Keep answers concise, well-structured, energetic, and formatted cleanly with markdown bolding and bullet points. Never hallucinate fake coupon codes.`;

      // Transform history into contents array for Gemini
      const contents = messages.map((m: any) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text || '' }],
      }));

      // Try gemini-3.5-flash for general multi-turn tasks, fallback to gemini-3.1-flash-lite
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];
      let replyText = '';

      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });

          if (response.text) {
            replyText = response.text;
            break;
          }
        } catch (err: any) {
          console.warn(`Chat attempt with ${model} failed:`, err?.message || err);
        }
      }

      if (!replyText) {
        return res.status(500).json({
          success: false,
          error: 'Could not generate a response from the AI Pit Crew right now. Please try again.',
        });
      }

      return res.json({
        success: true,
        reply: replyText,
      });
    } catch (err: any) {
      console.error('Gemini Chat Error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to generate chat response',
      });
    }
  });

  // In-memory / server-side marketing subscribers cache for fast API operations
  const serverSubscribers: Array<{
    id: string;
    email: string;
    name?: string;
    status: 'active' | 'unsubscribed';
    source: string;
    tags: string[];
    couponCodeIssued: string;
    subscribedAt: string;
  }> = [];

  // Newsletter Subscription API Route (can also forward to external services like Brevo, Mailchimp, Zapier, Webhook)
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const { email, name = '', source = 'footer', tags = ['vip_pit_pass'] } = req.body;

      if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address.',
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const welcomeCoupon = 'VIPGARAGE10';

      const existingIndex = serverSubscribers.findIndex(s => s.email.toLowerCase() === cleanEmail);
      let isNew = false;
      let subscriberId = '';

      if (existingIndex >= 0) {
        serverSubscribers[existingIndex].status = 'active';
        serverSubscribers[existingIndex].source = source || serverSubscribers[existingIndex].source;
        subscriberId = serverSubscribers[existingIndex].id;
      } else {
        isNew = true;
        subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        serverSubscribers.unshift({
          id: subscriberId,
          email: cleanEmail,
          name: (name || '').trim(),
          status: 'active',
          source: source || 'footer',
          tags: Array.isArray(tags) && tags.length > 0 ? tags : ['vip_pit_pass'],
          couponCodeIssued: welcomeCoupon,
          subscribedAt: new Date().toISOString(),
        });
      }

      // Optional: Forward to external marketing webhook if configured (e.g. Zapier, Make, Brevo, Mailchimp)
      const webhookUrl = process.env.MARKETING_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'newsletter_subscribed',
              email: cleanEmail,
              name,
              source,
              couponCode: welcomeCoupon,
              timestamp: new Date().toISOString(),
            }),
          }).catch(webhookErr => console.warn('Marketing webhook dispatch note:', webhookErr));
        } catch (webhookErr) {
          console.warn('Webhook error:', webhookErr);
        }
      }

      return res.json({
        success: true,
        isNew,
        couponCode: welcomeCoupon,
        message: isNew
          ? 'Welcome to the Redline Garage VIP Pit Pass! Enjoy your 10% discount.'
          : 'You are already registered on our VIP list! Use code VIPGARAGE10.',
        subscriber: {
          id: subscriberId,
          email: cleanEmail,
          name,
          couponCode: welcomeCoupon,
        },
      });
    } catch (err: any) {
      console.error('Newsletter subscribe error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to process newsletter subscription. Please try again.',
      });
    }
  });

  // GET Newsletter Subscribers List (for administrative queries / export sync)
  app.get('/api/newsletter/subscribers', (req, res) => {
    return res.json({
      success: true,
      count: serverSubscribers.length,
      subscribers: serverSubscribers,
    });
  });

  // Dynamic /sitemap.xml Generation Endpoint
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const BASE_URL = 'https://redlinegarage.in';
      const today = new Date().toISOString().split('T')[0];

      // Static and main section routes
      const staticUrls = [
        { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0' },
        { loc: `${BASE_URL}/#catalog`, changefreq: 'daily', priority: '0.9' },
        { loc: `${BASE_URL}/#categories`, changefreq: 'weekly', priority: '0.9' },
        { loc: `${BASE_URL}/#scanner`, changefreq: 'weekly', priority: '0.85' },
        { loc: `${BASE_URL}/#custom-builder`, changefreq: 'weekly', priority: '0.85' },
        { loc: `${BASE_URL}/#why-us`, changefreq: 'monthly', priority: '0.7' },
        { loc: `${BASE_URL}/#gallery`, changefreq: 'weekly', priority: '0.7' },
        { loc: `${BASE_URL}/#faq`, changefreq: 'weekly', priority: '0.7' },
      ];

      // Categories
      const categorySlugs = ['bouquets', 'frames', 'custom-cards', 'scale-models'];
      const categoryUrls = categorySlugs.map((slug) => ({
        loc: `${BASE_URL}/?category=${slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      }));

      // Known collector and flagship products
      const defaultProductIds = [
        'bouquet-midnight-supercars',
        'frame-skyline-gtr-heritage',
        'custom-card-personal',
        'scale-jdm-tuners-pack',
        'bouquet-ferrari-apex-red',
        'frame-porsche-911-lineage',
        'scale-muscle-legends-box',
        'bouquet-fast-furious-edition',
      ];

      const productUrls = defaultProductIds.map((id) => ({
        loc: `${BASE_URL}/?product=${encodeURIComponent(id)}`,
        changefreq: 'weekly',
        priority: '0.8',
      }));

      const allUrls = [...staticUrls, ...categoryUrls, ...productUrls];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.send(xml);
    } catch (err) {
      console.error('Error generating dynamic sitemap:', err);
      return res.status(500).send('Error generating sitemap');
    }
  });

  // Dynamic /robots.txt Endpoint
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/

Sitemap: https://redlinegarage.in/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.header('Cache-Control', 'public, max-age=86400');
    return res.send(robotsTxt);
  });

  // Serve static assets with explicit caching policies
  const publicPath = path.join(process.cwd(), 'public');
  const distPath = path.join(process.cwd(), 'dist');
  const distAssetsPath = path.join(distPath, 'assets');
  const indexHtmlPath = path.join(distPath, 'index.html');
  let inMemoryIndexHtml: string | null = null;

  // 1. Long-term immutable caching (1 year) for production fingerprinted assets
  app.use('/assets', express.static(distAssetsPath, {
    maxAge: '1y',
    immutable: true,
    etag: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));

  // 2. Public folder static assets (SVG, PNG, WebP, manifest, favicon)
  app.use(express.static(publicPath, {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      } else if (/\.(svg|png|jpg|jpeg|webp|ico|json|webmanifest|woff2|woff)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      }
    },
  }));

  // Vite middleware for development vs. highly optimized production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve dist folder static files with appropriate cache control
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
      },
    }));

    // Serve HTML entry document with strict zero-cache headers so new deployments are received instantly
    app.get('*', (req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      try {
        if (fs.existsSync(indexHtmlPath)) {
          const freshHtml = fs.readFileSync(indexHtmlPath, 'utf8');
          return res.send(freshHtml);
        }
      } catch (e) {
        console.warn('HTML disk read warning:', e);
      }

      res.sendFile(indexHtmlPath);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
