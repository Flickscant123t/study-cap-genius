import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

// Umami analytics
const umamiScript = document.createElement("script");
umamiScript.src = "https://cloud.umami.is/script.js";
umamiScript.defer = true;
umamiScript.dataset.websiteId = "a95b5b67-9b05-4fb2-940b-54b3d1934500";
document.head.appendChild(umamiScript);

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);