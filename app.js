const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session"); // <-- Import session
const path = require("path");
require("dotenv").config();

// Live Reload Setup
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

// Import Database & Settings
const { testConnection } = require("./config/database");
const { siteSettingsMiddleware } = require("./middlewares/siteSettingsMiddleware");
const { initSettingsTable } = require("./helpers/settingsHelper");

// Import Routes
const homeRoutes = require("./routes/homeRoutes");
const profilRoutes = require("./routes/profilRoutes");
const suratRoutes = require("./routes/suratRoutes");
const statistikRoutes = require("./routes/statistikRoutes");
const pengaduanRoutes = require("./routes/pengaduanRoutes");
const beritaRoutes = require("./routes/beritaRoutes");
const galeriRoutes = require("./routes/galeriRoutes");
const adminRoutes = require("./routes/adminRoutes"); // <-- Import admin routes

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Live Reload
if (process.env.NODE_ENV !== "production") {
  try {
    const liveReloadServer = livereload.createServer();
    if (liveReloadServer && liveReloadServer.server) {
      liveReloadServer.server.on("error", (err) => {
        if (err.code !== "EADDRINUSE") console.error("LiveReload error:", err.message);
      });
      liveReloadServer.watch([
        path.join(__dirname, "views"),
        path.join(__dirname, "public"),
      ]);
      app.use(connectLivereload());

      liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
          liveReloadServer.refresh("/");
        }, 100);
      });
    }
  } catch (e) {
    console.warn("LiveReload init skipped:", e.message);
  }
}

// 1. Session Middleware
app.use(
  session({
    secret: "diskominfo_bekasi_secret_key_2026",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 Jam
  }),
);

// 2. Middleware Form & Static Files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 3. Template Engine EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// 3.5. Middleware Pengaturan Situs & Penjaga Mode Maintenance
app.use(siteSettingsMiddleware);

// 4. Daftarkan Semua Routes
app.use("/", homeRoutes);
app.use("/profil", profilRoutes);
app.use("/surat", suratRoutes);
app.use("/statistik", statistikRoutes);
app.use("/pengaduan", pengaduanRoutes);
app.use("/berita", beritaRoutes);
app.use("/galeri", galeriRoutes);
app.use("/admin-diskominfo", adminRoutes); // <-- URL Akses Khusus Admin

// 5. Jalankan Server
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`🏛️  Portal DISKOMINFOSANTIK Kab. Bekasi`);
  console.log(
    `🔐 URL Akses Admin: http://localhost:${PORT}/admin-diskominfo/login`,
  );
  console.log(`==================================================`);

  await testConnection();
  await initSettingsTable();
});
