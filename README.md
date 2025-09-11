# Portraitly - AI Headshot Generator

An AI-powered headshot generator that creates professional portraits from casual selfies while preserving facial identity.

## Features

- 🎯 **Identity Preservation**: Powered by advanced AI that maintains facial consistency
- 🚀 **Quick Generation**: Upload a selfie, get professional headshots in seconds
- 💳 **Credit System**: Start with 10 free credits, each generation costs 1 credit
- 🔐 **Secure Auth**: Google OAuth integration with Supabase
- 📱 **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Deployment**: Vercel
- **AI**: Placeholder for Nano Banana integration (Phase 2)

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Google OAuth credentials

### 1. Clone and Install

```bash
git clone <your-repo>
cd portraitly
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Enable Google OAuth in Authentication > Providers
4. Create a storage bucket named `photos` (public)

### 3. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Project Structure

```
portraitly/
├── app/
│   ├── api/generate-headshot/    # API route for headshot generation
│   ├── dashboard/                # Dashboard page (protected)
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/
│   ├── Dashboard.tsx            # Main dashboard component
│   └── LandingPage.tsx          # Landing page component
├── lib/
│   ├── database.ts              # Database helper functions
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   └── server.ts            # Server-side Supabase
│   └── supabase-provider.tsx    # React context provider
└── supabase-schema.sql          # Database schema
```

## Database Schema

### Users Table
- `id`: UUID (primary key)
- `email`: User email
- `credits_remaining`: Number of credits left
- `created_at`: Timestamp

### Photos Table
- `id`: UUID (primary key)
- `user_id`: Foreign key to users
- `original_url`: URL of uploaded selfie
- `generated_url`: URL of generated headshot
- `created_at`: Timestamp

## API Endpoints

### POST /api/generate-headshot

Generates a professional headshot from an uploaded selfie.

**Request Body:**
```json
{
  "originalUrl": "https://...",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "generatedUrl": "https://...",
  "photoId": "uuid",
  "creditsRemaining": 9
}
```

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

The app is configured for Vercel deployment with proper Next.js settings.

## Phase 2 Roadmap

- [ ] Integrate Nano Banana AI for actual headshot generation
- [ ] Add Stripe payment integration
- [ ] Multiple headshot styles (LinkedIn, editorial, etc.)
- [ ] Batch processing
- [ ] Advanced credit packages
- [ ] User profile management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
