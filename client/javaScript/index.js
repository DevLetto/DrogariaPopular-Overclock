(function () {

  const API_BASE_URL = "http://localhost:8080/api";
  const ICONE_PADRAO = "../img/medicamentos_icon.png";

  let produtosCache = [];

  document.addEventListener("DOMContentLoaded", () => {

    carregarProdutosECategorias();
    carregarPromocoes();
    carregarServicos();
    carregarLojas();

  });

  /* =========================================================
     API
  ========================================================= */

  async function fetchJson(url) {

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Erro ${res.status} ao acessar ${url}`);
    }

    return res.json();
  }

  /* =========================================================
     UTILIDADES
  ========================================================= */

  function formatarPreco(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  }

  function escaparHTML(valor) {

    const div = document.createElement("div");

    div.textContent = valor ?? "";

    return div.innerHTML;

  }

  function mostrarErro(container, mensagem) {

    if (container) {

      container.innerHTML = `
        <p class="sem-dados">
          ${mensagem}
        </p>
      `;

    }

  }

  function atualizarStat(nome, valor) {

    const el = document.querySelector(
      `[data-stat="${nome}"]`
    );

    if (el) {
      el.textContent = valor;
    }

  }

  /* =========================================================
     NAVEGAÇÃO PARA PRODUTO
  ========================================================= */

  function irParaProduto(id) {

    if (!id) {
      return;
    }

    window.location.href = `item.html?id=${id}`;

  }

  /* =========================================================
     PRODUTOS + CATEGORIAS
  ========================================================= */

  async function carregarProdutosECategorias() {

    try {

      const [produtos, categorias] = await Promise.all([

        fetchJson(`${API_BASE_URL}/produto`),

        fetchJson(`${API_BASE_URL}/categoria`)

      ]);

      produtosCache =
        Array.isArray(produtos)
          ? produtos
          : [];

      atualizarStat(
        "produtos",
        `+${produtosCache.length}`
      );

      renderizarCategorias(categorias);

      renderizarMaisVendidos(produtosCache);

      renderizarOfertasHero(produtosCache);

    } catch (err) {

      console.error(
        "Falha ao carregar produtos/categorias:",
        err
      );

      mostrarErro(
        document.querySelector("[data-categorias]"),
        "Não foi possível carregar as categorias."
      );

      mostrarErro(
        document.querySelector("[data-mais-vendidos]"),
        "Não foi possível carregar os produtos."
      );

    }

  }

  /* =========================================================
     CATEGORIAS
  ========================================================= */

  function renderizarCategorias(categorias) {

    const container =
      document.querySelector("[data-categorias]");

    if (!container) {
      return;
    }

    if (
      !Array.isArray(categorias) ||
      categorias.length === 0
    ) {

      mostrarErro(
        container,
        "Nenhuma categoria cadastrada ainda."
      );

      return;

    }

    container.innerHTML = categorias
      .map((categoria) => {

        const id =
          categoria.idCategoria ??
          categoria.id ??
          "";

        const nome =
          categoria.nome ??
          "Categoria";

        return `
          <a
            href="produtos.html?categoria=${encodeURIComponent(id)}"
            class="card"
          >

            <img
              src="${ICONE_PADRAO}"
              alt="${escaparHTML(nome)}"
            />

            <strong>
              ${escaparHTML(nome)}
            </strong>

          </a>
        `;

      })
      .join("");

  }

  /* =========================================================
     MAIS VENDIDOS
  ========================================================= */

  function renderizarMaisVendidos(produtos) {

    const container =
      document.querySelector(
        "[data-mais-vendidos]"
      );

    if (!container) {
      return;
    }

    if (
      !Array.isArray(produtos) ||
      produtos.length === 0
    ) {

      mostrarErro(
        container,
        "Nenhum produto cadastrado ainda."
      );

      return;

    }

    /*
     * Como ainda não existe endpoint específico
     * de mais vendidos, usamos os primeiros produtos.
     */

    container.innerHTML =
      produtos
        .slice(0, 5)
        .map(criarCardProduto)
        .join("");

    adicionarEventosProdutos(container);

  }

  /* =========================================================
     CARD DE PRODUTO
  ========================================================= */

  function criarCardProduto(produto) {

    const id =
      produto.idProduto ??
      produto.id;

    const nome =
      produto.nomeProduto ??
      "Produto";

    const preco =
      formatarPreco(
        produto.precoProduto
      );

    const imagem =
      produto.imagemURL ||
      ICONE_PADRAO;

    return `
      <article
        class="product-card"
        data-produto-id="${id}"
        style="cursor: pointer;"
      >

        <div class="product-image-container">

          <img
            src="${imagem}"
            alt="${escaparHTML(nome)}"
            onerror="this.src='${ICONE_PADRAO}'"
          />

        </div>

        <div class="product-info">

          <h3>
            ${escaparHTML(nome)}
          </h3>

          <p class="price">
            ${preco}
          </p>

        </div>

      </article>
    `;

  }

  /* =========================================================
     CLIQUE NOS PRODUTOS
  ========================================================= */

  function adicionarEventosProdutos(container) {

    const cards =
      container.querySelectorAll(
        "[data-produto-id]"
      );

    cards.forEach((card) => {

      card.addEventListener(
        "click",
        () => {

          const id =
            card.dataset.produtoId;

          irParaProduto(id);

        }
      );

    });

  }

  /* =========================================================
     OFERTAS DO HERO
  ========================================================= */

  function renderizarOfertasHero(produtos) {

    const lista =
      document.querySelector(
        "[data-ofertas-hero]"
      );

    if (!lista) {
      return;
    }

    const destaques =
      produtos.slice(0, 3);

    if (destaques.length === 0) {

      lista.innerHTML = `
        <li>
          <span>
            Sem produtos no momento
          </span>
        </li>
      `;

      return;
    }

    lista.innerHTML =
      destaques
        .map((produto) => {

          const id =
            produto.idProduto ??
            produto.id;

          const nome =
            produto.nomeProduto ??
            "Produto";

          const preco =
            formatarPreco(
              produto.precoProduto
            );

          const imagem =
            produto.imagemURL ||
            ICONE_PADRAO;

          return `
            <li
              data-produto-id="${id}"
              style="cursor: pointer;"
            >

              <div class="item-info">

                <img
                  src="${imagem}"
                  alt="${escaparHTML(nome)}"
                  onerror="this.src='${ICONE_PADRAO}'"
                />

                <div>
                  <span>
                    ${escaparHTML(nome)}
                  </span>
                </div>

              </div>

              <div class="item-price">
                <strong>
                  ${preco}
                </strong>
              </div>

            </li>
          `;

        })
        .join("");

    adicionarEventosProdutos(lista);

  }

  /* =========================================================
     PROMOÇÕES
  ========================================================= */

  async function carregarPromocoes() {

    const container =
      document.querySelector(
        "[data-promocoes]"
      );

    if (!container) {
      return;
    }

    try {

      const promocoes =
        await fetchJson(
          `${API_BASE_URL}/promocao`
        );

      if (
        !Array.isArray(promocoes) ||
        promocoes.length === 0
      ) {

        mostrarErro(
          container,
          "Nenhuma promoção ativa no momento."
        );

        return;

      }

      if (produtosCache.length === 0) {

        produtosCache =
          await fetchJson(
            `${API_BASE_URL}/produto`
          );

      }

      const mapaProdutos =
        new Map(
          produtosCache.map(
            (produto) => [
              produto.idProduto,
              produto
            ]
          )
        );

      container.innerHTML =
        promocoes
          .map(
            (promo) =>
              criarCardPromocao(
                promo,
                mapaProdutos
              )
          )
          .join("");

      adicionarEventosProdutos(container);

    } catch (err) {

      console.error(
        "Falha ao carregar promoções:",
        err
      );

      mostrarErro(
        container,
        "Não foi possível carregar as promoções."
      );

    }

  }

  function criarCardPromocao(
    promocao,
    mapaProdutos
  ) {

    /*
     * Dependendo da serialização do seu backend,
     * a promoção pode vir com:
     *
     * promo.produto.idProduto
     *
     * ou:
     *
     * promo.idProduto
     */

    const idProduto =
      promocao.produto?.idProduto ??
      promocao.produto?.id ??
      promocao.idProduto;

    const produto =
      mapaProdutos.get(idProduto) ||
      promocao.produto ||
      {};

    const nome =
      produto.nomeProduto ??
      "Produto em promoção";

    const imagem =
      produto.imagemURL ||
      ICONE_PADRAO;

    const precoOriginal =
      Number(
        produto.precoProduto || 0
      );

    const precoPromo =
      Number(
        promocao.precoPromocional || 0
      );

    const desconto =
      precoOriginal > 0
        ? Math.round(
            (
              (precoOriginal - precoPromo) /
              precoOriginal
            ) * 100
          )
        : 0;

    return `
      <article
        class="product-card"
        data-produto-id="${idProduto}"
        style="cursor: pointer;"
      >

        <div class="product-image-container">

          ${
            desconto > 0
              ? `
                <span class="discount-badge">
                  -${desconto}%
                </span>
              `
              : ""
          }

          <img
            src="${imagem}"
            alt="${escaparHTML(nome)}"
            onerror="this.src='${ICONE_PADRAO}'"
          />

        </div>

        <div class="product-info">

          <h3>
            ${escaparHTML(nome)}
          </h3>

          <p class="price-container">

            <span class="price-red">
              ${formatarPreco(precoPromo)}
            </span>

            ${
              precoOriginal > 0
                ? `
                  <del>
                    ${formatarPreco(precoOriginal)}
                  </del>
                `
                : ""
            }

          </p>

        </div>

      </article>
    `;

  }

  /* =========================================================
     SERVIÇOS
  ========================================================= */

  async function carregarServicos() {

    const container =
      document.querySelector(
        "[data-servicos]"
      );

    if (!container) {
      return;
    }

    try {

      const servicos =
        await fetchJson(
          `${API_BASE_URL}/servico`
        );

      if (
        !Array.isArray(servicos) ||
        servicos.length === 0
      ) {

        mostrarErro(
          container,
          "Nenhum serviço cadastrado ainda."
        );

        return;

      }

      container.innerHTML =
        servicos
          .map(
            (servico) => `

              <article class="service-card">

                <div class="service-icon">

                  <img
                    src="../img/servicos_icon.png"
                    alt="${escaparHTML(
                      servico.nome ?? "Serviço"
                    )}"
                  />

                </div>

                <h3>
                  ${escaparHTML(
                    servico.nome ?? "Serviço"
                  )}
                </h3>

                <p>
                  ${escaparHTML(
                    servico.descricao ?? ""
                  )}
                </p>

              </article>

            `
          )
          .join("");

    } catch (err) {

      console.error(
        "Falha ao carregar serviços:",
        err
      );

      mostrarErro(
        container,
        "Não foi possível carregar os serviços."
      );

    }

  }

  /* =========================================================
     LOJAS
  ========================================================= */

  async function carregarLojas() {

    const container =
      document.querySelector(
        "[data-lojas]"
      );

    try {

      const lojas =
        await fetchJson(
          `${API_BASE_URL}/loja`
        );

      const total =
        Array.isArray(lojas)
          ? lojas.length
          : 0;

      atualizarStat(
        "lojas",
        total
      );

      if (!container) {
        return;
      }

      if (total === 0) {

        mostrarErro(
          container,
          "Nenhuma loja cadastrada ainda."
        );

        return;

      }

      container.innerHTML =
        lojas
          .map(
            (loja) => `

              <article class="store-card">

                <div class="store-icon">

                  <img
                    src="../img/localizacao_icon.png"
                    alt="${escaparHTML(
                      loja.nome ?? "Loja"
                    )}"
                  />

                </div>

                <div>

                  <h3>
                    ${escaparHTML(
                      loja.nome ?? "Loja"
                    )}
                  </h3>

                  <p>
                    📞 ${escaparHTML(
                      loja.telefone ??
                      "Telefone não informado"
                    )}
                  </p>

                  <p class="store-status">
                    🕒 ${escaparHTML(
                      loja.horarioFuncionamento ??
                      "Horário não informado"
                    )}
                  </p>

                </div>

              </article>

            `
          )
          .join("");

    } catch (err) {

      console.error(
        "Falha ao carregar lojas:",
        err
      );

      if (container) {

        mostrarErro(
          container,
          "Não foi possível carregar as lojas."
        );

      }

    }

  }

})();