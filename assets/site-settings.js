(function(){
  const STORAGE_KEY = 'site_settings';
  const DEFAULTS = {
    logoText: 'Herbalife',
    phoneText: '📞 0 555 123 45 67',
    footerText: '© 2026 Herbalife',
    searchPlaceholder: 'Ürün ara...',
    bannerText: '%30 <span>Luxury İndirim</span>',
    bannerAccentText: 'Luxury İndirim',
    homeBannerText: '%30 <span>Luxury İndirim</span>',
    homeBannerAccentText: 'Luxury İndirim',
    productsBannerText: 'Tüm <span>Ürünler</span>',
    productsBannerAccentText: 'Ürünler',
    campaignBannerText: '%30 <span>Luxury İndirim</span>',
    campaignBannerAccentText: 'Luxury İndirim',
    aboutBannerText: 'Biz <span>Kimiz?</span>',
    aboutBannerAccentText: 'Kimiz?',
    contactBannerText: 'Bizimle <span>İletişime Geç</span>',
    contactBannerAccentText: 'İletişime Geç',
    cartBannerText: 'Sepetim',
    successTitle: 'Ödeme Başarılı',
    productsSectionTitle: 'Öne Çıkan Ürünler',
    addToCartText: 'Sepete Ekle',
    productEmptyText: 'Ürün bulunamadı.',
    campaignEmptyText: 'Kampanya ürünü bulunamadı.',
    cartTitle: '🛒 Sepetim',
    clearCartText: '🗑️ Sepeti Temizle',
    emptyCartText: 'Sepetiniz boş',
    checkoutText: '💳 ÖDEMEYE GİT',
    aboutTitle: 'Hakkımızda',
    aboutContent: '',
    contactTitle: 'İletişim',
    contactAddress: 'Bursa, Türkiye',
    contactPhone: '+90 555 123 45 67',
    contactEmail: 'sezzginakdemir@gmail.com',
    contactNamePlaceholder: 'Adınız Soyadınız',
    contactEmailPlaceholder: 'Email Adresiniz',
    contactPhonePlaceholder: 'Telefon (opsiyonel)',
    contactProductPlaceholder: 'Ürün adı (opsiyonel)',
    contactBarcodePlaceholder: 'Ürün barkodu (opsiyonel)',
    contactMessagePlaceholder: 'Mesajınız...',
    contactSubmitText: 'Gönder',
    navHomeText: 'Ana Sayfa',
    navProductsText: 'Ürünler',
    navCampaignText: 'Kampanyalar',
    navAboutText: 'Hakkımızda',
    navContactText: 'İletişim',
    navSellerText: 'Satıcı Panelim',
    navCartText: '🛒 Sepetim',
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
    const settings = Object.assign({}, DEFAULTS, stored);
    if (!stored.homeBannerText && stored.bannerText) settings.homeBannerText = stored.bannerText;
    if (!stored.homeBannerAccentText && stored.bannerAccentText) settings.homeBannerAccentText = stored.bannerAccentText;
    return preserveEmojiSettings(settings);
  }

  function keepLeadingEmoji(value, fallback) {
    const text = (value || '').trim();
    const prefix = Array.from(fallback || '')[0] || '';
    if (!prefix || /^[A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(prefix)) return text;
    if (!text) return fallback;
    return text.startsWith(prefix) ? text : (prefix + ' ' + text).replace(/\s+/g, ' ');
  }

  function preserveEmojiSettings(settings) {
    settings.phoneText = keepLeadingEmoji(settings.phoneText, DEFAULTS.phoneText);
    settings.navCartText = keepLeadingEmoji(settings.navCartText, DEFAULTS.navCartText);
    settings.cartTitle = keepLeadingEmoji(settings.cartTitle, DEFAULTS.cartTitle);
    settings.clearCartText = keepLeadingEmoji(settings.clearCartText, DEFAULTS.clearCartText);
    settings.checkoutText = keepLeadingEmoji(settings.checkoutText, DEFAULTS.checkoutText);
    return settings;
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
      .cart-phone > span,
      .cart-icon,
      .banner-text,
      .menu-btn {
        font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif !important;
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
      if (a.classList.contains('cart-icon')) return;
      if (mapping[href]) a.textContent = mapping[href];
    });
    document.querySelectorAll('.side-menu a').forEach(a => {
      const href = a.getAttribute('href');
      if (mapping[href]) a.textContent = mapping[href];
    });
  }

  function getPageKey() {
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page === '' || page === 'index.html') return 'home';
    if (page === 'urunler.html') return 'products';
    if (page === 'kampanyalar.html') return 'campaign';
    if (page === 'hakkimizda.html') return 'about';
    if (page === 'iletisim.html') return 'contact';
    if (page === 'sepetim.html') return 'cart';
    if (page === 'success.html') return 'success';
    return '';
  }

  function applyBanner(settings) {
    const pageKey = getPageKey();
    const banner = document.querySelector('.banner-text');
    if (!banner) return;
    const textKey = pageKey ? pageKey + 'BannerText' : 'bannerText';
    const accentKey = pageKey ? pageKey + 'BannerAccentText' : 'bannerAccentText';
    const text = settings[textKey] || settings.bannerText;
    const accent = settings[accentKey] || settings.bannerAccentText;
    if (text) banner.innerHTML = text;
    if (accent) {
      const span = banner.querySelector('span');
      if (span) span.textContent = accent;
    }
  }

  function setPlaceholder(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.placeholder = value;
  }

  function applyContactForm(settings) {
    setPlaceholder('contact_name', settings.contactNamePlaceholder);
    setPlaceholder('contact_email', settings.contactEmailPlaceholder);
    setPlaceholder('contact_phone', settings.contactPhonePlaceholder);
    setPlaceholder('contact_product', settings.contactProductPlaceholder);
    setPlaceholder('contact_product_barcode', settings.contactBarcodePlaceholder);
    setPlaceholder('contact_message', settings.contactMessagePlaceholder);
    applyText('contact_submit', settings.contactSubmitText);
  }

  function applyDynamicText(settings) {
    document.querySelectorAll('.add-cart-btn').forEach(btn => {
      if (!btn.dataset.defaultText) btn.dataset.defaultText = btn.textContent.trim();
      if (!btn.classList.contains('is-added')) btn.textContent = settings.addToCartText || DEFAULTS.addToCartText;
    });
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid && productsGrid.children.length === 1 && productsGrid.querySelector('p')) {
      const emptyText = getPageKey() === 'campaign' ? settings.campaignEmptyText : settings.productEmptyText;
      productsGrid.querySelector('p').textContent = emptyText || DEFAULTS.productEmptyText;
    }
    if (getPageKey() === 'cart') {
      applyTextSelector('h1', settings.cartTitle);
      applyTextSelector('.btn-clear', settings.clearCartText);
      applyTextSelector('.btn-pay, .checkout-btn, .pay-btn, button[onclick*="checkout"]', settings.checkoutText);
      document.querySelectorAll('p').forEach(p => {
        if (/Sepetiniz boş|Sepetiniz bo/i.test(p.textContent)) p.textContent = settings.emptyCartText || DEFAULTS.emptyCartText;
      });
    }
  }

  function applySiteSettingsToPage(settings) {
    applyNavLabels(settings);
    applyTextSelector('.logo', settings.logoText);
    const search = document.querySelector('.search');
    if (search && settings.searchPlaceholder) search.placeholder = settings.searchPlaceholder;
    const phoneLabel = document.querySelector('.cart-phone > span:last-child');
    if (phoneLabel && settings.phoneText) phoneLabel.innerHTML = settings.phoneText;
    const footer = document.querySelector('footer');
    if (footer && settings.footerText) footer.textContent = settings.footerText;
    applyBanner(settings);
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
    applyText('order-title', settings.successTitle);
    if (getPageKey() === 'success') applyTextSelector('h1', settings.successTitle);
    applyContactForm(settings);
    applyDynamicText(settings);
  }

  function applySiteSettings() {
    const settings = getSiteSettings();
    injectThemeStyles();
    updateThemeVars(settings);
    applySiteSettingsToPage(settings);
  }

  document.addEventListener('DOMContentLoaded', applySiteSettings);
  window.getSiteSettings = getSiteSettings;
  window.applySiteSettings = applySiteSettings;
})();

