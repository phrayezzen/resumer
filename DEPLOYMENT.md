# Deployment Guide

## Quick Summary

You have two options for deployment:

1. **Demo Mode (Vercel Only)** - Perfect for client demos
2. **Production Mode (Vercel + Backend)** - For handling 3-5K applications

## Option 1: Demo Mode (Recommended for POC)

Deploy frontend to Vercel as a standalone demo.

### Steps:

1. **Push to GitHub**
```bash
cd /Users/xilinliu/Projects/resume-reviewer
git init
git add .
git commit -m "Initial commit: AI Resume Reviewer"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy to Vercel**
- Go to https://vercel.com
- Click "Import Project"
- Select your GitHub repository
- Set Root Directory to `frontend`
- Add Environment Variables:
  - `OPENAI_API_KEY`: Your OpenAI API key
  - `NEXT_PUBLIC_USE_BACKEND`: `false`
- Click "Deploy"

3. **Done!**
Your demo will be live at `https://your-project.vercel.app`

### Demo Characteristics:
✅ Works standalone (no backend needed)
✅ AI screening with GPT-4o
✅ Perfect for showing client the workflow
⚠️ Data resets between deployments (in-memory)
⚠️ Limited to ~50 applications (serverless limits)

---

## Option 2: Production Mode (Full Scale)

Deploy both frontend (Vercel) and backend (Railway/Render).

### Part A: Deploy Backend

**Option A1: Railway**
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo, choose `backend` folder
4. Add environment variables:
   - `OPENAI_API_KEY`
   - `DATABASE_URL` (Railway will auto-provision PostgreSQL)
5. Deploy
6. Note your backend URL: `https://your-app.railway.app`

**Option A2: Render**
1. Go to https://render.com
2. Create "Web Service"
3. Connect GitHub repo, select `backend` folder
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (same as Railway)
7. Deploy

### Part B: Deploy Frontend (Vercel)

1. Same as Demo Mode steps 1-2
2. But set environment variables as:
   - `NEXT_PUBLIC_USE_BACKEND`: `true`
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.railway.app` (from Part A)
3. Deploy

### Production Characteristics:
✅ Handles 3-5K+ applications
✅ Persistent PostgreSQL database
✅ Production-ready architecture
✅ Can scale horizontally
💰 May have hosting costs (Railway/Render free tiers available)

---

## Switching Between Modes

The beauty of this architecture: **Just change environment variables!**

**From Demo → Production:**
1. Deploy backend (Railway/Render)
2. Update Vercel environment variables:
   - `NEXT_PUBLIC_USE_BACKEND=true`
   - `NEXT_PUBLIC_API_URL=<your-backend-url>`
3. Redeploy frontend (automatic in Vercel)

**No code changes needed!**

---

## Testing Locally

### Test Demo Mode:
```bash
cd frontend
npm run dev
```
Visit `http://localhost:3000`

### Test with Backend:
Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Terminal 2 (Frontend):
```bash
cd frontend
# Edit .env.local: NEXT_PUBLIC_USE_BACKEND=true
npm run dev
```

---

## Recommended Path

1. **Week 1**: Deploy Demo Mode to Vercel
   - Show client the working demo
   - Get feedback on UI/UX
   - Test with 10-20 sample resumes

2. **Week 2-3**: Iterate based on feedback
   - Adjust scoring criteria
   - UI improvements
   - Add features

3. **Week 4**: Deploy Production Mode
   - Once client approves, deploy backend
   - Switch to production mode
   - Handle real 3-5K applications

---

## Environment Variables Reference

### Frontend (.env.local)

**Demo Mode:**
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_USE_BACKEND=false
```

**Production Mode:**
```env
NEXT_PUBLIC_USE_BACKEND=true
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend (.env)

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...  # Auto-provided by Railway/Render
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

---

## Troubleshooting

### "Build failed" on Vercel
- Check that root directory is set to `frontend`
- Ensure all dependencies are in package.json

### "API connection failed"
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running (visit backend URL in browser)
- Ensure CORS is configured in backend

### "OpenAI API Error"
- Check API key is valid
- Ensure you have credits in OpenAI account
- Check rate limits

---

## Cost Estimates

### Demo Mode:
- Vercel: Free (Hobby plan)
- OpenAI API: ~$0.03 per resume screening
- **Total for 50 resumes**: ~$1.50

### Production Mode:
- Vercel: Free (Hobby plan)
- Railway/Render: Free tier or $5-20/month
- PostgreSQL: Included with Railway/Render
- OpenAI API: ~$0.03 per resume
- **Total for 3000 resumes**: ~$90 + hosting

---

## Support

- Frontend issues: See `/frontend/README.md`
- Backend issues: See `/backend/README.md`
- Deployment: This guide

Good luck with your deployment! 🚀
