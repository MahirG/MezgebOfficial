import re
from pathlib import Path


def replace_pattern(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    if count != 1:
        raise SystemExit(f"Expected source structure not found: {label}")
    return updated


mobile = Path("components/mezgeb-mobile-controls.tsx")
text = mobile.read_text(encoding="utf-8")
if "const hydrationTimer" not in text:
    text = replace_pattern(
        text,
        r"  useEffect\(\(\) => \{\s*const savedLocale = .*?setTheme\(.*?\);\s*\}, \[\]\);",
        """  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const savedLocale = window.localStorage.getItem('mezgeb-app-locale') as Locale | null;
      if (savedLocale && localeOptions.some((option) => option.id === savedLocale)) {
        setLocale(savedLocale);
      }

      const savedTheme = window.localStorage.getItem('mezgeb-app-theme') as Theme | null;
      const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : preferredTheme);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);""",
        "locale and theme hydration",
    )

if "const searchTimer" not in text:
    text = replace_pattern(
        text,
        r"  useEffect\(\(\) => \{\s*if \(!searchOpen\) return;\s*void loadSearchData\(\);\s*window\.setTimeout\(\(\) => inputRef\.current\?\.focus\(\), 80\);\s*\}, \[loadSearchData, searchOpen\]\);",
        """  useEffect(() => {
    if (!searchOpen) return;

    const searchTimer = window.setTimeout(() => {
      void loadSearchData();
      inputRef.current?.focus();
    }, 80);

    return () => window.clearTimeout(searchTimer);
  }, [loadSearchData, searchOpen]);""",
        "search data synchronization",
    )
mobile.write_text(text, encoding="utf-8")

pricing = Path("components/pricing-section.tsx")
text = pricing.read_text(encoding="utf-8")
if "const initializationTimer" not in text:
    text = replace_pattern(
        text,
        r"    const requestedBilling = params\.get\('billing'\);.*?    requestAnimationFrame\(\(\) =>\s*document\.getElementById\('pricing'\)\?\.scrollIntoView\(\{ block: 'start' \}\)\s*\);",
        """    const requestedBilling = params.get('billing');
    const initializationTimer = window.setTimeout(() => {
      if (requestedBilling === 'monthly' || requestedBilling === 'annual') {
        setBillingCycle(requestedBilling);
      }

      setSelectedPlan(requestedPlan);
      setSelectedMethod('telebirr');
      setCheckoutMessage(
        params.get('pay') === '1'
          ? 'Continue below to open secure payment.'
          : params.get('trial') === '1'
            ? 'Continue below to activate your trial.'
            : 'Review the plan and choose how to continue.'
      );

      requestAnimationFrame(() =>
        document.getElementById('pricing')?.scrollIntoView({ block: 'start' })
      );
    }, 0);

    return () => window.clearTimeout(initializationTimer);""",
        "pricing URL initialization",
    )
pricing.write_text(text, encoding="utf-8")

experience = Path("components/experience-orchestrator.tsx")
text = experience.read_text(encoding="utf-8")
text = text.replace(
    "import { useEffect, useRef, useState } from 'react';",
    "import { useCallback, useEffect, useRef, useState } from 'react';",
    1,
)
if "const ensureAudio = useCallback" not in text:
    text = replace_pattern(
        text,
        r"  function ensureAudio\(\) \{.*?\n  function showNetworkToast\(nextToast: NonNullable<ToastState>\) \{.*?\n  \}(?=\n\n  useEffect)",
        """  const ensureAudio = useCallback(() => {
    if (audioContext.current) return audioContext.current;
    const Context = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!Context) return null;
    audioContext.current = new Context();
    return audioContext.current;
  }, []);

  const playFeedback = useCallback(
    (kind: 'success' | 'error' | 'info') => {
      if (!audioArmed.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        return;
      const context = ensureAudio();
      if (!context) return;
      void context.resume();

      const now = context.currentTime;
      const frequencies =
        kind === 'success' ? [523.25, 659.25] : kind === 'error' ? [220, 174.61] : [392];
      frequencies.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = kind === 'error' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.08);
        gain.gain.setValueAtTime(0.0001, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(
          kind === 'error' ? 0.055 : 0.04,
          now + index * 0.08 + 0.015
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.2);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + index * 0.08);
        oscillator.stop(now + index * 0.08 + 0.22);
      });
    },
    [ensureAudio]
  );

  const showNetworkToast = useCallback((nextToast: NonNullable<ToastState>) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(nextToast);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);""",
        "feedback callbacks",
    )

if "}, [playFeedback, showNetworkToast]);" not in text:
    text = replace_pattern(
        text,
        r"  \}, \[\]\);\s*\n\s*return \(",
        "  }, [playFeedback, showNetworkToast]);\n\n  return (",
        "feedback effect dependencies",
    )
experience.write_text(text, encoding="utf-8")
