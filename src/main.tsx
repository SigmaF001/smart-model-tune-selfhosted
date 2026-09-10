import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAuth } from "@/auth/keycloak";

void initAuth().catch(() => false).finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
