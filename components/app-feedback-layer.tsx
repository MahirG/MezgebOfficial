'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type FeedbackTone = 'loading' | 'success' | 'error' | 'duplicate' | 'info';

type Feedback = {
  tone: FeedbackTone;
  title: string;
  message: string;
};

const SUCCESS_PATTERN = /saved|recorded|added|issued|removed|synced|completed|updated|confirmed/i;
const LOADING_PATTERN = /saving|processing|loading|syncing|refreshing|issuing|adding|recording/i;
const DUPLICATE_PATTERN = /already|duplicate|exists/i;
const ERROR_PATTERN = /error|failed|could not|invalid|required|missing|enter |choose |must |unable/i;

function classifyMessage(message: string): Feedback {
  if (LOADING_PATTERN.test(message)) {
    return { tone: 'loading', title: 'Saving securely', message };
  }

  if (DUPLICATE_PATTERN.test(message)) {
    return { tone: 'duplicate', title: 'Already entered', message };
  }

  if (SUCCESS_PATTERN.test(message)) {
    return { tone: 'success', title: 'Entry confirmed', message };
  }

  if (ERROR_PATTERN.test(message)) {
    return { tone: 'error', title: 'Check the form', message };
  }

  return { tone: 'info', title: 'Mezgeb update', message };
}

function labelForField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  const label = field.closest('label');
  if (label) {
    const directText = Array.from(label.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .join(' ');
    if (directText) return directText;
  }

  return field.getAttribute('aria-label')
    || field.getAttribute('name')
    || (field instanceof HTMLSelectElement ? 'selection' : 'field');
}

function findField(labelFragment: string) {
  const labels = Array.from(document.querySelectorAll<HTMLLabelElement>('.cloudForm label'));
  const label = labels.find((candidate) => candidate.textContent?.toLowerCase().includes(labelFragment));
  return label?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea') ?? null;
}

function focusRelatedField(message: string) {
  const normalized = message.toLowerCase();
  let field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;

  if (normalized.includes('description')) field = findField('description');
  else if (normalized.includes('amount')) field = findField('amount');
  else if (normalized.includes('customer')) field = findField('customer');
  else if (normalized.includes('phone')) field = findField('phone');

  if (!field) return;
  field.classList.add('appFieldError');
  field.setAttribute('aria-invalid', 'true');
  field.focus({ preventScroll: false });
  field.addEventListener('input', () => {
    field?.classList.remove('appFieldError');
    field?.removeAttribute('aria-invalid');
  }, { once: true });
}

