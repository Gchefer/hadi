/* ==========================================================================
   busca.js — Modal de busca (portado do front P1, branch herofix2).
   Em vez da lista fixa de produtos do P1, consulta o backend:
   GET /api/produto/busca/{termo}  (api.buscarProdutosPorTermo, em api.js)
   "Ver todos" / Enter leva para catalogo.html?q=<termo>.
   ========================================================================== */
(function () {
    const modal = document.getElementById('modal-search');
    if (!modal || typeof api === 'undefined') return;

    const input = document.getElementById('search-input');
    const form = document.getElementById('search-form');
    const start = document.getElementById('search-start');
    const live = document.getElementById('search-live');
    const SUGGESTIONS = ['Jaqueta', 'Fleece', 'Shorts', 'Oakley', 'Nike'];

    const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const img = p => (typeof caminhoImagem === 'function' ? caminhoImagem(p.imagem) : p.imagem) || '';
    const imgFallback = "this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-image'}))";
    const urlResultados = q => 'catalogo.html?q=' + encodeURIComponent(q);

    let timer;
    let reqId = 0; // descarta respostas antigas quando o usuário continua digitando

    function renderEmpty(q) {
        live.innerHTML = `
            <div class="search-empty"><i class="fa-solid fa-magnifying-glass"></i>
                <p>NENHUM RESULTADO PARA "${esc(q.toUpperCase())}".<br>TENTE OUTRO TERMO OU VEJA AS SUGESTÕES:</p>
            </div>
            <div class="search-suggestions" style="justify-content:center">${SUGGESTIONS.map(s => `<button type="button" class="chip" data-q="${s}">${s.toUpperCase()}</button>`).join('')}</div>`;
    }

    function renderResults(q, results) {
        live.innerHTML = `
            <h3 class="search-subtitle">RESULTADOS <small>(${results.length})</small></h3>
            <div class="search-results-list">
                ${results.slice(0, 4).map(p => `
                    <a href="produto.html?codigo=${encodeURIComponent(p.codigo)}" class="search-result-row">
                        <img src="${esc(img(p))}" alt="${esc(p.nome)}" onerror="${imgFallback}">
                        <div class="sr-info"><h4>${esc(p.marca)}</h4><p class="sr-name">${esc(p.nome)}</p></div>
                        <div class="sr-price">${p.precoOriginal ? `<span class="price-old">${fmt(p.precoOriginal)}</span>` : ''}${fmt(p.preco)}</div>
                    </a>`).join('')}
            </div>
            <div class="search-see-all"><a class="btn-full" href="${urlResultados(q)}">VER TODOS OS RESULTADOS (${results.length}) &rarr;</a></div>`;
    }

    async function update() {
        const q = input.value.trim();
        const on = q.length >= 2;
        start.hidden = on;
        live.hidden = !on;
        if (!on) return;

        const meuId = ++reqId;
        try {
            const results = await api.buscarProdutosPorTermo(q);
            if (meuId !== reqId) return;
            if (!results || !results.length) renderEmpty(q);
            else renderResults(q, results);
        } catch (e) {
            if (meuId !== reqId) return;
            live.innerHTML = `<div class="search-empty"><i class="fa-solid fa-triangle-exclamation"></i>
                <p>NÃO FOI POSSÍVEL BUSCAR. VERIFIQUE SE O BACKEND ESTÁ RODANDO EM http://localhost:8080.</p></div>`;
        }
    }

    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 250); });
    form.addEventListener('submit', e => {
        e.preventDefault();
        const q = input.value.trim();
        if (q) window.location.href = urlResultados(q);
    });
    live.addEventListener('click', e => {
        const chip = e.target.closest('.chip');
        if (chip) { input.value = chip.dataset.q; update(); input.focus(); }
    });
    document.getElementById('btn-search')?.addEventListener('click', () => setTimeout(() => input.focus(), 50));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('active'); });
})();

/* ==========================================================================
   Catálogo (catalogo.html): filtros da barra lateral, ordenação, chips e paginação
   — mesma lógica do front P1 (herofix2), mas com os produtos vindos da API
   (GET /api/produtos). Os atributos de filtro (departamento, subcategoria, gêneros,
   tamanhos, tecnologias, atividades) vêm do backend. catalogo.html?q=termo filtra pela busca.
   ========================================================================== */
