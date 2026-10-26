const { db } = require("../config/database");
const QRCode = require("qrcode");

// 1. Halaman Utama Layanan Surat & Form Permohonan
exports.getSuratPage = async (req, res) => {
  try {
    const trackingQuery = req.query.tracking || "";
    let hasilTracking = null;
    let qrImage = null;

    if (trackingQuery) {
      const [rows] = await db.query(
        `SELECT * FROM layanan_surat 
                 WHERE nomor_surat = ? OR nik = ? 
                 ORDER BY created_at DESC LIMIT 1`,
        [trackingQuery.trim(), trackingQuery.trim()],
      );

      if (rows.length > 0) {
        hasilTracking = rows[0];
        // Generate QR Code untuk validasi tanda terima
        const qrData = `VALIDASI DISKOMINFOSANTIK BEKASI\nNo. Tiket: ${hasilTracking.nomor_surat}\nPemohon: ${hasilTracking.nama_pemohon}\nStatus: ${hasilTracking.status}`;
        qrImage = await QRCode.toDataURL(qrData);
      }
    }

    res.render("pages/surat/index", {
      title: "Pelayanan Persuratan Mandiri & Tracking",
      currentPage: "surat",
      trackingQuery,
      hasilTracking,
      qrImage,
      errorMsg: req.query.error || null,
      successMsg: req.query.success || null,
    });
  } catch (error) {
    console.error("Error memuat halaman persuratan:", error);
    res.status(500).send("Terjadi kesalahan memuat halaman surat.");
  }
};

// 2. Proses Pengajuan Surat Mandiri
exports.submitSurat = async (req, res) => {
  try {
    const {
      nama_pemohon,
      asal_instansi,
      nik,
      no_hp,
      email,
      jenis_surat,
      keperluan,
      math_answer,
      math_real,
    } = req.body;

    // Verifikasi Anti-Spam Math Challenge
    if (parseInt(math_answer) !== parseInt(math_real)) {
      return res.redirect(
        "/surat?error=" +
          encodeURIComponent(
            "Verifikasi anti-spam salah! Silakan coba kembali.",
          ),
      );
    }

    // Generate Tracking Code Unik: DKI-SRT-2026-XXXX
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const nomorSurat = `DKI-SRT-2026-${randomCode}`;

    // File Lampiran
    const berkasLampiran = req.file
      ? `/uploads/surat/${req.file.filename}`
      : null;

    // Simpan ke MySQL
    await db.query(
      `INSERT INTO layanan_surat 
             (nomor_surat, nama_pemohon, asal_instansi, nik, no_hp, email, jenis_surat, keperluan, berkas_lampiran, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu')`,
      [
        nomorSurat,
        nama_pemohon,
        asal_instansi || "-",
        nik,
        no_hp,
        email || "-",
        jenis_surat,
        keperluan,
        berkasLampiran,
      ],
    );

    res.redirect(`/surat?tracking=${encodeURIComponent(nomorSurat)}&success=1`);
  } catch (error) {
    console.error("Error simpan permohonan surat:", error);
    res.redirect(
      "/surat?error=" +
        encodeURIComponent("Gagal mengirim permohonan: " + error.message),
    );
  }
};

// 3. Cetak Tanda Terima Bukti Pengajuan (Format Cetak / PDF)
exports.cetakTandaTerima = async (req, res) => {
  try {
    const { nomorSurat } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM layanan_surat WHERE nomor_surat = ?",
      [nomorSurat],
    );

    if (rows.length === 0) {
      return res.status(404).send("Data surat tidak ditemukan.");
    }

    const surat = rows[0];
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const verifyUrl = `${protocol}://${host}/surat/verifikasi/${surat.nomor_surat}`;
    const qrData = `LEGALITAS BUKTI PENGAJUAN PERSURATAN DISKOMINFOSANTIK BEKASI\nNo: ${surat.nomor_surat}\nNIK: ${surat.nik}\nPemohon: ${surat.nama_pemohon}\nTanggal: ${new Date(surat.created_at).toLocaleString("id-ID")}\nVerifikasi: ${verifyUrl}`;
    const qrImage = await QRCode.toDataURL(qrData);

    res.render("pages/surat/cetak", {
      layout: false,
      surat,
      qrImage,
    });
  } catch (error) {
    console.error("Error cetak tanda terima:", error);
    res.status(500).send("Terjadi kesalahan saat memproses cetak.");
  }
};

