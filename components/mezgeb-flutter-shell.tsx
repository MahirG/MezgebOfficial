'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type BusinessOption = {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  vatRegistered: boolean;
  businessType: string | null;
  tin: string | null;
  receiptPrefix: string;
  openingBalance: number;
};

type Props = {
  userName: string;
  activeBusinessId: string;
  businesses: BusinessOption[];
};

type IconName =
  | 'home'
  | 'ledger'
  | 'receipt'
  | 'dube'
  | 'report'
  | 'operations'
  | 'search'
  | 'menu'
  | 'sun'
  | 'moon'
  | 'plus'
  | 'chevron';

const destinations: Array<{ label: string; icon: IconName }> = [
  { label: 'Home', icon: 'home' },
  { label: 'Ledger', icon: 'ledger' },
  { label: 'Receipts', icon: 'receipt' },
  { label: 'Dube', icon: 'dube' },
  { label: 'Reports', icon: 'report' },
  { label: 'Operations', icon: 'operations' }
];

const mobileDestinations = [0, 1, 3, 2, 4];

function AppIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true
  };

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.8 12 3l9 7.8" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case 'ledger':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case 'receipt':
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      );
    case 'dube':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="8" r="2.3" />
          <path d="M3.5 20c.4-3.6 2.3-5.5 5.5-5.5s5.1 1.9 5.5 5.5" />
          <path d="M14 14.7c3.6-.5 5.8 1.2 6.5 4.8" />
        </svg>
      );
    case 'report':
      return (
        <svg {...common}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
          <path d="M2 20h22" />
        </svg>
      );
    case 'operations':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05-2.83 2.83-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.08a1.7 1.7 0 0 0-1.38-1.66 1.7 1.7 0 0 0-1.55.45l-.05.05-2.83-2.83.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.08A1.7 1.7 0 0 0 4.74 8.2a1.7 1.7 0 0 0-.45-1.55l-.05-.05 2.83-2.83.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.08A1.7 1.7 0 0 0 15.8 4.74a1.7 1.7 0 0 0 1.55-.45l.05-.05 2.83 2.83-.05.05A1.7 1.7 0 0 0 19.4 9c.15.4.36.75.6 1 .3.3.68.43 1.1.4h.08v4h-.08a1.7 1.7 0 0 0-1.7.6Z" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common} strokeWidth={2.4}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
  }
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function MezgebFlutterShell({ userName, activeBusinessId, businesses }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const activeBusiness = businesses.find((item) => item.id === activeBusinessId) ?? businesses[0];
  const initial = userName.trim().charAt(0).toUpperCase() || 'M';

  const syncActiveDestination = useCallback(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.cloudSidebar nav button')
    );
    const nextIndex = buttons.findIndex((button) => button.classList.contains('active'));
    if (nextIndex >= 0) setActiveIndex(nextIndex);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(syncActiveDestination, 0);
    const nav = document.querySelector('.cloudSidebar nav');
    const observer = nav
      ? new MutationObserver(syncActiveDestination)
      : null;
    observer?.observe(nav!, { subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [syncActiveDestination]);

  useEffect(() => {
    const saved = window.localStorage.getItem('mezgeb-app-theme');
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const nextTheme = saved === 'dark' || saved === 'light' ? saved : preferred;
    setTheme(nextTheme);
    document.body.dataset.mezgebTheme = nextTheme;
    document.querySelector('.cloudMezgebApp')?.setAttribute('data-mezgeb-theme', nextTheme);
  }, []);

  const activateView = useCallback((index: number) => {
    const button = document.querySelectorAll<HTMLButtonElement>('.cloudSidebar nav button')[index];
    button?.click();
    setActiveIndex(index);
    document.querySelector('.cloudWorkspace')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('mezgeb-app-theme', next);
      document.body.dataset.mezgebTheme = next;
      document.querySelector('.cloudMezgebApp')?.setAttribute('data-mezgeb-theme', next);
      return next;
    });
  }, []);

  const openSearch = useCallback(() => {
    document.querySelector<HTMLButtonElement>('.mezgebMobileSearchBar button')?.click();
  }, []);

  const openMenu = useCallback(() => {
    document.querySelector<HTMLButtonElement>('.mezgebMobileMenuButton')?.click();
  }, []);

  const addSale = useCallback(() => {
    activateView(0);
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('.cloudQuickActions button:first-child')?.click();
    }, 80);
  }, [activateView]);

  const switchBusiness = useCallback(
    async (businessId: string) => {
      if (!businessId || businessId === activeBusinessId) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase
          .from('mezgeb_profiles')
          .update({ last_business_id: businessId })
          .eq('id', data.user.id);
      }
      router.push(`/app?business=${encodeURIComponent(businessId)}`);
      router.refresh();
    },
    [activeBusinessId, router, supabase]
  );

  return (
    <div className="flutterChrome" aria-label="Mezgeb application navigation">
      <aside className="flutterNavRail">
        <button className="flutterRailBrand" type="button" onClick={() => activateView(0)}>
          <span>መ</span>
          <strong>Mezgeb</strong>
        </button>
        <nav>
          {destinations.map((item, index) => (
            <button
              type="button"
              key={item.label}
              className={activeIndex === index ? 'active' : ''}
              onClick={() => activateView(index)}
              aria-label={item.label}
              aria-current={activeIndex === index ? 'page' : undefined}
            >
              <span className="flutterNavIndicator">
                <AppIcon name={item.icon} />
              </span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
        <div className="flutterRailFooter">
          <button type="button" onClick={toggleTheme} aria-label="Toggle appearance">
            <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <Link href="/dashboard" className="flutterRailAvatar" aria-label="Open account">
            {initial}
          </Link>
        </div>
      </aside>

      <header className="flutterAppBar">
        <div className="flutterAppBarLeading">
          <button className="flutterMobileBrand" type="button" onClick={() => activateView(0)}>
            መ
          </button>
          <div>
            <span>{greeting()}, {userName.split(' ')[0]}</span>
            <h1>{destinations[activeIndex]?.label ?? 'Mezgeb'}</h1>
          </div>
        </div>
        <div className="flutterAppBarActions">
          <label className="flutterBusinessPicker">
            <span>Business</span>
            <select value={activeBusinessId} onChange={(event) => void switchBusiness(event.target.value)}>
              {businesses.map((business) => (
                <option value={business.id} key={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            <AppIcon name="chevron" size={16} />
          </label>
          <button type="button" className="flutterIconButton" onClick={openSearch} aria-label="Search workspace">
            <AppIcon name="search" />
          </button>
          <button type="button" className="flutterIconButton flutterThemeButton" onClick={toggleTheme} aria-label="Toggle appearance">
            <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <Link href="/dashboard" className="flutterAvatar" aria-label="Open account">
            {initial}
          </Link>
          <button type="button" className="flutterIconButton flutterMenuButton" onClick={openMenu} aria-label="Open menu">
            <AppIcon name="menu" />
          </button>
        </div>
      </header>

      <button type="button" className="flutterFab" onClick={addSale} aria-label="Add sale">
        <AppIcon name="plus" size={26} />
        <span>New sale</span>
      </button>

      <nav className="flutterBottomNav" aria-label="Primary mobile navigation">
        {mobileDestinations.map((index) => {
          const item = destinations[index];
          return (
            <button
              type="button"
              key={item.label}
              className={activeIndex === index ? 'active' : ''}
              onClick={() => activateView(index)}
              aria-current={activeIndex === index ? 'page' : undefined}
            >
              <span className="flutterNavIndicator">
                <AppIcon name={item.icon} size={22} />
              </span>
              <small>{item.label}</small>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
