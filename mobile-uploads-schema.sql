-- Mobile uploads table for cross-device file sharing
CREATE TABLE IF NOT EXISTS mobile_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Stores filename, not public URL
  original_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_mobile_uploads_session_id ON mobile_uploads(session_id);

-- Index for cleanup of old uploads
CREATE INDEX IF NOT EXISTS idx_mobile_uploads_created_at ON mobile_uploads(created_at);

-- Enable RLS
ALTER TABLE mobile_uploads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for mobile uploads)
CREATE POLICY "mobile_uploads_insert" ON mobile_uploads FOR INSERT WITH CHECK (true);

-- Allow anyone to select (for desktop polling)
CREATE POLICY "mobile_uploads_select" ON mobile_uploads FOR SELECT USING (true);

-- Allow cleanup of old uploads (optional)
CREATE POLICY "mobile_uploads_delete_old" ON mobile_uploads FOR DELETE USING (created_at < NOW() - INTERVAL '24 hours');
