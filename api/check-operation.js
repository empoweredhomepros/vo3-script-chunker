// api/check-operation.js
// Serverless function to check the status of video generation operations

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
    const { operationName } = req.query;

    if (!operationName) {
      return res.status(400).json({ 
        error: 'Missing required parameter: operationName' 
      });
    }

    console.log('🔍 Checking operation status:', operationName);

    // Get access token
    const accessToken = await getAccessToken();

    // The operationName is a full path like:
    // "projects/{project}/locations/{location}/operations/{operation-id}"
    // We need to construct the full API URL
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/${operationName}`;

    console.log('📤 Polling Vertex AI operation...');

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ Operation check failed:', responseText);
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }

      return res.status(response.status).json({
        error: 'Failed to check operation status',
        details: errorData
      });
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from Vertex AI'
      });
    }

    // Check if operation is done
    if (result.done === true) {
      console.log('✅ Operation completed');
      
      // Check for errors
      if (result.error) {
        console.log('❌ Operation failed with error:', result.error);
        return res.status(200).json({
          done: true,
          error: result.error,
          status: 'error',
          message: result.error.message || 'Video generation failed'
        });
      }

      // Operation succeeded
      console.log('✅ Video generated successfully');
      return res.status(200).json({
        done: true,
        response: result.response,
        status: 'completed',
        message: 'Video generation completed'
      });
    } else {
      // Still processing
      console.log('⏳ Operation still in progress');
      const progress = result.metadata?.progressPercentage || 0;
      
      return res.status(200).json({
        done: false,
        status: 'processing',
        progress: progress,
        message: `Video generation in progress (${progress}%)`
      });
    }

  } catch (error) {
    console.error('❌ Error checking operation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
