const { getSettings } = require("../helpers/settingsHelper");

// Middleware Global: Injeksi Pengaturan Situs & Penjaga Mode Maintenance
const siteSettingsMiddleware = async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.locals.siteSettings = settings;
    res.locals.currentAdmin =
      req.session && req.session.admin ? req.session.admin : null;

    // Cek apakah Mode Maintenance sedang Aktif
    if (settings && settings.is_maintenance) {
      // 1. Bypass untuk rute Admin (/admin-diskominfo dan sub-rutenya)
      if (req.path.startsWith("/admin-diskominfo")) {
        return next();
      }

      // 2. Bypass untuk aset statis (CSS, JS, Gambar, Uploads)
      const isStaticAsset =
        req.path.startsWith("/css") ||
        req.path.startsWith("/images") ||
        req.path.startsWith("/uploads") ||
        req.path.startsWith("/js") ||
        req.path === "/favicon.ico";

      if (isStaticAsset) {
        return next();
      }

      // 3. Seluruh rute publik diarahkan ke Halaman Maintenance (503 Service Unavailable)
      //    tanpa membocorkan sesi admin atau menampilkan alert banner
      return res.status(503).render("pages/maintenance", {
        layout: false,
        siteSettings: settings,
      });
    }

    next();
  } catch (err) {
    console.error("Error pada siteSettingsMiddleware:", err.message);
    next();
  }
};

module.exports = { siteSettingsMiddleware };
