/**
 * ====================================================================
 * PORTAL DISKOMINFOSANTIK KABUPATEN BEKASI - SISTEM ALERT UNIVERSAL
 * Menggantikan alert bawaan browser / Chrome dengan Modal Notifikasi Modern
 * Kompatibel dengan Tema Light Mode & Dark Navy, serta Layar Sentuh Mobile
 * ====================================================================
 */

(function () {
  'use strict';

  // Helper untuk deteksi mode gelap
  function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.documentElement.classList.contains('dark');
  }

  // Helper untuk mendapatkan tema warna SweetAlert2
  function getSwalThemeConfig() {
    const dark = isDarkMode();
    return {
      background: dark ? '#0f172a' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',
      confirmButtonColor: '#ff6b00',
      cancelButtonColor: dark ? '#334155' : '#94a3b8',
      customClass: {
        popup: 'rounded-4 shadow-2xl border ' + (dark ? 'border-slate-700' : 'border-slate-200'),
        confirmButton: 'btn btn-orange px-4 py-2 rounded-pill font-bold shadow-sm',
        cancelButton: 'btn btn-outline-secondary px-4 py-2 rounded-pill font-bold ms-2',
        title: 'fw-bold ' + (dark ? 'text-white' : 'text-dark'),
        htmlContainer: dark ? 'text-slate-300' : 'text-slate-600'
      }
    };
  }

  /**
   * Fungsi Utama Tampilkan Alert Kustom
   * @param {Object} options - { title, message, icon: 'warning'|'error'|'success'|'info', targetInput, confirmText }
   */
  window.showCustomAlert = function (options) {
    const opts = typeof options === 'string' ? { message: options } : (options || {});
    const title = opts.title || (opts.icon === 'error' ? 'Peringatan Sistem' : 'Perhatian');
    const message = opts.message || opts.text || '';
    const icon = opts.icon || 'warning';
    const confirmText = opts.confirmText || 'Saya Mengerti';
    const targetInput = opts.targetInput || null;

    // Jika SweetAlert2 tersedia di window
    if (window.Swal) {
      const swalConfig = Object.assign({}, getSwalThemeConfig(), {
        title: title,
        html: `<div class="mt-2 text-base leading-relaxed">${message}</div>`,
        icon: icon,
        confirmButtonText: confirmText,
        focusConfirm: true,
        backdrop: 'rgba(15, 23, 42, 0.65)',
        didOpen: () => {
          // Tambahkan efek getar lembut jika ada input yang salah
          if (targetInput && typeof targetInput.focus === 'function') {
            highlightInvalidInput(targetInput);
          }
        }
      });

      return Swal.fire(swalConfig).then((result) => {
        if (targetInput && typeof targetInput.focus === 'function') {
          try {
            targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetInput.focus();
          } catch (e) {}
        }
        return result;
      });
    }

    // Fallback jika SweetAlert2 belum ter-load (Modal Kustom Mini)
    return showFallbackToast(title, message, icon, targetInput);
  };

  /**
   * Sorot input yang belum lengkap dengan border oranye/merah
   */
  function highlightInvalidInput(input) {
    if (!input) return;
    input.classList.add('border-warning');
    input.style.boxShadow = '0 0 0 3px rgba(255, 107, 0, 0.35)';
    input.style.transition = 'all 0.3s ease';

    const clearHighlight = () => {
      input.classList.remove('border-warning');
      input.style.boxShadow = '';
      input.removeEventListener('input', clearHighlight);
      input.removeEventListener('change', clearHighlight);
    };

    input.addEventListener('input', clearHighlight);
    input.addEventListener('change', clearHighlight);
  }

  /**
   * Fallback Toast jika Swal CDN belum terpasang
   */
  function showFallbackToast(title, message, icon, targetInput) {
    return new Promise((resolve) => {
      let toast = document.getElementById('customFallbackToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'customFallbackToast';
        toast.style.cssText = `
          position: fixed;
          top: 24px;
          right: 20px;
          z-index: 99999;
          max-width: 380px;
          width: calc(100vw - 40px);
          background: #ffffff;
          border-left: 5px solid #ff6b00;
          border-radius: 14px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateY(-20px);
          opacity: 0;
        `;
        document.body.appendChild(toast);
      }

      const iconEmoji = icon === 'error' ? '❌' : (icon === 'success' ? '✅' : '⚠️');
      toast.innerHTML = `
        <div style="font-size: 1.4rem; line-height: 1;">${iconEmoji}</div>
        <div style="flex: 1;">
          <strong style="display: block; font-size: 0.92rem; color: #0a2540; margin-bottom: 3px;">${title}</strong>
          <div style="font-size: 0.82rem; color: #475569; line-height: 1.4;">${message}</div>
        </div>
        <button type="button" style="background: none; border: none; font-size: 1.1rem; color: #94a3b8; cursor: pointer; padding: 0 4px;" onclick="this.parentElement.style.opacity=0;">✕</button>
      `;

      requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      });

      if (targetInput && typeof targetInput.focus === 'function') {
        highlightInvalidInput(targetInput);
        targetInput.focus();
      }

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        resolve();
      }, 4500);
    });
  }

  // 1. OVERRIDE NATIVE WINDOW.ALERT AGAR TIDAK MUNCUL DIALOG ABU-ABU BAWAAN BROWSER
  window.alert = function (message) {
    window.showCustomAlert({
      title: 'Pemberitahuan Sistem',
      message: message,
      icon: 'warning'
    });
  };

  /**
   * Ambil nama label kolom yang ramah pengguna
   */
  function getFieldLabel(input) {
    if (!input) return 'Kolom Formulir';

    // 1. Cek atribut data-label
    if (input.getAttribute('data-label')) {
      return input.getAttribute('data-label');
    }

    // 2. Cek label[for="id"]
    if (input.id) {
      const lbl = document.querySelector(`label[for="${input.id}"]`);
      if (lbl) return cleanLabelText(lbl.innerText);
    }

    // 3. Cek elemen label terdekat di parent / preceding sibling
    const parent = input.closest('.col-12, .col-md-6, .col-md-4, .mb-3, .mb-4, div');
    if (parent) {
      const lbl = parent.querySelector('label');
      if (lbl) return cleanLabelText(lbl.innerText);
    }

    // 4. Cek placeholder
    if (input.placeholder && input.placeholder.length < 40) {
      return input.placeholder.replace(/^Contoh:\s*/i, '');
    }

    // 5. Cek atribut name yang umum
    const nameMap = {
      'nama_pemohon': 'Nama Lengkap Pemohon',
      'nama_pelapor': 'Nama Lengkap Pelapor',
      'nik': 'Nomor NIK / Identitas',
      'nik_pelapor': 'Nomor NIK Pelapor',
      'asal_instansi': 'Asal Instansi / Universitas / Desa',
      'no_hp': 'Nomor WhatsApp / Telepon Aktif',
      'no_telp': 'Nomor WhatsApp / Telepon Aktif',
      'email': 'Alamat Email',
      'jenis_surat': 'Jenis Layanan Surat',
      'keperluan': 'Rincian Keperluan Surat',
      'kategori_aduan': 'Kategori Laporan Aduan',
      'judul_aduan': 'Judul Singkat Laporan',
      'isi_aduan': 'Isi Detail Pengaduan / Keluhan',
      'sifat_aduan': 'Sifat Privasi Laporan',
      'math_answer': 'Jawaban Verifikasi Keamanan (Anti-Spam)',
      'tracking': 'Kode Tiket atau Nomor Identitas',
      'password_lama': 'Kata Sandi Saat Ini',
      'password_baru': 'Kata Sandi Baru'
    };

    if (input.name && nameMap[input.name]) {
      return nameMap[input.name];
    }

    return input.name || 'Kolom Formulir';
  }

  function cleanLabelText(text) {
    if (!text) return '';
    return text.replace(/[*:\(\)]/g, '').replace(/wajib diisi/gi, '').trim();
  }

  // 2. PENCEGAHAN BUBBLE TOOLTIP NATIVE CHROME (INTERCEPT INVALID EVENT)
  let isAlertTriggered = false;

  document.addEventListener('invalid', function (e) {
    // Mencegah browser menampilkan bubble default ("Please fill out this field")
    e.preventDefault();

    const input = e.target;
    if (isAlertTriggered) return;
    isAlertTriggered = true;

    const labelName = getFieldLabel(input);
    let hintMessage = `Kolom <strong>"${labelName}"</strong> belum diisi atau formatnya belum lengkap.`;

    if (input.type === 'email' && input.value) {
      hintMessage = `Format email pada kolom <strong>"${labelName}"</strong> tidak valid (harus mengandung karakter @ dan domain).`;
    } else if (input.name === 'nik' || input.name === 'nik_pelapor') {
      if (input.value && input.value.length < 16) {
        hintMessage = `Nomor NIK pada kolom <strong>"${labelName}"</strong> minimal harus 16 digit.`;
      }
    } else if (input.name === 'math_answer') {
      hintMessage = `Harap jawab pertanyaan verifikasi anti-spam matematika sebelum mengirim formulir.`;
    }

    window.showCustomAlert({
      title: 'Data Belum Lengkap!',
      message: hintMessage,
      icon: 'warning',
      targetInput: input
    }).then(() => {
      setTimeout(() => { isAlertTriggered = false; }, 300);
    });
  }, true); // Use capture phase to intercept early

  // 3. VALIDATOR HELPER UNIVERSAL UNTUK DIGUNAKAN DI STEPPER / WIZARD
  window.validateSectionInputs = function (containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return true;

    const inputs = container.querySelectorAll('input, select, textarea');
    for (let el of inputs) {
      // Abaikan jika hidden atau disabled
      if (el.disabled || el.offsetParent === null) continue;

      if (el.hasAttribute('required') && !el.value.trim()) {
        const label = getFieldLabel(el);
        window.showCustomAlert({
          title: 'Kolom Wajib Belum Diisi',
          message: `Harap lengkapi kolom <strong>"${label}"</strong> terlebih dahulu.`,
          icon: 'warning',
          targetInput: el
        });
        return false;
      }

      // Validasi khusus NIK jika required
      if ((el.name === 'nik' || el.name === 'nik_pelapor') && el.value.trim().length < 8) {
        window.showCustomAlert({
          title: 'Nomor Identitas Kurang Lengkap',
          message: `Nomor NIK / NIM yang dimasukkan minimal 8-16 digit angka.`,
          icon: 'warning',
          targetInput: el
        });
        return false;
      }
    }
    return true;
  };

  // 4. INTERCEPT PENCARIAN LACAK TIKET JIKA KOSONG
  document.addEventListener('DOMContentLoaded', function () {
    // Tangani semua form lacak tiket cepat
    const trackingForms = document.querySelectorAll('form[action*="/surat"], form[action*="/pengaduan"]');
    trackingForms.forEach(form => {
      const isSearchForm = form.querySelector('input[name="tracking"], input[name="kode_tiket"]');
      if (isSearchForm) {
        form.addEventListener('submit', function (e) {
          const searchInput = isSearchForm;
          if (!searchInput.value.trim()) {
            e.preventDefault();
            window.showCustomAlert({
              title: 'Kolom Pencarian Kosong',
              message: 'Harap masukkan Nomor Tiket atau NIK Anda untuk melacak permohonan.',
              icon: 'info',
              targetInput: searchInput
            });
          }
        });
      }
    });
  });

})();
