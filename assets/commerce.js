(function(){
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function el(html){
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }

  function insertAfter(target, node){
    if(target && target.parentNode){
      target.parentNode.insertBefore(node, target.nextSibling);
    }
  }

  function addTopStrip(){
    if(document.querySelector('.zl-top-strip')) return;
    document.body.insertBefore(el(`
      <div class="zl-top-strip">
        <span>Bugune ozel <strong>2500 TL uzeri ucretsiz kargo</strong></span>
        <span>Guvenli odeme altyapisi</span>
        <span>WhatsApp destek: 0 555 123 45 67</span>
      </div>
    `), document.body.firstChild);
  }

  function addTrustGrid(anchor){
    if(document.querySelector('.zl-trust-grid')) return;
    insertAfter(anchor, el(`
      <section class="zl-trust-grid" aria-label="Magaza avantajlari">
        <div class="zl-trust-item"><strong>Guvenli Odeme</strong><span>PayTR ile kart bilgileri korunur.</span></div>
        <div class="zl-trust-item"><strong>Hizli Hazirlama</strong><span>Siparisler ayni gun isleme alinir.</span></div>
        <div class="zl-trust-item"><strong>Kolay Iletisim</strong><span>Siparis oncesi ve sonrasi destek.</span></div>
        <div class="zl-trust-item"><strong>Secili Koleksiyon</strong><span>Ozenle eklenen urun ve kampanyalar.</span></div>
      </section>
    `));
  }

  function addCategories(anchor){
    if(document.querySelector('.zl-category-row')) return;
    insertAfter(anchor, el(`
      <nav class="zl-category-row" aria-label="Kategoriler">
        <a class="zl-chip" href="urunler.html">Taki</a>
        <a class="zl-chip" href="urunler.html">Giyim</a>
        <a class="zl-chip" href="urunler.html">Aksesuar</a>
        <a class="zl-chip" href="kampanyalar.html">Kampanyalar</a>
        <a class="zl-chip" href="sepetim.html">Sepete Git</a>
      </nav>
    `));
  }

  function addNewsletter(){
    if(document.querySelector('.zl-newsletter')) return;
    const footer = document.querySelector('footer');
    if(!footer) return;
    footer.parentNode.insertBefore(el(`
      <section class="zl-newsletter">
        <div>
          <h2>Yeni urunleri ve firsatlari kacirma</h2>
          <p>Haftalik kampanya ve koleksiyon duyurularini e-posta ile al.</p>
        </div>
        <form onsubmit="event.preventDefault(); alert('Kaydiniz alindi.');">
          <input type="email" placeholder="E-posta adresiniz" required>
          <button type="submit">Kaydol</button>
        </form>
      </section>
    `), footer);
  }

  function addHomeHero(){
    if(page !== 'index.html' || document.querySelector('.zl-store-hero')) return;
    const search = document.querySelector('.search');
    const hero = el(`
      <section class="zl-store-hero">
        <div class="zl-hero-copy">
          <span class="zl-eyebrow">Yeni sezon secili urunlerde avantajli fiyat</span>
          <h1>HERBALİFE ile tek sayfada kesfet, sepete ekle, guvenle ode.</h1>
          <p>Takidan aksesuara uzanan secili urunleri incele, kampanyalari yakala ve PayTR guvenli odeme akisiyle siparisini tamamla.</p>
          <div class="zl-hero-actions">
            <a class="zl-btn zl-btn-primary" href="urunler.html">Alisverise Basla</a>
            <a class="zl-btn zl-btn-ghost" href="kampanyalar.html">Kampanyalari Gor</a>
          </div>
        </div>
        <aside class="zl-hero-panel">
          <h2>Bugunun Magaza Ozeti</h2>
          <div class="zl-mini-list">
            <div class="zl-mini-row"><span>Odeme</span><strong>PayTR</strong></div>
            <div class="zl-mini-row"><span>Kargo</span><strong>2500 TL uzeri ucretsiz</strong></div>
            <div class="zl-mini-row"><span>Destek</span><strong>WhatsApp</strong></div>
          </div>
        </aside>
      </section>
    `);
    document.body.insertBefore(hero, search || document.querySelector('.banner'));
    addTrustGrid(hero);
    addCategories(document.querySelector('.zl-trust-grid'));
  }

  function addStoreTools(){
    if(!['urunler.html','kampanyalar.html'].includes(page) || document.querySelector('.zl-store-tools')) return;
    const search = document.querySelector('.search');
    const isCampaign = page === 'kampanyalar.html';
    const tools = el(`
      <section class="zl-store-tools">
        <div>
          <h2>${isCampaign ? 'Aktif Kampanyalar' : 'Magaza Urunleri'}</h2>
          <p>${isCampaign ? 'Indirimli urunleri ara, sepete ekle ve odemeye gec.' : 'Kategorilere goz at, arama ile hizlica urune ulas.'}</p>
        </div>
        <div class="zl-category-row" style="width:auto;margin:0;">
          <a class="zl-chip" href="urunler.html">Tum Urunler</a>
          <a class="zl-chip" href="kampanyalar.html">Kampanyalar</a>
          <a class="zl-chip" href="sepetim.html">Sepet</a>
        </div>
      </section>
    `);
    insertAfter(search, tools);
    addTrustGrid(tools);
  }

  function addCartNotes(){
    if(page !== 'sepetim.html' || document.querySelector('.zl-cart-note')) return;
    const container = document.querySelector('.container');
    if(!container) return;
    insertAfter(container, el(`
      <section class="zl-cart-note">
        <div><strong>Odeme Guvenligi</strong>PayTR odeme sayfasi uzerinden tamamlanir.</div>
        <div><strong>Siparis Kaydi</strong>Odeme baslamadan once siparisiniz veritabanina yazilir.</div>
        <div><strong>Destek</strong>Herhangi bir sorunda telefon ile destek alabilirsiniz.</div>
      </section>
    `));
  }

  document.addEventListener('DOMContentLoaded', function(){
    addTopStrip();
    addHomeHero();
    addStoreTools();
    addCartNotes();
    addNewsletter();
  });
})();
