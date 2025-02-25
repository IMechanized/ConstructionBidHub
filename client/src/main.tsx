if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);