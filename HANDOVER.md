# Portraitly - AI Headshot Generator
## 🚀 Complete Handover Guide for New Owner

> **Ready-to-deploy SaaS application** with AI-powered professional headshot generation, mobile QR upload system, and complete Stripe billing integration.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Environment Setup](#environment-setup)
4. [Deployment](#deployment)
5. [Core Features](#core-features)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Maintenance Tasks](#maintenance-tasks)
9. [Buyer Checklist](#buyer-checklist)
10. [Support & Documentation](#support--documentation)

---

## 🎯 Project Overview

**Portraitly** transforms casual selfies into professional headshots using advanced AI technology. The platform preserves facial identity while creating stunning professional portraits perfect for LinkedIn, resumes, and business profiles.

### Core Value Proposition
- **Identity Preservation**: Advanced AI maintains facial consistency across different styles
- **Professional Quality**: Magazine-quality headshots in seconds
- **Mobile-First**: QR code upload system for seamless mobile-to-desktop workflow
- **Flexible Pricing**: 10 free credits to start, then $19.99/month Pro plan

### Key Metrics
- **Free Tier**: 10 credits (perfect for testing)
- **Pro Tier**: 200 credits/month ($19.99/month)
- **Conversion**: Free users can easily upgrade to Pro
- **Revenue**: Recurring monthly subscriptions via Stripe

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React hooks

### Backend
- **Runtime**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Google OAuth
- **Storage**: Supabase Storage
- **Payments**: Stripe (subscriptions, billing portal, webhooks)

### AI & Processing
- **AI Provider**: Google Gemini 2.5 Flash Image Preview
- **Image Processing**: Canvas API for QR code generation
- **File Handling**: Next.js file uploads with type validation

### Deployment
- **Platform**: Vercel
- **Domain**: www.portraitly.xyz
- **CDN**: Vercel Edge Network
- **SSL**: Automatic HTTPS

---

## ⚙️ Environment Setup

### Required Environment Variables

Add these to your **Vercel Dashboard → Project Settings → Environment Variables**:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51...your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...your_stripe_publishable_key
STRIPE_PRO_PRICE_ID=price_1...your_monthly_subscription_price_id
STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# App Configuration
NEXT_PUBLIC_SITE_URL=https://www.portraitly.xyz
```

### Environment Variable Sources

1. **Supabase**: [Dashboard → Settings → API](https://supabase.com/dashboard)
2. **Stripe**: [Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
3. **Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 🚀 Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/portraitly)

### Manual Deployment

1. **Fork this repository**
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Set up Supabase**:
   - Create new project at [supabase.com](https://supabase.com)
   - Run the SQL migration (see Database Schema section)
   - Configure Google OAuth provider

4. **Set up Stripe**:
   - Create products and prices in Stripe Dashboard
   - Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Add webhook secret to environment variables

---

## ✨ Core Features

### 1. Authentication Flow
- **Google OAuth**: One-click sign-in with Google
- **User Creation**: Automatic user creation with 10 free credits
- **Session Management**: Secure session handling via Supabase Auth

### 2. Credit System
- **Free Tier**: 10 credits for new users
- **Pro Tier**: 200 credits/month for $19.99
- **Credit Consumption**: 1 credit per AI generation
- **Real-time Updates**: Credits update immediately after generation

### 3. Mobile QR Upload System
- **QR Code Generation**: Unique session-based QR codes
- **Mobile Upload**: Users scan QR code to upload photos from mobile
- **Desktop Sync**: Real-time polling for uploaded images
- **Auto-cleanup**: Old uploads cleaned up after 24-48 hours

### 4. AI Headshot Generation
- **Style Options**: Professional, Finance, Tech, Creative, Executive, Editorial
- **Identity Preservation**: Advanced AI maintains facial consistency
- **High Quality**: Professional-grade output suitable for business use
- **Batch Processing**: Generate multiple styles from one upload

### 5. Stripe Integration
- **Subscription Management**: Monthly Pro plan billing
- **Billing Portal**: Customer self-service for plan changes
- **Webhook Handling**: Automatic credit refills and status updates
- **Payment Processing**: Secure card payments via Stripe Checkout

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 10,
  plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'free',
  subscription_plan TEXT,
  subscription_id TEXT,
  stripe_customer_id TEXT,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Uploads Table
```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Functions
- `consume_credit(user_id UUID)`: Deducts 1 credit from user account
- Row Level Security (RLS) enabled on all tables

---

## 🔌 API Endpoints

### Authentication
- `POST /api/user` - Get or create user data
- `GET /auth/callback` - OAuth callback handler

### Image Processing
- `POST /api/mobile-upload` - Handle mobile QR uploads
- `GET /api/mobile-uploads` - Poll for uploaded images
- `POST /api/generate-headshot` - Generate AI headshots
- `POST /api/cleanup-mobile-uploads` - Clean old uploads

### Stripe Integration
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/billing-portal` - Access billing portal
- `POST /api/stripe/webhook` - Handle Stripe events

### Debug & Monitoring
- `GET /api/stripe/debug` - Check Stripe environment variables
- `GET /api/debug-schema` - Inspect database schema

---

## 🔧 Maintenance Tasks

### Adding New AI Styles
1. **Update style options** in `components/Demo.tsx`:
```typescript
const STYLE_OPTIONS = [
  { id: 'newstyle', name: 'New Style', description: 'Style description' },
  // ... existing styles
]
```

2. **Update AI prompts** in `app/api/generate-headshot/route.ts`
3. **Test the new style** with various input images

### Managing Storage Cleanup
- **Automatic cleanup**: Runs via API endpoint `/api/cleanup-mobile-uploads`
- **Manual cleanup**: Check Supabase Storage dashboard for orphaned files
- **Storage monitoring**: Monitor usage in Supabase dashboard

### Monitoring & Logs
- **Vercel Logs**: Check function logs in Vercel dashboard
- **Supabase Logs**: Monitor database queries and auth events
- **Stripe Dashboard**: Track webhook delivery and payment events
- **Error Tracking**: Check browser console and server logs

### Database Maintenance
- **Backup**: Supabase handles automatic backups
- **Migrations**: Use Supabase SQL Editor for schema changes
- **Performance**: Monitor query performance in Supabase dashboard

---

## ✅ Buyer Checklist

### Immediate Setup (Required)
- [ ] **Update environment variables** in Vercel dashboard
- [ ] **Create new Stripe account** and update API keys
- [ ] **Set up new Supabase project** and update connection strings
- [ ] **Update Google OAuth** with your domain in Google Console
- [ ] **Test Stripe webhook** endpoint is receiving events
- [ ] **Verify Supabase policies** are active and working

### Domain & Branding
- [ ] **Update domain name** in environment variables
- [ ] **Customize branding** (logo, colors, copy) in components
- [ ] **Update Stripe branding** in dashboard
- [ ] **Configure email templates** for user communications

### Testing & Validation
- [ ] **Test complete user flow**: Sign up → Upload → Generate → Upgrade
- [ ] **Verify Stripe payments** work end-to-end
- [ ] **Test mobile QR upload** functionality
- [ ] **Check webhook delivery** in Stripe dashboard
- [ ] **Validate credit system** updates correctly

### Legal & Compliance
- [ ] **Update Terms of Service** and Privacy Policy
- [ ] **Configure GDPR compliance** if serving EU users
- [ ] **Set up proper error tracking** (Sentry, LogRocket, etc.)
- [ ] **Implement analytics** (Google Analytics, Mixpanel, etc.)

---

## 📚 Support & Documentation

### Key Files to Know
- `components/Demo.tsx` - Main dashboard component
- `app/api/generate-headshot/route.ts` - AI generation logic
- `app/api/stripe/webhook/route.ts` - Payment processing
- `lib/database.ts` - Database interface functions

### Common Issues & Solutions
1. **Credits not updating**: Check webhook delivery in Stripe dashboard
2. **Upload failures**: Verify Supabase storage permissions
3. **AI generation errors**: Check Gemini API key and quotas
4. **Payment issues**: Verify Stripe webhook secret matches

### Performance Optimization
- **Image optimization**: Consider adding image compression
- **Caching**: Implement Redis for session management
- **CDN**: Already using Vercel Edge Network
- **Database indexing**: Monitor query performance

### Scaling Considerations
- **Rate limiting**: Add rate limiting for API endpoints
- **Queue system**: Consider adding job queues for AI processing
- **Monitoring**: Implement comprehensive error tracking
- **Backup strategy**: Set up automated database backups

---

## 🎉 Ready to Launch!

This application is **production-ready** with:
- ✅ Complete Stripe integration
- ✅ Secure authentication
- ✅ Mobile-friendly upload system
- ✅ AI-powered image generation
- ✅ Professional UI/UX
- ✅ Comprehensive error handling
- ✅ Scalable architecture

**Total Development Time**: ~40+ hours of professional development
**Estimated Market Value**: $5,000 - $15,000+ for a SaaS application of this complexity

---

*For technical support or questions about this handover, please refer to the inline code comments and this documentation. The codebase is well-structured and documented for easy maintenance and feature additions.*
