"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
  Cable,
  Library,
  Braces,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  const isLinkActive = (href: string) => {
    const overviewPath = `/`;
    return href === overviewPath ? pathname === href : pathname.includes(href);
  };

  const baseLinks = [
    {
      section: "Home",
      links: [
        {
          title: "Home",
          href: `/`,
          icon: Home,
        },
      ],
    },
    {
      section: "Integrations",
      links: [
        {
          title: "Connectors",
          href: `/connectors`,
          icon: Library,
        },
        {
          title: "Integrations",
          href: `/integrations`,
          icon: Cable,
        },
        {
          title: "Connections",
          href: `/connections`,
          icon: Braces,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-2 left-4 z-50 overflow-hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-background">
            <div className="flex flex-col h-full">
              {/* Top: Logo */}
              <div className="p-4 border-b border-border">
                <Link href="/" className="flex items-center space-x-2">
                  <Logo />
                  <span className="font-bold text-lg">Mind</span>
                </Link>
              </div>

              {/* Middle: Scrollable links */}
              <div className="flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-border">
                <div className="flex flex-col gap-1 py-3">
                  {baseLinks.map((group, i) => (
                    <div key={i}>
                      <div className="text-xs uppercase text-muted-foreground font-semibold tracking-wider px-3 py-2 mt-4">
                        {group.section}
                      </div>
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-2",
                            isLinkActive(link.href)
                              ? "bg-muted font-bold text-primary dark:bg-muted/45 dark:text-primary-foreground"
                              : "text-muted-foreground hover:bg-secondary/45 hover:text-foreground"
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                          <span>{link.title}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out relative",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer absolute top-1/2 -right-0 translate-x-1/2 -translate-y-1/2 h-8 w-8 border rounded-none bg-muted z-10"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Top: Logo */}
        <div className="p-4 flex items-center justify-between border-b h-14">
          <Link href="/" className="flex items-center justify-center">
            <Logo />
          </Link>
        </div>

        {/* Middle: Scrollable links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-border">
          <div
            className={cn("flex flex-col gap-1 pb-3", collapsed ? "mt-2" : "")}
          >
            {baseLinks.map((group, i) => (
              <div key={i}>
                <div key={i}>
                  {!collapsed && (
                    <div className="text-xs uppercase text-muted-foreground font-semibold tracking-wider px-3 py-1 mt-4">
                      {group.section}
                    </div>
                  )}
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-2 mb-4" : "mt-2",
                        isLinkActive(link.href)
                          ? "bg-muted font-bold text-primary dark:bg-primary/5 dark:text-primary/50"
                          : "text-muted-foreground hover:bg-secondary/45 hover:text-foreground"
                      )}
                      title={collapsed ? link.title : undefined}
                    >
                      <link.icon className="h-4 w-4" />
                      {!collapsed && <span>{link.title}</span>}
                    </Link>
                  ))}
                </div>
                {collapsed && i < baseLinks.length - 1 && (
                  <Separator orientation="horizontal" className="my-2 mb-3" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
