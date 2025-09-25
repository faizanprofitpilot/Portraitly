import MobileUploadClient from '@/components/MobileUploadClient';

interface MobileUploadPageProps {
  searchParams: { session?: string };
}

export default function MobileUploadPage({ searchParams }: MobileUploadPageProps) {
  const sessionId = searchParams.session || null;

  return <MobileUploadClient sessionId={sessionId} />;
}
