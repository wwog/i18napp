import React from "react";
import ReactDOM from "react-dom/client";
import router from "./routes";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { boot_db } from "./db/boot";

import "./theme/normalize.css";
import "./theme/theme.css";

async function boot() {
  await boot_db();
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </React.StrictMode>
  );
}

boot().catch((error) => {
  console.error("应用启动失败:", error);
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <div style={{ padding: 16 }}>
      <h3>应用启动失败</h3>
      <p>{error.message}</p>
    </div>
  );
});
