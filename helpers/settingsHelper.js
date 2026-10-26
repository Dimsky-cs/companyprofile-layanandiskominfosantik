const { db } = require("../config/database");

// Cache in-memory agar query halaman publik super cepat (0ms overhead)
let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 menit TTL (langsung di-invalidate saat admin simpan)

function adjustColor(hex, percent) {
  try {
    let cleanHex = (hex || "#ff6b00").replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((x) => x + x).join("");
    }
    let num = parseInt(cleanHex, 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = ((num >> 8) & 0x00ff) + amt;
    let B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  } catch (e) {
    return hex;
  }
}

function hexToRgba(hex, alpha = 1) {
  try {
    let c = (hex || "#ff6b00").replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    let num = parseInt(c, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return `rgba(255, 107, 0, ${alpha})`;
  }
}

function enrichSettings(raw) {
  if (!raw) return getDefaultSettings();
  const primer = raw.warna_primer || "#ff6b00";
  const sekunder = raw.warna_sekunder || "#071527";

  return {
    ...raw,
    warna_primer: primer,
    warna_primer_hover: adjustColor(primer, -12),
    warna_primer_light: adjustColor(primer, 18),
    warna_primer_subtle: hexToRgba(primer, 0.12),
    warna_primer_glow: hexToRgba(primer, 0.35),
    warna_sekunder: sekunder,
    warna_sekunder_light: adjustColor(sekunder, 12),
    is_maintenance: Boolean(raw.is_maintenance),
    logo_url: raw.logo_url || "/images/logo.png",
    favicon_url: raw.favicon_url || "/images/logo.png",
    nama_instansi: raw.nama_instansi || "DISKOMINFOSANTIK",
    sub_instansi: raw.sub_instansi || "KABUPATEN BEKASI",
    tagline: raw.tagline || "Bekasi Makin Berani",
    maintenance_judul:
      raw.maintenance_judul || "Situs Sedang Dalam Pemeliharaan Berkala",
    maintenance_pesan:
      raw.maintenance_pesan ||
      "Kami sedang melakukan pemeliharaan dan peningkatan sistem layanan digital demi kenyamanan dan keamanan warga Kabupaten Bekasi. Layanan akan segera kembali beroperasi.",
  };
}

function getDefaultSettings() {
  return enrichSettings({
    id: 1,
    nama_instansi: "DISKOMINFOSANTIK",
    sub_instansi: "KABUPATEN BEKASI",
    tagline: "Bekasi Makin Berani",
    deskripsi_singkat:
      "Dinas Komunikasi, Informatika, Persandian dan Statistik Kabupaten Bekasi menyelenggarakan tata kelola pemerintahan berbasis digital, keamanan persandian, dan keterbukaan informasi publik.",
    logo_url: "/images/logo.png",
    favicon_url: "/images/logo.png",
    warna_primer: "#ff6b00",
    warna_sekunder: "#071527",
    alamat:
      "Komplek Perkantoran Pemkab Bekasi, Desa Sukamahi, Kec. Cikarang Pusat, Jawa Barat 17530",
    telepon: "(021) 89970000 / Call Center 112",
    email: "diskominfo@bekasikab.go.id",
    jam_layanan: "Senin - Jumat (08.00 - 16.00 WIB)",
    sosmed_facebook: "#",
    sosmed_instagram: "#",
    sosmed_youtube: "#",
    is_maintenance: 0,
    maintenance_judul: "Situs Sedang Dalam Pemeliharaan Berkala",
    maintenance_pesan:
      "Kami sedang melakukan pemeliharaan dan peningkatan sistem layanan digital demi kenyamanan dan keamanan warga Kabupaten Bekasi. Layanan akan segera kembali beroperasi.",
    maintenance_selesai: null,
  });
}

// Inisialisasi tabel pengaturan jika belum ada di database
async function initSettingsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pengaturan_website (
        id INT PRIMARY KEY DEFAULT 1,
        nama_instansi VARCHAR(150) DEFAULT 'DISKOMINFOSANTIK',
        sub_instansi VARCHAR(150) DEFAULT 'KABUPATEN BEKASI',
        tagline VARCHAR(255) DEFAULT 'Bekasi Makin Berani',
        deskripsi_singkat TEXT NULL,
        logo_url VARCHAR(255) DEFAULT '/images/logo.png',
        favicon_url VARCHAR(255) DEFAULT '/images/logo.png',
        warna_primer VARCHAR(20) DEFAULT '#ff6b00',
        warna_sekunder VARCHAR(20) DEFAULT '#071527',
        alamat TEXT NULL,
        telepon VARCHAR(50) DEFAULT '(021) 89970000 / Call Center 112',
        email VARCHAR(100) DEFAULT 'diskominfo@bekasikab.go.id',
        jam_layanan VARCHAR(100) DEFAULT 'Senin - Jumat (08.00 - 16.00 WIB)',
        sosmed_facebook VARCHAR(255) DEFAULT '#',
        sosmed_instagram VARCHAR(255) DEFAULT '#',
        sosmed_youtube VARCHAR(255) DEFAULT '#',
        is_maintenance TINYINT(1) DEFAULT 0,
        maintenance_judul VARCHAR(200) DEFAULT 'Situs Sedang Dalam Pemeliharaan Berkala',
        maintenance_pesan TEXT NULL,
        maintenance_selesai DATETIME NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await db.query(
      "SELECT * FROM pengaturan_website WHERE id = 1 LIMIT 1",
    );
    if (!rows || rows.length === 0) {
      const def = getDefaultSettings();
      await db.query(
        `
        INSERT INTO pengaturan_website (
          id, nama_instansi, sub_instansi, tagline, deskripsi_singkat,
          logo_url, favicon_url, warna_primer, warna_sekunder,
          alamat, telepon, email, jam_layanan,
          sosmed_facebook, sosmed_instagram, sosmed_youtube,
          is_maintenance, maintenance_judul, maintenance_pesan
        ) VALUES (
          1, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?
        )
      `,
        [
          def.nama_instansi,
          def.sub_instansi,
          def.tagline,
          def.deskripsi_singkat,
          def.logo_url,
          def.favicon_url,
          def.warna_primer,
          def.warna_sekunder,
          def.alamat,
          def.telepon,
          def.email,
          def.jam_layanan,
          def.sosmed_facebook,
          def.sosmed_instagram,
          def.sosmed_youtube,
          0,
          def.maintenance_judul,
          def.maintenance_pesan,
        ],
      );
    }
  } catch (err) {
    console.error("Error initSettingsTable:", err.message);
  }
}

