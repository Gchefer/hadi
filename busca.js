(function () {
    // ===== Catálogo de exemplo (troque por dados reais/API) =====
    // cat/sub/gender/tech/act usam os mesmos nomes dos filtros da barra lateral
    const P = (o) => o;
    const PRODUCTS = [
        P({ brand: "ARC'TERYX", name: "JAQUETA BETA AR GORE-TEX", price: 3499.90, img: "img/arcteryx-beta-ar.png", kw: "jaqueta casaco", cat: "roupas", sub: "jaquetas", gender: ["homens"], sizes: ["P","M","G","GG"], tech: ["gore-tex"], act: ["trekking","ski e neve"] }),
        P({ brand: "NIKE ACG", name: "ACTIVITORIUM THERMAL PANTS", price: 899.90, oldPrice: 1299.90, img: "img/nike-acg-thermal-pants.png", kw: "calca pants", cat: "roupas", sub: "calcas", gender: ["homens"], sizes: ["38","40","42","44"], tech: ["thermal"], act: ["trekking","ski e neve"] }),
        P({ brand: "SALOMON", name: "SALOMON LAB RECCO SOFTSHELL", price: 3499.90, img: "img/salomon-recco-softshell.png", kw: "jaqueta casaco", cat: "roupas", sub: "jaquetas", gender: ["homens","mulheres","unissex"], sizes: ["P","M","G"], tech: ["thermal"], act: ["ski e neve","trekking"] }),
        P({ brand: "COLUMBIA", name: "COLUMBIA MOUNTAIN FULL ZIP 2.0 FLEECE", price: 399.90, img: "img/tnf-columbia-fullzip-fleece.png", kw: "fleece jaqueta", cat: "roupas", sub: "jaquetas", gender: ["homens"], sizes: ["M","G","GG","2GG"], tech: ["thermal"], act: ["casual","trekking"] }),
        P({ brand: "PATAGONIA", name: "FUNHOGGERS SHORTS", price: 185.90, img: "img/patagonia-funhoggers-shorts.png", kw: "shorts bermuda", cat: "roupas", sub: "shorts e bermudas", gender: ["homens"], sizes: ["P","M","G","GG"], tech: ["protecao uv"], act: ["trail running","casual"] }),
        P({ brand: "OAKLEY", name: "SOFTWARE WINDBREAKER", price: 600.00, oldPrice: 1600.00, img: "img/oakley-software-windbreaker.png", kw: "corta-vento jaqueta", cat: "roupas", sub: "jaquetas", gender: ["homens"], sizes: ["M","G","GG"], tech: ["protecao uv"], act: ["trail running"] }),
        P({ brand: "NIKE ACG", name: "NIKE ACG LICHEN FLEECE HOODIE - MOSS", price: 500.00, img: "img/nike-acg-lichen-fleece-hoodie.png", kw: "hoodie fleece moletom", cat: "roupas", sub: "jaquetas", gender: ["mulheres"], sizes: ["PP","P","M","G"], tech: ["thermal"], act: ["casual","trekking"] }),
        P({ brand: "NIKE ACG", name: "NIKE ACG TRAIL SHORTS - MICA GREEN", price: 299.90, img: "img/nike-acg-trail-shorts.png", kw: "shorts bermuda", cat: "roupas", sub: "shorts e bermudas", gender: ["mulheres"], sizes: ["PP","P","M","G"], tech: ["protecao uv"], act: ["trail running"] }),
        P({ brand: "ARC'TERYX", name: "BIRD HEAD BEANIE", price: 289.90, img: "img/arcteryx-bird-head-beanie.png", kw: "gorro touca", cat: "acessorios", sub: "headwear", gender: ["homens","mulheres","unissex"], sizes: [], tech: ["thermal"], act: ["ski e neve"] }),
        P({ brand: "OAKLEY", name: "EYE JACKET REDUX - DUNE", price: 799.90, img: "img/oakley-eye-jacket-dune.png", kw: "oculos sol", cat: "acessorios", sub: "oculos", gender: ["homens","mulheres","unissex"], sizes: [], tech: ["protecao uv"], act: ["casual"] }),
        P({ brand: "OAKLEY", name: "RADAR EV PATH", price: 1099.90, img: "img/oakley-radar-ev-path.png", kw: "oculos sol", cat: "acessorios", sub: "oculos", gender: ["homens","mulheres","unissex"], sizes: [], tech: ["protecao uv"], act: ["trail running","ski e neve"] }),
        P({ brand: "PATAGONIA", name: "ULTRALIGHT BLACK HOLE SLING", price: 349.90, img: "img/patagonia-slingbag.png", kw: "mochila bolsa", cat: "acessorios", sub: "mochilas e bolsas", gender: ["homens","mulheres","unissex"], sizes: [], tech: [], act: ["casual","trekking"] })
    ];
    const SUGGESTIONS = ["Jaqueta", "Fleece", "Shorts", "Óculos", "Gore-Tex"];

    const fmt = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const imgFallback = "this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-image'}))";
    const discount = p => p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const priceHTML = p => p.oldPrice
        ? `<span class="price-old">${fmt(p.oldPrice)}</span><span class="price-new">${fmt(p.price)} <span class="discount">-${discount(p)}%</span></span>`
        : `<span class="price-new">${fmt(p.price)}</span>`;

    function search(q) {
        const terms = norm(q).split(' ').filter(Boolean);
        if (!terms.length) return [];
        return PRODUCTS.filter(p => {
            const hay = norm([p.brand, p.name, p.kw, p.cat, p.sub, p.tech.join(' '), p.act.join(' ')].join(' '));
            return terms.every(t => hay.includes(t));
        });
    }

    // ===================== MODAL =====================
    const modal = document.getElementById('modal-search');
    if (modal) {
        const input = document.getElementById('search-input');
        const form = document.getElementById('search-form');
        const start = document.getElementById('search-start');
        const live = document.getElementById('search-live');
        let timer;

        function renderLive(q) {
            const results = search(q);
            if (!results.length) {
                live.innerHTML = `
                    <div class="search-empty"><i class="fa-solid fa-magnifying-glass"></i>
                        <p>NENHUM RESULTADO PARA "${esc(q.toUpperCase())}".<br>TENTE OUTRO TERMO OU VEJA AS SUGESTÕES:</p>
                    </div>
                    <div class="search-suggestions" style="justify-content:center">${SUGGESTIONS.map(s => `<button type="button" class="chip" data-q="${s}">${s.toUpperCase()}</button>`).join('')}</div>`;
                return;
            }
            live.innerHTML = `
                <h3 class="search-subtitle">RESULTADOS <small>(${results.length})</small></h3>
                <div class="search-results-list">
                    ${results.slice(0, 4).map(p => `
                        <a href="produto.html" class="search-result-row">
                            <img src="${p.img}" alt="${esc(p.name)}" onerror="${imgFallback}">
                            <div class="sr-info"><h4>${esc(p.brand)}</h4><p class="sr-name">${esc(p.name)}</p></div>
                            <div class="sr-price">${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ''}${fmt(p.price)}</div>
                        </a>`).join('')}
                </div>
                <div class="search-see-all"><a class="btn-full" href="resultados-busca.html?q=${encodeURIComponent(q)}">VER TODOS OS RESULTADOS (${results.length}) &rarr;</a></div>`;
        }
        function update() {
            const q = input.value.trim();
            const on = q.length >= 2;
            start.hidden = on; live.hidden = !on;
            if (on) renderLive(q);
        }
        input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 150); });
        form.addEventListener('submit', e => {
            e.preventDefault();
            const q = input.value.trim();
            if (q) window.location.href = 'resultados-busca.html?q=' + encodeURIComponent(q);
        });
        live.addEventListener('click', e => {
            const chip = e.target.closest('.chip');
            if (chip) { input.value = chip.dataset.q; update(); input.focus(); }
        });
        document.getElementById('btn-search')?.addEventListener('click', () => setTimeout(() => input.focus(), 50));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('active'); });
    }

    // ===================== PÁGINA DE RESULTADOS + FILTROS =====================
    const grid = document.getElementById('results-grid');
    const sidebar = document.getElementById('sidebar-filters');
    if (!grid) return;

    const PER_PAGE = 9;
    const PAGE_FILE = location.pathname.split('/').pop() || 'catalogo.html';
    let q = new URLSearchParams(location.search).get('q') || '';
    let page = 1;

    const sortEl = document.getElementById('sort');
    const pageInput = document.getElementById('page-search-input'); // só existe em resultados-busca.html
    const hasClearAllBtn = !!document.getElementById('btn-clear-all-filters');
    const slider = document.getElementById('price-slider');
    const btnClear = sidebar.querySelector('.filter-actions .btn-outline');

    // --- Mapeia cada controle do DOM para um grupo de filtro ---
    const GROUPS = { 'categorias': 'cat', 'genero': 'gender', 'tecnologias': 'tech', 'atividade': 'act', 'tamanhos': 'size' };
    const controls = []; // { el, group, value, label, parentCat }
    sidebar.querySelectorAll('.filter-group').forEach(g => {
        const key = GROUPS[norm(g.querySelector('h4').textContent)];
        if (!key) return;
        if (key === 'size') {
            g.querySelectorAll('.size-btn').forEach(b => controls.push({ el: b, group: 'size', value: b.textContent.trim().toUpperCase(), label: b.textContent.trim() }));
            return;
        }
        g.querySelectorAll('input[type=checkbox]').forEach(cb => {
            const label = cb.closest('label').textContent.trim();
            const inSub = !!cb.closest('.subcategory-list');
            const parentCat = inSub ? norm(cb.closest('.category-item').querySelector('.category-toggle').closest('label').textContent) : null;
            controls.push({ el: cb, group: key === 'cat' ? (inSub ? 'sub' : 'cat') : key, value: norm(label), label, parentCat });
        });
    });
    const isOn = c => c.el.matches('.size-btn') ? c.el.classList.contains('active') : c.el.checked;
    const selected = g => controls.filter(c => c.group === g && isOn(c));
    const maxPrice = () => slider ? Number(slider.value) : Infinity;
    const priceActive = () => slider && Number(slider.value) < Number(slider.max);

    function matches(p) {
        if (p.price > maxPrice()) return false;
        // Categorias: subcategorias marcadas têm prioridade; categoria-mãe sem subs marcadas libera tudo dela
        const cats = selected('cat'), subs = selected('sub');
        if (cats.length || subs.length) {
            const okSub = subs.some(s => s.value === p.sub);
            const okCat = cats.some(c => c.value === p.cat && !subs.some(s => s.parentCat === c.value));
            if (!okSub && !okCat) return false;
        }
        const sg = selected('gender');  if (sg.length && !sg.some(c => p.gender.includes(c.value))) return false;
        const ss = selected('size');    if (ss.length && !ss.some(c => p.sizes.includes(c.value))) return false;
        const st = selected('tech');    if (st.length && !st.some(c => p.tech.includes(c.value))) return false;
        const sa = selected('act');     if (sa.length && !sa.some(c => p.act.includes(c.value))) return false;
        return true;
    }

    function resetControl(c) {
        if (c.el.matches('.size-btn')) c.el.classList.remove('active');
        else {
            c.el.checked = false;
            if (c.el.classList.contains('category-toggle')) {
                c.el.closest('.category-item').classList.remove('expanded');
                controls.filter(x => x.parentCat === c.value).forEach(x => x.el.checked = false);
            }
        }
    }
    function resetPrice() {
        if (!slider) return;
        slider.value = slider.max;
        document.getElementById('price-max').textContent = 'R$ ' + Number(slider.max).toLocaleString('pt-BR');
    }
    function activeCount() { return controls.filter(isOn).length + (priceActive() ? 1 : 0); }

    function renderChips() {
        const chips = [];
        if (q) chips.push(`<span class="filter-chip">"${esc(q.toUpperCase())}" <button type="button" data-remove="q" aria-label="Remover busca"><i class="fa-solid fa-xmark"></i></button></span>`);
        if (priceActive()) chips.push(`<span class="filter-chip">ATÉ ${fmt(maxPrice()).replace(',00', '')} <button type="button" data-remove="price" aria-label="Remover preço"><i class="fa-solid fa-xmark"></i></button></span>`);
        controls.filter(isOn).forEach((c, i) => chips.push(`<span class="filter-chip">${esc(c.label.toUpperCase())} <button type="button" data-remove="${controls.indexOf(c)}" aria-label="Remover ${esc(c.label)}"><i class="fa-solid fa-xmark"></i></button></span>`));
        if (!hasClearAllBtn && (chips.length > 1 || activeCount())) chips.push(`<button type="button" class="filter-chip-clear" data-remove="all">LIMPAR TODOS OS FILTROS</button>`);
        document.getElementById('results-chip').innerHTML = chips.join('');
        const n = activeCount();
        document.getElementById('filter-badge').textContent = n ? n : '';
    }

    function renderPagination(total) {
        const pages = Math.ceil(total / PER_PAGE);
        const box = document.getElementById('results-pagination');
        if (pages <= 1) { box.innerHTML = ''; return; }
        let html = `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Anterior">&lt;</button>`;
        for (let i = 1; i <= pages; i++) html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        html += `<button class="page-btn" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Próxima">&gt;</button>`;
        box.innerHTML = html;
    }

    function render(resetPage = true) {
        if (resetPage) page = 1;
        let list = (q ? search(q) : PRODUCTS.slice()).filter(matches);
        if (sortEl.value === 'MENOR PREÇO') list.sort((a, b) => a.price - b.price);
        if (sortEl.value === 'MAIOR PREÇO') list.sort((a, b) => b.price - a.price);

        const termEl = document.getElementById('results-term'); if (termEl) termEl.textContent = q ? 'PARA "' + q.toUpperCase() + '"' : '';
        const countEl = document.getElementById('results-count'); if (countEl) countEl.textContent = list.length + (list.length === 1 ? ' PRODUTO ENCONTRADO' : ' PRODUTOS ENCONTRADOS');
        document.getElementById('results-empty').hidden = list.length > 0;

        const start = (page - 1) * PER_PAGE;
        grid.innerHTML = list.slice(start, start + PER_PAGE).map(p => `
            <article class="product-card">
                <a href="produto.html" class="product-card-link">
                    <div class="img-wrapper"><img src="${p.img}" alt="${esc(p.name)}" onerror="${imgFallback}"></div>
                    <div class="product-info">
                        <h3>${esc(p.brand)}</h3>
                        <p class="product-name">${esc(p.name)}</p>
                        <div class="prices">${priceHTML(p)}</div>
                    </div>
                </a>
            </article>`).join('');
        renderPagination(list.length);
        renderChips();
    }

    // --- Eventos ---
    // (script.js já cuida de abrir/fechar painel, recolher grupos e alternar tamanhos/expansão;
    //  aqui só reagimos às mudanças para refiltrar)
    sidebar.addEventListener('change', e => {
        const c = controls.find(x => x.el === e.target);
        // desmarcar categoria-mãe desmarca as subcategorias dela
        if (c && c.group === 'cat' && !c.el.checked) controls.filter(x => x.parentCat === c.value).forEach(x => x.el.checked = false);
        render();
    });
    sidebar.addEventListener('click', e => { if (e.target.closest('.size-btn')) render(); });
    slider?.addEventListener('input', () => render());
    // setTimeout: garante que rode depois do reset de checkboxes feito pelo script.js
    btnClear.addEventListener('click', () => setTimeout(() => { resetPrice(); render(); }, 0));
    document.getElementById('btn-apply-filters').addEventListener('click', () => {
        sidebar.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    sortEl.addEventListener('change', () => render());

    document.getElementById('results-chip').addEventListener('click', e => {
        const b = e.target.closest('[data-remove]'); if (!b) return;
        const k = b.dataset.remove;
        if (k === 'q') { q = ''; if (pageInput) pageInput.value = ''; history.replaceState(null, '', PAGE_FILE); }
        else if (k === 'price') resetPrice();
        else if (k === 'all') { q = ''; if (pageInput) pageInput.value = ''; history.replaceState(null, '', PAGE_FILE); btnClear.click(); return; }
        else resetControl(controls[Number(k)]);
        render();
    });
    document.getElementById('results-pagination').addEventListener('click', e => {
        const b = e.target.closest('[data-page]'); if (!b || b.disabled) return;
        page = Number(b.dataset.page); render(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.getElementById('page-search-form')?.addEventListener('submit', e => {
        e.preventDefault();
        q = pageInput.value.trim();
        history.replaceState(null, '', PAGE_FILE + (q ? '?q=' + encodeURIComponent(q) : ''));
        render();
    });
    document.getElementById('empty-clear')?.addEventListener('click', () => btnClear.click());
    document.querySelectorAll('#results-empty .chip[data-q]').forEach(c => c.addEventListener('click', () => {
        q = c.dataset.q; if (pageInput) pageInput.value = q;
        history.replaceState(null, '', PAGE_FILE + '?q=' + encodeURIComponent(q));
        render();
    }));

    if (pageInput) pageInput.value = q;
    render();
})();
