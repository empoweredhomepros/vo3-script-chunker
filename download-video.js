// Vercel Serverless Function to proxy video downloads
// This allows downloading videos that require API authentication

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Get video URI from query parameter
  const { uri } = req.query;
  
  if (!uri) {
    return res.status(400).json({ error: 'Video URI required' });
  }

  try {
    // Download the video using the API key
    const response = await fetch(uri, {
      headers: {
        'x-goog-api-key': apiKey
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch video' });
    }

    // Get the video content
    const videoBuffer = await response.arrayBuffer();
    
    // Set appropriate headers for video download
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="veo3-video.mp4"');
    res.setHeader('Content-Length', videoBuffer.byteLength);
    
    // Send the video
    return res.send(Buffer.from(videoBuffer));
  } catch (error) {
    console.error('Error downloading video:', error);
    return res.status(500).json({ error: error.message });
  }
}
