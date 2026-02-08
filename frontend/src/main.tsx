import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/geist-mono";
import "@fontsource/bebas-neue";
import "@fontsource/gravitas-one";

createRoot(document.getElementById("root")!).render(<App />);
