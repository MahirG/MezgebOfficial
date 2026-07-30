'use client';

import { useEffect, useRef, useState } from 'react';

type ConnectionState = 'online' | 'offline' | 'restored';

const workspaceLabels = ['Home', 'Ledger', 'Receipts', 'Dube', 'Reports', 'Operations'];

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
  );
}

function activateWorkspaceView(index: number) {
  const button = document.querySelectorAll<HTMLButtonElement>('.cloudSidebar nav button')[index];
  if (!button) return false;
  button.click();
  document.querySelector<HTMLElement>('.cloudWorkspace')?.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

function openWorkspaceSearch() {
  const trigger = document.querySelector<HTMLButtonElement>('.mezgebMobileSearchBar button');
  trigger?.click();
  return Boolean(trigger);
}

function openNewSale() {
  activateWorkspaceView(0);
  window.setTimeout(() => {
    document.querySelector<HTMLButtonElement>('.cloudQuickActions button:first-child')?.click();
  }, 90);
}

export function MezgebExperienceEnhancements() {
  const [connection, setConnection] = useState<ConnectionState>('online');
  const [announcement, setAnnouncement] = useState('');
  const restoredTimer = useRef<number | null>(null);

  useEffect(() => {
    const searchButtons = document.querySelectorAll<HTMLButtonElement>(
      '.flutterIconButton[aria-label="Search workspace"], .mezgebMobileSearchBar button'
    );
    searchButtons.forEach((button) => {
      button.setAttribute('aria-keyshortcuts', 'Control+K Meta+K');
      button.title = 'Search workspace (Ctrl/⌘ K)';
    });

    const saleButtons = document.querySelectorAll<HTMLButtonElement>(
      '.flutterFab, .cloudQuickActions button:first-child'
    );
    saleButtons.forEach((button) => {
      button.setAttribute('aria-keyshortcuts', 'Alt+N');
      button.title = 'New sale (Alt+N)';
    });

    const navigationButtons = document.querySelectorAll<HTMLButtonElement>(
      '.flutterNavRail nav button, .cloudSidebar nav button'
    );
    navigationButtons.forEach((button, index) => {
      const destinationIndex = index % workspaceLabels.length;
      const shortcut = `Alt+${destinationIndex + 1}`;
      button.setAttribute('aria-keyshortcuts', shortcut);
      button.title = `${workspaceLabels[destinationIndex]} (${shortcut})`;
    });
  }, []);

  useEffect(() => {
    const setInputMode = (mode: 'keyboard' | 'pointer') => {
      document.body.dataset.mezgebInput = mode;
    };

    const onPointerDown = () => setInputMode('pointer');
    const onKeyDown = (event: KeyboardEvent) => {
      setInputMode('keyboard');

      if (isEditableTarget(event.target)) return;

      const commandKey = event.metaKey || event.ctrlKey;
      if (commandKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (openWorkspaceSearch()) setAnnouncement('Workspace search opened');
        return;
      }

      if (event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openNewSale();
        setAnnouncement('New sale form opened');
        return;
      }

      if (event.altKey && /^[1-6]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (activateWorkspaceView(index)) {
          event.preventDefault();
          setAnnouncement(`${workspaceLabels[index]} opened`);
        }
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    const updateConnection = () => {
      if (!navigator.onLine) {
        if (restoredTimer.current) window.clearTimeout(restoredTimer.current);
        setConnection('offline');
        setAnnouncement('You are offline. Existing information remains visible.');
        return;
      }

      setConnection((current) => {
        if (current !== 'offline') return 'online';
        setAnnouncement('Connection restored');
        if (restoredTimer.current) window.clearTimeout(restoredTimer.current);
        restoredTimer.current = window.setTimeout(() => setConnection('online'), 2800);
        return 'restored';
      });
    };

    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      if (restoredTimer.current) window.clearTimeout(restoredTimer.current);
    };
  }, []);

  return (
    <>
      {connection !== 'online' ? (
        <div className={`mezgebConnectionStatus ${connection}`} role="status">
          <span aria-hidden="true" />
          {connection === 'offline' ? 'Offline — changes may not sync' : 'Connection restored'}
        </div>
      ) : null}
      <div className="mezgebLiveRegion" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );
}
