# Portraitly - AI Headshot Generator

Transform casual selfies into professional headshots with AI-powered technology. Portraitly preserves facial identity while creating stunning professional portraits perfect for LinkedIn, resumes, and business profiles.

## ✨ Features

- 🎯 **Identity Preservation**: Advanced AI maintains facial consistency
- 🚀 **Quick Generation**: Professional headshots in seconds
- 💳 **Flexible Pricing**: 10 free credits, then Pro plan with 200 credits/month
- 🔐 **Secure Authentication**: Google OAuth integration
- 📱 **Mobile Upload**: QR code upload for mobile photos
- 💼 **Multiple Styles**: Professional, Finance, Tech, Creative, Executive, Editorial
- 🎨 **Beautiful UI**: Modern, responsive design

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Google OAuth
- **Payments**: Stripe
- **Storage**: Supabase Storage
- **AI**: Gemini API
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/portraitly.git
   cd portraitly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.local.template .env.local
   ```
   
   Fill in your environment variables:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRO_PRICE_ID=price_...
   
   # AI
   GEMINI_API_KEY=your_gemini_api_key
   
   # App
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Run the SQL scripts in your Supabase SQL Editor:
   - `supabase-schema.sql` - Main database schema
   - `mobile-uploads-schema.sql` - Mobile uploads table
   - `minimal-stripe-migration.sql` - Stripe integration

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
portraitly/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication
│   ├── dashboard/         # Dashboard page
│   ├── pricing/           # Pricing page
│   └── mobile-upload/     # Mobile upload page
├── components/            # React components
├── lib/                   # Utility functions
├── docs/                  # Documentation
└── *.sql                  # Database schemas
```

## 🔧 Core Flows

### Authentication Flow
1. User clicks "Try for Free" on landing page
2. Google OAuth authentication via Supabase
3. User record created in database
4. Redirect to dashboard with 10 free credits

### AI Generation Flow
1. User uploads selfie (drag & drop or mobile QR)
2. Selects professional style and attire preference
3. AI processes image using Gemini API
4. User downloads professional headshot
5. Credit deducted from account

### Subscription Flow
1. User visits pricing page
2. Selects Pro plan ($19.99/month)
3. Stripe checkout session created
4. Payment processed
5. Webhook updates user to Pro plan with 200 credits
6. Monthly credit refills via webhook

## 💳 Pricing

- **Free Plan**: 10 credits to start
- **Pro Plan**: $19.99/month for 200 credits
- Credits reset monthly on billing date
- Cancel anytime through billing portal

## 🔒 Security

- Row Level Security (RLS) enabled on all database tables
- Supabase Auth handles secure authentication
- Stripe webhook signature verification
- Secure file upload validation
- API rate limiting

## 📚 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - Detailed technical documentation
- [Environment Variables](env.local.template) - Required environment variables

## 🚀 Deployment

The application is production-ready and deployed on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up Stripe webhook endpoint: `https://yourdomain.com/api/stripe/webhooks`
4. Deploy automatically on git push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@portraitly.com or create an issue in the GitHub repository.

---

Built with ❤️ by the Portraitly team