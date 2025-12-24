const COLORS = {
  brand: {
    teal: "#00d4aa",
    purple: "#7c3aed",
    yellow: "#F7BC2D",
    yellowDark: "#201A13",
    surface: "#1A1A1A",
    deep: {
      start: "#0f0c29",
      middle: "#302b63",
      end: "#24243e",
    },
  },
  difficulty: {
    easy: "#22c55e",
    medium: "#f59e0b",
    hard: "#ef4444",
  },
  stat: {
    blue: "#38bdf8",
    indigo: "#6366f1",
    violet: "#8b5cf6",
    purple: "#a855f7",
  },
  grayCustom: {
    200: "#e4e4e7",
    400: "#a1a1aa",
    500: "#6b7280",
    700: "#374151",
    800: "#1f2937",
    stroke: "#888888",
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                chart: {
                    "1": "hsl(var(--chart-1))",
                    "2": "hsl(var(--chart-2))",
                    "3": "hsl(var(--chart-3))",
                    "4": "hsl(var(--chart-4))",
                    "5": "hsl(var(--chart-5))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground":
                        "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground":
                        "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
                brand: COLORS.brand,
                difficulty: COLORS.difficulty,
                stat: COLORS.stat,
                "gray-custom": COLORS.grayCustom,
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontSize: {
                xxs: "0.625rem",
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
                "slide-in-from-bottom-full": {
                    "0%": {
                        transform: "translateY(100%)",
                    },
                    "100%": {
                        transform: "translateY(0)",
                    },
                },
                "slide-out-to-bottom-full": {
                    "0%": {
                        transform: "translateY(0)",
                    },
                    "100%": {
                        transform: "translateY(100%)",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "slide-in-from-bottom-full": "slide-in-from-bottom-full 0.3s ease-in-out",
                "slide-out-to-bottom-full": "slide-out-to-bottom-full 0.3s ease-in-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
