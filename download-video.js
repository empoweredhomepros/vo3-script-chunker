// api/download-video.js
// Serverless function to proxy video downloads from Google Cloud Storage
// This is needed because videos require authentication to download

import { getAccessToken } from './utils/vertex-auth.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    // Get video URI from query parameter
    const { uri } = req.query;
    
    if (!uri) {
      return res.status(400).json({ 
        error: 'Missing required parameter: uri',
        message: 'Please provide the video URI in the query string'
      });
    }

    console.log('⬇️ Downloading video from:', uri);

    // Get access token for authentication
    const accessToken = await getAccessToken();

    // Download the video using OAuth token
    console.log('📤 Fetching video from Google Cloud Storage...');
    
    const response = await fetch(uri, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch video. Status:', response.status);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
      return res.status(response.status).json({ 
        error: 'Failed to fetch video from Google Cloud Storage',
        status: response.status,
        details: errorText
      });
    }

    // Get the video content as buffer
    const videoBuffer = await response.arrayBuffer();
    
    console.log(`✅ Video downloaded (${videoBuffer.byteLength} bytes)`);

    // Set appropriate headers for video download
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="veo3-video.mp4"');
    res.setHeader('Content-Length', videoBuffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the video
    return res.send(Buffer.from(videoBuffer));
    
  } catch (error) {
    console.error('❌ Error downloading video:', error);
    return res.status(500).json({ 
      error: 'Internal server error while downloading video',
      message: error.message
    });
  }
}
