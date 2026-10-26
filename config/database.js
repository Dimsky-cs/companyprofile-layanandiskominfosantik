const mysql = require("mysql2");
require("dotenv").config();

// Membuat connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "portal_diskominfo_bekasi",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Menggunakan wrapper Promise untuk kemudahan async/await
const db = pool.promise();

// Fungsi helper untuk cek koneksi saat aplikasi startup
const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log(
      "✅ Koneksi ke Database MySQL (portal_diskominfo_bekasi) Berhasil Terhubung!",
    );
    connection.release();
  } catch (error) {
    console.error("❌ Gagal terhubung ke Database MySQL:", error.message);
    console.error(
      "👉 Pastikan MySQL Service (XAMPP/MySQL Server) sudah berjalan dan database telah dibuat.",
    );
  }
};

module.exports = { db, testConnection };