(function () {
    const grid = document.getElementById('results-grid');
    const sidebar = document.getElementById('sidebar-filters');
    if (!grid || !sidebar || typeof api === 'undefined') return;

    const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const lista = s => (s || '').split(',').map(x => x.trim()).filter(Boolean);
    const imgFallback = "this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-image'}))";
    const discount = p => p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const priceHTML = p => p.oldPrice && discount(p) > 0
        ? `<span class="price-old">${fmt(p.oldPrice)}</span><span class="price-new">${fmt(p.price)} <span class="discount">-${discount(p)}%</span></span>`
        : `<span class="price-new">${fmt(p.price)}</span>`;
    const ratingHTML = p => p.total
        ? `<p class="card-rating"><i class="fa-solid fa-star"></i> ${p.media.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} <span>(${p.total})</span></p>`
        : '';

    // Produto da API -> formato usado pelos filtros
    const doBackend = p => ({
        codigo: p.codigo,
        brand: p.marca || '',
        name: p.nome || '',
        price: Number(p.preco),
        oldPrice: p.precoOriginal ? Number(p.precoOriginal) : null,
        img: caminhoImagem(p.imagem),
        kw: [p.descricao, p.categoria].join(' '),
        cat: norm(p.departamento),
        sub: norm(p.subcategoria),
        gender: lista(p.generos).map(norm),
        sizes: lista(p.tamanhos).map(s => s.toUpperCase()),
        tech: lista(p.tecnologias).map(norm),
        act: lista(p.atividades).map(norm),
        media: Number(p.mediaAvaliacoes) || 0,
        total: Number(p.totalAvaliacoes) || 0,
        ordem: p.codigo
    });

    let PRODUCTS = [];
    function search(q) {
        const terms = norm(q).split(' ').filter(Boolean);
        if (!terms.length) return PRODUCTS.slice();
        return PRODUCTS.filter(p => {
            const hay = norm([p.brand, p.name, p.kw, p.cat, p.sub, p.tech.join(' '), p.act.join(' ')].join(' '));
            return terms.every(t => hay.includes(t));
        });
    }

    const PER_PAGE = 9;
    const PAGE_FILE = location.pathname.split('/').pop() || 'catalogo.html';
    let q = (new URLSearchParams(location.search).get('q') || '').trim();
    let page = 1;

    const sortEl = document.getElementById('sort');
    const hasClearAllBtn = !!document.getElementById('btn-clear-all-filters');
    const slider = document.getElementById('price-slider');
    const btnClear = sidebar.querySelector('.filter-actions .btn-outline');
    const searchInput = document.getElementById('search-input');
    if (searchInput && q) searchInput.value = q;

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
        const sg = selected('gender'); if (sg.length && !sg.some(c => p.gender.includes(c.value))) return false;
        const ss = selected('size');   if (ss.length && !ss.some(c => p.sizes.includes(c.value))) return false;
        const st = selected('tech');   if (st.length && !st.some(c => p.tech.includes(c.value))) return false;
        const sa = selected('act');    if (sa.length && !sa.some(c => p.act.includes(c.value))) return false;
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
        controls.filter(isOn).forEach(c => chips.push(`<span class="filter-chip">${esc(c.label.toUpperCase())} <button type="button" data-remove="${controls.indexOf(c)}" aria-label="Remover ${esc(c.label)}"><i class="fa-solid fa-xmark"></i></button></span>`));
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
        const list = search(q).filter(matches);
        if (sortEl.value === 'MENOR PREÇO') list.sort((a, b) => a.price - b.price);
        else if (sortEl.value === 'MAIOR PREÇO') list.sort((a, b) => b.price - a.price);
        else list.sort((a, b) => b.ordem - a.ordem); // MAIS RECENTES: cadastrados por último primeiro

        const countEl = document.getElementById('results-count');
        if (countEl) countEl.textContent = (q ? `"${q.toUpperCase()}": ` : '') + list.length + (list.length === 1 ? ' PRODUTO ENCONTRADO' : ' PRODUTOS ENCONTRADOS');
        document.getElementById('results-empty').hidden = list.length > 0;

        const start = (page - 1) * PER_PAGE;
        grid.innerHTML = list.slice(start, start + PER_PAGE).map(p => `
            <article class="product-card">
                <a href="produto.html?codigo=${encodeURIComponent(p.codigo)}" class="product-card-link">
                    <div class="img-wrapper"><img src="${esc(p.img)}" alt="${esc(p.name)}" onerror="${imgFallback}"></div>
                    <div class="product-info">
                        <h3>${esc(p.brand)}</h3>
                        <p class="product-name">${esc(p.name)}</p>
                        <div class="prices">${priceHTML(p)}</div>
                        ${ratingHTML(p)}
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
    document.getElementById('btn-clear-all-filters')?.addEventListener('click', () => setTimeout(() => {
        q = ''; history.replaceState(null, '', PAGE_FILE); resetPrice(); render();
    }, 0));
    document.getElementById('btn-apply-filters').addEventListener('click', () => {
        sidebar.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    sortEl.addEventListener('change', () => render());

    document.getElementById('results-chip').addEventListener('click', e => {
        const b = e.target.closest('[data-remove]'); if (!b) return;
        const k = b.dataset.remove;
        if (k === 'q') { q = ''; history.replaceState(null, '', PAGE_FILE); }
        else if (k === 'price') resetPrice();
        else if (k === 'all') { q = ''; history.replaceState(null, '', PAGE_FILE); btnClear.click(); return; }
        else resetControl(controls[Number(k)]);
        render();
    });
    document.getElementById('results-pagination').addEventListener('click', e => {
        const b = e.target.closest('[data-page]'); if (!b || b.disabled) return;
        page = Number(b.dataset.page); render(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.getElementById('empty-clear')?.addEventListener('click', () => btnClear.click());

    // --- Carrega os produtos do backend ---
    document.getElementById('results-count').textContent = 'CARREGANDO PRODUTOS...';
    api.listarProdutos()
        .then(produtos => { PRODUCTS = (produtos || []).map(doBackend); render(); })
        .catch(() => {
            document.getElementById('results-count').textContent =
                'NÃO FOI POSSÍVEL CARREGAR OS PRODUTOS. VERIFIQUE SE O BACKEND ESTÁ RODANDO EM ' + API_BASE_URL.replace(/\/api$/, '') + '.';
        });
})();
