(function () {

  const API_BASE_URL = "http://localhost:8080/api";
  const ICONE_PADRAO = "../img/produto_placeholder.png";
  const USER_STORAGE_KEY = "usuarioLogado";

  let produtoAtual = null;

  document.addEventListener("DOMContentLoaded", () => {
    inicializar();
  });


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function inicializar() {

    const id = obterIdProdutoDaURL();

    if (!id) {
      mostrarErro("Produto não informado.");
      return;
    }

    configurarQuantidade();
    configurarBotaoCarrinho();

    await carregarProduto(id);
  }


  /* =========================================================
     ID DO PRODUTO NA URL
  ========================================================= */

  function obterIdProdutoDaURL() {

    const params =
      new URLSearchParams(window.location.search);

    return params.get("id");
  }


  /* =========================================================
     FETCH
  ========================================================= */

  async function fetchJson(url) {

    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status}`);
    }

    return resposta.json();
  }


  /* =========================================================
     CARREGAR PRODUTO
  ========================================================= */

  async function carregarProduto(id) {

    try {

      produtoAtual = await fetchJson(
        `${API_BASE_URL}/produto/${id}`
      );

      /*
       * Busca a promoção do produto.
       * Se não existir promoção, retorna null.
       */
      const promocao =
        await buscarPromocaoDoProduto(produtoAtual);

      produtoAtual.promocao = promocao;

      preencherProduto(produtoAtual);

      carregarProdutosRelacionados(produtoAtual);

    } catch (erro) {

      console.error(
        "Erro ao carregar produto:",
        erro
      );

      mostrarErro(
        "Não foi possível carregar este produto."
      );
    }
  }


  /* =========================================================
     PREENCHER PRODUTO
  ========================================================= */

  function preencherProduto(produto) {

    const nome =
      produto.nomeProduto ?? "Produto";

    const precoNormal =
      Number(produto.precoProduto || 0);

    const promocao =
      produto.promocao;

    const temPromocao =
      promocao !== null &&
      promocao !== undefined;

    const precoAtual =
      temPromocao
        ? Number(promocao.precoPromocional)
        : precoNormal;

    const descricao =
      produto.descricao ??
      "Descrição não informada.";

    const imagem =
      produto.imagemURL ||
      ICONE_PADRAO;


    document.title =
      `${nome} · Drogaria Popular Ponte Alta`;


    preencherTexto(
      "[data-produto-nome]",
      nome
    );


    preencherTexto(
      "[data-produto-nome-breadcrumb]",
      nome
    );


    preencherTexto(
      "[data-produto-preco-atual]",
      formatarPreco(precoAtual)
    );


    preencherTexto(
      "[data-produto-descricao]",
      descricao
    );


    /*
     * Configura promoção.
     *
     * Se não houver promoção:
     * - esconde badge
     * - esconde preço antigo
     *
     * Se houver:
     * - mostra percentual
     * - mostra preço antigo
     */
    configurarPromocao(
      precoNormal,
      promocao
    );


    const imagemPrincipal =
      document.querySelector(
        "[data-produto-imagem-principal]"
      );


    if (imagemPrincipal) {

      imagemPrincipal.src = imagem;
      imagemPrincipal.alt = nome;

      imagemPrincipal.onerror = () => {
        imagemPrincipal.src = ICONE_PADRAO;
      };
    }


    preencherCategoria(produto);


    preencherTexto(
      "[data-produto-sku]",
      produto.idProduto
        ? `#${produto.idProduto}`
        : "-"
    );


    const tipo =
      produto.medicamentoControlado
        ? "Medicamento controlado"
        : "Produto";


    preencherTexto(
      "[data-produto-tipo]",
      tipo
    );


    preencherBadges(produto);

    configurarGaleria(imagem);
  }


  /* =========================================================
     PROMOÇÕES
  ========================================================= */

  async function buscarPromocaoDoProduto(produto) {

    try {

      const promocoes =
        await fetchJson(
          `${API_BASE_URL}/promocao`
        );


      if (!Array.isArray(promocoes)) {
        return null;
      }


      const idProduto =
        produto.idProduto ??
        produto.id;


      const agora = new Date();


      const promocaoValida =
        promocoes.find((promocao) => {

          if (!promocao) {
            return false;
          }


          /*
           * O produto pode vir com:
           *
           * produto.idProduto
           *
           * ou
           *
           * produto.id
           */
          const idProdutoPromocao =
            promocao.produto?.idProduto ??
            promocao.produto?.id;


          if (
            String(idProdutoPromocao) !==
            String(idProduto)
          ) {
            return false;
          }


          if (
            promocao.precoPromocional === null ||
            promocao.precoPromocional === undefined
          ) {
            return false;
          }


          if (
            !promocao.dataInicio ||
            !promocao.dataFim
          ) {
            return false;
          }


          /*
           * Backend usa LocalDate:
           *
           * YYYY-MM-DD
           *
           * A promoção começa às 00:00
           * e termina às 23:59:59.
           */

          const inicio =
            new Date(
              `${promocao.dataInicio}T00:00:00`
            );


          const fim =
            new Date(
              `${promocao.dataFim}T23:59:59`
            );


          return (
            agora >= inicio &&
            agora <= fim
          );
        });


      return promocaoValida ?? null;

    } catch (erro) {

      /*
       * Se a API de promoção falhar,
       * o produto continua funcionando
       * com preço normal.
       */
      console.warn(
        "Não foi possível carregar as promoções:",
        erro
      );

      return null;
    }
  }


  function configurarPromocao(
    precoNormal,
    promocao
  ) {

    const badge =
      document.querySelector(
        "[data-produto-badge-promo]"
      );


    const precoAntigo =
      document.querySelector(
        "[data-produto-preco-antigo]"
      );


    /*
     * Não existe promoção.
     */
    if (!promocao) {

      if (badge) {
        badge.hidden = true;
        badge.textContent = "";
      }


      if (precoAntigo) {
        precoAntigo.hidden = true;
        precoAntigo.textContent = "";
      }

      return;
    }


    const precoPromocional =
      Number(
        promocao.precoPromocional
      );


    /*
     * Proteção contra promoção inválida.
     *
     * A promoção não pode ser igual
     * ou maior que o preço normal.
     */
    if (
      !Number.isFinite(precoPromocional) ||
      precoPromocional <= 0 ||
      precoPromocional >= precoNormal
    ) {

      if (badge) {
        badge.hidden = true;
        badge.textContent = "";
      }


      if (precoAntigo) {
        precoAntigo.hidden = true;
        precoAntigo.textContent = "";
      }

      return;
    }


    /*
     * Calcula o percentual.
     *
     * Exemplo:
     *
     * R$ 10,00 -> R$ 7,00
     *
     * desconto = 30%
     */
    const percentual =
      Math.round(
        (
          (precoNormal - precoPromocional) /
          precoNormal
        ) * 100
      );


    /*
     * Badge da promoção.
     */
    if (badge) {

      badge.hidden = false;

      badge.textContent =
        `-${percentual}%`;
    }


    /*
     * Preço antigo.
     */
    if (precoAntigo) {

      precoAntigo.hidden = false;

      precoAntigo.textContent =
        formatarPreco(precoNormal);
    }
  }


  /* =========================================================
     CATEGORIA
  ========================================================= */

  async function preencherCategoria(produto) {

    const elemento =
      document.querySelector(
        "[data-produto-categoria]"
      );


    if (!elemento) {
      return;
    }


    if (!produto.idCategoria) {

      elemento.textContent =
        "Farmácia";

      return;
    }


    try {

      const categoria =
        await fetchJson(
          `${API_BASE_URL}/categoria/${produto.idCategoria}`
        );


      elemento.textContent =
        categoria.nome ??
        "Farmácia";

    } catch (erro) {

      console.warn(
        "Não foi possível carregar a categoria:",
        erro
      );


      elemento.textContent =
        "Farmácia";
    }
  }


  /* =========================================================
     BADGES
  ========================================================= */

  function preencherBadges(produto) {

    const container =
      document.querySelector(
        "[data-produto-badges]"
      );


    if (!container) {
      return;
    }


    const badges = [];


    if (produto.esgotado) {

      badges.push(`
        <span class="badge badge-estoque">
          <img
            src="../img/info_icon.png"
            alt=""
          />
          Esgotado
        </span>
      `);

    } else if (produto.disponivel === false) {

      badges.push(`
        <span class="badge badge-estoque">
          <img
            src="../img/info_icon.png"
            alt=""
          />
          Indisponível
        </span>
      `);

    } else {

      badges.push(`
        <span class="badge badge-estoque">
          <img
            src="../img/check_icon.png"
            alt=""
          />
          Em estoque
        </span>
      `);
    }


    if (produto.necessitaReceita) {

      badges.push(`
        <span class="badge">
          <img
            src="../img/info_icon.png"
            alt=""
          />
          Receita necessária
        </span>
      `);
    }


    if (produto.medicamentoControlado) {

      badges.push(`
        <span class="badge">
          <img
            src="../img/info_icon.png"
            alt=""
          />
          Medicamento controlado
        </span>
      `);
    }


    container.innerHTML =
      badges.join("");
  }


  /* =========================================================
     GALERIA
  ========================================================= */

  function configurarGaleria(imagem) {

    const galeria =
      document.querySelector(
        "[data-produto-galeria]"
      );


    const principal =
      document.querySelector(
        "[data-produto-imagem-principal]"
      );


    if (!galeria || !principal) {
      return;
    }


    galeria.innerHTML = `
      <button
        class="thumb active"
        type="button"
      >
        <img
          src="${imagem}"
          alt="Miniatura do produto"
          onerror="this.src='${ICONE_PADRAO}'"
        />
      </button>
    `;


    const thumb =
      galeria.querySelector(".thumb");


    if (thumb) {

      thumb.addEventListener(
        "click",
        () => {

          principal.src =
            imagem;


          galeria
            .querySelectorAll(".thumb")
            .forEach((item) => {

              item.classList.remove(
                "active"
              );
            });


          thumb.classList.add(
            "active"
          );
        }
      );
    }
  }


  /* =========================================================
     QUANTIDADE
  ========================================================= */

  function configurarQuantidade() {

    const input =
      document.querySelector(
        "[data-qty-input]"
      );


    const menos =
      document.querySelector(
        "[data-qty-menos]"
      );


    const mais =
      document.querySelector(
        "[data-qty-mais]"
      );


    if (!input) {
      return;
    }


    input.addEventListener(
      "input",
      () => {

        let valor =
          parseInt(
            input.value.replace(/\D/g, ""),
            10
          );


        if (!valor || valor < 1) {
          valor = 1;
        }


        input.value =
          valor;
      }
    );


    if (menos) {

      menos.addEventListener(
        "click",
        () => {

          let valor =
            parseInt(
              input.value,
              10
            ) || 1;


          if (valor > 1) {
            valor--;
          }


          input.value =
            valor;
        }
      );
    }


    if (mais) {

      mais.addEventListener(
        "click",
        () => {

          let valor =
            parseInt(
              input.value,
              10
            ) || 1;


          valor++;


          input.value =
            valor;
        }
      );
    }
  }


  /* =========================================================
     CONFIGURAR BOTÃO CARRINHO
  ========================================================= */

  function configurarBotaoCarrinho() {

    const botao =
      document.querySelector(
        "[data-btn-add-carrinho]"
      );


    if (!botao) {
      return;
    }


    botao.addEventListener(
      "click",
      adicionarAoCarrinho
    );
  }


  /* =========================================================
     ADICIONAR AO CARRINHO
  ========================================================= */

  async function adicionarAoCarrinho() {

    if (!produtoAtual) {

      alert(
        "Produto ainda não carregado."
      );

      return;
    }


    /*
     * USUÁRIO LOGADO
     */

    const usuarioSalvo =
      localStorage.getItem(
        USER_STORAGE_KEY
      );


    if (!usuarioSalvo) {

      alert(
        "Você precisa estar logado para adicionar produtos ao carrinho."
      );


      window.location.href =
        "login.html";


      return;
    }


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
        USER_STORAGE_KEY
      );


      alert(
        "Sua sessão é inválida. Faça login novamente."
      );


      window.location.href =
        "login.html";


      return;
    }


    /*
     * ID CLIENTE
     */

    const idCliente =
      usuario.idCliente;


    if (!idCliente) {

      alert(
        "Não foi possível identificar o usuário."
      );

      return;
    }


    /*
     * ID PRODUTO
     */

    const idProduto =
      produtoAtual.idProduto ??
      produtoAtual.id;


    if (!idProduto) {

      alert(
        "Não foi possível identificar o produto."
      );

      return;
    }


    /*
     * QUANTIDADE
     */

    const input =
      document.querySelector(
        "[data-qty-input]"
      );


    const quantidade =
      parseInt(
        input?.value,
        10
      ) || 1;


    /*
     * BOTÃO
     */

    const botao =
      document.querySelector(
        "[data-btn-add-carrinho]"
      );


    const textoOriginal =
      botao
        ? botao.innerHTML
        : "";


    /*
     * POST /api/carrinho
     */

    try {

      if (botao) {

        botao.disabled =
          true;

        botao.innerHTML =
          "Adicionando...";
      }


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
                idCliente,

              idProduto:
                Number(idProduto),

              quantidade:
                quantidade
            })
          }
        );


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


      const resultado =
        await resposta.json();


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

      if (botao) {

        botao.disabled =
          false;

        botao.innerHTML =
          textoOriginal;
      }
    }
  }


  /* =========================================================
     PRODUTOS RELACIONADOS
  ========================================================= */

  async function carregarProdutosRelacionados(produto) {

    const container =
      document.querySelector(
        "[data-produtos-relacionados]"
      );


    if (!container) {
      return;
    }


    try {

      const produtos =
        await fetchJson(
          `${API_BASE_URL}/produto`
        );


      if (!Array.isArray(produtos)) {

        container.innerHTML =
          "";

        return;
      }


      const idAtual =
        produto.idProduto ??
        produto.id;


      const relacionados =
        produtos

          .filter((item) => {

            const id =
              item.idProduto ??
              item.id;


            return (
              String(id) !==
              String(idAtual)
            );
          })


          .filter((item) => {

            if (!produto.idCategoria) {
              return true;
            }


            return (
              item.idCategoria ===
              produto.idCategoria
            );
          })


          .slice(0, 4);


      if (
        relacionados.length === 0
      ) {

        container.innerHTML = `
          <p class="sem-dados">
            Nenhum produto relacionado encontrado.
          </p>
        `;

        return;
      }


      container.innerHTML =
        relacionados
          .map(criarCardRelacionado)
          .join("");


      adicionarEventosRelacionados(
        container
      );


    } catch (erro) {

      console.error(
        "Erro ao carregar relacionados:",
        erro
      );


      container.innerHTML = `
        <p class="sem-dados">
          Não foi possível carregar produtos relacionados.
        </p>
      `;
    }
  }


  function criarCardRelacionado(produto) {

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


  function adicionarEventosRelacionados(
    container
  ) {

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


          if (!id) {
            return;
          }


          window.location.href =
            `item.html?id=${encodeURIComponent(id)}`;
        }
      );
    });
  }


  /* =========================================================
     UTILIDADES
  ========================================================= */

  function preencherTexto(
    seletor,
    valor
  ) {

    const elemento =
      document.querySelector(
        seletor
      );


    if (elemento) {

      elemento.textContent =
        valor ?? "";
    }
  }


  function formatarPreco(valor) {

    return Number(valor || 0)
      .toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );
  }


  function escaparHTML(valor) {

    const div =
      document.createElement(
        "div"
      );


    div.textContent =
      valor ?? "";


    return div.innerHTML;
  }


  /* =========================================================
     ERRO
  ========================================================= */

  function mostrarErro(mensagem) {

    const main =
      document.querySelector(
        "main"
      );


    if (!main) {
      return;
    }


    main.innerHTML = `
      <div
        class="section-container"
        style="
          padding: 80px 20px;
          text-align: center;
        "
      >

        <h2>
          Produto não encontrado
        </h2>

        <p>
          ${escaparHTML(mensagem)}
        </p>

        <a
          href="produtos.html"
          class="btn-primary"
        >
          Voltar para produtos
        </a>

      </div>
    `;
  }

})();