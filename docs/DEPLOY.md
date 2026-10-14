# TaskFlow Deploy Guide (Roman Urdu + English)

**Recommended stack:** Backend → **Render** · Frontend → **Vercel** · Database → **MongoDB Atlas** (already set)

---

## Step 0 — Pehle yeh karo

1. **GitHub** pe latest code push ho (repo: `abdullahyafai077/TaskFlow`)
2. **MongoDB Atlas** → Network Access → `0.0.0.0/0` allow (Render ka IP fixed nahi hota)
3. Apna `MONGO_URI` copy karo (`Server/.env` se — password secret rakho)

---

## Step 1 — Backend deploy (Render)

1. Open: https://render.com → Sign up (GitHub se)
2. **New +** → **Blueprint**
3. Connect repo: `abdullahyafai077/TaskFlow`
4. Render `Server/render.yaml` detect karega
5. **Environment variables** set karo:

| Key | Value |
|-----|--------|
| `MONGO_URI` | tumhari Atlas connection string (`/TaskFlow` database) |
| `CLIENT_ORIGIN` | abhi temporary: `http://localhost:3000` (Step 2 ke baad Vercel URL daalenge) |

6. **Deploy** — 3–5 min wait
7. URL milega jaise: `https://taskflow-api.onrender.com`
8. Test: browser mein open karo  
   `https://taskflow-api.onrender.com/api/health`  
   → `{"ok":true,"service":"taskflow-api"}`

**Note:** Free tier pe server sleep ho sakta hai — pehli request 30–60 sec slow ho sakti hai.

---

## Step 2 — Frontend deploy (Vercel)

1. Open: https://vercel.com → Sign up (GitHub se)
2. **Add New Project** → import `TaskFlow` repo
3. **Important settings:**

| Setting | Value |
|---------|--------|
| **Root Directory** | `Client` |
| Framework | Next.js (auto) |
| Build Command | `npm run build` |
| Output | default |

4. **Environment Variables:**

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://taskflow-api.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://taskflow-api.onrender.com` |

5. **Deploy**
6. URL milega jaise: `https://taskflow.vercel.app`

---

## Step 3 — CORS fix (zaroori)

Vercel URL milne ke baad:

1. **Render** → `taskflow-api` → **Environment**
2. `CLIENT_ORIGIN` update karo:

```
https://taskflow.vercel.app
```

Agar custom domain ho to comma se multiple:

```
https://taskflow.vercel.app,https://www.yourdomain.com
```

3. Save — Render auto-restart karega

---

## Step 4 — Live test

1. Vercel URL open → `/register`
2. Account banao → workspace → project → task
3. Doosra tab/incognito → same workspace → drag task → **live sync** check
4. Activity feed update honi chahiye

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API 500 / DB error | Atlas IP whitelist `0.0.0.0/0`, `MONGO_URI` correct |
| CORS error in browser | `CLIENT_ORIGIN` = exact Vercel URL (no trailing slash) |
| Socket connect fail | `NEXT_PUBLIC_SOCKET_URL` = Render URL without `/api` |
| Slow first load | Render free tier cold start — normal |
| Login works locally not live | Env vars Vercel pe set? Redeploy after env change |

---

## Optional — Custom domain

- **Vercel:** Project → Settings → Domains
- **Render:** Service → Settings → Custom Domain
- `CLIENT_ORIGIN` mein custom domain add karo

---

## Security reminder

- GitHub remote mein token URL mein **mat** rakho — revoke karo agar leak ho
- Production `JWT_SECRET` strong random string use karo
- `.env` files kabhi commit mat karo (already in `.gitignore`)

---

## Quick reference

```
User Browser (Vercel)
    ↓ HTTPS REST + JWT
Render API (taskflow-api.onrender.com)
    ↓
MongoDB Atlas (TaskFlow DB)
    ↑ Socket.io rooms (same Render URL)
```

**Portfolio line:**  
*"Live demo: Vercel frontend + Render API + Atlas MongoDB with real-time Socket.io rooms."*
