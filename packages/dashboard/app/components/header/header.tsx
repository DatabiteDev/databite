"use client";

import React from "react";
import HeaderCommandBar from "./header-command-bar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CreateConnectionForm } from "../create-connection-form";

export default function Header() {
  return (
    <div className="flex w-full flex-row items-center justify-between border-b border-solid px-5 h-14">
      <div className="flex items-center justify-start space-x-2"></div>
      <HeaderCommandBar />
      <div className="flex h-fit w-fit flex-row items-center space-x-2">
        <CreateConnectionForm />
        <ThemeToggle />
      </div>
    </div>
  );
}
