'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type FeedbackKind = 'success' | 'error' | 'info' | 'loading';
type ToastState = { kind: 'success' | 'error'; message: string } | null;

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

const successWords = /saved|synced|added|recorded|issued|updated|received|complete|completed|active|ready|confirmed|created|sent|connected/i;
const errorWords = /error|failed|unable|invalid|could not|not found|required|choose|enter a|unavailable|denied|expired|removed/i;
const loadingWords = /saving|loading|syncing|please wait|sending|joining|refreshing|processing|connecting/i;

function classifyMessage(message: string): FeedbackKind {
  if (loadingWords.test(message)) return 'loading';
  if (errorWords.test(message)) return 'error';
  if (successWords.test(message)) return 'success';
  return 'info';
}

function isInternalNavigation(element: Element) {
  const anchor = element.closest('a[href]') as HTMLAnchorElement | null;
  if (!anchor) return false;
  if (anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  if (anchor.protocol !== window.location.protocol || anchor.host !== window.location.host) return false;
  return !anchor.hash || anchor.pathname !== window.location.pathname;
}

export function ExperienceOrchestrator() {
  const pathname = usePathname();
  const audioContext = useRef<AudioContext | null>(null);
  const audioArmed = useRef(false);
  const previousMessages = useRef(new WeakMap<Element, string>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  function ensureAudio() {
    if (audioContext.current) return audioContext.current;
    const Context = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!Context) return null;
    audioContext.current = new Context();
    return audioContext.current;
  }

  function playFeedback(kind: 'success' | 'error' | 'info') {
    if (!audioArmed.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = ensureAudio();
    if (!context) return;
    void context.resume();

    const now = context.currentTime;
    const frequencies = kind === 'success' ? [523.25, 659.25] : kind === 'error' ? [220, 174.61] : [392];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === 'error' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.08);
      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(kind === 'error' ? 0.055 : 0.04, now + index * 0.08 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.08);
      oscillator.stop(now + index * 0.08 + 0.22);
    });
  }

  function showNetworkToast(nextToast: NonNullable<ToastState>) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(nextToast);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  useEffect(() => {
    document.documentElement.classList.remove('mezgebNavigating');
  }, [pathname]);

  useEffect(() => {
    const interactiveSelector = 'button, a[href], input, select, textarea, [role="button"]';

    const onPointerDown = (event: PointerEvent) => {
      audioArmed.current = true;
      const target = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
      if (!target) return;
      target.classList.add('mezgebPressed');
      window.setTimeout(() => target.classList.remove('mezgebPressed'), 150);
      if ('vibrate' in navigator && target.matches('button, [role="button"], .button')) navigator.vibrate(7);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target && isInternalNavigation(target)) {
        document.documentElement.classList.add('mezgebNavigating');
        window.setTimeout(() => document.documentElement.classList.remove('mezgebNavigating'), 1400);
      }
    };

    const onSubmit = () => {
      document.documentElement.classList.add('mezgebNavigating');
      window.setTimeout(() => document.documentElement.classList.remove('mezgebNavigating'), 1200);
    };

    const onInvalid = (event: Event) => {
      const element = event.target instanceof HTMLElement ? event.target : null;
      element?.closest('label')?.classList.add('mezgebInvalidField');
      playFeedback('error');
    };

    const onInput = (event: Event) => {
      const element = event.target instanceof HTMLElement ? event.target : null;
      element?.closest('label')?.classList.remove('mezgebInvalidField');
    };

    const updateFeedbackElement = (element: Element) => {
      const text = element.textContent?.trim() ?? '';
      if (!text || previousMessages.current.get(element) === text) return;
      previousMessages.current.set(element, text);
      const kind = classifyMessage(text);
      element.setAttribute('data-feedback-state', kind);
      if (kind === 'success' || kind === 'error' || kind === 'info') playFeedback(kind);
    };

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        if (target?.matches('[role="status"], [role="alert"], .mezgebNotice')) updateFeedbackElement(target);
        target?.querySelectorAll?.('[role="status"], [role="alert"], .mezgebNotice').forEach(updateFeedbackElement);
      });
    });

    document.querySelectorAll('[role="status"], [role="alert"], .mezgebNotice').forEach(updateFeedbackElement);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });

    const onOffline = () => {
      showNetworkToast({ kind: 'error', message: 'You are offline. Unsaved cloud actions will wait until the connection returns.' });
      playFeedback('error');
    };
    const onOnline = () => {
      showNetworkToast({ kind: 'success', message: 'Connection restored. Mezgeb is ready to sync again.' });
      playFeedback('success');
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('invalid', onInvalid, true);
    document.addEventListener('input', onInput, true);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      observer.disconnect();
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit);
      document.removeEventListener('invalid', onInvalid, true);
      document.removeEventListener('input', onInput, true);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      void audioContext.current?.close();
    };
  }, []);

  return (
    <>
      <span className="mezgebRouteProgress" aria-hidden="true" />
      {toast ? <div className={`mezgebSystemToast ${toast.kind}`} role="status"><span aria-hidden="true">{toast.kind === 'success' ? '✓' : '!'}</span>{toast.message}</div> : null}
    </>
  );
}
