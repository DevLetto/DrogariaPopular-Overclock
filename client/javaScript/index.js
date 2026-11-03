(function () {
  const API_BASE_URL = "http://localhost:8080/api";
  const ICONE_PADRAO = "../img/medicamentos_icon.png";

  let produtosCache = [];

  // idProduto -> { produto, precoOriginal, precoPromo, desconto }
  let ofertasPorId = new Map();

  document.addEventListener("DOMContentLoaded", inicializar);

  function inicializar() {
    configurarBotaoOfertas();

    carregarCatalogo();
    carregarServicos();
    carregarLojas();
  }

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

  function escaparAtributo(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function mostrarErro(container, mensagem) {
    if (container) {
      container.innerHTML = `<p class="sem-dados">${mensagem}</p>`;
    }
  }

  function atualizarStat(nome, valor) {
    const el = document.querySelector(`[data-stat="${nome}"]`);

    if (el) el.textContent = valor;
  }

  function obterIdProduto(produto) {
    return produto?.idProduto ?? produto?.id ?? null;
  }

  function ehVerdadeiro(valor) {
    return valor === true || valor === 1;
  }

  function estaForaDeEstoque(produto) {
    return (
      ehVerdadeiro(produto?.esgotado) ||
      produto?.disponivel === false ||
      produto?.disponivel === 0
    );
  }

  /* =========================================================
     BOTÃO "VER OFERTAS"
  ========================================================= */

  function configurarBotaoOfertas() {
    const botao = document.querySelector("[data-btn-ofertas]");

    if (!botao) return;

    botao.addEventListener("click", () => {
      window.location.href = botao.dataset.destino || "produtos.html";
    });
  }

  // Sem ofertas ativas, o botão leva para o catálogo completo
  // (em vez de abrir uma listagem de promoções vazia).
  function ajustarBotaoOfertas(temOfertas) {
    const botao = document.querySelector("[data-btn-ofertas]");

    if (!botao || temOfertas) return;

    botao.textContent = "Ver todos os produtos →";
    botao.dataset.destino = "produtos.html";
  }

  /* =========================================================
     PROMOÇÕES ATIVAS
  ========================================================= */

  function dataLocalISO() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function obterIdProdutoPromocao(promocao) {
    return (
      promocao?.idProduto ??
      promocao?.produto?.idProduto ??
      promocao?.produto?.id ??
      promocao?.produtoId ??
      null
    );
  }

  function promocaoEstaAtiva(promocao) {
    const hoje = dataLocalISO();
    const inicio = String(promocao?.dataInicio ?? "").slice(0, 10);
    const fim = String(promocao?.dataFim ?? "").slice(0, 10);

    return Boolean(
      inicio &&
        fim &&
        inicio <= hoje &&
        fim >= hoje &&
        obterIdProdutoPromocao(promocao) != null,
    );
  }

  /*
   * Transforma as promoções em "ofertas": só as que estão dentro da
   * validade, têm preço válido (menor que o normal) e o produto está
   * disponível. Ordena pelo maior desconto e remove produtos repetidos.
   */
  function montarOfertas(promocoes, mapaProdutos) {
    if (!Array.isArray(promocoes)) return [];

    const ofertas = promocoes
      .filter(promocaoEstaAtiva)
      .map((promocao) => {
        const produto = mapaProdutos.get(
          String(obterIdProdutoPromocao(promocao)),
        );

        if (!produto || estaForaDeEstoque(produto)) return null;

        const precoOriginal = Number(produto.precoProduto || 0);
        const precoPromo = Number(promocao.precoPromocional);

        if (
          !Number.isFinite(precoPromo) ||
          precoPromo <= 0 ||
          precoPromo >= precoOriginal
        ) {
          return null;
        }

        return {
          produto,
          precoOriginal,
          precoPromo,
          desconto: Math.round(
            ((precoOriginal - precoPromo) / precoOriginal) * 100,
          ),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.desconto - a.desconto);

    const vistos = new Set();

    return ofertas.filter((oferta) => {
      const id = String(obterIdProduto(oferta.produto));

      if (vistos.has(id)) return false;

      vistos.add(id);
      return true;
    });
  }

  /* =========================================================
     CATÁLOGO: PRODUTOS + CATEGORIAS + PROMOÇÕES
  ========================================================= */

  async function carregarCatalogo() {
    try {
      const [produtos, categorias, promocoes] = await Promise.all([
        fetchJson(`${API_BASE_URL}/produto`),
        fetchJson(`${API_BASE_URL}/categoria`),
        fetchJson(`${API_BASE_URL}/promocao`).catch((erro) => {
          console.warn("Não foi possível carregar promoções:", erro);
          return [];
        }),
      ]);

      produtosCache = Array.isArray(produtos) ? produtos : [];

      const mapaProdutos = new Map(
        produtosCache.map((produto) => [
          String(obterIdProduto(produto)),
          produto,
        ]),
      );

      const ofertas = montarOfertas(promocoes, mapaProdutos);

      ofertasPorId = new Map(
        ofertas.map((oferta) => [
          String(obterIdProduto(oferta.produto)),
          oferta,
        ]),
      );

      atualizarStat("produtos", `+${produtosCache.length}`);

      renderizarCategorias(categorias);
      renderizarOfertasHero(ofertas);
      renderizarPromocoes(ofertas);
      renderizarMaisVendidos(produtosCache);
      ajustarBotaoOfertas(ofertas.length > 0);
    } catch (erro) {
      console.error("Falha ao carregar o catálogo:", erro);

      mostrarErro(
        document.querySelector("[data-categorias]"),
        "Não foi possível carregar as categorias.",
      );

      mostrarErro(
        document.querySelector("[data-promocoes]"),
        "Não foi possível carregar as promoções.",
      );

      mostrarErro(
        document.querySelector("[data-mais-vendidos]"),
        "Não foi possível carregar os produtos.",
      );

      const hero = document.querySelector("[data-ofertas-hero]");

      if (hero) {
        hero.innerHTML = "<li><span>Ofertas indisponíveis no momento</span></li>";
      }

      ajustarBotaoOfertas(false);
    }
  }

  /* =========================================================
     CATEGORIAS
  ========================================================= */

  function renderizarCategorias(categorias) {
    const container = document.querySelector("[data-categorias]");

    if (!container) return;

    if (!Array.isArray(categorias) || categorias.length === 0) {
      mostrarErro(container, "Nenhuma categoria cadastrada ainda.");
      return;
    }

    container.innerHTML = categorias
      .map((categoria) => {
        const id = categoria.idCategoria ?? categoria.id ?? "";
        const nome = categoria.nome ?? categoria.nomeCategoria ?? "Categoria";

        return `
          <a
            href="produtos.html?categoria=${encodeURIComponent(id)}"
            class="card"
          >
            <img
              src="${ICONE_PADRAO}"
              alt="${escaparAtributo(nome)}"
            />

            <strong>${escaparHTML(nome)}</strong>
          </a>`;
      })
      .join("");
  }

  /* =========================================================
     CARD DE PRODUTO (usado em promoções e mais vendidos)
  ========================================================= */

  function criarCardProduto(produto, oferta) {
    const id = obterIdProduto(produto);
    const nome = produto.nomeProduto ?? "Produto";
    const imagem = produto.imagemURL || ICONE_PADRAO;

    const preco = oferta
      ? `
        <p class="price-container">
          <span class="price-red">${formatarPreco(oferta.precoPromo)}</span>
          <del>${formatarPreco(oferta.precoOriginal)}</del>
        </p>`
      : `<p class="price">${formatarPreco(produto.precoProduto)}</p>`;

    return `
      <article
        class="product-card"
        data-produto-id="${escaparAtributo(id)}"
        style="cursor: pointer;"
      >
        <div class="product-image-container">
          ${
            oferta
              ? `<span class="discount-badge">-${oferta.desconto}%</span>`
              : ""
          }

          <img
            src="${escaparAtributo(imagem)}"
            alt="${escaparAtributo(nome)}"
            onerror="this.onerror=null;this.src='${ICONE_PADRAO}'"
          />
        </div>

        <div class="product-info">
          <h3>${escaparHTML(nome)}</h3>
          ${preco}
        </div>
      </article>`;
  }

  function adicionarEventosProdutos(container) {
    container.querySelectorAll("[data-produto-id]").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.produtoId;

        if (id) {
          window.location.href = `item.html?id=${encodeURIComponent(id)}`;
        }
      });
    });
  }

  /* =========================================================
     OFERTAS DE HOJE (hero)
  ========================================================= */

  function criarLinhaHero(produto, oferta) {
    const id = obterIdProduto(produto);
    const nome = produto.nomeProduto ?? "Produto";
    const imagem = produto.imagemURL || ICONE_PADRAO;

    const preco = oferta
      ? `
        <strong>${formatarPreco(oferta.precoPromo)}</strong>
        <del>${formatarPreco(oferta.precoOriginal)}</del>`
      : `<strong style="color: var(--cor-primaria)">${formatarPreco(produto.precoProduto)}</strong>`;

    return `
      <li
        data-produto-id="${escaparAtributo(id)}"
        style="cursor: pointer;"
      >
        <div class="item-info">
          <img
            src="${escaparAtributo(imagem)}"
            alt="${escaparAtributo(nome)}"
            onerror="this.onerror=null;this.src='${ICONE_PADRAO}'"
          />

          <div>
            <span>${escaparHTML(nome)}</span>
          </div>
        </div>

        <div class="item-price">${preco}</div>
      </li>`;
  }

  /*
   * Com ofertas ativas: mostra as 3 maiores.
   * Sem ofertas: vira "Destaques da loja" com produtos disponíveis,
   * sem preço riscado e sem o selo "atualizado agora".
   */
  function renderizarOfertasHero(ofertas) {
    const lista = document.querySelector("[data-ofertas-hero]");
    const titulo = document.querySelector("[data-ofertas-titulo]");
    const status = document.querySelector("[data-ofertas-status]");

    if (!lista) return;

    if (ofertas.length > 0) {
      if (titulo) titulo.textContent = "OFERTAS DE HOJE";
      if (status) status.hidden = false;

      lista.innerHTML = ofertas
        .slice(0, 3)
        .map((oferta) => criarLinhaHero(oferta.produto, oferta))
        .join("");
    } else {
      if (titulo) titulo.textContent = "DESTAQUES DA LOJA";
      if (status) status.hidden = true;

      const destaques = produtosCache
        .filter((produto) => !estaForaDeEstoque(produto))
        .slice(0, 3);

      lista.innerHTML = destaques.length
        ? destaques.map((produto) => criarLinhaHero(produto, null)).join("")
        : "<li><span>Sem produtos no momento</span></li>";
    }

    adicionarEventosProdutos(lista);
  }

  /* =========================================================
     SEÇÃO "EM PROMOÇÃO"
  ========================================================= */

  function renderizarPromocoes(ofertas) {
    const container = document.querySelector("[data-promocoes]");

    if (!container) return;

    if (ofertas.length === 0) {
      mostrarErro(container, "Nenhuma promoção ativa no momento.");
      return;
    }

    container.innerHTML = ofertas
      .slice(0, 6)
      .map((oferta) => criarCardProduto(oferta.produto, oferta))
      .join("");

    adicionarEventosProdutos(container);
  }

  /* =========================================================
     MAIS VENDIDOS
     (ainda não existe endpoint de vendas: usa os primeiros produtos)
  ========================================================= */

  function renderizarMaisVendidos(produtos) {
    const container = document.querySelector("[data-mais-vendidos]");

    if (!container) return;

    const disponiveis = produtos.filter((produto) => !estaForaDeEstoque(produto));

    if (disponiveis.length === 0) {
      mostrarErro(container, "Nenhum produto cadastrado ainda.");
      return;
    }

    container.innerHTML = disponiveis
      .slice(0, 5)
      .map((produto) =>
        criarCardProduto(
          produto,
          ofertasPorId.get(String(obterIdProduto(produto))) || null,
        ),
      )
      .join("");

    adicionarEventosProdutos(container);
  }

  /* =========================================================
     SERVIÇOS
  ========================================================= */

  async function carregarServicos() {
    const container = document.querySelector("[data-servicos]");

    if (!container) return;

    try {
      const servicos = await fetchJson(`${API_BASE_URL}/servico`);

      if (!Array.isArray(servicos) || servicos.length === 0) {
        mostrarErro(container, "Nenhum serviço cadastrado ainda.");
        return;
      }

      container.innerHTML = servicos
        .map(
          (servico) => `
            <article class="service-card">
              <div class="service-icon">
                <img
                  src="../img/servicos_icon.png"
                  alt="${escaparAtributo(servico.nome ?? "Serviço")}"
                />
              </div>

              <h3>${escaparHTML(servico.nome ?? "Serviço")}</h3>

              <p>${escaparHTML(servico.descricao ?? "")}</p>
            </article>`,
        )
        .join("");
    } catch (erro) {
      console.error("Falha ao carregar serviços:", erro);

      mostrarErro(container, "Não foi possível carregar os serviços.");
    }
  }

  /* =========================================================
     LOJAS
  ========================================================= */

  async function carregarLojas() {
    const container = document.querySelector("[data-lojas]");

    try {
      const lojas = await fetchJson(`${API_BASE_URL}/loja`);

      const total = Array.isArray(lojas) ? lojas.length : 0;

      atualizarStat("lojas", total);

      if (!container) return;

      if (total === 0) {
        mostrarErro(container, "Nenhuma loja cadastrada ainda.");
        return;
      }

      container.innerHTML = lojas
        .map(
          (loja) => `
            <article class="store-card">
              <div class="store-icon">
                <img
                  src="../img/localizacao_icon.png"
                  alt="${escaparAtributo(loja.nome ?? "Loja")}"
                />
              </div>

              <div>
                <h3>${escaparHTML(loja.nome ?? "Loja")}</h3>

                <p>📞 ${escaparHTML(loja.telefone ?? "Telefone não informado")}</p>

                <p class="store-status">
                  🕒 ${escaparHTML(loja.horarioFuncionamento ?? "Horário não informado")}
                </p>
              </div>
            </article>`,
        )
        .join("");
    } catch (erro) {
      console.error("Falha ao carregar lojas:", erro);

      if (container) {
        mostrarErro(container, "Não foi possível carregar as lojas.");
      }
    }
  }
})();