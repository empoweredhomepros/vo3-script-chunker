// api/utils/vertex-auth.js
// This file handles authentication with Google Cloud Vertex AI

import { GoogleAuth } from 'google-auth-library';

let cachedAuth = null;
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get authenticated Google Auth client
 */
export async function getVertexAIAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }

  // Get credentials from environment variable
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!credentialsJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. Please add it in Vercel dashboard.');
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    throw new Error('Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON');
  }
  
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  cachedAuth = auth;
  return auth;
}

/**
 * Get fresh access token (with caching to avoid unnecessary refreshes)
 */
export async function getAccessToken() {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - (5 * 60 * 1000)) {
    return cachedToken;
  }

  const auth = await getVertexAIAuth();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  
  cachedToken = tokenResponse.token;
  // Tokens typically expire in 1 hour
  tokenExpiry = Date.now() + (60 * 60 * 1000);
  
  return cachedToken;
}

/**
 * Get Google Cloud Project ID
 */
export function getProjectId() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set');
  }
  return projectId;
}

/**
 * Get Vertex AI location/region
 */
export function getLocation() {
  return process.env.VERTEX_AI_LOCATION || 'us-central1';
}

/**
 * Build the base Vertex AI API URL
 */
export function getVertexAIBaseUrl() {
  const location = getLocation();
  const projectId = getProjectId();
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}`;
}
