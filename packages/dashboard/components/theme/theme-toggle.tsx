"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// --- Toasts for when the user switches to DARK mode ---
// (Framed as the superior choice)
const toDarkToasts = [
  { title: "Welcome to the Club.", description: "The cooler, darker club." },
  {
    title: "You've Seen the Light...",
    description: "...and you wisely chose darkness.",
  },
  { title: "Ah, Perfect.", description: "Your eyes are already thanking you." },
  {
    title: "The Superior Choice.",
    description: "It's not an opinion, it's a fact.",
  },
  {
    title: "Welcome, Night Owl 🦉",
    description: "The interface is now vibing with you.",
  },
  { title: "Comfort Mode: ON", description: "Let your retinas relax." },
  {
    title: "Now We're Talking.",
    description: "This just feels right, doesn't it?",
  },
  {
    title: "Entered VIP Mode.",
    description: "Everything looks better in black.",
  },
  {
    title: "The Aesthetic Choice.",
    description: "Sleek, stylish, and sophisticated.",
  },
  { title: "You Get It.", description: "Some people just have better taste." },
  { title: "This Is The Way.", description: "The only way, really." },
  { title: "Hiding From the Sun? 😎", description: "We've got you covered." },
  { title: "Good for Your Battery.", description: "Great for your soul." },
  { title: "Let the Shadows Embrace You.", description: "It's cozy in here." },
  {
    title: "Welcome Home.",
    description: "We knew you'd come back to the dark.",
  },
  {
    title: "Finally, Some Peace.",
    description: "No more searing white light.",
  },
  {
    title: "The Secret Handshake is Next.",
    description: "You're officially one of us now.",
  },
  { title: "Power Saver Mode.", description: "For your eyes and your device." },
  {
    title: "Switched to Awesome.",
    description: "The other mode is just 'okay'.",
  },
  {
    title: "Elite Status: Unlocked.",
    description: "You're Browse in first class now.",
  },
  { title: "Chef's Kiss. 👌", description: "A truly magnificent decision." },
];

// --- Toasts for when the user switches to LIGHT mode ---
// (Still friendly, but with a hint of preference for dark)
const toLightToasts = [
  {
    title: "Okay, It's Bright In Here.",
    description: "Hope you have your sunglasses.",
  },
  { title: "Switching to Light...", description: "...if you really must." },
  { title: "A Bold Choice.", description: "A very, very bright choice." },
  { title: "The Classic Look.", description: "We'll admit, it's a classic." },
  {
    title: "Alright, Alright, Light Mode.",
    description: "The dark side will await your return.",
  },
  {
    title: "Is It Daytime Already?",
    description: "Because it sure looks like it now.",
  },
  {
    title: "A Choice Was Made.",
    description: "We're not saying it was the wrong one...",
  },
  {
    title: "For the Traditionalists.",
    description: "There's nothing wrong with vanilla.",
  },
  { title: "It's... Clean.", description: "We'll give it that. Very clean." },
  {
    title: "Don't Forget to Blink.",
    description: "It's important for eye health!",
  },
  { title: "Back to Basics.", description: "Sometimes simplicity is key." },
  { title: "Hello, Sunshine!", description: "It's a bit loud, but hello!" },
  { title: "The Sun Says Hello.", description: "Right in your eyeballs." },
  {
    title: "Switching on the Stadium Lights.",
    description: "Everything is illuminated.",
  },
  {
    title: "A Crisp, Clean Slate.",
    description: "Like a fresh sheet of paper.",
  },
  { title: "Okay, But Have You Tried Dark?", description: "Just checking." },
  { title: "Who Needs Retinas Anyway?", description: "Kidding! Mostly." },
  {
    title: "Feeling Optimistic, Are We?",
    description: "This theme certainly is.",
  },
  {
    title: "A Fine Option for a Well-Lit Room.",
    description: "And only for a well-lit room.",
  },
  {
    title: "Public Library Mode: ON.",
    description: "Quiet, bright, and studious.",
  },
  {
    title: "The Default Setting of Life.",
    description: "But we all know custom is better.",
  },
];

// Helper function to pick a random item from an array
function getRandomToast(options: any[]) {
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    // Get a random toast from the appropriate list
    const toastMessage =
      newTheme === "dark"
        ? getRandomToast(toDarkToasts)
        : getRandomToast(toLightToasts);

    // [!code focus:6]
    // Select the correct icon based on the new theme
    const toastIcon =
      newTheme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      );

    // Launch the toast, now with a theme-appropriate icon
    toast(toastMessage.title, {
      description: toastMessage.description,
      // [!code focus]
      icon: toastIcon,
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="pointer-events-auto relative cursor-pointer"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
