(function () {

  const API_BASE_URL = "http://localhost:8080/api";

  const ICONE_PADRAO = "../img/medicamentos_icon.png";

  let todosProdutos = [];
  let produtosExibidos = [];
  let categorias = [];

  let categoriaSelecionada = null;


  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  document.addEventListener("DOMContentLoaded", () => {

    inicializar();

  });


  async function inicializar() {

    categoriaSelecionada = obterCategoriaDaURL();

    configurarEventos();

    mostrarCarregando();

    await carregarDados();

  }


  // =========================================================
  // URL
  // =========================================================

  function obterCategoriaDaURL() {

    const params = new URLSearchParams(
      window.location.search
    );

    return params.get("categoria");

  }


  function obterBuscaDaURL() {

    const params = new URLSearchParams(
      window.location.search
    );

    return (
      params.get("busca") ||
      params.get("q") ||
      ""
    );

  }


  // =========================================================
  // API
  // =========================================================

  async function fetchJson(url) {

    const resposta = await fetch(url);

    if (!resposta.ok) {

      throw new Error(
        `Erro ${resposta.status} ao acessar ${url}`
      );

    }

    return resposta.json();

  }


  // =========================================================
  // CARREGAR DADOS
  // =========================================================

  async function carregarDados() {

    try {

      const [produtosApi, categoriasApi] =
        await Promise.all([

          fetchJson(
            `${API_BASE_URL}/produto`
          ),

          fetchJson(
            `${API_BASE_URL}/categoria`
          )

        ]);


      todosProdutos =
        Array.isArray(produtosApi)
          ? produtosApi
          : [];


      categorias =
        Array.isArray(categoriasApi)
          ? categoriasApi
          : [];


      console.log(
        "Produtos carregados:",
        todosProdutos
      );

      console.log(
        "Categorias carregadas:",
        categorias
      );


      renderizarCategorias();

      definirCategoriaAtual();

      preencherBuscaInicial();

      aplicarFiltros();

    } catch (erro) {

      console.error(
        "Erro ao carregar produtos:",
        erro
      );

      mostrarErro(
        "Não foi possível carregar os produtos."
      );

    }

  }


  // =========================================================
  // CARREGANDO
  // =========================================================

  function mostrarCarregando() {

    const grid =
      document.querySelector(".products-grid");

    if (grid) {

      grid.innerHTML = `
        <div
          class="sem-dados"
          style="
            grid-column: 1 / -1;
            padding: 50px;
            text-align: center;
          "
        >
          <p>Carregando produtos...</p>
        </div>
      `;

    }


    const contador =
      document.querySelector(".products-count");

    if (contador) {

      contador.textContent =
        "Carregando produtos...";

    }


    const descricao =
      document.querySelector(".title-area p");

    if (descricao) {

      descricao.textContent =
        "Carregando produtos...";

    }

  }


  // =========================================================
  // CATEGORIAS
  // =========================================================

  function renderizarCategorias() {

    const container =
      document.querySelector(
        "#filtrosCategorias"
      );

    if (!container) {

      console.warn(
        "Container #filtrosCategorias não encontrado."
      );

      return;

    }


    if (
      !Array.isArray(categorias) ||
      categorias.length === 0
    ) {

      container.innerHTML = `
        <p class="sem-dados">
          Nenhuma categoria encontrada.
        </p>
      `;

      return;

    }


    container.innerHTML =
      categorias
        .map((categoria) => {

          const id =
            categoria.id ??
            categoria.idCategoria;

          const nome =
            categoria.nome ??
            "Categoria";

          const marcada =
            categoriaSelecionada &&
            String(id) ===
            String(categoriaSelecionada);


          return `
            <label class="checkbox-label">

              <input
                type="checkbox"
                class="filtro-categoria"
                data-categoria-id="${id}"
                ${marcada ? "checked" : ""}
              >

              <span>
                ${escaparHTML(nome)}
              </span>

            </label>
          `;

        })
        .join("");


    // =======================================================
    // EVENTOS DAS CATEGORIAS
    // =======================================================

    container
      .querySelectorAll(
        ".filtro-categoria"
      )
      .forEach((checkbox) => {

        checkbox.addEventListener(
          "change",
          () => {

            const id =
              checkbox.dataset.categoriaId;


            if (checkbox.checked) {

              // Apenas uma categoria por vez
              container
                .querySelectorAll(
                  ".filtro-categoria"
                )
                .forEach((outro) => {

                  if (outro !== checkbox) {

                    outro.checked = false;

                  }

                });


              categoriaSelecionada = id;

            } else {

              categoriaSelecionada = null;

            }


            atualizarURL();

            definirCategoriaAtual();

            aplicarFiltros();

          }
        );

      });

  }


  // =========================================================
  // CATEGORIA ATUAL
  // =========================================================

  function definirCategoriaAtual() {

    const titulo =
      document.querySelector(
        ".page-header h1"
      );

    const descricao =
      document.querySelector(
        ".title-area p"
      );

    const breadcrumbCategoria =
      document.querySelector(
        "#breadcrumbCategoria"
      );


    // =======================================================
    // TODOS OS PRODUTOS
    // =======================================================

    if (!categoriaSelecionada) {

      if (titulo) {

        titulo.textContent =
          "TODOS OS PRODUTOS";

      }

      if (breadcrumbCategoria) {

        breadcrumbCategoria.textContent =
          "";

      }

      return;

    }


    // =======================================================
    // ENCONTRAR CATEGORIA
    // =======================================================

    const categoria =
      categorias.find((item) => {

        const id =
          item.id ??
          item.idCategoria;

        return (
          String(id) ===
          String(categoriaSelecionada)
        );

      });


    if (!categoria) {

      if (titulo) {

        titulo.textContent =
          "PRODUTOS";

      }

      if (breadcrumbCategoria) {

        breadcrumbCategoria.textContent =
          "";

      }

      return;

    }


    const nome =
      categoria.nome ??
      "Categoria";


    if (titulo) {

      titulo.textContent =
        nome.toUpperCase();

    }


    if (breadcrumbCategoria) {

      breadcrumbCategoria.textContent =
        `/ ${nome}`;

    }

  }


  // =========================================================
  // BUSCA INICIAL
  // =========================================================

  function preencherBuscaInicial() {

    const busca =
      obterBuscaDaURL();

    if (!busca) {
      return;
    }


    const campoBusca =
      document.querySelector(
        ".search-bar input"
      );


    if (campoBusca) {

      campoBusca.value = busca;

    }

  }


  // =========================================================
  // FILTROS
  // =========================================================

  function aplicarFiltros() {

    let produtos =
      [...todosProdutos];


    // =======================================================
    // CATEGORIA
    // =======================================================

    if (categoriaSelecionada) {

      produtos =
        produtos.filter((produto) => {

          const idCategoria =
            obterIdCategoria(produto);

          return (
            String(idCategoria) ===
            String(categoriaSelecionada)
          );

        });

    }


    // =======================================================
    // PREÇO MÍNIMO
    // =======================================================

    const campoMin =
      document.querySelector(
        "#precoMin"
      );


    const campoMax =
      document.querySelector(
        "#precoMax"
      );


    const minimo =
      obterValorPreco(campoMin);


    const maximo =
      obterValorPreco(campoMax);


    if (minimo !== null) {

      produtos =
        produtos.filter((produto) => {

          return (
            Number(
              produto.precoProduto || 0
            ) >= minimo
          );

        });

    }


    if (maximo !== null) {

      produtos =
        produtos.filter((produto) => {

          return (
            Number(
              produto.precoProduto || 0
            ) <= maximo
          );

        });

    }


    // =======================================================
    // EM ESTOQUE
    // =======================================================

    const checkboxEstoque =
      document.querySelector(
        "#filtroEstoque"
      );


    if (
      checkboxEstoque &&
      checkboxEstoque.checked
    ) {

      produtos =
        produtos.filter((produto) => {

          return (
            produto.esgotado !== true &&
            produto.disponivel !== false
          );

        });

    }


    // =======================================================
    // SÓ RETIRADA
    // =======================================================

    const checkboxRetirada =
      document.querySelector(
        "#filtroRetirada"
      );


    if (
      checkboxRetirada &&
      checkboxRetirada.checked
    ) {

      produtos =
        produtos.filter((produto) => {

          return (
            produto.retiradaSomente === true ||
            produto.retirada === true
          );

        });

    }


    // =======================================================
    // BUSCA
    // =======================================================

    const campoBusca =
      document.querySelector(
        ".search-bar input"
      );


    const termo =
      campoBusca?.value
        ?.trim()
        ?.toLowerCase() || "";


    if (termo) {

      produtos =
        produtos.filter((produto) => {

          const nome =
            String(
              produto.nomeProduto || ""
            ).toLowerCase();


          const descricao =
            String(
              produto.descricao || ""
            ).toLowerCase();


          return (
            nome.includes(termo) ||
            descricao.includes(termo)
          );

        });

    }


    // =======================================================
    // ORDENAÇÃO
    // =======================================================

    const selectOrdenacao =
      document.querySelector(
        ".sort-select"
      );


    const ordenacao =
      selectOrdenacao?.value ||
      "relevancia";


    if (
      ordenacao ===
      "menor-preco"
    ) {

      produtos.sort((a, b) => {

        return (
          Number(a.precoProduto || 0) -
          Number(b.precoProduto || 0)
        );

      });

    }


    else if (
      ordenacao ===
      "maior-preco"
    ) {

      produtos.sort((a, b) => {

        return (
          Number(b.precoProduto || 0) -
          Number(a.precoProduto || 0)
        );

      });

    }


    else if (
      ordenacao ===
      "nome"
    ) {

      produtos.sort((a, b) => {

        const nomeA =
          String(
            a.nomeProduto || ""
          );

        const nomeB =
          String(
            b.nomeProduto || ""
          );


        return nomeA.localeCompare(
          nomeB,
          "pt-BR"
        );

      });

    }


    produtosExibidos =
      produtos;


    atualizarQuantidade(
      produtos.length
    );


    renderizarProdutos(
      produtos
    );


    renderizarFiltrosAtivos();

  }


  // =========================================================
  // ID DA CATEGORIA DO PRODUTO
  // =========================================================

  function obterIdCategoria(
    produto
  ) {

    return (
      produto.idCategoria ??
      produto.categoria?.id ??
      produto.categoria?.idCategoria ??
      produto.categoriaId ??
      null
    );

  }


  // =========================================================
  // PRODUTOS
  // =========================================================

  function renderizarProdutos(
    produtos
  ) {

    const container =
      document.querySelector(
        ".products-grid"
      );


    if (!container) {

      console.warn(
        "Container .products-grid não encontrado."
      );

      return;

    }


    if (
      !Array.isArray(produtos) ||
      produtos.length === 0
    ) {

      container.innerHTML = `
        <div
          class="sem-dados"
          style="
            grid-column: 1 / -1;
            padding: 50px;
            text-align: center;
          "
        >

          <h3>
            Nenhum produto encontrado
          </h3>

          <p>
            Tente alterar os filtros ou pesquisar outro produto.
          </p>

        </div>
      `;

      return;

    }


    container.innerHTML =
      produtos
        .map(
          criarCardProduto
        )
        .join("");


    adicionarEventosProdutos(
      container
    );

  }


  // =========================================================
  // CARD
  // =========================================================

  function criarCardProduto(
    produto
  ) {

    const id =
      produto.idProduto ??
      produto.id;


    const nome =
      produto.nomeProduto ??
      "Produto";


    const preco =
      Number(
        produto.precoProduto || 0
      );


    const imagem =
      produto.imagemURL ||
      ICONE_PADRAO;


    const esgotado =
      produto.esgotado === true;


    const disponivel =
      produto.disponivel !== false;


    const foraEstoque =
      esgotado ||
      !disponivel;


    const receita =
      produto.necessitaReceita === true;


    return `
      <article
        class="product-card"
        data-produto-id="${id}"
        style="cursor: pointer;"
      >

        <div class="product-image-container">

          ${
            receita
              ? `
                <span class="badge-prescription">
                  RECEITA
                </span>
              `
              : ""
          }


          <button
            type="button"
            class="btn-fav"
            data-favoritar
          >

            <img
              src="../img/coracao_icon.png"
              alt="Favoritar"
            >

          </button>


          <img
            src="${escaparAtributo(imagem)}"
            alt="${escaparAtributo(nome)}"
            onerror="this.src='${ICONE_PADRAO}'"
          />

        </div>


        <div class="product-info">

          <span
            class="stock-status ${
              foraEstoque
                ? "gray"
                : "green"
            }"
          >

            <span class="status-dot"></span>

            ${
              foraEstoque
                ? "ESGOTADO"
                : "EM ESTOQUE"
            }

          </span>


          <h3>
            ${escaparHTML(nome)}
          </h3>


          <div class="price-container">

            <span class="price">
              ${formatarPreco(preco)}
            </span>

          </div>


          ${
            foraEstoque

              ? `

                <button
                  type="button"
                  class="btn-notify"
                >
                  Avisar quando chegar
                </button>

              `

              : `

                <button
                  type="button"
                  class="btn-add-cart"
                >

                  Adicionar

                  <img
                    src="../img/carrinho_icon.png"
                    alt=""
                  />

                </button>

              `

          }

        </div>

      </article>
    `;

  }


  // =========================================================
  // CLIQUE NOS PRODUTOS
  // =========================================================

  function adicionarEventosProdutos(
  container
) {

  const cards =
    container.querySelectorAll(
      "[data-produto-id]"
    );

  cards.forEach((card) => {

    // =======================================================
    // ADICIONAR AO CARRINHO
    // =======================================================

    const botaoCarrinho =
      card.querySelector(
        ".btn-add-cart"
      );

    if (botaoCarrinho) {

      botaoCarrinho.addEventListener(
        "click",
        async (event) => {

          event.preventDefault();
          event.stopPropagation();

          const idProduto =
            card.dataset.produtoId;

          await adicionarProdutoAoCarrinho(
            idProduto,
            botaoCarrinho
          );

        }
      );

    }


    // =======================================================
    // CLIQUE NO CARD
    // =======================================================

    card.addEventListener(
      "click",
      (event) => {

        if (
          event.target.closest(
            ".btn-fav"
          ) ||
          event.target.closest(
            ".btn-add-cart"
          ) ||
          event.target.closest(
            ".btn-notify"
          )
        ) {
          event.stopPropagation();
          return;
        }

        const id =
          card.dataset.produtoId;

        if (!id) {
          console.warn(
            "Produto sem ID:",
            card
          );
          return;
        }

        window.location.href =
          `item.html?id=${encodeURIComponent(id)}`;

      }
    );

  });

}

// =========================================================
// CARRINHO
// =========================================================

async function adicionarProdutoAoCarrinho(
  idProduto,
  botao
) {

  const usuarioSalvo =
    localStorage.getItem(
      "usuarioLogado"
    );

  // =======================================================
  // VERIFICAR LOGIN
  // =======================================================

  if (!usuarioSalvo) {

    alert(
      "Você precisa estar logado para adicionar produtos ao carrinho."
    );

    window.location.href =
      "login.html";

    return;
  }


  // =======================================================
  // LER USUÁRIO
  // =======================================================

  let usuario;

  try {

    usuario =
      JSON.parse(
        usuarioSalvo
      );

  } catch (erro) {

    console.error(
      "Erro ao ler usuarioLogado:",
      erro
    );

    localStorage.removeItem(
      "usuarioLogado"
    );

    alert(
      "Sua sessão é inválida. Faça login novamente."
    );

    window.location.href =
      "login.html";

    return;
  }


  // =======================================================
  // ID DO CLIENTE
  // =======================================================

  const idCliente =
    usuario.idCliente;

  if (!idCliente) {

    alert(
      "Não foi possível identificar o usuário."
    );

    return;
  }


  // =======================================================
  // ID DO PRODUTO
  // =======================================================

  if (!idProduto) {

    alert(
      "Não foi possível identificar o produto."
    );

    return;
  }


  // =======================================================
  // ADICIONAR
  // =======================================================

  const textoOriginal =
    botao.innerHTML;

  try {

    botao.disabled = true;

    botao.innerHTML =
      "Adicionando...";


    const resposta =
      await fetch(
        `${API_BASE_URL}/carrinho`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          credentials: "include",

          body: JSON.stringify({

            idCliente:
              Number(idCliente),

            idProduto:
              Number(idProduto),

            quantidade:
              1

          })
        }
      );


    // =====================================================
    // ERRO DO BACKEND
    // =====================================================

    if (!resposta.ok) {

      const texto =
        await resposta.text();

      console.error(
        "Erro retornado pelo backend:",
        texto
      );

      throw new Error(
        `Erro ${resposta.status}`
      );
    }


    // =====================================================
    // RESPOSTA
    // =====================================================

    let resultado = null;

    const contentType =
      resposta.headers.get(
        "content-type"
      );

    if (
      contentType &&
      contentType.includes(
        "application/json"
      )
    ) {

      resultado =
        await resposta.json();

    }


    console.log(
      "Produto adicionado ao carrinho:",
      resultado
    );


    alert(
      "Produto adicionado ao carrinho!"
    );


  } catch (erro) {

    console.error(
      "Erro ao adicionar ao carrinho:",
      erro
    );

    alert(
      "Não foi possível adicionar o produto ao carrinho."
    );


  } finally {

    botao.disabled =
      false;

    botao.innerHTML =
      textoOriginal;

  }

}

  // =========================================================
  // FILTROS ATIVOS
  // =========================================================

  function renderizarFiltrosAtivos() {

    const container =
      document.querySelector(
        "#filtrosAtivos"
      );


    if (!container) {
      return;
    }


    const filtros = [];


    // Categoria
    if (categoriaSelecionada) {

      const categoria =
        categorias.find((item) => {

          const id =
            item.id ??
            item.idCategoria;

          return (
            String(id) ===
            String(categoriaSelecionada)
          );

        });


      if (categoria) {

        filtros.push(
          `Categoria: ${categoria.nome}`
        );

      }

    }


    // Busca
    const campoBusca =
      document.querySelector(
        ".search-bar input"
      );


    const termo =
      campoBusca?.value?.trim();


    if (termo) {

      filtros.push(
        `Busca: ${termo}`
      );

    }


    // Preço mínimo
    const minimo =
      obterValorPreco(
        document.querySelector(
          "#precoMin"
        )
      );


    if (minimo !== null) {

      filtros.push(
        `A partir de ${formatarPreco(minimo)}`
      );

    }


    // Preço máximo
    const maximo =
      obterValorPreco(
        document.querySelector(
          "#precoMax"
        )
      );


    if (maximo !== null) {

      filtros.push(
        `Até ${formatarPreco(maximo)}`
      );

    }


    // Estoque
    const estoque =
      document.querySelector(
        "#filtroEstoque"
      );


    if (
      estoque &&
      estoque.checked
    ) {

      filtros.push(
        "Em estoque"
      );

    }


    if (filtros.length === 0) {

      container.innerHTML = "";

      return;

    }


    container.innerHTML =
      filtros
        .map(
          (filtro) => `
            <span class="filter-chip">
              ${escaparHTML(filtro)}
            </span>
          `
        )
        .join("");

  }


  // =========================================================
  // EVENTOS
  // =========================================================

  function configurarEventos() {

    // =======================================================
    // ORDENAÇÃO
    // =======================================================

    const select =
      document.querySelector(
        ".sort-select"
      );


    if (select) {

      select.addEventListener(
        "change",
        () => {

          aplicarFiltros();

        }
      );

    }


    // =======================================================
    // BUSCA
    // =======================================================

    const campoBusca =
      document.querySelector(
        ".search-bar input"
      );


    if (campoBusca) {

      campoBusca.addEventListener(
        "input",
        () => {

          aplicarFiltros();

        }
      );


      campoBusca.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key === "Enter"
          ) {

            event.preventDefault();

            executarBusca();

          }

        }
      );

    }


    // =======================================================
    // BOTÃO BUSCAR
    // =======================================================

    const botaoBusca =
      document.querySelector(
        "#btnBuscar"
      );


    if (botaoBusca) {

      botaoBusca.addEventListener(
        "click",
        () => {

          executarBusca();

        }
      );

    }


    // =======================================================
    // PREÇO
    // =======================================================

    const inputsPreco =
      document.querySelectorAll(
        ".price-inputs input"
      );


    inputsPreco.forEach((input) => {

      input.addEventListener(
        "input",
        () => {

          aplicarFiltros();

        }
      );

    });


    // =======================================================
    // ESTOQUE
    // =======================================================

    const estoque =
      document.querySelector(
        "#filtroEstoque"
      );


    if (estoque) {

      estoque.addEventListener(
        "change",
        () => {

          aplicarFiltros();

        }
      );

    }


    // =======================================================
    // RETIRADA
    // =======================================================

    const retirada =
      document.querySelector(
        "#filtroRetirada"
      );


    if (retirada) {

      retirada.addEventListener(
        "change",
        () => {

          aplicarFiltros();

        }
      );

    }


    // =======================================================
    // LIMPAR FILTROS
    // =======================================================

    const limpar =
      document.querySelector(
        "#btnLimparFiltros"
      );


    if (limpar) {

      limpar.addEventListener(
        "click",
        limparFiltros
      );

    }

  }


  // =========================================================
  // BUSCA
  // =========================================================

  function executarBusca() {

    const campoBusca =
      document.querySelector(
        ".search-bar input"
      );


    const termo =
      campoBusca?.value?.trim() || "";


    const url =
      new URL(
        window.location.href
      );


    if (termo) {

      url.searchParams.set(
        "busca",
        termo
      );

    } else {

      url.searchParams.delete(
        "busca"
      );

    }


    window.history.replaceState(
      {},
      "",
      url
    );


    aplicarFiltros();

  }


  // =========================================================
  // ATUALIZAR URL
  // =========================================================

  function atualizarURL() {

    const url =
      new URL(
        window.location.href
      );


    if (categoriaSelecionada) {

      url.searchParams.set(
        "categoria",
        categoriaSelecionada
      );

    } else {

      url.searchParams.delete(
        "categoria"
      );

    }


    window.history.replaceState(
      {},
      "",
      url
    );

  }


  // =========================================================
  // LIMPAR FILTROS
  // =========================================================

  function limparFiltros() {

    categoriaSelecionada = null;


    // Checkboxes
    document
      .querySelectorAll(
        ".sidebar-filters input[type='checkbox']"
      )
      .forEach((checkbox) => {

        checkbox.checked = false;

      });


    // Preços
    document
      .querySelectorAll(
        ".price-inputs input"
      )
      .forEach((input) => {

        input.value = "";

      });


    // Busca
    const busca =
      document.querySelector(
        ".search-bar input"
      );


    if (busca) {

      busca.value = "";

    }


    // URL
    const url =
      new URL(
        window.location.href
      );


    url.searchParams.delete(
      "categoria"
    );


    url.searchParams.delete(
      "busca"
    );


    url.searchParams.delete(
      "q"
    );


    window.history.replaceState(
      {},
      "",
      url
    );


    definirCategoriaAtual();

    aplicarFiltros();

  }


  // =========================================================
  // QUANTIDADE
  // =========================================================

  function atualizarQuantidade(
    quantidade
  ) {

    const texto =
      `${quantidade} produto(s) encontrado(s)`;


    const descricao =
      document.querySelector(
        ".title-area p"
      );


    if (descricao) {

      descricao.textContent =
        texto;

    }


    const contador =
      document.querySelector(
        ".products-count"
      );


    if (contador) {

      contador.textContent =
        texto;

    }

  }


  // =========================================================
  // PREÇO
  // =========================================================

  function obterValorPreco(
    input
  ) {

    if (
      !input ||
      !input.value.trim()
    ) {

      return null;

    }


    const valor =
      Number(
        input.value
          .replace(",", ".")
          .replace(/[^\d.]/g, "")
      );


    if (
      Number.isNaN(valor)
    ) {

      return null;

    }


    return valor;

  }


  // =========================================================
  // MOEDA
  // =========================================================

  function formatarPreco(
    valor
  ) {

    return Number(valor || 0)
      .toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );

  }


  // =========================================================
  // ESCAPAR HTML
  // =========================================================

  function escaparHTML(
    valor
  ) {

    const div =
      document.createElement(
        "div"
      );


    div.textContent =
      valor ?? "";


    return div.innerHTML;

  }


  // =========================================================
  // ESCAPAR ATRIBUTO
  // =========================================================

  function escaparAtributo(
    valor
  ) {

    return String(
      valor ?? ""
    )
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  }


  // =========================================================
  // ERRO
  // =========================================================

  function mostrarErro(
    mensagem
  ) {

    const container =
      document.querySelector(
        ".products-grid"
      );


    if (container) {

      container.innerHTML = `
        <div
          style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px;
          "
        >

          <h3>
            Erro ao carregar produtos
          </h3>

          <p>
            ${escaparHTML(mensagem)}
          </p>

        </div>
      `;

    }


    const descricao =
      document.querySelector(
        ".title-area p"
      );


    if (descricao) {

      descricao.textContent =
        "Erro ao carregar produtos.";

    }


    const contador =
      document.querySelector(
        ".products-count"
      );


    if (contador) {

      contador.textContent =
        "Erro ao carregar produtos.";

    }

  }

})();