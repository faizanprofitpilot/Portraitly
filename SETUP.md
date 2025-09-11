# 🚀 Portraitly Setup Guide

Follow these steps to get your Portraitly MVP running locally:

## 1. Install Dependencies

```bash
npm install
```

## 2. Set up Supabase

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (usually 2-3 minutes)

### Run Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to execute the schema

### Configure Authentication
1. Go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Set redirect URL to: `http://localhost:3000/auth/callback`

### Set up Storage
1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `photos`
3. Make it **public**

## 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

You can find these values in your Supabase project settings:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 4. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 5. Test the Flow

1. **Landing Page**: Click "Get Started" to sign in with Google
2. **Dashboard**: Upload a selfie image
3. **Generation**: Click "Generate Headshot" (returns placeholder for now)
4. **Credits**: Watch your credits decrease from 10 to 9

## 🎯 What's Working

✅ **Authentication**: Google OAuth sign-in/sign-out  
✅ **Database**: User and photo storage  
✅ **Credits System**: 10 free credits, decrements on generation  
✅ **Image Upload**: Supabase storage integration  
✅ **Mock Generation**: Placeholder headshot generation  
✅ **Responsive UI**: Beautiful Tailwind design  
✅ **Vercel Ready**: Configured for deployment  

## 🔧 Next Steps (Phase 2)

- Replace mock generation with actual AI (Nano Banana)
- Add Stripe payment integration
- Multiple headshot styles
- Batch processing
- Advanced credit packages

## 🐛 Troubleshooting

**Google OAuth not working?**
- Check your redirect URLs in Google Console
- Ensure Supabase auth settings match

**Database errors?**
- Verify the schema was run correctly
- Check RLS policies are enabled

**Image upload failing?**
- Confirm storage bucket is public
- Check file size limits (10MB max)

**Need help?** Check the main README.md for detailed documentation.
