'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/practice', label: 'Practice' },
  { href: '/progress', label: 'Progress' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="appFrame">
      <header className="topBar">
        <div className="brand">Algebra Flow Web</div>
        <nav className="navTabs" aria-label="Primary">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`navTab ${isActive ? 'navTabActive' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mainContent">{children}</main>
    </div>
  );
}
