const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("daisyui"),
  ],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#4B89DC",            // Soft Blue
          secondary: "#F1A5B3",          // Pastel Pink
          accent: "#8EDFB2",             // Mint Green
          neutral: "#F1F2F6",            // Light Gray
          "base-100": "#FFFFFF",         // White
          "base-content": "#1F1F1F",     // Black (text)
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
          "--rounded-badge": "0.25rem",
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.375rem",
        },
      },
      {
        dark: {
          primary: "#661AE6",            // Purple
          secondary: "#D926AA",          // Pink
          accent: "#1FB2A5",             // Teal
          neutral: "#2A303C",            // Dark Blue-gray
          "base-100": "#1D232A",         // Very Dark Blue-gray
          "base-content": "#A6ADBB",     // Light Gray (text)
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        }
      },
      {
        cupcake: {
          primary: "#65C3C8",            // Teal
          secondary: "#EF9FBC",          // Pink
          accent: "#EEAF3A",             // Yellow
          neutral: "#291334",            // Dark Purple
          "base-100": "#FAF7F5",         // Cream
          "base-content": "#291334",     // Dark Purple (text)
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        }
      },
      {
        corporate: {
          primary: "#4B6BFB",            // Blue 
          secondary: "#7B92B2",          // Slate blue
          accent: "#37CDBE",             // Teal
          neutral: "#3D4451",            // Dark gray
          "base-100": "#FFFFFF",         // White
          "base-content": "#333333",     // Dark gray (text)
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        }
      },
      {
        synthwave: {
          primary: "#E779C1",           // Pink
          secondary: "#58C7F3",         // Blue
          accent: "#F3CC30",            // Yellow
          neutral: "#2B1C2F",           // Dark purple
          "base-100": "#2D1B69",        // Very dark blue-purple
          "base-content": "#F9F7FD",    // Very light purple (text)
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        }
      }
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
}

