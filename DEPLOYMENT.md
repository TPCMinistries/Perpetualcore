# Deployment Guide

## Deploy to Vercel (Recommended)

### Prerequisites
- GitHub repository with your code
- Vercel account
- Domain: ai.lorenzodc.com

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Perpetual Core Platform setup"
git branch -M main
git remote add origin your-github-repo-url
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

### Step 3: Add Environment Variables

In Vercel project settings > Environment Variables, add all from `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://ai.lorenzodc.com/api/auth/google/callback

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App Config
NEXT_PUBLIC_APP_URL=https://ai.lorenzodc.com
```

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Step 5: Configure Custom Domain

1. In Vercel project settings > Domains
2. Add domain: `ai.lorenzodc.com`
3. Vercel will provide DNS records

#### DNS Configuration

Add these records to your domain registrar (where lorenzodc.com is hosted):

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: ai
Value: cname.vercel-dns.com
```

**Option B: A Record**
```
Type: A
Name: ai
Value: 76.76.21.21
```

4. Wait for DNS propagation (up to 48 hours, usually much faster)
5. SSL certificate will be automatically provisioned by Vercel

### Step 6: Update External Services

#### Google Cloud Console
1. Update OAuth Authorized Redirect URIs:
   - `https://ai.lorenzodc.com/api/auth/google/callback`

#### Stripe Dashboard
1. Update webhook endpoint:
   - `https://ai.lorenzodc.com/api/webhooks/stripe`
2. Get new webhook secret and update in Vercel env vars

#### Twilio Console
1. Update WhatsApp webhook:
   - `https://ai.lorenzodc.com/api/webhooks/twilio`

### Step 7: Test Production

1. Visit https://ai.lorenzodc.com
2. Test authentication flow
3. Test AI chat
4. Test document upload
5. Verify all integrations

## Alternative: Deploy to Custom VPS

### Prerequisites
- Ubuntu 22.04 server
- Node.js 18+
- Nginx
- SSL certificate (Let's Encrypt)

### Setup Steps

1. **SSH into your server**
```bash
ssh user@your-server-ip
```

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PM2**
```bash
sudo npm install -g pm2
```

4. **Clone repository**
```bash
git clone your-repo-url
cd ai-os-platform
```

5. **Install dependencies**
```bash
npm install
```

6. **Create .env.local**
```bash
nano .env.local
# Paste your environment variables
```

7. **Build application**
```bash
npm run build
```

8. **Start with PM2**
```bash
pm2 start npm --name "ai-os" -- start
pm2 save
pm2 startup
```

9. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/ai.lorenzodc.com
```

```nginx
server {
    listen 80;
    server_name ai.lorenzodc.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

10. **Enable site**
```bash
sudo ln -s /etc/nginx/sites-available/ai.lorenzodc.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

11. **Install SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d ai.lorenzodc.com
```

## Monitoring & Maintenance

### Vercel
- View logs in Vercel dashboard
- Set up error tracking (Sentry)
- Configure alerts

### Custom VPS
```bash
# View logs
pm2 logs ai-os

# Restart app
pm2 restart ai-os

# View status
pm2 status

# Monitor
pm2 monit
```

## CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Backup Strategy

### Database (Supabase)
- Supabase automatically backs up your database
- Additional manual backups:
  ```bash
  # Export from Supabase dashboard or via CLI
  supabase db dump -f backup.sql
  ```

### Code
- GitHub repository is your primary backup
- Tag releases:
  ```bash
  git tag -a v1.0.0 -m "Version 1.0.0"
  git push origin v1.0.0
  ```

### Environment Variables
- Keep secure backup of `.env.local`
- Store in password manager or secure vault
- Document all API keys and secrets

## Scaling Considerations

### Database
- Supabase Pro plan for better performance
- Connection pooling enabled
- Read replicas for heavy read workloads

### API Rate Limits
- Implement rate limiting middleware
- Cache responses where appropriate
- Queue background jobs

### File Storage
- Use Supabase Storage or S3
- CDN for static assets
- Image optimization

### Monitoring
- Set up error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (UptimeRobot, Better Uptime)

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] Database RLS policies are enabled
- [ ] CORS is configured properly
- [ ] Rate limiting is implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Supabase client)
- [ ] XSS prevention (React escaping)
- [ ] CSRF tokens for forms
- [ ] Secure session management
- [ ] HTTPS enforced
- [ ] Security headers configured

## Performance Optimization

### Next.js
- Enable Image Optimization
- Use dynamic imports for large components
- Implement ISR (Incremental Static Regeneration) where appropriate

### Database
- Add indexes for frequently queried fields
- Use connection pooling
- Optimize vector search parameters

### Caching
- Redis for session storage (optional)
- API response caching
- Static asset CDN

## Cost Optimization

### AI API Usage
- Implement token limits per user/org
- Cache common responses
- Use cheaper models when appropriate
- Stream responses to reduce timeouts

### Database
- Regular cleanup of old data
- Archive strategy for historical data
- Optimize vector storage

### Infrastructure
- Start with Vercel free tier
- Scale up based on actual usage
- Monitor and optimize bundle size
