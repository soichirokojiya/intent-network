"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/agent", label: "Agent", icon: "agent" },
    { href: "/contact", label: "Contact", icon: "contact" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--card-border)] z-50 backdrop-blur-md bg-opacity-80">
      <div className="flex">
        {items.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex justify-center py-3"
            >
              <div className={`p-2 rounded-full ${isActive ? "font-bold" : ""}`}>
                {item.icon === "home" ? (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={isActive ? 2.5 : 1.5}>
                    <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
                  </svg>
                ) : item.icon === "contact" ? (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={isActive ? 2.5 : 1.5}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={isActive ? 2.5 : 1.5}>
                    <path d="M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5zM20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  </svg>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
