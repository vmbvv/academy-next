# Erxes Academy

Movie browsing and review app built with Next.js, Auth.js, Prisma, and MongoDB.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
copy .env.example .env
```

3. Fill in `.env`:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

4. Sync Prisma with MongoDB:

```bash
npx prisma generate
npx prisma db push
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- The first registered user becomes `ADMIN`.
- OAuth sign-in requires GitHub and Google credentials in `.env`.
- Build for production with:

```bash
npm run build
```
