(function () {
    // Catálogo de exemplo (troque por dados reais/API)
    const PRODUCTS = [
        { brand: "ARC'TERYX", name: "JAQUETA BETA AR GORE-TEX", cat: "jaqueta", price: 3499.90, img: "img/arcteryx-beta-ar.png", tags: "trekking gore-tex homens roupas" },
        { brand: "NIKE ACG", name: "ACTIVITORIUM THERMAL PANTS", cat: "calça", price: 899.90, img: "img/nike-acg-thermal-pants.png", tags: "thermal homens roupas trekking" },
        { brand: "SALOMON", name: "SALOMON LAB RECCO SOFTSHELL", cat: "jaqueta", price: 3499.90, img: "img/salomon-recco-softshell.png", tags: "softshell ski neve roupas" },
        { brand: "COLUMBIA", name: "COLUMBIA MOUNTAIN FULL ZIP 2.0 FLEECE", cat: "fleece jaqueta", price: 399.90, img: "img/tnf-columbia-fullzip-fleece.png", tags: "thermal casual roupas" },
        { brand: "PATAGONIA", name: "FUNHOGGERS SHORTS", cat: "shorts bermuda", price: 185.90, img: "img/patagonia-funhoggers-shorts.png", tags: "trail running casual roupas" },
        { brand: "OAKLEY", name: "SOFTWARE WINDBREAKER", cat: "jaqueta corta-vento", price: 600.00, img: "img/oakley-software-windbreaker.png", tags: "trail running roupas" },
        { brand: "NIKE ACG", name: "NIKE ACG LICHEN FLEECE HOODIE - MOSS", cat: "hoodie fleece", price: 500.00, img: "img/nike-acg-lichen-fleece-hoodie.png", tags: "thermal casual roupas" },
        { brand: "NIKE ACG", name: "NIKE ACG TRAIL SHORTS - MICA GREEN", cat: "shorts bermuda", price: 299.90, img: "img/nike-acg-trail-shorts.png", tags: "trail running roupas" },
        { brand: "ARC'TERYX", name: "BIRD HEAD BEANIE", cat: "gorro headwear acessório", price: 289.90, img: "img/arcteryx-bird-head-beanie.png", tags: "acessórios ski neve" },
        { brand: "OAKLEY", name: "EYE JACKET REDUX - DUNE", cat: "óculos acessório", price: 799.90, img: "img/oakley-eye-jacket-dune.png", tags: "acessórios óculos casual" },
        { brand: "OAKLEY", name: "RADAR EV PATH", cat: "óculos acessório", price: 1099.90, img: "img/oakley-radar-ev-path.png", tags: "acessórios óculos trail running" },
        { brand: "PATAGONIA", name: "ULTRALIGHT BLACK HOLE SLING", cat: "mochila bolsa acessório", price: 349.90, img: "img/patagonia-slingbag.png", tags: "acessórios mochilas bolsas casual" }
    ];
    const SUGGESTIONS = ["Jaqueta", "Fleece", "Shorts", "Óculos", "Gore-Tex"];

    const fmt = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const imgFallback = "this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-image'}))";

    function search(q) {
        const terms = norm(q).split(/\s+/).filter(Boolean);
        if (!terms.length) return [];
        return PRODUCTS.filter(p => {
            const hay = norm([p.brand, p.name, p.cat, p.tags].join(' '));
            return terms.every(t => hay.includes(t));
        });
    }

    // ---------- MODAL ----------
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
                            <div class="sr-price">${fmt(p.price)}</div>
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

    // ---------- PÁGINA DE RESULTADOS ----------
    const grid = document.getElementById('results-grid');
    if (grid) {
        const q = new URLSearchParams(location.search).get('q') || '';
        const sortEl = document.getElementById('sort');
        const pageInput = document.getElementById('page-search-input');
        pageInput.value = q;
        document.getElementById('results-term').textContent = q ? '"' + q.toUpperCase() + '"' : '';
        const base = q ? search(q) : PRODUCTS.slice();

        function draw() {
            let list = base.slice();
            if (sortEl.value === 'MENOR PREÇO') list.sort((a, b) => a.price - b.price);
            if (sortEl.value === 'MAIOR PREÇO') list.sort((a, b) => b.price - a.price);
            document.getElementById('results-count').textContent = list.length + (list.length === 1 ? ' PRODUTO ENCONTRADO' : ' PRODUTOS ENCONTRADOS');
            document.getElementById('results-chip').innerHTML = q ? `<span class="filter-chip">${esc(q.toUpperCase())} <button aria-label="Remover busca" id="chip-remove"><i class="fa-solid fa-xmark"></i></button></span>` : '';
            document.getElementById('chip-remove')?.addEventListener('click', () => location.href = 'resultados-busca.html');
            document.getElementById('results-empty').hidden = list.length > 0;
            document.getElementById('results-pagination').hidden = list.length === 0;
            grid.innerHTML = list.map(p => `
                <article class="product-card">
                    <a href="produto.html" class="product-card-link">
                        <div class="img-wrapper"><img src="${p.img}" alt="${esc(p.name)}" onerror="${imgFallback}"></div>
                        <div class="product-info">
                            <h3>${esc(p.brand)}</h3>
                            <p class="product-name">${esc(p.name)}</p>
                            <div class="prices"><span class="price-new">${fmt(p.price)}</span></div>
                        </div>
                    </a>
                </article>`).join('');
        }
        sortEl.addEventListener('change', draw);
        document.getElementById('page-search-form').addEventListener('submit', e => {
            e.preventDefault();
            const v = pageInput.value.trim();
            location.href = 'resultados-busca.html' + (v ? '?q=' + encodeURIComponent(v) : '');
        });
        document.querySelectorAll('#results-empty .chip').forEach(c => c.addEventListener('click', () => location.href = 'resultados-busca.html?q=' + encodeURIComponent(c.dataset.q)));
        draw();
    }
})();