async function getSettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM pengaturan_website WHERE id = 1 LIMIT 1",
    );
    if (rows && rows.length > 0) {
      cachedSettings = enrichSettings(rows[0]);
    } else {
      await initSettingsTable();
      const [newRows] = await db.query(
        "SELECT * FROM pengaturan_website WHERE id = 1 LIMIT 1",
      );
      cachedSettings = enrichSettings(
        newRows && newRows.length > 0 ? newRows[0] : getDefaultSettings(),
      );
    }
    lastFetchTime = now;
    return cachedSettings;
  } catch (err) {
    console.warn("Gagal mengambil pengaturan_website:", err.message);
    if (!cachedSettings) cachedSettings = getDefaultSettings();
    return cachedSettings;
  }
}

async function updateSettings(data) {
  try {
    const fields = [
      "nama_instansi",
      "sub_instansi",
      "tagline",
      "deskripsi_singkat",
      "logo_url",
      "favicon_url",
      "warna_primer",
      "warna_sekunder",
      "alamat",
      "telepon",
      "email",
      "jam_layanan",
      "sosmed_facebook",
      "sosmed_instagram",
      "sosmed_youtube",
      "is_maintenance",
      "maintenance_judul",
      "maintenance_pesan",
      "maintenance_selesai",
    ];

    const updates = [];
    const values = [];

    fields.forEach((f) => {
      if (data[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(data[f]);
      }
    });

    if (updates.length > 0) {
      values.push(1); // WHERE id = 1
      await db.query(
        `UPDATE pengaturan_website SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    // Segera refresh cache agar perubahan langsung berefek seketika
    cachedSettings = null;
    return await getSettings(true);
  } catch (err) {
    console.error("Error updateSettings:", err.message);
    throw err;
  }
}

function invalidateSettingsCache() {
  cachedSettings = null;
}

module.exports = {
  initSettingsTable,
  getSettings,
  updateSettings,
  invalidateSettingsCache,
  getDefaultSettings,
};
