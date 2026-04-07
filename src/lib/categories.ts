export const CATEGORIES = [
  {
    slug: "icons",
    name: "Icons",
    description: "Beautiful open-source icons for your projects",
    icon: "Grid3X3",
    color: "from-blue-500 to-blue-600",
  },
  {
    slug: "illustrations",
    name: "Illustrations",
    description: "Free illustrations for web and mobile",
    icon: "Image",
    color: "from-purple-500 to-purple-600",
  },
  {
    slug: "lottie",
    name: "Lottie Animations",
    description: "Lightweight animations in JSON format",
    icon: "Play",
    color: "from-pink-500 to-pink-600",
  },
  {
    slug: "animated-icons",
    name: "Animated Icons",
    description: "Icons with delightful micro-animations",
    icon: "Sparkles",
    color: "from-amber-500 to-amber-600",
  },
  {
    slug: "stickers",
    name: "Stickers",
    description: "Fun animated stickers and emojis",
    icon: "Smile",
    color: "from-green-500 to-green-600",
  },
  {
    slug: "3d-assets",
    name: "3D Assets",
    description: "3D icons, avatars, and illustrations",
    icon: "Box",
    color: "from-cyan-500 to-cyan-600",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