export function AppFeedbackLayer() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastMessageRef = useRef('');
  const dismissTimerRef = useRef<number | null>(null);
  const operationTimerRef = useRef<number | null>(null);
  const validationLockRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    if (operationTimerRef.current) window.clearTimeout(operationTimerRef.current);
    dismissTimerRef.current = null;
    operationTimerRef.current = null;
  }, []);

  const speak = useCallback((message: string, tone: FeedbackTone) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const spokenMessage = tone === 'success'
      ? `Success. ${message}`
      : tone === 'duplicate'
        ? `Already entered. ${message}`
        : tone === 'error'
          ? `Please check the form. ${message}`
          : message;
    const utterance = new SpeechSynthesisUtterance(spokenMessage);
    utterance.lang = 'en-US';
    utterance.rate = 0.96;
    utterance.pitch = tone === 'success' ? 1.08 : 1;
    utterance.volume = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) => voice.lang.startsWith('en') && /Samantha|Ava|Google|Microsoft/i.test(voice.name))
      ?? voices.find((voice) => voice.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const announce = useCallback((nextFeedback: Feedback, force = false) => {
    if (!force && lastMessageRef.current === nextFeedback.message) return;

    clearTimers();
    lastMessageRef.current = nextFeedback.message;
    setFeedback(nextFeedback);

    if (nextFeedback.tone === 'error') {
      navigator.vibrate?.([55, 35, 55]);
      focusRelatedField(nextFeedback.message);
    } else if (nextFeedback.tone === 'success') {
      navigator.vibrate?.(45);
    }

    speak(nextFeedback.message, nextFeedback.tone);

    if (nextFeedback.tone !== 'loading') {
      dismissTimerRef.current = window.setTimeout(() => setFeedback(null), nextFeedback.tone === 'error' ? 7000 : 5200);
    }
  }, [clearTimers, speak]);

  const beginLoading = useCallback((message: string) => {
    announce({ tone: 'loading', title: 'Saving securely', message }, true);
    operationTimerRef.current = window.setTimeout(() => {
      announce({
        tone: 'error',
        title: 'Still working',
        message: 'This is taking longer than expected. Check your connection and try again.'
      }, true);
    }, 20000);
  }, [announce]);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem('mezgeb-voice-feedback');
    if (storedPreference === 'off') setVoiceEnabled(false);
  }, []);

  useEffect(() => {
    const root = document.getElementById('mezgeb-application') ?? document.body;

    const readNotice = () => {
      const message = document.querySelector<HTMLElement>('.mezgebNotice span')?.textContent?.trim();
      if (!message) return;
      announce(classifyMessage(message));
    };

    const observer = new MutationObserver(readNotice);
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    const handleSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches('.cloudForm')) return;
      const formTitle = form.querySelector('h2')?.textContent?.trim() || 'entry';
      beginLoading(`Saving ${formTitle.toLowerCase()}…`);
    };

    const handleClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      const text = button.textContent?.trim().toLowerCase() ?? '';
      if (text === 'issue receipt') beginLoading('Creating and confirming the receipt…');
    };

    const handleInvalid = (event: Event) => {
      event.preventDefault();
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      if (validationLockRef.current) return;

      validationLockRef.current = true;
      window.setTimeout(() => { validationLockRef.current = false; }, 250);

      const fieldLabel = labelForField(field);
      const message = field.validity.valueMissing
        ? `Please fill in ${fieldLabel}.`
        : `Please enter a valid value for ${fieldLabel}.`;

      field.classList.add('appFieldError');
      field.setAttribute('aria-invalid', 'true');
      field.focus({ preventScroll: false });
      field.addEventListener('input', () => {
        field.classList.remove('appFieldError');
        field.removeAttribute('aria-invalid');
      }, { once: true });

      announce({ tone: 'error', title: 'Complete required fields', message }, true);
    };

    root.addEventListener('submit', handleSubmit, true);
    root.addEventListener('click', handleClick, true);
    root.addEventListener('invalid', handleInvalid, true);
    readNotice();

    return () => {
      observer.disconnect();
      root.removeEventListener('submit', handleSubmit, true);
      root.removeEventListener('click', handleClick, true);
      root.removeEventListener('invalid', handleInvalid, true);
      clearTimers();
      window.speechSynthesis?.cancel();
    };
  }, [announce, beginLoading, clearTimers]);

  const toggleVoice = () => {
    const nextValue = !voiceEnabled;
    setVoiceEnabled(nextValue);
    window.localStorage.setItem('mezgeb-voice-feedback', nextValue ? 'on' : 'off');
    if (nextValue) {
      window.setTimeout(() => speak('Voice confirmations are on.', 'info'), 0);
    } else {
      window.speechSynthesis?.cancel();
    }
  };

  if (!feedback) return null;

  const icon = feedback.tone === 'loading'
    ? null
    : feedback.tone === 'success'
      ? '✓'
      : feedback.tone === 'duplicate'
        ? '↺'
        : feedback.tone === 'error'
          ? '!'
          : 'i';

  return (
    <div className={`appFeedbackLayer ${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : 'status'} aria-live={feedback.tone === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
      <div className="appFeedbackCard" aria-busy={feedback.tone === 'loading'}>
        <div className="appFeedbackIcon" aria-hidden="true">
          {feedback.tone === 'loading' ? <span className="appFeedbackSpinner" /> : icon}
        </div>
        <div className="appFeedbackCopy">
          <strong>{feedback.title}</strong>
          <span>{feedback.message}</span>
        </div>
        <button className="appFeedbackVoice" type="button" onClick={toggleVoice} aria-label={voiceEnabled ? 'Turn voice confirmations off' : 'Turn voice confirmations on'} title={voiceEnabled ? 'Voice on' : 'Voice off'}>
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
        {feedback.tone !== 'loading' ? (
          <button className="appFeedbackClose" type="button" onClick={() => setFeedback(null)} aria-label="Dismiss confirmation">×</button>
        ) : null}
        {feedback.tone === 'loading' ? <span className="appFeedbackProgress" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
