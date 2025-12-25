"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Search, Home, Users } from "lucide-react";

export default function HeaderCommandBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Ctrl / Cmd + K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Quick navigation only
  const navigationCommands = [
    {
      title: "Home",
      description: "Go to dashboard overview",
      href: "/",
      icon: Home,
      keywords: ["home", "dashboard"],
    },
    {
      title: "Connections",
      description: "Manage connections",
      href: "/connections",
      icon: Users,
      keywords: ["connections"],
    },
    {
      title: "Connectors",
      description: "Manage connectors",
      href: "/connectors",
      icon: Users,
      keywords: ["connectors"],
    },
    {
      title: "Integrations",
      description: "Manage integrations",
      href: "/integrations",
      icon: Users,
      keywords: ["integrations"],
    },
  ];

  const filteredNavigation = useMemo(() => {
    if (!search) return navigationCommands;

    const q = search.toLowerCase();
    return navigationCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.keywords.some((k) => k.includes(q))
    );
  }, [search]);

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      {/* Trigger */}
      <div
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-1/3 px-4 py-2 border rounded-sm shadow-sm cursor-pointer bg-background text-muted-foreground hover:bg-muted"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span className="text-sm">Quick navigation…</span>
        </div>
        <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
          Ctrl K
        </kbd>
      </div>

      {/* Command dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Go to…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Navigation">
              {filteredNavigation.map((cmd) => (
                <CommandItem
                  key={cmd.href}
                  onSelect={() => handleSelect(cmd.href)}
                  className="flex items-center gap-3"
                >
                  <cmd.icon className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span>{cmd.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {cmd.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
