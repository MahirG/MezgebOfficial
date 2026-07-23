'use client';

import { useEffect, useRef, useState } from 'react';

const APP_PARTS = [0, 1, 2, 3].map((part) => `/mezgeb-app.part-${part}.txt`);

type EmbeddedMezgebAppProps = {
  className?: string;
  showFullscreenControl?: boolean;
};

export function EmbeddedMezgebApp({
  className = 'mezgebAppFrame',
  showFullscreenControl = false
}: EmbeddedMezgebAppProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [documentHtml, setDocumentHtml] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadApplication() {
      try {
        if (typeof DecompressionStream === 'undefined') {
          throw new Error('This browser does not support the application loader.');
        }

        const responses = await Promise.all(
          APP_PARTS.map((path) => fetch(path, { cache: 'force-cache' }))
        );

        if (responses.some((response) => !response.ok)) {
          throw new Error('One or more application files could not be loaded.');
        }

        const encodedParts = await Promise.all(responses.map((response) => response.text()));
        const encoded = encodedParts.join('').replace(/\s/g, '');
        const binary = atob(encoded);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        const decompressed = new Blob([bytes.buffer])
          .stream()
          .pipeThrough(new DecompressionStream('gzip'));
        const html = await new Response(decompressed).text();

        if (active) setDocumentHtml(html);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'The application could not be loaded.');
        }
      }
    }

    loadApplication();
    return () => {
      active = false;
    };
  }, []);

  async function openFullscreen() {
    try {
      await iframeRef.current?.requestFullscreen();
    } catch {
      setError('Full-screen mode is unavailable in this browser.');
    }
  }

  if (error) {
    return (
      <div className="embeddedAppState" role="alert">
        <strong>Mezgeb could not open.</strong>
        <span>{error} Reload the page or use a current version of Chrome, Edge, Firefox or Safari.</span>
      </div>
    );
  }

  if (!documentHtml) {
    return (
      <div className="embeddedAppState" role="status" aria-live="polite">
        <span className="appLoader" aria-hidden="true" />
        <strong>Opening Mezgeb…</strong>
        <span>Loading the complete application securely inside the website.</span>
      </div>
    );
  }

  return (
    <div className="embeddedAppViewport">
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