// 4. Cetak / Unduh Surat Permohonan Digital Pemohon
exports.cetakPermohonanPemohon = async (req, res) => {
  try {
    const { nomorSurat } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM layanan_surat WHERE nomor_surat = ?",
      [nomorSurat],
    );

    if (rows.length === 0) {
      return res.status(404).send("Data surat permohonan tidak ditemukan.");
    }

    const surat = rows[0];
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const verifyUrl = `${protocol}://${host}/surat/verifikasi/${surat.nomor_surat}`;
    const qrData = `VERIFIKASI PERMOHONAN DIGITAL DISKOMINFOSANTIK BEKASI\nNo Tiket: ${surat.nomor_surat}\nPemohon: ${surat.nama_pemohon}\nNIK: ${surat.nik}\nStatus: ${surat.status}\nVerifikasi: ${verifyUrl}`;
    const qrImage = await QRCode.toDataURL(qrData);

    res.render("pages/surat/surat_permohonan", {
      layout: false,
      surat,
      qrImage,
      verifyUrl,
    });
  } catch (error) {
    console.error("Error cetak surat permohonan:", error);
    res.status(500).send("Terjadi kesalahan memuat surat permohonan pemohon.");
  }
};

// 5. Cetak / Unduh Surat Balasan Resmi Diskominfo (KOP & QR TTE)
exports.cetakSuratResmiDinas = async (req, res) => {
  try {
    const { nomorSurat } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM layanan_surat WHERE nomor_surat = ?",
      [nomorSurat],
    );

    if (rows.length === 0) {
      return res.status(404).send("Data surat resmi tidak ditemukan.");
    }

    const surat = rows[0];
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const verifyUrl = `${protocol}://${host}/surat/verifikasi/${surat.nomor_surat}`;
    const nomorDinas = `500.12.7/${Number(surat.id) + 120}/DISKOMINFOSANTIK/${new Date().getFullYear()}`;
    const qrData = `TTE TERSERTIFIKASI DISKOMINFOSANTIK KAB. BEKASI\nNomor: ${nomorDinas}\nPerihal: ${surat.jenis_surat}\nPemohon: ${surat.nama_pemohon}\nStatus: DISETUJUI & SAH\nCek Keabsahan: ${verifyUrl}`;
    const qrImage = await QRCode.toDataURL(qrData);

    res.render("pages/surat/surat_resmi_dinas", {
      layout: false,
      surat,
      qrImage,
      nomorDinas,
      verifyUrl,
    });
  } catch (error) {
    console.error("Error cetak surat resmi dinas:", error);
    res.status(500).send("Terjadi kesalahan memuat surat resmi dinas.");
  }
};

// 6. Verifikasi Keabsahan QR Code Dokumen Digital
exports.verifikasiSurat = async (req, res) => {
  try {
    const { nomorSurat } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM layanan_surat WHERE nomor_surat = ?",
      [nomorSurat],
    );

    if (rows.length === 0) {
      return res.status(404).send("Dokumen tidak ditemukan atau nomor tiket tidak terdaftar.");
    }

    const surat = rows[0];

    res.render("pages/surat/verifikasi", {
      layout: false,
      surat,
    });
  } catch (error) {
    console.error("Error verifikasi surat:", error);
    res.status(500).send("Terjadi kesalahan saat memverifikasi dokumen.");
  }
};
