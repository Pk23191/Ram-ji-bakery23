JWT authentication fixes for production (Vercel frontend + Render backend)
=================================================

Purpose: concise checklist and code snippets to resolve "Invalid token" and "Unable to load dashboard/orders" in production.

1) Verify login returns and stores the token (frontend)
- Backend must return a JSON token on successful login:

```js
// backend login handler
// after verifying user credentials
const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user });
```

- Frontend must save exactly that token string (no extra wrapping):

```js
// after login response
const data = await res.json();
localStorage.setItem('token', data.token);
```

2) Send the token on every protected request
- Minimal fetch example (works on Vercel):

```js
const token = localStorage.getItem('token');
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
});

if (res.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

- Axios global example (recommended if using axios):

```js
axios.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

axios.interceptors.response.use(null, err => {
  if (err.response && err.response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});
```

3) Backend auth middleware (Express example)
- Ensure middleware reads the header and verifies with the same secret used to sign tokens:

```js
const auth = (req, res, next) => {
  const header = req.headers.authorization || req.headers.Authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;
```

4) Environment variables on Render (critical)
- Set `JWT_SECRET` in Render to the same value used for local/dev tokens.
- Also set `FRONTEND_URL` (your Vercel URL) and `NODE_ENV=production`.
- If you rotate the secret, all previously issued tokens become invalid.

5) CORS and Allowed Headers
- Make sure backend allows the frontend origin and the `Authorization` header. Example using cors middleware:

```js
const corsOptions = {
  origin: process.env.FRONTEND_URL, // https://your-site.vercel.app
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};
app.use(cors(corsOptions));
```

6) Debugging checklist (quick)
- In browser devtools -> Application -> Local Storage: confirm `token` exists and matches login response.
- In Network tab, inspect the protected request: check `Authorization` header contains `Bearer <token>`.
- If 401: copy token and run `jwt.verify(token, JWT_SECRET)` locally (Node REPL) to ensure validity.

7) Test API directly (Postman / curl)
- Use a fresh token from login and call orders endpoint:

curl example:

```bash
curl -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  ${API_URL}/orders
```

Postman: Add header `Authorization: Bearer <token>` and call `GET /api/orders`.

8) Token expiry and clock skew
- Ensure the server clock is correct. If tokens seem valid but verify fails, check expiry (`exp`) claim and server time.

9) Auto-logout and UX
- On any protected request that returns 401, clear token and redirect to login to avoid repeated "Invalid token" messages.

10) Common pitfalls
- Storing a JSON object instead of the token string: ensure you store `data.token`, not `JSON.stringify(data)`.
- Using different `JWT_SECRET` values across environments.
- Forgetting to send `Authorization` header from client (double-check fetch/axios wrappers and SSR calls).

If you want, I can:
- search the repo for existing login, fetch/axios wrappers and update them to include the Authorization header,
- add server middleware file or patch the existing auth middleware,
- or generate a short test script to verify an issued token against the Render environment.

---
Saved file: JWT_AUTH_PRODUCTION_FIX.md
