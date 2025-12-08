// Vercel Serverless Function to proxy VEO3 API calls
// This avoids CORS issues by making the API call from the server side

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Get the payload from the request
    const { prompt, image, aspectRatio, sampleCount } = req.body;

    // Build the request body for Veo 3.1 Fast
    const requestBody = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        aspectRatio: aspectRatio || "16:9",
        sampleCount: sampleCount || 1
      }
    };

    // Add image if provided
    if (image) {
      requestBody.instances[0].image = image;
    }

    // Make the request to the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Return the response (contains operation name)
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error calling VEO3 API:', error);
    return res.status(500).json({ error: error.message });
  }
}
