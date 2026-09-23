const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('./models/Chat');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-chatbot';

// Middleware - with 25MB body limit for photos and PDFs
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Candidate models supporting current Gemini API versions (with optional env override)
const CANDIDATE_MODELS = [
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL.trim()] : []),
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// Direct REST call supporting multimodal (text + image/PDF) and AQ. key format
const callGeminiRest = async (apiKey, modelName, apiVersion, prompt, attachment) => {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent`;

  const parts = [{ text: prompt }];
  if (attachment && attachment.base64 && attachment.mimeType) {
    parts.push({
      inline_data: {
        mime_type: attachment.mimeType,
        data: attachment.base64,
      },
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      contents: [{ parts }],
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text returned in Gemini response candidate');
  }
  return text;
};

// Generate content using Gemini with multimodal attachment support
const generateWithGemini = async (prompt, attachment) => {
  dotenv.config({ override: true });
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    // Try SDK first for the fastest successful path.
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const contentParts = [prompt];
      if (attachment && attachment.base64 && attachment.mimeType) {
        contentParts.push({
          inlineData: {
            data: attachment.base64,
            mimeType: attachment.mimeType,
          },
        });
      }

      const result = await model.generateContent(contentParts);
      const response = await result.response;
      const text = response.text();
      console.log(`[Gemini SDK] Success using ${modelName}`);
      return { text, modelName };
    } catch (sdkErr) {
      console.warn(`[Gemini SDK] ${modelName} attempt failed:`, sdkErr.message);
      lastError = sdkErr;
    }

    // Use REST fallback only once per model to keep it fast.
    try {
      const text = await callGeminiRest(apiKey, modelName, 'v1beta', prompt, attachment);
      console.log(`[Gemini REST] Success using ${modelName}`);
      return { text, modelName };
    } catch (restErr) {
      console.warn(`[Gemini REST] ${modelName} attempt failed:`, restErr.message);
      lastError = restErr;
    }
  }

  throw lastError;
};

// MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.warn('Note: Ensure MongoDB is running or update MONGO_URI in .env');
  });

// Health check routes
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'AI Chatbot Backend is running.',
    mongoConnectionState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState,
  });
});

// POST /api/chat - Generate response, store conversation & session
app.post('/api/chat', async (req, res) => {
  try {
    let { prompt, attachment, sessionId, sessionTitle } = req.body;
    const currentKey = (process.env.GEMINI_API_KEY || '').trim();

    // Default or generate session
    if (!sessionId) {
      sessionId = `sess_${Date.now()}`;
    }

    if (!sessionTitle) {
      sessionTitle = prompt
        ? prompt.substring(0, 32) + (prompt.length > 32 ? '...' : '')
        : 'New Chat';
    }

    console.log(
      `[Chat API] Session: ${sessionId} | Prompt: "${(prompt || '').substring(0, 25)}..." | Attachment: ${
        attachment ? attachment.fileName || attachment.mimeType : 'None'
      } | Key preview: "${currentKey.substring(0, 7)}..."`
    );

    const effectivePrompt =
      (prompt && prompt.trim()) || 'Analyze this uploaded file/image and provide helpful details.';

    // Call Google Gemini API
    let botResponse = '';
    let usedModel = '';
    try {
      const geminiResult = await generateWithGemini(effectivePrompt, attachment);
      botResponse = geminiResult.text;
      usedModel = geminiResult.modelName;
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError.message);
      return res.status(502).json({
        success: false,
        error: `Gemini API error: ${geminiError.message}`,
      });
    }

    // Save conversation to MongoDB with sessionId & title
    let savedChat = null;
    try {
      savedChat = await Chat.create({
        sessionId,
        sessionTitle,
        prompt: effectivePrompt,
        response: botResponse,
        attachment: attachment
          ? {
              fileName: attachment.fileName,
              fileType: attachment.mimeType,
              fileSize: attachment.fileSize,
            }
          : undefined,
      });
    } catch (dbError) {
      console.error('Failed to save chat to MongoDB:', dbError.message);
      return res.status(200).json({
        success: true,
        sessionId,
        sessionTitle,
        response: botResponse,
        model: usedModel,
        warning: 'Conversation could not be persisted to the database.',
      });
    }

    return res.status(200).json({
      success: true,
      sessionId,
      sessionTitle,
      response: botResponse,
      model: usedModel,
      data: savedChat,
    });
  } catch (error) {
    console.error('Unhandled server error in /api/chat:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
});

// GET /api/sessions - Get all conversation sessions for sidebar
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Chat.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$sessionId', 'default_session'] },
          title: { $first: '$sessionTitle' },
          lastMessageAt: { $max: '$createdAt' },
          firstPrompt: { $first: '$prompt' },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 100 },
    ]);

    const formattedSessions = sessions.map((s) => ({
      sessionId: s._id,
      title: s.title || s.firstPrompt?.substring(0, 30) || 'Conversation',
      lastMessageAt: s.lastMessageAt,
      messageCount: s.messageCount,
    }));

    return res.status(200).json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation sessions.',
    });
  }
});

// GET /api/sessions/:sessionId - Get all messages for a specific session
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const query =
      sessionId === 'default_session'
        ? { $or: [{ sessionId: 'default_session' }, { sessionId: null }] }
        : { sessionId };

    const messages = await Chat.find(query).sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      sessionId,
      messages,
    });
  } catch (error) {
    console.error('Failed to fetch session messages:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve session messages.',
    });
  }
});

// DELETE /api/sessions/:sessionId - Delete an entire chat session
app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const query =
      sessionId === 'default_session'
        ? { $or: [{ sessionId: 'default_session' }, { sessionId: null }] }
        : { sessionId };

    await Chat.deleteMany(query);
    return res.status(200).json({
      success: true,
      message: `Session ${sessionId} deleted successfully.`,
    });
  } catch (error) {
    console.error('Failed to delete session:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete session.',
    });
  }
});

// GET /api/chat/history - Retrieve all recent chat history (legacy compatibility)
app.get('/api/chat/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = await Chat.find().sort({ createdAt: 1 }).limit(limit);
    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('Failed to fetch conversation history:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation history.',
    });
  }
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use by another terminal or process!`);
    console.error(`👉 Please kill the process using port ${PORT} or close old terminals before restarting.\n`);
  } else {
    console.error('Server error:', err);
  }
});
