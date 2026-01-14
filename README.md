# Meta SaaS (ready-to-run)

## 1) Install system deps (Mac)
```bash
brew install exiftool ffmpeg
```

## 2) Install node deps
```bash
npm install
```

## 3) Run
```bash
npm run dev
```

Open http://localhost:3000

### Email verification
- If you configure SMTP in `.env`, users will receive the verification email.
- If you DON'T configure SMTP, the app will **print the verification link in the server console** (dev-friendly).
