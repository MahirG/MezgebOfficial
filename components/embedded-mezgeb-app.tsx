'use client';

import { useRef, useState } from 'react';

type EmbeddedMezgebAppProps = {
  documentHtml: string;
  className?: string;
  showFullscreenControl?: boolean;
};

export function EmbeddedMezgebApp({
  documentHtml,
  className = 'mezgebAppFrame',
  showFullscreenControl = false
}: EmbeddedMezgebAppProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState('');

  async function openFullscreen() {
    try {
      await iframeRef.current?.requestFullscreen();
    } catch {
      setError('Full-screen mode is unavailable in this browser.');
    }
  }

  return (
    <div className="embeddedAppViewport">
      {error ? <p className="embeddedFullscreenError" role="alert">{error}</p> : null}
      {showFullscreenControl ? (
        <button className="embeddedFullscreenButton" type="button" onClick={openFullscreen}>
          Enter full screen
        </button>
      ) : null}
      <iframe
        ref={iframeRef}
        className={className}
        srcDoc={documentHtml}
        title="Mezgeb application"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="same-origin"
        allowFullScreen
      />
    </div>
  );
}
