"use client";

import Link from "next/link";
import { TypographyLink } from "../Typography/TypographyLink";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  active?: boolean;
};

const NavLink = ({ href, children, active = false }: NavLinkProps) => (
  <TypographyLink
    className={cn({
      ["underline"]: active,
    })}
    type="internal"
    href={href}
    prefetch
  >
    {children}
  </TypographyLink>
);

export const Nav = () => {
  const pathname = usePathname();

  return (
    <nav className="border-b border-b-gray-200 bg-accent px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between py-4 text-accent-foreground sm:py-5">
        <Link href="/" className="text-4xl">
          🍞
        </Link>
        <ul className="flex gap-4">
          <li>
            <NavLink href="/om" active={pathname === "/om"}>
              Om
            </NavLink>
          </li>
          <li>
            <NavLink
              href="/oppskrifter"
              active={pathname.startsWith("/oppskrifter")}
            >
              Oppskrifter
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};
