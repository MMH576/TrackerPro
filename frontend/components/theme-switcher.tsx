"use client";

import { useThemeContext } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  // To avoid hydration mismatch, only show the theme switcher after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Group themes by categories for better organization
  const popularThemes = ["light", "dark", "cupcake", "emerald", "synthwave", "retro", "cyberpunk"];
  const otherThemes = availableThemes.filter(t => !popularThemes.includes(t));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change theme">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="h-[300px] overflow-y-auto">
          <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
            Popular
          </DropdownMenuLabel>
          {popularThemes.map((t) => (
            <DropdownMenuItem
              key={t}
              className="capitalize"
              onClick={() => setTheme(t)}
            >
              <div className="w-4 h-4 rounded-full mr-2 border" 
                   style={{ backgroundColor: `var(--${t === 'light' ? 'b1' : t === 'dark' ? 'd1' : t})` }}></div>
              {t} {theme === t && "✓"}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
            All Themes
          </DropdownMenuLabel>
          {otherThemes.map((t) => (
            <DropdownMenuItem
              key={t}
              className="capitalize"
              onClick={() => setTheme(t)}
            >
              <div className="w-4 h-4 rounded-full mr-2 border" 
                   style={{ backgroundColor: `var(--${t})` }}></div>
              {t} {theme === t && "✓"}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 