// index.js
// Carrega dados reais da API pra popular a home, substituindo os
// produtos/categorias/promoções/serviços/lojas que estavam
// hardcoded como exemplo no HTML estático.

(function () {
  const API_BASE_URL = 'http://localhost:8080/api';
  const ICONE_PADRAO = '../img/medicamentos_icon.png';

  let produtosCache = [];

  document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosECategorias();
    carregarPromocoes();
    carregarServicos();
    carregarLojas();
  });

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ${res.status} ao acessar ${url}`);
    return res.json();
  }

  function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function mostrarErro(container, mensagem) {
    if (container) {
      container.innerHTML = `<p class="sem-dados">${mensagem}</p>`;
    }
  }

  // ---------- Produtos + Categorias + estatísticas do hero ----------
  async function carregarProdutosECategorias() {
    try {
      const [produtos, categorias] = await Promise.all([
        fetchJson(`${API_BASE_URL}/produto`),
        fetchJson(`${API_BASE_URL}/categoria`),
      ]);

      produtosCache = Array.isArray(produtos) ? produtos : [];

      atualizarStat('produtos', `+${produtosCache.length}`);
      renderizarCategorias(categorias);
      renderizarMaisVendidos(produtosCache);
      renderizarOfertasHero(produtosCache);
    } catch (err) {
      console.error('Falha ao carregar produtos/categorias:', err);
      mostrarErro(
        document.querySelector('[data-categorias]'),
        'Não foi possível carregar as categorias.'
      );
      mostrarErro(
        document.querySelector('[data-mais-vendidos]'),
        'Não foi possível carregar os produtos.'
      );
    }
  }

  function atualizarStat(nome, valor) {
    const el = document.querySelector(`[data-stat="${nome}"]`);
    if (el) el.textContent = valor;
  }

  function renderizarCategorias(categorias) {
    const container = document.querySelector('[data-categorias]');
    if (!container) return;

    if (!Array.isArray(categorias) || categorias.length === 0) {
      mostrarErro(container, 'Nenhuma categoria cadastrada ainda.');
      return;
    }

    container.innerHTML = categorias
      .map((categoria) => {
        const id = categoria.idCategoria ?? categoria.id ?? '';
        const nome = categoria.nome ?? 'Categoria';
        return `
          <a href="produtos.html?categoria=${id}" class="card">
            <img src="${ICONE_PADRAO}" alt="${nome}" />
            <strong>${nome}</strong>
          </a>
        `;
      })
      .join('');
  }

  function renderizarMaisVendidos(produtos) {
    const container = document.querySelector('[data-mais-vendidos]');
    if (!container) return;

    if (produtos.length === 0) {
      mostrarErro(container, 'Nenhum produto cadastrado ainda.');
      return;
    }

    // Nao existe endpoint de "mais vendidos" documentado, entao
    // mostramos os primeiros produtos cadastrados como destaque.
    container.innerHTML = produtos.slice(0, 5).map(criarCardProduto).join('');
  }

  function criarCardProduto(produto) {
    const nome = produto.nomeProduto ?? 'Produto';
    const preco = formatarPreco(produto.precoProduto);
    const imagem = produto.imagemURL || ICONE_PADRAO;

    return `
      <article class="product-card">
        <div class="product-image-container">
          <img src="${imagem}" alt="${nome}" onerror="this.src='${ICONE_PADRAO}'" />
        </div>
        <div class="product-info">
          <h3>${nome}</h3>
          <p class="price">${preco}</p>
        </div>
      </article>
    `;
  }

  function renderizarOfertasHero(produtos) {
    const lista = document.querySelector('[data-ofertas-hero]');
    if (!lista) return;

    const destaques = produtos.slice(0, 3);

    if (destaques.length === 0) {
      lista.innerHTML = '<li><span>Sem produtos no momento</span></li>';
      return;
    }

    lista.innerHTML = destaques
      .map((produto) => {
        const nome = produto.nomeProduto ?? 'Produto';
        const preco = formatarPreco(produto.precoProduto);
        const imagem = produto.imagemURL || ICONE_PADRAO;
        return `
          <li>
            <div class="item-info">
              <img src="${imagem}" alt="${nome}" onerror="this.src='${ICONE_PADRAO}'" />
              <div><span>${nome}</span></div>
            </div>
            <div class="item-price"><strong>${preco}</strong></div>
          </li>
        `;
      })
      .join('');
  }

  // ---------- Promoções ----------
  async function carregarPromocoes() {
    const container = document.querySelector('[data-promocoes]');
    if (!container) return;

    try {
      const promocoes = await fetchJson(`${API_BASE_URL}/promocao`);

      if (!Array.isArray(promocoes) || promocoes.length === 0) {
        mostrarErro(container, 'Nenhuma promoção ativa no momento.');
        return;
      }

      // Garante que temos os produtos carregados pra casar nome/preço original
      if (produtosCache.length === 0) {
        produtosCache = await fetchJson(`${API_BASE_URL}/produto`);
      }
      const mapaProdutos = new Map(produtosCache.map((p) => [p.idProduto, p]));

      container.innerHTML = promocoes
        .map((promo) => criarCardPromocao(promo, mapaProdutos))
        .join('');
    } catch (err) {
      console.error('Falha ao carregar promoções:', err);
      mostrarErro(container, 'Não foi possível carregar as promoções.');
    }
  }

  function criarCardPromocao(promocao, mapaProdutos) {
    const produto = mapaProdutos.get(promocao.idProduto) || {};
    const nome = produto.nomeProduto ?? 'Produto em promoção';
    const imagem = produto.imagemURL || ICONE_PADRAO;
    const precoOriginal = Number(produto.precoProduto || 0);
    const precoPromo = Number(promocao.precoPromocional || 0);

    const desconto =
      precoOriginal > 0
        ? Math.round(((precoOriginal - precoPromo) / precoOriginal) * 100)
        : 0;

    return `
      <article class="product-card">
        <div class="product-image-container">
          ${desconto > 0 ? `<span class="discount-badge">-${desconto}%</span>` : ''}
          <img src="${imagem}" alt="${nome}" onerror="this.src='${ICONE_PADRAO}'" />
        </div>
        <div class="product-info">
          <h3>${nome}</h3>
          <p class="price-container">
            <span class="price-red">${formatarPreco(precoPromo)}</span>
            ${precoOriginal > 0 ? `<del>${formatarPreco(precoOriginal)}</del>` : ''}
          </p>
        </div>
      </article>
    `;
  }

  // ---------- Serviços ----------
  async function carregarServicos() {
    const container = document.querySelector('[data-servicos]');
    if (!container) return;

    try {
      const servicos = await fetchJson(`${API_BASE_URL}/servico`);

      if (!Array.isArray(servicos) || servicos.length === 0) {
        mostrarErro(container, 'Nenhum serviço cadastrado ainda.');
        return;
      }

      container.innerHTML = servicos
        .map(
          (servico) => `
          <article class="service-card">
            <div class="service-icon">
              <img src="../img/servicos_icon.png" alt="${servico.nome ?? 'Serviço'}" />
            </div>
            <h3>${servico.nome ?? 'Serviço'}</h3>
            <p>${servico.descricao ?? ''}</p>
          </article>
        `
        )
        .join('');
    } catch (err) {
      console.error('Falha ao carregar serviços:', err);
      mostrarErro(container, 'Não foi possível carregar os serviços.');
    }
  }

  // ---------- Lojas ----------
  async function carregarLojas() {
    const container = document.querySelector('[data-lojas]');

    try {
      const lojas = await fetchJson(`${API_BASE_URL}/loja`);
      const total = Array.isArray(lojas) ? lojas.length : 0;

      atualizarStat('lojas', total);

      if (!container) return;

      if (total === 0) {
        mostrarErro(container, 'Nenhuma loja cadastrada ainda.');
        return;
      }

      container.innerHTML = lojas
        .map(
          (loja) => `
          <article class="store-card">
            <div class="store-icon">
              <img src="../img/localizacao_icon.png" alt="${loja.nome ?? 'Loja'}" />
            </div>
            <div>
              <h3>${loja.nome ?? 'Loja'}</h3>
              <p>📞 ${loja.telefone ?? 'Telefone não informado'}</p>
              <p class="store-status">🕒 ${loja.horarioFuncionamento ?? 'Horário não informado'}</p>
            </div>
          </article>
        `
        )
        .join('');
    } catch (err) {
      console.error('Falha ao carregar lojas:', err);
      if (container) mostrarErro(container, 'Não foi possível carregar as lojas.');
    }
  }
})();