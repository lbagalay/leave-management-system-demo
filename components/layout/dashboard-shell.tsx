"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarPlus,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import type { DemoUser } from "@/types/auth";

type DashboardShellProps = {
  user: DemoUser;
  children: React.ReactNode;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isEmployee = user.role === "EMPLOYEE";
  const dashboardHref = isEmployee ? "/employee/dashboard" : "/admin/dashboard";
  const roleLabel = user.role === "SUPERVISOR" ? "Supervisor" : user.role === "ADMIN" ? "Administrator" : "Employee";
  const navigation = isEmployee
    ? [
        { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
        { label: "File Leave", href: "/employee/leave/new", icon: CalendarPlus },
        { label: "My Requests", href: "/employee/leave/requests", icon: ClipboardList },
        { label: "Profile", href: "/employee/profile", icon: UserRound },
      ]
    : [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Leave Requests", href: "/admin/requests", icon: ClipboardList },
        { label: "Employees", href: "/admin/employees", icon: UsersRound },
        { label: "Reports", href: "/admin/reports", icon: ChartNoAxesColumnIncreasing },
        { label: "Support", href: "/admin/support", icon: LifeBuoy },
      ];

  return (
    <div className="app-frame">
      {menuOpen && (
        <button
          className="mobile-overlay"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={menuOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="sidebar-brand">
          <BrandMark inverted />
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== dashboardHref && pathname.startsWith(`${href}/`));

            return (
              <Link
                href={href}
                className={isActive ? "nav-link nav-link-active" : "nav-link"}
                onClick={() => setMenuOpen(false)}
                key={href}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-context">
          <ShieldCheck size={19} />
          <div>
            <strong>{roleLabel} access</strong>
            <span>Protected workspace</span>
          </div>
        </div>

        <div className="sidebar-user">
          <span className="avatar avatar-dark">{initials(user.name)}</span>
          <div className="sidebar-user-copy">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <button
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
          <div className="topbar-brand-mobile">
            <BrandMark compact />
            <span>Leave Management</span>
          </div>
          <div className="topbar-company">
            <Building2 size={18} />
            <span>Demo Company</span>
          </div>
          <details className="user-menu">
            <summary>
              <span className="avatar">{initials(user.name)}</span>
              <span className="topbar-user-copy">
                <strong>{user.name}</strong>
                <small>{roleLabel}</small>
              </span>
              <ChevronDown size={16} />
            </summary>
            <div className="user-menu-panel">
              <div className="user-menu-identity">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="logout-button">
                  <LogOut size={17} />
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
