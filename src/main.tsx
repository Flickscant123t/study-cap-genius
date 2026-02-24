import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

const UMAMI_WEBSITE_ID = "a95b5b67-9b05-4fb2-940b-54b3d1934500";

const loadUmamiScript = () => {
  if (document.querySelector(`script[data-website-id="${UMAMI_WEBSITE_ID}"]`)) {
    return;
  }

  const umamiScript = document.createElement("script");
  umamiScript.src = "https://cloud.umami.is/script.js";
  umamiScript.defer = true;
  umamiScript.dataset.websiteId = UMAMI_WEBSITE_ID;
  document.head.appendChild(umamiScript);
};

if (import.meta.env.PROD) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadUmamiScript, { timeout: 2000 });
  } else {
    window.setTimeout(loadUmamiScript, 1200);
  }
}



createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
