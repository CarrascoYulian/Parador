import { StrictMode, Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/manrope';
import './styles/global.css';
import { ContentProvider, fetchContent, readEmbeddedContent } from './lib/content';
import type { Content } from './lib/types';
import { App } from './App';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function Site() {
  const [content, setContent] = useState<Content | null>(readEmbeddedContent);
  useEffect(() => {
    if (!content) fetchContent().then(setContent).catch(console.error);
  }, [content]);
  if (!content) return null;
  return (
    <ContentProvider value={content}>
      <App />
    </ContentProvider>
  );
}

const isAdmin = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      {isAdmin ? (
        <Suspense fallback={null}>
          <AdminApp />
        </Suspense>
      ) : (
        <Site />
      )}
    </MotionConfig>
  </StrictMode>,
);
