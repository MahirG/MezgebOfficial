'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type QuickAction = 'sale' | 'expense' | 'dube' | 'receipt';

type GestureStart = {
  x: number;
  y: number;
  scrollTop: number;
  target: EventTarget | null;
};

const viewNames = ['Home', 'Ledger', 'Receipts', 'Dube', 'Reports', 'Operations'];
const interactiveSelector =
  'button, a, input, select, textarea, [role="button"], .cloudMetricGrid article, .cloudPanel';

function vibrate(pattern: number | number[] = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

function isFormTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('input, select, textarea, button, a, form'));
}

export function MezgebInteractionLayer() {
  const [fabOpen, setFabOpen] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [pullDistance, setPullDistance] = useState(0);
  const [successBurst, setSuccessBurst] = useState(false);
  const gestureRef = useRef<GestureStart | null>(null);
  const snackTimerRef = useRef<number | null>(null);

  const showSnackbar = useCallback((message: string) => {
    if (snackTimerRef.current) window.clearTimeout(snackTimerRef.current);
    setSnackbar(message);
    snackTimerRef.current = window.setTimeout(() => setSnackbar(''), 2600);
  }, []);

  const getActiveIndex = useCallback(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.cloudSidebar nav button')
    );
    const index = buttons.findIndex((button) => button.classList.contains('active'));
    return index >= 0 ? index : 0;
  }, []);

  const activateView = useCallback(
    (index: number, announce = true) => {
      const buttons = document.querySelectorAll<HTMLButtonElement>('.cloudSidebar nav button');
      const next = Math.max(0, Math.min(buttons.length - 1, index));
      buttons[next]?.click();
      const content = document.querySelector<HTMLElement>('.cloudContent');
      content?.classList.remove('mzViewEntering');
      requestAnimationFrame(() => content?.classList.add('mzViewEntering'));
      document.querySelector<HTMLElement>('.cloudWorkspace')?.scrollTo({ top: 0, behavior: 'smooth' });
      if (announce) showSnackbar(viewNames[next] ?? 'Section opened');
      vibrate(8);
    },
    [showSnackbar]
  );

  const openSearch = useCallback(() => {
    document.querySelector<HTMLButtonElement>('.mezgebMobileSearchBar button')?.click();
    showSnackbar('Search ready');
    vibrate(8);
  }, [showSnackbar]);

  const triggerQuickAction = useCallback(
    (action: QuickAction) => {
      setFabOpen(false);
      if (action === 'sale' || action === 'expense') {
        activateView(0, false);
        window.setTimeout(() => {
          const quickButtons = document.querySelectorAll<HTMLButtonElement>('.cloudQuickActions button');
          quickButtons[action === 'sale' ? 0 : 1]?.click();
          window.setTimeout(() => {
            document
              .querySelector<HTMLInputElement>('#transaction-form input:not([type="checkbox"])')
              ?.focus({ preventScroll: true });
          }, 180);
        }, 90);
        showSnackbar(action === 'sale' ? 'New sale form opened' : 'New expense form opened');
      } else if (action === 'dube') {
        activateView(3, false);
        window.setTimeout(() => {
          document.querySelector<HTMLInputElement>('.cloudDubeForms input')?.focus({ preventScroll: true });
        }, 200);
        showSnackbar('Dube workspace opened');
      } else {
        activateView(2, false);
        showSnackbar('Receipt centre opened');
      }
      vibrate(12);
    },
    [activateView, showSnackbar]
  );

  useEffect(() => {
    return () => {
      if (snackTimerRef.current) window.clearTimeout(snackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const root = document.getElementById('mezgeb-application');
    if (!root) return;

    const decorate = () => {
      root.querySelectorAll<HTMLElement>(interactiveSelector).forEach((element) => {
        if (element.dataset.mzInteractive === 'true') return;
        element.dataset.mzInteractive = 'true';
        if (element.matches('.cloudMetricGrid article')) {
          element.tabIndex = 0;
          element.setAttribute('role', 'button');
          const index = Array.from(element.parentElement?.children ?? []).indexOf(element);
          element.setAttribute(
            'aria-label',
            index === 0
              ? 'Open ledger details'
              : index === 1
                ? 'Open outstanding Dube'
                : 'Open VAT reports'
          );
        }
      });
    };

    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(root, { childList: true, subtree: true });

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>(interactiveSelector);
      if (!target || target.matches(':disabled')) return;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.35;
      ripple.className = 'mzRipple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      target.appendChild(ripple);
      target.classList.add('mzPressed');
      window.setTimeout(() => ripple.remove(), 620);
      vibrate(5);
    };

    const clearPressed = () => {
      root.querySelectorAll<HTMLElement>('.mzPressed').forEach((item) => item.classList.remove('mzPressed'));
    };

    const onMetricAction = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>('.cloudMetricGrid article');
      if (!card || event.target.closest('button, a, input, select')) return;
      const index = Array.from(card.parentElement?.children ?? []).indexOf(card);
      activateView(index === 0 ? 1 : index === 1 ? 3 : 4);
    };

    const onKeyActivate = (event: KeyboardEvent) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>('.cloudMetricGrid article');
      if (card && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        card.click();
      }
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('click', onMetricAction);
    root.addEventListener('keydown', onKeyActivate);
    window.addEventListener('pointerup', clearPressed);
    window.addEventListener('pointercancel', clearPressed);

    return () => {
      observer.disconnect();
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('click', onMetricAction);
      root.removeEventListener('keydown', onKeyActivate);
      window.removeEventListener('pointerup', clearPressed);
      window.removeEventListener('pointercancel', clearPressed);
    };
  }, [activateView]);

  useEffect(() => {
    const workspace = document.querySelector<HTMLElement>('.cloudWorkspace');
    if (!workspace) return;

    const onScroll = () => {
      document.body.classList.toggle('mzAppScrolled', workspace.scrollTop > 18);
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      gestureRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        scrollTop: workspace.scrollTop,
        target: event.target
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      const start = gestureRef.current;
      if (!start || start.scrollTop > 0 || isFormTarget(start.target)) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (dy > 0 && Math.abs(dx) < 42) setPullDistance(Math.min(96, dy * 0.52));
    };

    const onTouchEnd = (event: TouchEvent) => {
      const start = gestureRef.current;
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const shouldRefresh = pullDistance >= 64;
      setPullDistance(0);
      gestureRef.current = null;

      if (shouldRefresh) {
        document.querySelector<HTMLButtonElement>('.cloudTopActions button')?.click();
        showSnackbar('Refreshing business data…');
        vibrate([12, 24, 12]);
        return;
      }

      if (isFormTarget(start.target) || Math.abs(dx) < 72 || Math.abs(dy) > 58) return;
      const current = getActiveIndex();
      activateView(dx < 0 ? current + 1 : current - 1);
    };

    workspace.addEventListener('scroll', onScroll, { passive: true });
    workspace.addEventListener('touchstart', onTouchStart, { passive: true });
    workspace.addEventListener('touchmove', onTouchMove, { passive: true });
    workspace.addEventListener('touchend', onTouchEnd, { passive: true });
    onScroll();

    return () => {
      workspace.removeEventListener('scroll', onScroll);
      workspace.removeEventListener('touchstart', onTouchStart);
      workspace.removeEventListener('touchmove', onTouchMove);
      workspace.removeEventListener('touchend', onTouchEnd);
    };
  }, [activateView, getActiveIndex, pullDistance, showSnackbar]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isFormTarget(event.target)) return;
      if (event.key === '/') {
        event.preventDefault();
        openSearch();
      } else if (event.key.toLowerCase() === 'n') {
        triggerQuickAction('sale');
      } else if (event.key.toLowerCase() === 'e') {
        triggerQuickAction('expense');
      } else if (event.key.toLowerCase() === 'd') {
        activateView(3);
      } else if (event.key.toLowerCase() === 'r') {
        activateView(2);
      } else if (event.key === 'ArrowRight') {
        activateView(getActiveIndex() + 1);
      } else if (event.key === 'ArrowLeft') {
        activateView(getActiveIndex() - 1);
      } else if (event.key === 'Escape') {
        setFabOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activateView, getActiveIndex, openSearch, triggerQuickAction]);

  useEffect(() => {
    const root = document.getElementById('mezgeb-application');
    if (!root) return;
    let lastNotice = '';
    const observer = new MutationObserver(() => {
      const notice = root.querySelector<HTMLElement>('.mezgebNotice');
      const text = notice?.textContent?.replace('×', '').trim() ?? '';
      if (!text || text === lastNotice) return;
      lastNotice = text;
      showSnackbar(text);
      if (/saved|issued|recorded|added|updated|success/i.test(text)) {
        setSuccessBurst(false);
        requestAnimationFrame(() => setSuccessBurst(true));
        window.setTimeout(() => setSuccessBurst(false), 900);
        vibrate([18, 30, 18]);
      }
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [showSnackbar]);

  return (
    <div className="mzInteractionLayer" aria-live="polite">
      <div
        className={`mzPullIndicator ${pullDistance > 0 ? 'visible' : ''} ${pullDistance >= 64 ? 'ready' : ''}`}
        style={{ '--mz-pull': `${pullDistance}px` } as React.CSSProperties}
      >
        <span>↻</span>
        <small>{pullDistance >= 64 ? 'Release to refresh' : 'Pull to refresh'}</small>
      </div>

      {fabOpen ? (
        <button
          type="button"
          className="mzFabBackdrop"
          aria-label="Close quick actions"
          onClick={() => setFabOpen(false)}
        />
      ) : null}

      <div className={`mzSpeedDial ${fabOpen ? 'open' : ''}`}>
        <div className="mzSpeedDialActions" aria-hidden={!fabOpen}>
          <button type="button" onClick={() => triggerQuickAction('receipt')}>
            <span>▤</span><b>Receipt</b>
          </button>
          <button type="button" onClick={() => triggerQuickAction('dube')}>
            <span>◎</span><b>Dube</b>
          </button>
          <button type="button" onClick={() => triggerQuickAction('expense')}>
            <span>−</span><b>Expense</b>
          </button>
          <button type="button" onClick={() => triggerQuickAction('sale')}>
            <span>＋</span><b>Sale</b>
          </button>
        </div>
        <button
          type="button"
          className="mzSpeedDialFab"
          aria-label={fabOpen ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={fabOpen}
          onClick={() => {
            setFabOpen((current) => !current);
            vibrate(10);
          }}
        >
          <span>{fabOpen ? '×' : '＋'}</span>
          <b>{fabOpen ? 'Close' : 'Quick add'}</b>
        </button>
      </div>

      <div className={`mzSnackbar ${snackbar ? 'visible' : ''}`} role="status">
        <span>✓</span>
        <p>{snackbar}</p>
        <button type="button" aria-label="Dismiss" onClick={() => setSnackbar('')}>×</button>
      </div>

      {successBurst ? (
        <div className="mzSuccessBurst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
        </div>
      ) : null}

      <div className="mzShortcutHint" aria-hidden="true">
        <kbd>N</kbd> sale <kbd>E</kbd> expense <kbd>/</kbd> search
      </div>
    </div>
  );
}
