/**
 * ====================================================================
 * PORTAL DISKOMINFOSANTIK KABUPATEN BEKASI - SITE ANIMATIONS ENGINE
 * Didesain khusus ramah pengguna (Masyarakat Awam & Administrator)
 * Efek: Halus, responsif, tidak memusingkan, dan berperforma tinggi
 * ====================================================================
 */

(function () {
  'use strict';

  // 1. Cek preferensi aksesibilitas pengguna (Reduced Motion)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Helper Animasi Counter Angka (Count-Up)
  function animateValue(obj, start, end, duration, formatOptions) {
    if (prefersReducedMotion) {
      obj.innerHTML = formatOptions.prefix + formatNumber(end, formatOptions) + formatOptions.suffix;
      return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing out cubic / expo: bergerak cepat lalu melambat lembut di akhir
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * (end - start) + start);
      
      obj.innerHTML = formatOptions.prefix + formatNumber(current, formatOptions) + formatOptions.suffix;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        // Pastikan angka akhir tepat
        obj.innerHTML = formatOptions.prefix + formatNumber(end, formatOptions) + formatOptions.suffix;
      }
    };
    window.requestAnimationFrame(step);
  }

  function formatNumber(num, options) {
    if (options.hasDecimals) {
      return (num / 10).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return num.toLocaleString('id-ID');
  }

  // 3. Inisialisasi Counter Otomatis pada Elemen Metrik
  function initNumberCounters() {
    // Cari semua elemen angka yang cocok untuk dianimasikan
    const candidates = document.querySelectorAll(
      '.metric-neon-card h3, .metric-neon-card h4, .metric-neon-card h5, [data-counter], .stat-count, .kpi-number'
    );

    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.dataset.counterDone === 'true') return;

            // Dapatkan teks dan parse angka
            const rawText = el.innerText.trim();
            // Cek apakah mengandung angka
            const match = rawText.match(/([\d\.,]+)/);
            if (match) {
              const fullMatch = match[0];
              // Format Indonesia: titik adalah ribuan, koma adalah desimal
              const isPercentage = rawText.includes('%');
              const hasComma = fullMatch.includes(',');
              let numVal = 0;
              let hasDecimals = false;

              if (hasComma) {
                // Misal: 99,1 atau 66,8
                const clean = fullMatch.replace(/\./g, '').replace(',', '.');
                numVal = Math.round(parseFloat(clean) * 10);
                hasDecimals = true;
              } else {
                const clean = fullMatch.replace(/\./g, '');
                numVal = parseInt(clean, 10);
              }

              if (!isNaN(numVal) && numVal > 0) {
                el.dataset.counterDone = 'true';
                const parts = rawText.split(fullMatch);
                const prefix = parts[0] || '';
                const suffix = parts.slice(1).join(fullMatch) || '';

                animateValue(el, 0, numVal, 1200, {
                  prefix,
                  suffix,
                  hasDecimals
                });
              }
            }

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -20px 0px' }
    );

    candidates.forEach((el) => {
      if (!el.dataset.counterDone) {
        counterObserver.observe(el);
      }
    });
  }

  // 4. Scroll Reveal Engine (Intersection Observer)
  function initScrollReveal() {
    // Pilih elemen-elemen penting di halaman publik
    const revealSelectors = [
      '.bento-card',
      '.metric-neon-card',
      '.card-modern',
      '.news-card',
      '.gallery-item-clickable',
      '.timeline-step-card',
      '.org-card',
      '.glow-card',
      '.glass-tracker-box',
      '.card-service-hero',
      '.section-reveal-block',
      '.row.g-4 > [class*="col-"]'
    ];

    const elementsToReveal = document.querySelectorAll(revealSelectors.join(', '));

    if (elementsToReveal.length === 0) return;

    // Pasang stagger delay otomatis pada elemen sebaris (siblings)
    document.querySelectorAll('.row').forEach((row) => {
      const items = row.querySelectorAll('.bento-card, .metric-neon-card, .card-modern, [class*="col-"] > .card');
      items.forEach((item, index) => {
        if (!item.classList.contains('reveal-on-scroll')) {
          item.classList.add('reveal-on-scroll');
          if (!prefersReducedMotion) {
            item.style.setProperty('--reveal-delay', `${(index % 4) * 0.08}s`);
          }
        }
      });
    });

    elementsToReveal.forEach((el) => {
      if (!el.classList.contains('reveal-on-scroll')) {
        el.classList.add('reveal-on-scroll');
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      revealObserver.observe(el);
    });
  }

  // 5. Tactile Button Click & Ripple Micro-Interaction
  function initButtonInteractions() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn, .bento-card, .btn-orange, .btn-navy');
      if (!btn) return;

      // Buat efek ripple lembut tanpa mengganggu layout
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'site-ripple-effect';
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      btn.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  // 6. Tombol Melayang "Kembali ke Atas" (Back to Top) Ramah Warga
  function initBackToTop() {
    if (document.getElementById('siteBackToTopBtn')) return;

    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'siteBackToTopBtn';
    backToTopBtn.className = 'site-back-to-top';
    backToTopBtn.setAttribute('type', 'button');
    backToTopBtn.setAttribute('title', 'Kembali ke bagian atas halaman');
    backToTopBtn.setAttribute('aria-label', 'Kembali ke atas');
    backToTopBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    `;

    document.body.appendChild(backToTopBtn);

    let isVisible = false;
    window.addEventListener(
      'scroll',
      () => {
        const scrolled = window.scrollY || document.documentElement.scrollTop;
        if (scrolled > 320 && !isVisible) {
          backToTopBtn.classList.add('visible');
          isVisible = true;
        } else if (scrolled <= 320 && isVisible) {
          backToTopBtn.classList.remove('visible');
          isVisible = false;
        }
      },
      { passive: true }
    );

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  }

  // 7. Micro-Interaksi Form Input Focus Glow
  function initFormFocusEffects() {
    const inputs = document.querySelectorAll('.form-control, .form-select');
    inputs.forEach((input) => {
      input.addEventListener('focus', () => {
        const parentGroup = input.closest('.input-group') || input.parentElement;
        if (parentGroup) parentGroup.classList.add('input-focused');
      });
      input.addEventListener('blur', () => {
        const parentGroup = input.closest('.input-group') || input.parentElement;
        if (parentGroup) parentGroup.classList.remove('input-focused');
      });
    });
  }

  // 8. Inisialisasi Saat DOM Siap
  function initAll() {
    initScrollReveal();
    initNumberCounters();
    initButtonInteractions();
    initBackToTop();
    initFormFocusEffects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Dukungan untuk update dinamis
  window.refreshSiteAnimations = function () {
    initScrollReveal();
    initNumberCounters();
  };
})();
