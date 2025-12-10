// api/generate-video.js
// Serverless function to generate videos using Google Vertex AI (Veo 3)

import { getAccessToken, getVertexAIBaseUrl } from './utils/vertex-auth.js';

export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('📹 Video generation request received');
    
    // Extract request parameters
    const { prompt, aspectRatio = '16:9', sampleCount = 1, image } = req.body;

    // Validate required parameters
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required parameter: prompt' 
      });
    }

    console.log(`🎬 Generating video with prompt: "${prompt.substring(0, 50)}..."`);

    // Get authentication
    const accessToken = await getAccessToken();
    const baseUrl = getVertexAIBaseUrl();

    // Vertex AI endpoint for Veo 3 video generation
    const endpoint = `${baseUrl}/publishers/google/models/veo-3:generateContent`;

    // Build request payload
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        candidateCount: parseInt(sampleCount) || 1,
        maxOutputTokens: 8192
      }
    };

    // Add image if provided (for image-to-video generation)
    if (image && image.bytesBase64Encoded) {
      console.log('🖼️ Image provided, using image-to-video mode');
      payload.contents[0].parts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: image.bytesBase64Encoded
        }
      });
    }

    console.log('📤 Sending request to Vertex AI...');

    // Make request to Vertex AI
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Vertex AI Error Response:', responseText);
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      
      return res.status(response.status).json({
        error: 'Video generation request failed',
        details: errorData,
        message: errorData.error?.message || 'Unknown error from Vertex AI'
      });
    }

    // Parse successful response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response:', responseText);
      return res.status(500).json({
        error: 'Invalid response format from Vertex AI',
        rawResponse: responseText
      });
    }

    console.log('✅ Vertex AI response received');

    // Veo 3 returns an operation name for async processing
    // The response format might be:
    // { name: "projects/.../operations/..." } for async
    // OR immediate result with video data

    if (result.name && result.name.includes('/operations/')) {
      // Async operation - return operation ID for polling
      console.log('⏳ Video generation started (async). Operation:', result.name);
      return res.status(202).json({
        name: result.name,
        status: 'processing',
        message: 'Video generation started. Poll /api/check-operation to get status.'
      });
    } else if (result.candidates && result.candidates.length > 0) {
      // Check if we got immediate video data
      console.log('✅ Immediate response received');
      return res.status(200).json(result);
    } else {
      // Unknown response format
      console.log('⚠️ Unexpected response format:', result);
      return res.status(200).json(result);
    }

  } catch (error) {
    console.error('❌ Error in generate-video:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
