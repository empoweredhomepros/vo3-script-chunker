// Vercel Serverless Function to check VEO3 operation status
// Used for polling long-running video generation operations

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

  // Get operation name from query parameter
  const { operationName } = req.query;
  
  if (!operationName) {
    return res.status(400).json({ error: 'Operation name required' });
  }

  try {
    // Check the operation status
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Return the response
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error checking operation status:', error);
    return res.status(500).json({ error: error.message });
  }
}
