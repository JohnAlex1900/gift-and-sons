import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import React from "react";
import App from "./App";
import "./index.css";
import { HelmetProvider } from "react-helmet-async";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
