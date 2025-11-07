# 🚀 Deployment Guide - Saper QR

## Problem Diagnosis

**Issue:** Snake minigame not visible in Host panel on production (Fly.io)

**Root Cause:** Code changes are committed to GitHub but **not deployed to Fly.io**

### Evidence
- ✅ Local file `templates/host.html` contains Snake section (line 426)
- ✅ JavaScript handlers for Snake are present (line 1343)
- ✅ API endpoints support Snake (`/api/host/minigames/status`)
- ❌ Production returns `null` for `document.getElementById('snake-minigame-card')`
- ❌ Production uses old version of templates

## Solution: Automated Deployment

### Option 1: GitHub Actions (Recommended) ✨

A GitHub Actions workflow has been created: `.github/workflows/fly-deploy.yml`

**Setup Steps:**

1. **Get Fly.io API Token:**
   ```bash
   flyctl auth token
   ```

2. **Add token to GitHub Secrets:**
   - Go to: https://github.com/michalkopec1981/Saper-Fly/settings/secrets/actions
   - Click "New repository secret"
   - Name: `FLY_API_TOKEN`
   - Value: [paste token from step 1]
   - Click "Add secret"

3. **Trigger deployment:**
   - Push to `main` branch, OR
   - Go to Actions → "Deploy to Fly.io" → "Run workflow"

**After setup:** Every push to `main` will automatically deploy to Fly.io! 🎉

---

### Option 2: Manual Deployment

If you prefer manual deployments:

```bash
# Install flyctl (if not installed)
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
flyctl auth login

# Deploy from project root
flyctl deploy
```

**Important:** Run this command every time you want to deploy changes!

---

## Verification

After deployment, verify Snake is visible:

1. **Open Host panel** on production
2. **Go to "Minigry" tab**
3. **You should see 3 games:**
   - 🎮 Tetris
   - 🏓 Arkanoid
   - 🐍 Snake ← **Should be visible now!**

4. **Or check via console (F12):**
   ```javascript
   document.getElementById('snake-minigame-card')
   // Should return: <div class="card mb-3" id="snake-minigame-card">...</div>
   ```

5. **Or visit debug endpoint:**
   ```
   https://your-app.fly.dev/debug/template-info
   ```
   Should show: `"has_snake_section": true`

---

## Current Status

- **Local code:** ✅ Up to date (includes Snake)
- **GitHub repo:** ✅ Up to date (branch: `claude/fix-snake-game-tab-011CUqbkzbGE3xdHHLZwNS4U`)
- **Fly.io production:** ❌ **Needs deployment**

## Next Steps

1. ✅ Merge PR to `main` branch
2. ⚙️ Set up GitHub Actions (add FLY_API_TOKEN secret)
3. 🚀 Deployment will happen automatically on next push!

OR manually run: `flyctl deploy`

---

## Troubleshooting

**Q: Still don't see Snake after deployment?**

A: Clear browser cache with **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

**Q: How do I know if deployment succeeded?**

A: Check GitHub Actions tab or run `flyctl status`

**Q: Can I deploy from a feature branch?**

A: Yes! Modify `.github/workflows/fly-deploy.yml` to include your branch name

---

*Last updated: 2025-11-05*
