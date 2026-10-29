(function () {
  const API_BASE_URL = "http://localhost:8080/api";
  const ICONE_PADRAO = "../img/medicamentos_icon.png";

  let todosProdutos = [];
  let produtosExibidos = [];
  let categorias = [];
  let promocoesAtivas = [];
  let categoriaSelecionada = null;
  let somentePromocoes = false;

  document.addEventListener("DOMContentLoaded", inicializar);

  async function inicializar() {
    categoriaSelecionada = obterCategoriaDaURL();
    somentePromocoes = obterModoPromocoesDaURL();

    if (
      ["promocao", "promocoes", "promoção", "promoções"].includes(
        normalizar(categoriaSelecionada),
      )
    ) {
      somentePromocoes = true;
      categoriaSelecionada = null;
    }

    configurarEventos();
    mostrarCarregando();
    await carregarDados();
  }

  // ---------------------------------------------------------
  // URL E NORMALIZAÇÃO
  // ---------------------------------------------------------

  function obterCategoriaDaURL() {
    return new URLSearchParams(window.location.search).get("categoria");
  }

  function obterBuscaDaURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("busca") || params.get("q") || "";
  }

  function obterModoPromocoesDaURL() {
    const params = new URLSearchParams(window.location.search);
    const valor = normalizar(
      params.get("promocao") || params.get("promocoes") || "",
    );

    return ["true", "1", "sim", "ativo", "promocao", "promocoes"].includes(
      valor,
    );
  }

  function normalizar(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  async function fetchJson(url) {
    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status} ao acessar ${url}`);
    }

    return resposta.json();
  }

  // ---------------------------------------------------------
  // CARREGAMENTO
  // ---------------------------------------------------------

  async function carregarDados() {
    try {
      const [produtosApi, categoriasApi, promocoesApi] = await Promise.all([
        fetchJson(`${API_BASE_URL}/produto`),
        fetchJson(`${API_BASE_URL}/categoria`),
        fetchJson(`${API_BASE_URL}/promocao`).catch((erro) => {
          console.warn("Não foi possível carregar promoções:", erro);
          return [];
        }),
      ]);

      todosProdutos = Array.isArray(produtosApi) ? produtosApi : [];
      categorias = Array.isArray(categoriasApi) ? categoriasApi : [];

      promocoesAtivas = (
        Array.isArray(promocoesApi) ? promocoesApi : []
      ).filter(promocaoEstaAtiva);

      renderizarCategorias();
      definirCategoriaAtual();
      preencherBuscaInicial();
      aplicarFiltros();
    } catch (erro) {
      console.error("Erro ao carregar produtos:", erro);
      mostrarErro("Não foi possível carregar os produtos.");
    }
  }

  function mostrarCarregando() {
    const grid = document.querySelector(".products-grid");

    if (grid) {
      grid.innerHTML = `
        <div class="sem-dados" style="grid-column:1/-1;padding:50px;text-align:center">
          <p>Carregando produtos...</p>
        </div>`;
    }

    const contador = document.querySelector(".products-count");
    if (contador) contador.textContent = "Carregando produtos...";

    const descricao = document.querySelector(".title-area p");
    if (descricao) descricao.textContent = "Carregando produtos...";
  }

  // ---------------------------------------------------------
  // CATEGORIAS
  // ---------------------------------------------------------

  function obterIdCategoriaObjeto(categoria) {
    return (
      categoria?.id ?? categoria?.idCategoria ?? categoria?.categoriaId ?? null
    );
  }

  function obterCategoriaSelecionada() {
    if (!categoriaSelecionada) return null;

    const selecionada = normalizar(categoriaSelecionada);

    return (
      categorias.find((categoria) => {
        const id = obterIdCategoriaObjeto(categoria);
        const nome = normalizar(
          categoria.nome ?? categoria.nomeCategoria ?? "",
        );

        return (
          String(id) === String(categoriaSelecionada) ||
          nome === selecionada ||
          (selecionada === "medicamentos" &&
            ["remedio", "medicamentos"].includes(nome))
        );
      }) || null
    );
  }

  function renderizarCategorias() {
    const container = document.querySelector("#filtrosCategorias");
    if (!container) return;

    if (!categorias.length) {
      container.innerHTML = `<p class="sem-dados">Nenhuma categoria encontrada.</p>`;
      return;
    }

    const categoriaAtual = obterCategoriaSelecionada();
    const idAtual = categoriaAtual
      ? obterIdCategoriaObjeto(categoriaAtual)
      : null;

    container.innerHTML = categorias
      .map((categoria) => {
        const id = obterIdCategoriaObjeto(categoria);
        const nome = categoria.nome ?? categoria.nomeCategoria ?? "Categoria";

        const marcada =
          !somentePromocoes &&
          idAtual !== null &&
          String(idAtual) === String(id);

        return `
        <label class="checkbox-label">
          <input
            type="checkbox"
            class="filtro-categoria"
            data-categoria-id="${escaparAtributo(id)}"
            ${marcada ? "checked" : ""}
          >
          <span>${escaparHTML(nome)}</span>
        </label>`;
      })
      .join("");

    container.querySelectorAll(".filtro-categoria").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          container.querySelectorAll(".filtro-categoria").forEach((outro) => {
            if (outro !== checkbox) outro.checked = false;
          });

          categoriaSelecionada = checkbox.dataset.categoriaId;
          somentePromocoes = false;
        } else {
          categoriaSelecionada = null;
        }

        atualizarURL();
        definirCategoriaAtual();
        aplicarFiltros();
      });
    });
  }

  function definirCategoriaAtual() {
    const titulo = document.querySelector(".page-header h1");
    const breadcrumbCategoria = document.querySelector("#breadcrumbCategoria");

    if (somentePromocoes) {
      if (titulo) titulo.textContent = "PROMOÇÕES";
      if (breadcrumbCategoria) {
        breadcrumbCategoria.textContent = "/ Promoções";
      }
      return;
    }

    if (!categoriaSelecionada) {
      if (titulo) titulo.textContent = "TODOS OS PRODUTOS";
      if (breadcrumbCategoria) breadcrumbCategoria.textContent = "";
      return;
    }

    const categoria = obterCategoriaSelecionada();

    if (!categoria) {
      if (titulo) titulo.textContent = "PRODUTOS";
      if (breadcrumbCategoria) breadcrumbCategoria.textContent = "";
      return;
    }

    const nome = categoria.nome ?? categoria.nomeCategoria ?? "Categoria";

    if (titulo) titulo.textContent = nome.toUpperCase();
    if (breadcrumbCategoria) {
      breadcrumbCategoria.textContent = `/ ${nome}`;
    }
  }

  // ---------------------------------------------------------
  // PROMOÇÕES
  // ---------------------------------------------------------

  function dataLocalISO() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
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

  function obterIdProdutoPromocao(promocao) {
    return (
      promocao?.idProduto ??
      promocao?.produto?.idProduto ??
      promocao?.produto?.id ??
      promocao?.produtoId ??
      null
    );
  }

  function obterPromocaoProduto(produto) {
    const idProduto = obterIdProduto(produto);

    if (idProduto == null) return null;

    return (
      promocoesAtivas.find(
        (promocao) =>
          String(obterIdProdutoPromocao(promocao)) === String(idProduto),
      ) || null
    );
  }

  function obterPrecoEfetivo(produto) {
    const promocao = obterPromocaoProduto(produto);
    const precoPromocional = Number(promocao?.precoPromocional);

    if (
      promocao &&
      Number.isFinite(precoPromocional) &&
      precoPromocional >= 0
    ) {
      return precoPromocional;
    }

    return Number(produto.precoProduto ?? produto.preco ?? 0);
  }

  // ---------------------------------------------------------
  // BUSCA E FILTROS
  // ---------------------------------------------------------

  function preencherBuscaInicial() {
    const busca = obterBuscaDaURL();
    const campoBusca = document.querySelector(".search-bar input");

    if (campoBusca && busca) {
      campoBusca.value = busca;
    }
  }

  function obterIdProduto(produto) {
    return produto?.idProduto ?? produto?.id ?? null;
  }

  function obterIdCategoriaProduto(produto) {
    return (
      produto?.idCategoria ??
      produto?.categoria?.id ??
      produto?.categoria?.idCategoria ??
      produto?.categoriaId ??
      null
    );
  }

  function aplicarFiltros() {
    let produtos = [...todosProdutos];

    if (somentePromocoes) {
      const idsPromocao = new Set(
        promocoesAtivas
          .map(obterIdProdutoPromocao)
          .filter((id) => id != null)
          .map(String),
      );

      produtos = produtos.filter((produto) =>
        idsPromocao.has(String(obterIdProduto(produto))),
      );
    } else if (categoriaSelecionada) {
      const categoria = obterCategoriaSelecionada();

      if (categoria) {
        const idCategoria = obterIdCategoriaObjeto(categoria);

        produtos = produtos.filter(
          (produto) =>
            String(obterIdCategoriaProduto(produto)) === String(idCategoria),
        );
      } else {
        produtos = [];
      }
    }

    const minimo = obterValorPreco(document.querySelector("#precoMin"));
    const maximo = obterValorPreco(document.querySelector("#precoMax"));

    if (minimo !== null) {
      produtos = produtos.filter(
        (produto) => obterPrecoEfetivo(produto) >= minimo,
      );
    }

    if (maximo !== null) {
      produtos = produtos.filter(
        (produto) => obterPrecoEfetivo(produto) <= maximo,
      );
    }

    const checkboxEstoque = document.querySelector("#filtroEstoque");

    if (checkboxEstoque?.checked) {
      produtos = produtos.filter(
        (produto) => produto.esgotado !== true && produto.disponivel !== false,
      );
    }

    const checkboxRetirada = document.querySelector("#filtroRetirada");

    if (checkboxRetirada?.checked) {
      produtos = produtos.filter(
        (produto) =>
          produto.retiradaSomenteLoja === true ||
          produto.retiradaSomenteLoja === 1 ||
          produto.retiradaSomente === true ||
          produto.retirada === true,
      );
    }

    const campoBusca = document.querySelector(".search-bar input");
    const termo = normalizar(campoBusca?.value ?? "");

    if (termo) {
      produtos = produtos.filter(
        (produto) =>
          normalizar(produto.nomeProduto ?? produto.nome).includes(termo) ||
          normalizar(produto.descricao).includes(termo),
      );
    }

    const selectOrdenacao = document.querySelector(".sort-select");
    const ordenacao = selectOrdenacao?.value || "relevancia";

    if (ordenacao === "menor-preco") {
      produtos.sort((a, b) => obterPrecoEfetivo(a) - obterPrecoEfetivo(b));
    } else if (ordenacao === "maior-preco") {
      produtos.sort((a, b) => obterPrecoEfetivo(b) - obterPrecoEfetivo(a));
    } else if (ordenacao === "nome") {
      produtos.sort((a, b) =>
        String(a.nomeProduto ?? a.nome ?? "").localeCompare(
          String(b.nomeProduto ?? b.nome ?? ""),
          "pt-BR",
        ),
      );
    }

    produtosExibidos = produtos;

    atualizarQuantidade(produtos.length);
    renderizarProdutos(produtos);
    renderizarFiltrosAtivos();
  }

  // ---------------------------------------------------------
  // RENDERIZAÇÃO DOS PRODUTOS
  // ---------------------------------------------------------

  function renderizarProdutos(produtos) {
    const container = document.querySelector(".products-grid");
    if (!container) return;

    if (!Array.isArray(produtos) || produtos.length === 0) {
      container.innerHTML = `
        <div class="sem-dados" style="grid-column:1/-1;padding:50px;text-align:center">
          <h3>Nenhum produto encontrado</h3>
          <p>Tente alterar os filtros ou pesquisar outro produto.</p>
        </div>`;
      return;
    }

    container.innerHTML = produtos.map(criarCardProduto).join("");
    adicionarEventosProdutos(container);
  }

  function criarCardProduto(produto) {
    const id = obterIdProduto(produto);
    const nome = produto.nomeProduto ?? produto.nome ?? "Produto";
    const precoOriginal = Number(produto.precoProduto ?? produto.preco ?? 0);
    const promocao = obterPromocaoProduto(produto);
    const precoEfetivo = obterPrecoEfetivo(produto);

    const temPromocao = Boolean(promocao && precoEfetivo < precoOriginal);

    const imagem = produto.imagemURL || produto.fotos || ICONE_PADRAO;

    const esgotado = produto.esgotado === true || produto.esgotado === 1;

    const disponivel = produto.disponivel !== false && produto.disponivel !== 0;

    const foraEstoque = esgotado || !disponivel;

    const receita =
      produto.necessitaReceita === true || produto.necessitaReceita === 1;

    return `
      <article
        class="product-card"
        data-produto-id="${escaparAtributo(id)}"
        style="cursor:pointer"
      >
        <div class="product-image-container">
          ${receita ? `<span class="badge-prescription">RECEITA</span>` : ""}

          ${temPromocao ? `<span class="badge-promocao">PROMOÇÃO</span>` : ""}

          <button
            type="button"
            class="btn-fav"
            data-favoritar
            aria-label="Favoritar produto"
          >
            <img src="../img/coracao_icon.png" alt="Favoritar">
          </button>

          <img
            src="${escaparAtributo(imagem)}"
            alt="${escaparAtributo(nome)}"
            onerror="this.onerror=null;this.src='${ICONE_PADRAO}'"
          >
        </div>

        <div class="product-info">
          <span class="stock-status ${foraEstoque ? "gray" : "green"}">
            <span class="status-dot"></span>
            ${foraEstoque ? "ESGOTADO" : "EM ESTOQUE"}
          </span>

          <div class="name-container">
            <h3>${escaparHTML(nome)}</h3>
          </div>

          <div class="price-container">
            ${
              temPromocao
                ? `<span class="price-original" style="text-decoration:line-through;opacity:.65;margin-right:8px">${formatarPreco(precoOriginal)}</span>`
                : ""
            }

            <span class="price">${formatarPreco(precoEfetivo)}</span>
          </div>

          ${
            foraEstoque
              ? `<button type="button" class="btn-notify">Avisar quando chegar</button>`
              : `<button type="button" class="btn-add-cart">Adicionar <img src="../img/carrinho_icon.png" alt=""></button>`
          }
        </div>
      </article>`;
  }

  function adicionarEventosProdutos(container) {
    container.querySelectorAll("[data-produto-id]").forEach((card) => {
      const botaoCarrinho = card.querySelector(".btn-add-cart");

      if (botaoCarrinho) {
        botaoCarrinho.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();

          await adicionarProdutoAoCarrinho(
            card.dataset.produtoId,
            botaoCarrinho,
          );
        });
      }

      card.addEventListener("click", (event) => {
        if (event.target.closest(".btn-fav, .btn-add-cart, .btn-notify")) {
          event.stopPropagation();
          return;
        }

        const id = card.dataset.produtoId;

        if (id) {
          window.location.href = `item.html?id=${encodeURIComponent(id)}`;
        }
      });
    });
  }

  // ---------------------------------------------------------
  // CARRINHO E NOTIFICAÇÕES
  // ---------------------------------------------------------

  function mostrarNotificacao(mensagem, tipo = "sucesso") {
    let container = document.querySelector(".toast-container");

    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "false");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;

    const icones = {
      sucesso: "✓",
      erro: "!",
      aviso: "!",
    };

    const icone = document.createElement("span");
    icone.className = "toast-icone";
    icone.textContent = icones[tipo] || "✓";
    icone.setAttribute("aria-hidden", "true");

    const texto = document.createElement("span");
    texto.className = "toast-mensagem";
    texto.textContent = mensagem;

    const fechar = document.createElement("button");
    fechar.className = "toast-fechar";
    fechar.type = "button";
    fechar.textContent = "×";
    fechar.setAttribute("aria-label", "Fechar notificação");

    toast.append(icone, texto, fechar);
    container.appendChild(toast);

    let removido = false;

    function removerNotificacao() {
      if (removido) return;

      removido = true;
      toast.classList.add("toast-saindo");

      setTimeout(() => {
        toast.remove();

        if (container.children.length === 0) {
          container.remove();
        }
      }, 250);
    }

    const temporizador = setTimeout(removerNotificacao, 3500);

    fechar.addEventListener("click", () => {
      clearTimeout(temporizador);
      removerNotificacao();
    });
  }

  async function adicionarProdutoAoCarrinho(idProduto, botao) {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) {
      mostrarNotificacao(
        "Você precisa estar logado para adicionar produtos ao carrinho.",
        "aviso",
      );

      window.location.href = "login.html";
      return;
    }

    let usuario;

    try {
      usuario = JSON.parse(usuarioSalvo);
    } catch (erro) {
      console.error("Erro ao ler usuarioLogado:", erro);

      localStorage.removeItem("usuarioLogado");

      mostrarNotificacao(
        "Sua sessão é inválida. Faça login novamente.",
        "aviso",
      );

      window.location.href = "login.html";
      return;
    }

    const idCliente = usuario.idCliente;

    if (!idCliente) {
      mostrarNotificacao("Não foi possível identificar o usuário.", "erro");
      return;
    }

    if (!idProduto) {
      mostrarNotificacao("Não foi possível identificar o produto.", "erro");
      return;
    }

    const textoOriginal = botao.innerHTML;

    try {
      botao.disabled = true;
      botao.textContent = "Adicionando...";

      const resposta = await fetch(`${API_BASE_URL}/carrinho`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          idCliente: Number(idCliente),
          idProduto: Number(idProduto),
          quantidade: 1,
        }),
      });

      if (!resposta.ok) {
        const texto = await resposta.text();

        console.error("Erro retornado pelo backend:", texto);

        throw new Error(`Erro ${resposta.status}`);
      }

      mostrarNotificacao("Produto adicionado ao carrinho!");
    } catch (erro) {
      console.error("Erro ao adicionar ao carrinho:", erro);

      mostrarNotificacao(
        "Não foi possível adicionar o produto ao carrinho.",
        "erro",
      );
    } finally {
      botao.disabled = false;
      botao.innerHTML = textoOriginal;
    }
  }

  // ---------------------------------------------------------
  // FILTROS ATIVOS
  // ---------------------------------------------------------

  function renderizarFiltrosAtivos() {
    const container = document.querySelector("#filtrosAtivos");
    if (!container) return;

    const filtros = [];

    if (somentePromocoes) {
      filtros.push("Promoções");
    } else if (categoriaSelecionada) {
      const categoria = obterCategoriaSelecionada();

      if (categoria) {
        filtros.push(
          `Categoria: ${categoria.nome ?? categoria.nomeCategoria ?? "Categoria"}`,
        );
      }
    }

    const termo = document.querySelector(".search-bar input")?.value?.trim();

    if (termo) {
      filtros.push(`Busca: ${termo}`);
    }

    const minimo = obterValorPreco(document.querySelector("#precoMin"));

    if (minimo !== null) {
      filtros.push(`A partir de ${formatarPreco(minimo)}`);
    }

    const maximo = obterValorPreco(document.querySelector("#precoMax"));

    if (maximo !== null) {
      filtros.push(`Até ${formatarPreco(maximo)}`);
    }

    if (document.querySelector("#filtroEstoque")?.checked) {
      filtros.push("Em estoque");
    }

    if (document.querySelector("#filtroRetirada")?.checked) {
      filtros.push("Só retirada na loja");
    }

    container.innerHTML = filtros
      .map(
        (filtro) => `<span class="filter-chip">${escaparHTML(filtro)}</span>`,
      )
      .join("");
  }

  // ---------------------------------------------------------
  // EVENTOS, BUSCA, URL E LIMPEZA
  // ---------------------------------------------------------

  function configurarEventos() {
    document
      .querySelector(".sort-select")
      ?.addEventListener("change", aplicarFiltros);

    const campoBusca = document.querySelector(".search-bar input");

    if (campoBusca) {
      campoBusca.addEventListener("input", aplicarFiltros);

      campoBusca.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          executarBusca();
        }
      });
    }

    document
      .querySelector("#btnBuscar")
      ?.addEventListener("click", executarBusca);

    document
      .querySelectorAll(".price-inputs input")
      .forEach((input) => input.addEventListener("input", aplicarFiltros));

    document
      .querySelector("#filtroEstoque")
      ?.addEventListener("change", aplicarFiltros);

    document
      .querySelector("#filtroRetirada")
      ?.addEventListener("change", aplicarFiltros);

    document
      .querySelector("#btnLimparFiltros")
      ?.addEventListener("click", limparFiltros);
  }

  function executarBusca() {
    const termo =
      document.querySelector(".search-bar input")?.value?.trim() || "";

    const url = new URL(window.location.href);

    if (termo) {
      url.searchParams.set("busca", termo);
    } else {
      url.searchParams.delete("busca");
      url.searchParams.delete("q");
    }

    window.history.replaceState({}, "", url);
    aplicarFiltros();
  }

  function atualizarURL() {
    const url = new URL(window.location.href);

    if (somentePromocoes) {
      url.searchParams.delete("categoria");
      url.searchParams.set("promocao", "true");
      url.searchParams.delete("promocoes");
    } else {
      url.searchParams.delete("promocao");
      url.searchParams.delete("promocoes");

      if (categoriaSelecionada) {
        url.searchParams.set("categoria", categoriaSelecionada);
      } else {
        url.searchParams.delete("categoria");
      }
    }

    window.history.replaceState({}, "", url);
  }

  function limparFiltros() {
    categoriaSelecionada = null;
    somentePromocoes = false;

    document
      .querySelectorAll(".sidebar-filters input[type='checkbox']")
      .forEach((checkbox) => {
        checkbox.checked = false;
      });

    document.querySelectorAll(".price-inputs input").forEach((input) => {
      input.value = "";
    });

    const busca = document.querySelector(".search-bar input");

    if (busca) {
      busca.value = "";
    }

    const url = new URL(window.location.href);

    ["categoria", "promocao", "promocoes", "busca", "q"].forEach((param) =>
      url.searchParams.delete(param),
    );

    window.history.replaceState({}, "", url);

    renderizarCategorias();
    definirCategoriaAtual();
    aplicarFiltros();
  }

  // ---------------------------------------------------------
  // UTILITÁRIOS
  // ---------------------------------------------------------

  function atualizarQuantidade(quantidade) {
    const texto = `${quantidade} produto(s) encontrado(s)`;

    const descricao = document.querySelector(".title-area p");
    if (descricao) descricao.textContent = texto;

    const contador = document.querySelector(".products-count");
    if (contador) contador.textContent = texto;
  }

  function obterValorPreco(input) {
    if (!input || !input.value.trim()) return null;

    const valor = Number(input.value.replace(",", ".").replace(/[^\d.]/g, ""));

    return Number.isNaN(valor) ? null : valor;
  }

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

  function mostrarErro(mensagem) {
    const container = document.querySelector(".products-grid");

    if (container) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px">
          <h3>Erro ao carregar produtos</h3>
          <p>${escaparHTML(mensagem)}</p>
        </div>`;
    }

    const descricao = document.querySelector(".title-area p");
    if (descricao) descricao.textContent = "Erro ao carregar produtos.";

    const contador = document.querySelector(".products-count");
    if (contador) contador.textContent = "Erro ao carregar produtos.";
  }
})();
