/* ==========================================================================
   conta.js — Minha Conta: dados pessoais editáveis, validação de CPF, consulta
   de CEP (ViaCEP), municípios (IBGE) e verificação de cartão (Luhn).
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('form-dados')) return; // só roda em minha-conta.html

    const $ = (id) => document.getElementById(id);
    const digitos = (v) => (v || '').replace(/\D/g, '');
    let cliente = null; // preenchido após sessaoPronta (validação da sessão no backend)

    /* ---------------- Validadores / máscaras ---------------- */
    function cpfValido(valor) {
        const c = digitos(valor);
        if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
        const calc = (n) => {
            let soma = 0;
            for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i);
            const r = (soma * 10) % 11;
            return r === 10 ? 0 : r;
        };
        return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
    }
    const maskCpf = (v) => digitos(v).slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    const maskCep = (v) => digitos(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
    const maskTel = (v) => {
        const d = digitos(v).slice(0, 11);
        if (d.length <= 2) return d;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };
    const luhn = (num) => {
        let soma = 0, alt = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let n = Number(num[i]);
            if (alt) { n *= 2; if (n > 9) n -= 9; }
            soma += n; alt = !alt;
        }
        return num.length > 0 && soma % 10 === 0;
    };
    function bandeira(num) {
        if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(num)) return 'ELO';
        if (/^(606282|3841)/.test(num)) return 'HIPERCARD';
        if (/^4/.test(num)) return 'VISA';
        if (/^(5[1-5]|2[2-7])/.test(num)) return 'MASTERCARD';
        if (/^3[47]/.test(num)) return 'AMEX';
        if (/^3(0[0-5]|[68])/.test(num)) return 'DINERS';
        return 'CARTÃO';
    }
    const iconeBandeira = { VISA: 'fa-cc-visa', MASTERCARD: 'fa-cc-mastercard', AMEX: 'fa-cc-amex', DINERS: 'fa-cc-diners-club' };

    // PUT /api/cliente responde 200 também para "Cliente não encontrado!" — só "sucesso" conta como gravado.
    async function salvarNoBackend(dados) {
        const resposta = await api.alterarCliente(dados);
        if (typeof resposta !== 'string' || !resposta.toLowerCase().includes('sucesso')) {
            const e = new Error(/não encontrado/i.test(resposta)
                ? 'SUA SESSÃO EXPIROU (CONTA NÃO ENCONTRADA). SAIA E FAÇA LOGIN NOVAMENTE.'
                : String(resposta || 'NÃO FOI POSSÍVEL SALVAR.'));
            e.status = 200;
            throw e;
        }
    }
    const mensagemErro = (err) => err.status
        ? (err.message || 'NÃO FOI POSSÍVEL SALVAR.').toUpperCase()
        : 'NÃO FOI POSSÍVEL SALVAR. VERIFIQUE SE O BACKEND ESTÁ RODANDO.';

    function dica(el, texto, ok) {
        el.textContent = texto;
        el.className = 'field-hint' + (texto ? (ok ? ' ok' : ' bad') : '');
    }

    /* ---------------- Dados pessoais (com permissão de edição) ---------------- */
    const form = $('form-dados');
    const camposEditaveis = ['conta-nome', 'conta-telefone', 'conta-nascimento'];
    const msgDados = $('dados-msg');

    function preencherDados() {
        if (!cliente) return;
        $('conta-nome').value = cliente.nome || '';
        $('conta-email').value = cliente.email || '';
        $('conta-telefone').value = maskTel(cliente.telefone);
        $('conta-nascimento').value = cliente.dataNascimento || '';
        $('conta-genero').value = cliente.genero || '';
    }
    function modoEdicao(editar) {
        camposEditaveis.forEach(id => { $(id).readOnly = !editar; });
        $('conta-genero').disabled = !editar;
        $('btn-editar-dados').style.display = editar ? 'none' : '';
        $('btn-salvar-dados').style.display = editar ? '' : 'none';
        $('btn-cancelar-dados').style.display = editar ? '' : 'none';
        if (editar) $('conta-nome').focus();
    }
    // Data de nascimento: não aceita futuro nem mais de 120 anos atrás
    const hoje = new Date();
    $('conta-nascimento').max = hoje.toISOString().slice(0, 10);
    $('conta-nascimento').min = `${hoje.getFullYear() - 120}-01-01`;

    $('conta-telefone').addEventListener('input', (e) => { e.target.value = maskTel(e.target.value); });
    $('btn-editar-dados').addEventListener('click', (e) => {
        e.preventDefault();
        if (!cliente || !cliente.codigo) { msgDados.textContent = 'FAÇA LOGIN PARA EDITAR SEUS DADOS.'; return; }
        msgDados.textContent = '';
        modoEdicao(true);
    });
    $('btn-cancelar-dados').addEventListener('click', (e) => {
        e.preventDefault();
        preencherDados(); modoEdicao(false); msgDados.textContent = '';
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgDados.textContent = ''; msgDados.classList.remove('ok');
        const nome = $('conta-nome').value.trim();
        const tel = digitos($('conta-telefone').value);
        if (nome.length < 3) { msgDados.textContent = 'INFORME O NOME COMPLETO.'; return; }
        if (tel && (tel.length < 10 || tel.length > 11)) { msgDados.textContent = 'TELEFONE INVÁLIDO. USE DDD + NÚMERO.'; return; }
        const nasc = $('conta-nascimento').value;
        if (nasc && (nasc > $('conta-nascimento').max || nasc < $('conta-nascimento').min)) {
            msgDados.textContent = 'DATA DE NASCIMENTO INVÁLIDA.'; return;
        }
        try {
            await salvarNoBackend({
                codigo: cliente.codigo, nome, telefone: tel, dataNascimento: nasc, genero: $('conta-genero').value,
            });
            cliente = { ...cliente, nome, telefone: tel, dataNascimento: nasc, genero: $('conta-genero').value };
            sessao.salvar(cliente);
            modoEdicao(false);
            msgDados.textContent = 'DADOS ATUALIZADOS COM SUCESSO.'; msgDados.classList.add('ok');
        } catch (err) {
            msgDados.textContent = mensagemErro(err);
        }
    });

    /* ---------------- Endereço: CPF, CEP (ViaCEP) e municípios (IBGE) ---------------- */
    const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
    const selUf = $('addr-estado'), selCidade = $('addr-cidade');
    UFS.forEach(uf => selUf.add(new Option(uf, uf)));

    const cacheMunicipios = {};
    async function carregarMunicipios(uf, selecionar) {
        selCidade.innerHTML = '<option value="">SELECIONE</option>';
        if (!uf) return;
        try {
            if (!cacheMunicipios[uf]) {
                const r = await fetch(`https://servicos.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
                if (!r.ok) throw new Error('IBGE');
                cacheMunicipios[uf] = (await r.json()).map(m => m.nome);
            }
            cacheMunicipios[uf].forEach(n => selCidade.add(new Option(n, n)));
        } catch {
            // IBGE indisponível: ainda assim permite gravar a cidade vinda do CEP
        }
        if (selecionar) {
            const alvo = [...selCidade.options].find(o => o.value.toLowerCase() === selecionar.toLowerCase());
            if (alvo) selCidade.value = alvo.value;
            else { selCidade.add(new Option(selecionar, selecionar)); selCidade.value = selecionar; }
        }
    }
    selUf.addEventListener('change', () => carregarMunicipios(selUf.value));

    const cpfInput = $('addr-cpf'), cpfHint = $('addr-cpf-hint');
    function validarCpfCampo() {
        if (digitos(cpfInput.value).length < 11) { dica(cpfHint, '', true); return false; }
        const ok = cpfValido(cpfInput.value);
        dica(cpfHint, ok ? 'CPF VÁLIDO ✔' : 'CPF INVÁLIDO ✘', ok);
        return ok;
    }
    cpfInput.addEventListener('input', () => { cpfInput.value = maskCpf(cpfInput.value); validarCpfCampo(); });

    const cepInput = $('addr-cep'), cepHint = $('addr-cep-hint');
    let cepUltimo = '';
    async function consultarCep() {
        const cep = digitos(cepInput.value);
        if (cep.length !== 8 || cep === cepUltimo) return;
        cepUltimo = cep;
        dica(cepHint, 'CONSULTANDO CEP...', true);
        try {
            const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const d = await r.json();
            if (d.erro) { dica(cepHint, 'CEP NÃO ENCONTRADO ✘', false); return; }
            $('addr-endereco').value = [d.logradouro, d.bairro].filter(Boolean).join(' - ');
            selUf.value = d.uf;
            await carregarMunicipios(d.uf, d.localidade);
            dica(cepHint, `${d.localidade} / ${d.uf} ✔`, true);
            $('addr-numero').focus();
        } catch {
            dica(cepHint, 'NÃO FOI POSSÍVEL CONSULTAR O CEP. PREENCHA MANUALMENTE.', false);
            cepUltimo = '';
        }
    }
    cepInput.addEventListener('input', () => { cepInput.value = maskCep(cepInput.value); consultarCep(); });

    const formEnd = $('form-account-address'), addrError = $('addr-error');
    formEnd.addEventListener('submit', async (e) => {
        e.preventDefault();
        addrError.textContent = '';
        if (!formEnd.checkValidity()) { formEnd.reportValidity(); addrError.textContent = 'PREENCHA TODOS OS CAMPOS OBRIGATÓRIOS CORRETAMENTE.'; return; }
        if (!validarCpfCampo()) { addrError.textContent = 'INFORME UM CPF VÁLIDO.'; cpfInput.focus(); return; }
        if (digitos(cepInput.value).length !== 8) { addrError.textContent = 'CEP INVÁLIDO.'; cepInput.focus(); return; }
        if (!cliente || !cliente.codigo) { addrError.textContent = 'FAÇA LOGIN PARA SALVAR SEU ENDEREÇO.'; return; }
        const dados = {
            codigo: cliente.codigo,
            documento: digitos(cpfInput.value),
            cep: cepInput.value,
            endereco: $('addr-endereco').value.trim(),
            numero: $('addr-numero').value.trim(),
            complemento: $('addr-complemento').value.trim(),
            estado: selUf.value,
            cidade: selCidade.value,
        };
        try {
            await salvarNoBackend(dados);
            cliente = { ...cliente, ...dados };
            sessao.salvar(cliente);
            alert('Endereço salvo com sucesso!');
        } catch (err) {
            addrError.textContent = mensagemErro(err);
        }
    });

    /* ---------------- Cartões: verificação (Luhn, validade, CVV, CPF) ---------------- */
    const chave = () => 'hadi_cartoes_' + ((cliente && cliente.codigo) || 'anon');
    const lerCartoes = () => { try { return JSON.parse(localStorage.getItem(chave())) || []; } catch { return []; } };
    const gravarCartoes = (l) => localStorage.setItem(chave(), JSON.stringify(l));

    function renderCartoes() {
        const lista = $('cartoes-lista'), cartoes = lerCartoes();
        lista.innerHTML = '';
        $('cartoes-vazio').style.display = cartoes.length ? 'none' : 'block';
        cartoes.forEach((c, i) => {
            const div = document.createElement('div');
            div.className = 'saved-card';
            div.innerHTML = `<div class="card-info"><i class="fa-brands ${iconeBandeira[c.bandeira] || 'fa-credit-card'}"></i><div>
                <p><strong class="c-b"></strong></p><p class="c-e"></p><p class="c-c"></p><p class="c-n"></p></div></div>
                <button type="button" class="btn-underline text-red">EXCLUIR MÉTODO DE PAGAMENTO</button>`;
            div.querySelector('.c-b').textContent = `${c.bandeira} ****${c.final}`;
            div.querySelector('.c-e').textContent = `EXPIRA EM: ${c.validade}`;
            div.querySelector('.c-c').textContent = `CPF: ***.***.***-${c.cpfFinal}`;
            div.querySelector('.c-n').textContent = `NOME COMPLETO: ${c.nome}`;
            div.querySelector('button').addEventListener('click', () => {
                if (!confirm('Excluir este cartão?')) return;
                const l = lerCartoes(); l.splice(i, 1); gravarCartoes(l); renderCartoes();
            });
            lista.appendChild(div);
        });
    }

    const mCartao = $('modal-cartao'), fCartao = $('form-cartao');
    const n = $('card-numero'), nm = $('card-nome'), val = $('card-validade'), cvv = $('card-cvv'), cp = $('card-cpf');

    function checarCartao() {
        const num = digitos(n.value), b = bandeira(num);
        const tamOk = b === 'AMEX' ? num.length === 15 : b === 'DINERS' ? num.length === 14 : num.length >= 13 && num.length <= 19;
        const mm = Number(val.value.slice(0, 2)), aa = Number(val.value.slice(3, 5));
        const agora = new Date(), anoAtual = agora.getFullYear() % 100, mesAtual = agora.getMonth() + 1;
        const valOk = /^\d{2}\/\d{2}$/.test(val.value) && mm >= 1 && mm <= 12 && (aa > anoAtual || (aa === anoAtual && mm >= mesAtual)) && aa <= anoAtual + 20;
        const r = {
            numero: tamOk && luhn(num),
            nome: nm.value.trim().split(/\s+/).filter(p => p.length > 1).length >= 2,
            validade: valOk,
            cvv: digitos(cvv.value).length === (b === 'AMEX' ? 4 : 3),
            cpf: cpfValido(cp.value),
        };
        document.querySelectorAll('#card-checks li').forEach(li => {
            const ok = r[li.dataset.check];
            li.className = ok ? 'ok' : (li.dataset.tocado ? 'bad' : '');
        });
        // Preview ao vivo
        $('cp-brand').textContent = b;
        $('cp-number').textContent = (n.value || '•••• •••• •••• ••••');
        $('cp-name').textContent = nm.value.trim().toUpperCase() || 'NOME NO CARTÃO';
        $('cp-exp').textContent = val.value || 'MM/AA';
        return { r, b, num };
    }
    const marcarTocado = (el, chk) => el.addEventListener('blur', () => {
        document.querySelector(`#card-checks li[data-check="${chk}"]`).dataset.tocado = '1'; checarCartao();
    });
    marcarTocado(n, 'numero'); marcarTocado(nm, 'nome'); marcarTocado(val, 'validade'); marcarTocado(cvv, 'cvv'); marcarTocado(cp, 'cpf');

    n.addEventListener('input', () => {
        const d = digitos(n.value).slice(0, 19);
        n.value = bandeira(d) === 'AMEX' ? d.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
                                          : d.replace(/(\d{4})(?=\d)/g, '$1 ');
        checarCartao();
    });
    val.addEventListener('input', () => { val.value = digitos(val.value).slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2'); checarCartao(); });
    cvv.addEventListener('input', () => { cvv.value = digitos(cvv.value).slice(0, 4); checarCartao(); });
    cp.addEventListener('input', () => { cp.value = maskCpf(cp.value); checarCartao(); });
    nm.addEventListener('input', checarCartao);

    $('btn-add-cartao').addEventListener('click', () => {
        fCartao.reset(); $('card-msg').textContent = '';
        document.querySelectorAll('#card-checks li').forEach(li => { delete li.dataset.tocado; });
        checarCartao();
        mCartao.classList.add('active');
    });
    fCartao.addEventListener('submit', (e) => {
        e.preventDefault();
        document.querySelectorAll('#card-checks li').forEach(li => { li.dataset.tocado = '1'; });
        const { r, b, num } = checarCartao();
        if (!Object.values(r).every(Boolean)) { $('card-msg').textContent = 'CORRIJA OS ITENS EM VERMELHO PARA CONTINUAR.'; return; }
        const lista = lerCartoes();
        if (lista.some(c => c.bandeira === b && c.final === num.slice(-4) && c.validade === val.value)) {
            $('card-msg').textContent = 'ESTE CARTÃO JÁ ESTÁ CADASTRADO.'; return;
        }
        // Nunca guardamos número completo nem CVV.
        lista.push({ bandeira: b, final: num.slice(-4), validade: val.value, nome: nm.value.trim().toUpperCase(), cpfFinal: digitos(cp.value).slice(-2) });
        gravarCartoes(lista);
        fCartao.reset();
        mCartao.classList.remove('active');
        renderCartoes();
    });

    /* ---------------- Inicialização ---------------- */
    // Espera a validação da sessão no backend (api.js): dados vêm do banco, não do que ficou no navegador.
    (typeof sessaoPronta !== 'undefined' ? sessaoPronta : Promise.resolve(sessao.obter())).then((c) => {
        cliente = c;
        preencherDados();
        renderCartoes();
        if (!cliente) {
            msgDados.textContent = 'FAÇA LOGIN PARA VER E EDITAR SEUS DADOS.';
            return;
        }
        $('addr-nome').value = cliente.nome || '';
        if (cliente.documento) { cpfInput.value = maskCpf(cliente.documento); validarCpfCampo(); }
        if (cliente.cep) { cepInput.value = maskCep(cliente.cep); cepUltimo = digitos(cliente.cep); }
        $('addr-endereco').value = cliente.endereco || '';
        $('addr-numero').value = cliente.numero || '';
        $('addr-complemento').value = cliente.complemento || '';
        if (cliente.estado) { selUf.value = cliente.estado; carregarMunicipios(cliente.estado, cliente.cidade); }
    });
});
