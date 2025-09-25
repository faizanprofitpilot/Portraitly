# Portraitly Architecture Guide

## Overview

Portraitly is a production-ready SaaS application that transforms casual selfies into professional headshots using AI. The application follows a clean, scalable architecture with three core flows.

## Core Flows

### 1. Authentication Flow
```
User → Google OAuth → Supabase Auth → Dashboard
```

**Components:**
- `app/page.tsx` - Home page with auth check
- `components/LandingPage.tsx` - Landing page with sign-in
- `app/auth/callback/route.ts` - OAuth callback handler
- `app/dashboard/page.tsx` - Protected dashboard

**Database:**
- `users` table with `auth_user_id` linking to Supabase auth
- Automatic user creation on first login

### 2. AI Generation Flow
```
Upload → Storage → AI Processing → Download
```

**Components:**
- `components/Demo.tsx` - Main upload interface
- `app/api/generate-headshot/route.ts` - AI generation endpoint
- `app/api/mobile-upload/route.ts` - Mobile upload handling
- `components/MobileUploadModal.tsx` - Mobile upload UI

**Features:**
- Drag & drop file upload
- Mobile QR code upload
- Credit system (10 free, 200/month Pro)
- Multiple style options

### 3. Subscription Flow
```
Pricing → Stripe Checkout → Webhook → Credit Refill
```

**Components:**
- `app/pricing/page.tsx` - Pricing page
- `components/PricingSection.tsx` - Pricing tiers
- `app/api/stripe/checkout/route.ts` - Checkout creation
- `app/api/stripe/webhooks/route.ts` - Webhook handler
- `app/api/stripe/billing-portal/route.ts` - Billing management

**Features:**
- Free plan: 10 credits
- Pro plan: 200 credits/month
- Stripe billing portal integration
- Automatic credit refills

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Google OAuth
- **Payments**: Stripe
- **Storage**: Supabase Storage
- **AI**: Gemini API
- **Deployment**: Vercel

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  credits_remaining INTEGER NOT NULL DEFAULT 10,
  subscription_status TEXT DEFAULT 'free',
  subscription_plan TEXT,
  subscription_id TEXT,
  stripe_customer_id TEXT,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Mobile Uploads Table
```sql
CREATE TABLE mobile_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Production Endpoints
- `GET /api/user` - Get user data
- `POST /api/generate-headshot` - Generate AI headshot
- `POST /api/mobile-upload` - Handle mobile uploads
- `GET /api/mobile-uploads` - Poll for mobile uploads
- `POST /api/stripe/checkout` - Create Stripe checkout
- `POST /api/stripe/webhooks` - Handle Stripe webhooks
- `POST /api/stripe/billing-portal` - Create billing portal session
- `POST /api/cleanup-mobile-uploads` - Cleanup old uploads

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

# AI
GEMINI_API_KEY=

# App
NEXT_PUBLIC_SITE_URL=
```

## Deployment

The application is deployed on Vercel with the following configuration:
- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard
- Stripe webhook endpoint: `https://www.portraitly.xyz/api/stripe/webhooks`

## Security

- Row Level Security (RLS) enabled on all tables
- Supabase Auth handles authentication
- Stripe webhook signature verification
- API rate limiting through Vercel
- Secure file upload validation
