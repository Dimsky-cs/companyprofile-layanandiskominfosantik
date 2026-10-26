const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 1. Pastikan Semua Folder Upload Tersedia
const dirs = [
  path.join(__dirname, "../public/uploads/surat"),
  path.join(__dirname, "../public/uploads/pengaduan"),
  path.join(__dirname, "../public/uploads/berita"),
  path.join(__dirname, "../public/uploads/galeri"),
  path.join(__dirname, "../public/uploads/branding"),
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 2. Storage Handlers
const storageSurat = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dirs[0]),
  filename: (req, file, cb) => {
    const prefix = file.fieldname === "file_surat_hasil" ? "surat-hasil-" : "lampiran-";
    cb(null, prefix + Date.now() + path.extname(file.originalname));
  },
});

const storageAduan = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dirs[1]),
  filename: (req, file, cb) =>
    cb(null, "bukti-aduan-" + Date.now() + path.extname(file.originalname)),
});

const storageBerita = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dirs[2]),
  filename: (req, file, cb) =>
    cb(null, "berita-" + Date.now() + path.extname(file.originalname)),
});

const storageGaleri = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dirs[3]),
  filename: (req, file, cb) =>
    cb(null, "galeri-" + Date.now() + path.extname(file.originalname)),
});

const storageBranding = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dirs[4]),
  filename: (req, file, cb) => {
    const prefix = file.fieldname === "favicon" ? "favicon-" : "logo-";
    cb(null, prefix + Date.now() + path.extname(file.originalname));
  },
});

// 3. Filter Format File (PDF, JPG, PNG, WEBP, MP4, ICO, SVG)
const fileFilter = (req, file, cb) => {
  const allowed = /pdf|jpg|jpeg|png|webp|mp4|mkv|ico|svg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype) || file.mimetype === "image/x-icon" || file.mimetype === "image/svg+xml";

  if (ext || mime) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung!"));
  }
};

// 4. Inisialisasi Middleware Multer
const uploadSurat = multer({
  storage: storageSurat,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});
const uploadPengaduan = multer({
  storage: storageAduan,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});
const uploadBerita = multer({
  storage: storageBerita,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});
const uploadGaleri = multer({
  storage: storageGaleri,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});
const uploadBranding = multer({
  storage: storageBranding,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = {
  uploadSurat,
  uploadPengaduan,
  uploadBerita,
  uploadGaleri,
  uploadBranding,
};
