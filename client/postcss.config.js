console.log("PostCSS config loaded");

export default {
  plugins: {
    tailwindcss: { config: "./tailwind.config.ts" },
    autoprefixer: {},
  },
};
