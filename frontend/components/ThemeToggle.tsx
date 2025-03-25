"use client";

import { useEffect, useState } from "react";
import { useThemeContext } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme, themeCategories, themeMetadata, getThemeIcon, getThemeInfo } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Quick toggle options
  const favoriteThemes = ["light", "dark", "cupcake", "synthwave", "corporate"];
  
  // Get current theme info
  const currentThemeInfo = getThemeInfo(theme);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="relative h-9 w-9 border-2 border-primary/20 hover:border-primary/70" 
                aria-label="Change theme"
              >
                <span className="text-lg">{currentThemeInfo.icon}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <div className="px-3 py-2 border-b">
                <h4 className="font-medium">Choose Theme</h4>
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-medium capitalize">{theme}</span>
                </p>
              </div>
              <div className="p-3 space-y-3">
                {favoriteThemes.map((themeName) => {
                  const themeInfo = getThemeInfo(themeName);
                  const isSelected = theme === themeName;
                  return (
                    <button 
                      key={themeName}
                      className={`flex items-center w-full p-2.5 rounded-md transition-all ${
                        isSelected 
                          ? 'bg-primary/10 ring-2 ring-primary ring-offset-1' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setTheme(themeName)}
                    >
                      <div 
                        className="w-8 h-8 rounded-full mr-3 flex items-center justify-center" 
                        data-theme={themeName}
                        style={{ backgroundColor: `hsl(var(--b1))` }}
                      >
                        <span className="text-lg" style={{ color: `hsl(var(--bc))` }}>
                          {themeInfo.icon}
                        </span>
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="font-medium capitalize text-sm">{themeName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {themeInfo.description}
                        </div>
                      </div>
                      {isSelected && (
                        <svg 
                          className="ml-2 h-4 w-4 text-primary flex-shrink-0" 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex items-center gap-2">
            <span>{currentThemeInfo.icon}</span>
            <p className="capitalize">{theme} Theme</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 