if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize the React app
createRoot(document.getElementById("root")!).render(<App />);

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('Hot module replacement active - updated modules will be applied automatically');
  });
}