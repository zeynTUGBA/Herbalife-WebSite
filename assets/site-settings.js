(function(){
  const STORAGE_KEY = 'site_settings';
  const DEFAULTS = {
    logoText: 'Herbalife',
    phoneText: '� 0 555 123 45 67',
    footerText: '© 2026 Herbalife',
    searchPlaceholder: 'Ürün ara...',
    bannerText: '%30 <span>Luxury İndirim</span>',
    bannerAccentText: 'Luxury İndirim',
    aboutTitle: 'Hakkımızda',
    aboutContent: '',
    contactTitle: 'İletişim',
    contactAddress: 'Bursa, Türkiye',
    contactPhone: '+90 555 123 45 67',
    contactEmail: 'sezzginakdemir@gmail.com',
    navHomeText: 'Ana Sayfa',
    navProductsText: 'Ürünler',
    navCampaignText: 'Kampanyalar',
    navAboutText: 'Hakkımızda',
    navContactText: 'İletişim',
    navSellerText: 'Satıcı Panelim',
    navCartText: 'Sepetim',
    primaryColor: '#D4AF37',
    accentColor: '#f0d77b',
    textColor: '#eee',
    mutedColor: '#a7a09a',
    bgColor: '#0f0f0f',
    surfaceColor: '#111',
    buttonTextColor: '#000',
    headerBg: 'rgba(0,0,0,0.75)'
  };

  function safeParse(value, fallback) {
    try {
      if (!value) return fallback;
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }

  function getSiteSettings() {
    const stored = safeParse(localStorage.getItem(STORAGE_KEY), {});
    return Object.assign({}, DEFAULTS, stored);
  }

  function injectThemeStyles() {
    if (document.getElementById('site-settings-theme')) return;
    const style = document.createElement('style');
    style.id = 'site-settings-theme';
    style.textContent = `
      :root {
        --site-primary: ${DEFAULTS.primaryColor};
        --site-accent: ${DEFAULTS.accentColor};
        --site-text: ${DEFAULTS.textColor};
        --site-muted: ${DEFAULTS.mutedColor};
        --site-bg: ${DEFAULTS.bgColor};
        --site-surface: ${DEFAULTS.surfaceColor};
        --site-button-text: ${DEFAULTS.buttonTextColor};
        --site-header-bg: ${DEFAULTS.headerBg};
      }
      body {
        color: var(--site-text) !important;
      }
      header {
        background: var(--site-header-bg) !important;
      }
      .logo,
      .menu-btn,
      .cart-icon,
      nav a,
      .banner-text span,
      .section-title,
      .price,
      .zl-eyebrow,
      .zl-mini-row strong,
      .zl-chip,
      .add-cart-btn,
      .seller-header h1,
      .seller-header p,
      .field-label,
      .contact-info strong,
      .contact-info,
      footer,
      .about-section h1,
      .contact-section h1 {
        color: var(--site-text) !important;
      }
      .logo,
      .menu-btn,
      .cart-icon,
      nav a:hover,
      nav a.active,
      .banner-text span,
      .section-title,
      .price,
      .zl-eyebrow,
      .zl-mini-row strong,
      .zl-chip,
      .add-cart-btn,
      .cart-phone > span {
        color: var(--site-primary) !important;
      }
      .banner-text {
        color: var(--site-text) !important;
      }
      .search {
        color: var(--site-text) !important;
        border-color: rgba(255,255,255,.18) !important;
        background: rgba(0,0,0,.68) !important;
      }
      .add-cart-btn,
      .btn-primary,
      .btn-secondary,
      .cart-btn,
      .save-btn-blue,
      .save-btn-green {
        background: var(--site-primary) !important;
        color: var(--site-button-text) !important;
      }
      .card::before {
        background: var(--site-primary) !important;
      }
      .zl-chip {
        background: rgba(212,175,55,.06) !important;
        border-color: rgba(212,175,55,.24) !important;
        color: var(--site-text) !important;
      }
      .zl-chip:hover {
        background: rgba(212,175,55,.14) !important;
        color: var(--site-text) !important;
      }
      footer {
        color: var(--site-muted) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function updateThemeVars(settings) {
    const root = document.documentElement;
    root.style.setProperty('--site-primary', settings.primaryColor || DEFAULTS.primaryColor);
    root.style.setProperty('--site-accent', settings.accentColor || DEFAULTS.accentColor);
    root.style.setProperty('--site-text', settings.textColor || DEFAULTS.textColor);
    root.style.setProperty('--site-muted', settings.mutedColor || DEFAULTS.mutedColor);
    root.style.setProperty('--site-bg', settings.bgColor || DEFAULTS.bgColor);
    root.style.setProperty('--site-surface', settings.surfaceColor || DEFAULTS.surfaceColor);
    root.style.setProperty('--site-button-text', settings.buttonTextColor || DEFAULTS.buttonTextColor);
    root.style.setProperty('--site-header-bg', settings.headerBg || DEFAULTS.headerBg);
    document.body.style.color = settings.textColor || DEFAULTS.textColor;
  }

  function applyText(id, value, html) {
    const el = document.getElementById(id);
    if (!el || value === undefined || value === null || value === '') return;
    if (html) el.innerHTML = value;
    else el.textContent = value;
  }

  function applyTextSelector(selector, value, html) {
    const el = document.querySelector(selector);
    if (!el || value === undefined || value === null || value === '') return;
    if (html) el.innerHTML = value;
    else el.textContent = value;
  }

  function applyNavLabels(settings) {
    const mapping = {
      'index.html': settings.navHomeText,
      'urunler.html': settings.navProductsText,
      'kampanyalar.html': settings.navCampaignText,
      'hakkimizda.html': settings.navAboutText,
      'iletisim.html': settings.navContactText,
      'satici-paneli.html': settings.navSellerText,
      'sepetim.html': settings.navCartText
    };
    document.querySelectorAll('nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (mapping[href]) a.textContent = mapping[href];
    });
  }

  function applySiteSettingsToPage(settings) {
    applyNavLabels(settings);
    applyTextSelector('.logo', settings.logoText);
    const search = document.querySelector('.search');
    if (search && settings.searchPlaceholder) search.placeholder = settings.searchPlaceholder;
    const phoneLabel = document.querySelector('.cart-phone > span:last-child');
    if (phoneLabel && settings.phoneText) phoneLabel.textContent = settings.phoneText;
    const footer = document.querySelector('footer');
    if (footer && settings.footerText) footer.textContent = settings.footerText;
    const banner = document.querySelector('.banner-text');
    if (banner && settings.bannerText) banner.innerHTML = settings.bannerText;
    if (banner && settings.bannerAccentText) {
      const span = banner.querySelector('span');
      if (span) span.textContent = settings.bannerAccentText;
    }
    if (settings.headerBg) {
      const header = document.querySelector('header');
      if (header) header.style.background = settings.headerBg;
    }
    applyText('aboutTitle', settings.aboutTitle);
    if (settings.aboutContent) applyText('aboutContent', settings.aboutContent, true);
    applyText('contactTitle', settings.contactTitle);
    if (settings.contactAddress) applyText('contactAddress', `<strong>Adres:</strong> ${settings.contactAddress}`, true);
    if (settings.contactPhone) applyText('contactPhone', `<strong>Telefon:</strong> ${settings.contactPhone}`, true);
    if (settings.contactEmail) applyText('contactEmail', `<strong>Email:</strong> ${settings.contactEmail}`, true);
    const sectionTitle = document.getElementById('homeProductsTitle');
    if (sectionTitle && settings.productsSectionTitle) sectionTitle.textContent = settings.productsSectionTitle;
  }

  function applySiteSettings() {
    const settings = getSiteSettings();
    injectThemeStyles();
    updateThemeVars(settings);
    applySiteSettingsToPage(settings);
  }

  document.addEventListener('DOMContentLoaded', applySiteSettings);
  window.applySiteSettings = applySiteSettings;
})();
