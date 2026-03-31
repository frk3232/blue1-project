import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const mode = process.env.NODE_ENV || "development";

  console.log(`Starting server in ${mode} mode...`);

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      mode: mode,
      time: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (mode !== "production") {
    console.log("Initializing Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from the dist directory in production
    const distPath = path.resolve(__dirname, "dist");
    console.log("Production mode: Serving static files from:", distPath);
    
    if (!fs.existsSync(distPath)) {
      console.error("CRITICAL ERROR: 'dist' directory not found! Have you run 'npm run build'?");
    }

    app.use(express.static(distPath));
    
    // Fallback to index.html for SPA routing
    app.get("*", (req, res) => {
      console.log(`SPA Fallback: ${req.method} ${req.url}`);
      const indexPath = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error("CRITICAL ERROR: index.html not found in dist!");
        res.status(404).send("Application not found. Please check build status.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Error starting server:", err);
});
