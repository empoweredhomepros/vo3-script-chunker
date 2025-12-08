# VEO3 Script Chunker - Deployment Instructions

## Files to Upload to GitHub

You need to add these files to your GitHub repository:

1. **vo3-script-chunker.html** - The main HTML file (already there, just update it)
2. **api/generate-video.js** - Serverless function for video generation
3. **api/check-operation.js** - Serverless function for checking operation status
4. **vercel.json** - Vercel configuration file

## How to Deploy

### Step 1: Upload Files to GitHub

1. Go to your GitHub repository: `github.com/empoweredhomepros/vo3-script-chunker`
2. Click "Add file" → "Upload files"
3. Upload:
   - `vo3-script-chunker.html` (replace the existing one)
   - `vercel.json`
4. Create a folder called `api`:
   - Click "Add file" → "Create new file"
   - Type `api/generate-video.js` in the filename
   - Paste the contents of `generate-video.js`
   - Commit
5. Repeat for `api/check-operation.js`

### Step 2: Configure Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your `vo3-script-chunker` project
3. Click on it
4. Go to **Settings** → **Environment Variables**
5. Add a new environment variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your actual Gemini API key (from ai.google.dev)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### Step 3: Redeploy

1. Go to the **Deployments** tab in your Vercel project
2. Click the three dots (•••) on the latest deployment
3. Click **Redeploy**
4. Wait for it to finish deploying

### Step 4: Test!

1. Visit your Vercel URL (should be something like `vo3-script-chunker.vercel.app`)
2. You do NOT need to enter your API key in the app anymore (it's stored securely in Vercel)
3. Try generating a video!

## Important Notes

- Your API key is now stored securely in Vercel's environment variables
- You can remove the API key input field from the UI if you want (or keep it for clarity)
- The "Generate in VEO3" button should now work without CORS errors!

## Troubleshooting

If you get errors:
1. Make sure the `GEMINI_API_KEY` environment variable is set correctly in Vercel
2. Check the Vercel function logs (Settings → Functions → Logs)
3. Make sure all files are uploaded correctly to GitHub

## Questions?

The serverless functions are located in the `/api` folder and handle:
- `/api/generate-video` - Makes the initial video generation request
- `/api/check-operation` - Polls for video generation completion
