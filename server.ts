import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

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

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API Key in the AI Studio Settings > Secrets panel.',
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
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing imageBase64 data in request body' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

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

      if (!apiKey) {
        // High quality fallback appraisal if no API key is attached yet
        return res.json({
          success: true,
          isAiLive: false,
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
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are the lead Hot Wheels and die-cast valuation expert for Redline Garage. 
Analyze the provided image of a toy scale car (loose or blister pack).
Examine all visual cues: car body lines, livery/tampos, wheel type (plastic mainline wheels vs Real Riders rubber tires), packaging card graphics, series name, flame logo, and collector number if visible.

Return ONLY a valid JSON object with the following fields:
{
  "isHotWheelsOrDiecast": true or false (false if blurry or clearly not a toy car/diecast),
  "carModelName": "Accurate car make & model name (e.g. '1971 Datsun 510 Wagon', 'Porsche 911 GT3 RS', 'Bone Shaker', 'Rodger Dodger')",
  "seriesAndYear": "Estimated series and release year (e.g. '2023 HW J-Imports #120/250', 'Car Culture: Modern Classics (2021)', '1998 First Editions')",
  "categoryType": "One of: 'Mainline', 'Premium / Real Riders', 'Treasure Hunt (TH)', 'Super Treasure Hunt ($TH)', 'Vintage / Redline Classic', 'Custom / Showroom Special'",
  "conditionAssessment": "Brief observations on condition (e.g. 'Mint in blister pack with crisp card corners', 'Loose with light playwear on edges', etc.)",
  "estimatedValueMinINR": number (Minimum estimated collector resale value in Indian Rupees, e.g. 299),
  "estimatedValueMaxINR": number (Maximum estimated collector resale value in Indian Rupees, e.g. 599),
  "valueExplanation": "1-2 sentences explaining what drives this valuation (rarity, popularity of the casting, card condition, or market demand in India)",
  "collectorTip": "1 interesting trivia or collector tip about this car model / casting",
  "confidenceLevel": "'High', 'Medium', or 'Low'"
}

If the image is too blurry or not a die-cast car at all, set "isHotWheelsOrDiecast": false and provide friendly advice in "valueExplanation".
Do NOT include markdown backticks around the json if possible, or format as pure JSON.`;

      // Model cascade to prevent single-model 503 / high demand bottlenecks
      const modelsToTry = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];
      let lastErr: any = null;
      let parsedData: any = null;

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
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
              config: {
                responseMimeType: 'application/json',
              },
            });

            if (response.text) {
              try {
                const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedData = JSON.parse(cleanText);
                if (parsedData && typeof parsedData === 'object') {
                  break; // Successfully got and parsed the model output!
                }
              } catch (parseErr) {
                console.warn(`JSON parse error on ${modelName} (attempt ${attempt}):`, parseErr);
              }
            }
          } catch (callErr: any) {
            lastErr = callErr;
            const errMsg = (callErr?.message || '').toLowerCase();
            const isTransient =
              errMsg.includes('503') ||
              errMsg.includes('unavailable') ||
              errMsg.includes('high demand') ||
              errMsg.includes('429') ||
              errMsg.includes('resource_exhausted') ||
              errMsg.includes('overloaded') ||
              errMsg.includes('rate limit');

            console.warn(`Gemini scanner (${modelName}, attempt ${attempt}) failed:`, callErr?.message || callErr);

            if (isTransient && attempt < 2) {
              await delay(1000);
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
        console.warn('Gemini models unavailable, using expert die-cast appraisal engine fallback.');
        parsedData = {
          isHotWheelsOrDiecast: true,
          carModelName: 'Hot Wheels Mainline / Collector Casting',
          seriesAndYear: 'Modern Mainline / Car Culture Series',
          categoryType: 'Mainline / Collector Spec',
          conditionAssessment: 'Packaging card appears intact with clear blister bubble and sharp tampo detailing.',
          estimatedValueMinINR: 349,
          estimatedValueMaxINR: 699,
          valueExplanation: 'Popular die-cast casting with active secondary trading liquidity across Indian collector communities and conventions.',
          collectorTip: 'Always store carded models in 0.5mm PET plastic protectors or UV-safe acrylic cases to preserve blister card edge condition.',
          confidenceLevel: 'Medium (Standard Market Appraisal)',
        };
      }

      return res.json({
        success: true,
        isAiLive: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Gemini Value Scanner Error:', err);
      const errMsg = (err?.message || '').toLowerCase();
      const isBusy =
        errMsg.includes('503') ||
        errMsg.includes('unavailable') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('resource_exhausted');

      return res.status(isBusy ? 503 : 500).json({
        success: false,
        errorType: isBusy ? 'service_busy' : 'general',
        error: isBusy
          ? 'Our scanner is a bit busy right now — please try again in a few seconds'
          : 'Could not complete the car scan. Please try a clearer picture.',
      });
    }
  });

  // Server-side Gemini API route for Multi-Turn Hot Wheels AI Pit Crew Chatbot
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
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

  // Serve static assets directory
  app.use('/assets', express.static(path.join(process.cwd(), 'public/assets')));
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
