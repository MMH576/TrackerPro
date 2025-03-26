"use client";

import { useThemeContext } from "@/contexts/theme-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

export function ThemeSelector() {
  const { theme, setTheme, themeCategories, getThemeIcon, getThemeInfo } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  // To avoid hydration mismatch, only show the theme selector after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // All available themes
  const allThemes = ["light", "dark"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl font-semibold">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how the application looks and feels
        </p>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Theme</h4>
        
        <RadioGroup 
          value={theme} 
          onValueChange={setTheme}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {allThemes.map((themeName) => {
            const themeInfo = getThemeInfo(themeName);
            const isSelected = theme === themeName;
            
            return (
              <div key={themeName} className="space-y-2">
                <RadioGroupItem
                  value={themeName}
                  id={`theme-${themeName}`}
                  className="sr-only"
                />
                <Label
                  htmlFor={`theme-${themeName}`}
                  className="cursor-pointer block"
                >
                  <Card 
                    className={`overflow-hidden transition-all ${
                      isSelected 
                        ? "ring-4 ring-primary" 
                        : "hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <div 
                      className="h-24 w-full relative"
                      data-theme={themeName}
                      style={{ backgroundColor: `hsl(var(--b1))` }}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                      
                      <div className="flex flex-col h-full p-3">
                        {/* Theme icon */}
                        <div 
                          className="text-xl mb-1"
                          style={{ color: `hsl(var(--bc))` }}
                        >
                          {themeInfo.icon}
                        </div>
                        
                        {/* Color swatches */}
                        <div className="flex gap-1 mt-auto">
                          <div 
                            className="h-5 w-5 rounded-full border"
                            style={{ backgroundColor: `hsl(var(--p))` }}
                            title="Primary"
                          ></div>
                          <div 
                            className="h-5 w-5 rounded-full border"
                            style={{ backgroundColor: `hsl(var(--s))` }}
                            title="Secondary"
                          ></div>
                          <div 
                            className="h-5 w-5 rounded-full border"
                            style={{ backgroundColor: `hsl(var(--a))` }}
                            title="Accent"
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="p-3 flex items-center justify-between" 
                      style={{ backgroundColor: `hsl(var(--b1))` }}
                    >
                      <div 
                        className="font-medium capitalize" 
                        style={{ color: `hsl(var(--bc))` }}
                      >
                        {themeName}
                      </div>
                      <div 
                        className="text-xs" 
                        style={{ color: `hsl(var(--bc) / 0.7)` }}
                      >
                        {themeCategories.light.includes(themeName) 
                          ? "Light" 
                          : "Dark"}
                      </div>
                    </div>
                  </Card>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-base font-medium mb-3">Theme Colors Explained</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2 p-3 rounded-md bg-muted/50">
            <h5 className="text-sm font-medium">Primary Colors</h5>
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-primary"></div>
                <span>Primary - Main brand color</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-secondary"></div>
                <span>Secondary - Complementary color</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full" style={{backgroundColor: "hsl(var(--a))"}}>
                </div>
                <span>Accent - Highlight color</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 p-3 rounded-md bg-muted/50">
            <h5 className="text-sm font-medium">UI Colors</h5>
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-background border"></div>
                <span>Background - Main surface color</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-card border"></div>
                <span>Card - Component background</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-muted"></div>
                <span>Muted - Subtle background color</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 