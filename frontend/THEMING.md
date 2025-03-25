# Theming in Habit Tracker Pro

This document explains how the theming system is implemented in Habit Tracker Pro.

## Features

- **Multiple themes**: Access to 29+ built-in themes from DaisyUI
- **Persistent preferences**: User theme choice is saved to localStorage
- **Visual preview**: Theme selector with visual previews in settings
- **SSR compatible**: Safe hydration with client-side theme application
- **Centralized management**: Theme selection is only available in the Settings page

## Implementation

The theme system uses:

1. **DaisyUI**: Provides preset themes with consistent design tokens
2. **ThemeContext**: Custom React context for managing theme state
3. **localStorage**: Persists user theme selection between sessions

## How to Use

### User Interface

Users can change themes in the dedicated Settings page:

1. Navigate to Settings > Appearance
2. Browse the visual theme previews
3. Click on a theme to select and apply it immediately

### Code Usage

To access or update the theme in your components:

```tsx
import { useThemeContext } from "@/contexts/theme-context";

function MyComponent() {
  const { theme, setTheme, availableThemes } = useThemeContext();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("cupcake")}>
        Switch to Cupcake Theme
      </button>
    </div>
  );
}
```

## Available Themes

The system includes all DaisyUI themes:

- Light themes: light, cupcake, bumblebee, emerald, corporate, lemonade
- Dark themes: dark, synthwave, retro, cyberpunk, valentine, halloween, forest
- Special themes: luxury, dracula, cmyk, autumn, business, acid, night, coffee, winter

## Theme Color Palettes

Here's a comprehensive overview of all available DaisyUI themes and their primary colors:

### Light-based Themes

- **Light** – White, Blue, Purple, Black
- **Corporate** – White, Blue, Black
- **Pastel** – White, Pink, Aqua, Green
- **Wireframe** – White, Light Gray, Dark Gray
- **Lemonade** – Light Green, Yellow, Dark Green
- **Winter** – Light Blue, White
- **Silk** – Light Gray, White

### Dark-based Themes

- **Dark** – Dark Gray, Blue, Purple, Black
- **Black** – Black, Gray
- **Luxury** – Black, Gold, Brown
- **Dracula** – Black, Pink, Orange, Gray
- **Business** – Dark Gray, Blue
- **Night** – Dark Blue, Aqua, Purple
- **Dim** – Black, Gray, Purple
- **Abyss** – Black, Green, Purple
- **Lofi** – Black, White

### Colorful Themes

- **Cupcake** – Light Beige, Pink, Aqua, Black
- **Bumblebee** – Yellow, Orange, Black
- **Emerald** – Green, Aqua, Black
- **Synthwave** – Dark Blue, Pink, Orange, Yellow
- **Retro** – Beige, Brown, Orange
- **Cyberpunk** – Yellow, Pink, Blue, Black
- **Valentine** – Pink, Magenta, Blue
- **Halloween** – Black, Orange, Yellow, Green
- **Garden** – Gray, Green, Brown
- **Forest** – Dark Green, Aqua, Black
- **Aqua** – Blue, Light Blue, Yellow
- **Fantasy** – Dark Purple, Aqua, Orange
- **CMYK** – Blue, Cyan, Yellow
- **Autumn** – Beige, Red, Brown
- **Acid** – Pink, Orange, Yellow, Green
- **Coffee** – Dark Brown, Aqua, Orange
- **Nord** – Light Blue, Dark Blue, Gray
- **Sunset** – Black, Orange, Red
- **Caramel Latte** – Beige, Black, Brown

### Theme Examples

Here are some detailed examples of the most popular themes:

#### Light Theme

- Primary: `#570df8` (Purple)
- Secondary: `#f000b8` (Pink)
- Background: `#ffffff` (White)
- Text: `#1f2937` (Dark Gray)

#### Dark Theme

- Primary: `#661ae6` (Purple)
- Secondary: `#d926a9` (Pink)
- Background: `#1d232a` (Dark Gray)
- Text: `#a6adbb` (Light Gray)

#### Cupcake Theme

- Primary: `#65c3c8` (Teal)
- Secondary: `#ef9fbc` (Pink)
- Background: `#faf7f5` (Cream)
- Text: `#291334` (Dark Purple)

#### Synthwave Theme

- Primary: `#e779c6` (Pink)
- Secondary: `#58c7f3` (Blue)
- Background: `#2d1b69` (Dark Purple)
- Text: `#f9f7fd` (Light Purple)

#### Cyberpunk Theme

- Primary: `#ff7598` (Pink)
- Secondary: `#75d1f0` (Blue)
- Background: `#150220` (Very Dark Purple)
- Text: `#fffc99` (Light Yellow)

#### Halloween Theme

- Primary: `#f28c18` (Orange)
- Secondary: `#6d3a9c` (Purple)
- Background: `#212121` (Near Black)
- Text: `#f8f8f2` (Light Gray)

## Custom Components

- **ThemeSelector**: Grid of preview cards for the settings page
- **ThemeProvider**: Manages the theme state and persistence

## Implementation Details

### How Themes Are Applied

The current theme is applied by setting the `data-theme` attribute on the `<html>` element:

```javascript
document.documentElement.setAttribute("data-theme", theme);
```

### Theme Persistence

Themes are saved to localStorage when selected:

```javascript
localStorage.setItem("theme", theme);
```

And retrieved when the application loads:

```javascript
const storedTheme = localStorage.getItem("theme") || "light";
```

### SSR Compatibility

To avoid hydration mismatch, theme selection components use a `mounted` state:

```javascript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return null;
}
```

## Adding New Themes

If you want to create custom themes beyond what DaisyUI provides, refer to the [DaisyUI Theme Documentation](https://daisyui.com/docs/themes/).
