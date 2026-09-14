const API_CARRINHO =
  "http://localhost:8080/api/carrinho";

const API_PRODUTO =
  "http://localhost:8080/api/produto";

const API_PEDIDO =
  "http://localhost:8080/api/pedido";

const API_AUTH =
  "http://localhost:8080/api/auth";

const STORAGE_USUARIO =
  "usuarioLogado";

const STORAGE_CHECKOUT =
  "checkoutCarrinho";

// =========================================================
// USUÁRIO
// =========================================================

let clienteLogado = null;

try {

  clienteLogado = JSON.parse(
    localStorage.getItem(STORAGE_USUARIO)
  );

} catch (erro) {

  console.error(
    "Erro ao ler usuarioLogado:",
    erro
  );
}

const ID_CLIENTE =
  clienteLogado?.idCliente ??
  clienteLogado?.idUsuario;


// =========================================================
// ELEMENTOS
// =========================================================

const listaRevisao =
  document.getElementById(
    "listaRevisaoPedido"
  );

const subtotalEl =
  document.getElementById(
    "checkoutSubtotal"
  );

const descontoEl =
  document.getElementById(
    "checkoutDesconto"
  );

const freteEl =
  document.getElementById(
    "checkoutFrete"
  );

const totalEl =
  document.getElementById(
    "checkoutTotal"
  );

const btnConfirmar =
  document.getElementById(
    "btnConfirmarPedido"
  );

const listaLojas =
  document.getElementById(
    "listaLojas"
  );


// =========================================================
// ESTADO
// =========================================================

let carrinhoItens = [];

let tipoEntrega = "retirada";

let formaPagamento = "pix";

let lojaSelecionada =
  "Ponte Alta Norte";

let desconto = 0;

// Valor provisório do frete.
const VALOR_FRETE_ENTREGA = 10;


// =========================================================
// CSRF
// =========================================================

let tokenCsrf = null;

function obterTokenCsrf() {

  // Primeiro tenta usar o token
  // recebido pelo endpoint /csrf.
  if (tokenCsrf) {
    return tokenCsrf;
  }

  // Fallback: tenta pegar pelo cookie
  // XSRF-TOKEN.
  const cookie =
    document.cookie
      .split("; ")
      .find((cookie) =>
        cookie.startsWith("XSRF-TOKEN=")
      );

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(
    cookie.substring(
      "XSRF-TOKEN=".length
    )
  );
}

function csrfHeaders() {

  const token =
    obterTokenCsrf();

  if (!token) {
    return {};
  }

  return {
    "X-XSRF-TOKEN": token
  };
}

async function prepararCsrf() {

  try {

    const res =
      await fetch(
        `${API_AUTH}/csrf`,
        {
          method: "GET",
          credentials: "include"
        }
      );

    console.log(
      "Preparação CSRF:",
      res.status
    );

    if (!res.ok) {

      console.warn(
        "Não foi possível preparar o CSRF."
      );

      return false;
    }

    /*
     * O endpoint /csrf agora retorna:
     *
     * {
     *   "token": "..."
     * }
     */

    const dados =
      await res.json();

    console.log(
      "Resposta CSRF:",
      dados
    );

    if (dados?.token) {

      tokenCsrf =
        dados.token;

      console.log(
        "Token CSRF obtido com sucesso."
      );

      return true;
    }

    /*
     * Fallback caso o token também
     * esteja sendo enviado pelo cookie.
     */

    const tokenCookie =
      obterTokenCsrf();

    if (tokenCookie) {

      tokenCsrf =
        tokenCookie;

      console.log(
        "Token CSRF obtido pelo cookie."
      );

      return true;
    }

    console.warn(
      "Backend respondeu, mas nenhum token CSRF foi encontrado."
    );

    return false;

  } catch (erro) {

    console.error(
      "Erro ao preparar CSRF:",
      erro
    );

    return false;
  }
}


// =========================================================
// INICIALIZAÇÃO
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    inicializarCheckout();
  }
);


// =========================================================
// INICIALIZAR
// =========================================================

async function inicializarCheckout() {

  if (!ID_CLIENTE) {

    alert(
      "Você precisa estar logado para finalizar o pedido."
    );

    window.location.href =
      "login.html";

    return;
  }

  await prepararCsrf();

  configurarEntrega();

  configurarPagamento();

  configurarLojas();

  configurarConfirmacao();

  await carregarCarrinho();
}


// =========================================================
// CARREGAR CARRINHO
// =========================================================

async function carregarCarrinho() {

  try {

    const res =
      await fetch(
        `${API_CARRINHO}/${ID_CLIENTE}`,
        {
          credentials: "include",
          headers: csrfHeaders()
        }
      );

    if (!res.ok) {

      if (res.status === 401) {

        throw new Error(
          "O servidor não reconheceu sua sessão. Faça login novamente."
        );
      }

      if (res.status === 403) {

        throw new Error(
          "Acesso negado ao carrinho."
        );
      }

      throw new Error(
        "Não foi possível carregar o carrinho."
      );
    }

    const itensRaw =
      await res.json();

    if (!Array.isArray(itensRaw)) {

      carrinhoItens = [];

      renderizarCheckout();

      return;
    }

    // Apenas produtos que realmente serão comprados
    carrinhoItens =
      itensRaw.filter(
        (item) =>
          !Number(
            item.salvoParaDepois ?? 0
          )
      );

    await renderizarCheckout();

  } catch (erro) {

    console.error(
      "Erro ao carregar checkout:",
      erro
    );

    if (listaRevisao) {

      listaRevisao.innerHTML = `
        <li class="checkout-erro">
          ${escaparHTML(
            erro.message ||
              "Não foi possível carregar os itens do pedido."
          )}
        </li>
      `;
    }

    if (btnConfirmar) {
      btnConfirmar.disabled = true;
    }
  }
}


// =========================================================
// RENDERIZAR CHECKOUT
// =========================================================

async function renderizarCheckout() {

  if (
    !Array.isArray(carrinhoItens) ||
    carrinhoItens.length === 0
  ) {

    if (listaRevisao) {

      listaRevisao.innerHTML = `
        <li class="checkout-vazio">
          Seu carrinho está vazio.
        </li>
      `;
    }

    atualizarResumo();

    if (btnConfirmar) {
      btnConfirmar.disabled = true;
    }

    return;
  }

  const itensComProduto =
    await Promise.all(
      carrinhoItens.map(
        async (item) => {

          let produto = {};

          try {

            const res =
              await fetch(
                `${API_PRODUTO}/${item.idProduto}`
              );

            if (res.ok) {

              produto =
                await res.json();
            }

          } catch (erro) {

            console.error(
              "Erro ao buscar produto:",
              item.idProduto,
              erro
            );
          }

          return {

            ...item,

            nomeProduto:
              produto.nomeProduto ||
              "Produto indisponível",

            precoProduto:
              Number(
                produto.precoProduto || 0
              ),

            imagemURL:
              produto.imagemURL ||
              null
          };
        }
      )
    );

  carrinhoItens =
    itensComProduto;

  if (listaRevisao) {

    listaRevisao.innerHTML =
      carrinhoItens
        .map(criarItemRevisao)
        .join("");
  }

  atualizarResumo();

  if (btnConfirmar) {
    btnConfirmar.disabled = false;
  }
}


// =========================================================
// ITEM DA REVISÃO
// =========================================================

function criarItemRevisao(item) {

  const quantidade =
    Number(item.quantidade || 0);

  const preco =
    Number(item.precoProduto || 0);

  const total =
    quantidade * preco;

  return `
    <li>

      <span>

        ${quantidade}x

        ${escaparHTML(
          item.nomeProduto
        )}

      </span>

      <span>

        ${formatarPreco(total)}

      </span>

    </li>
  `;
}


// =========================================================
// RESUMO
// =========================================================

function atualizarResumo() {

  const subtotal =
    carrinhoItens.reduce(
      (acumulado, item) => {

        return (
          acumulado +
          Number(
            item.precoProduto || 0
          ) *
            Number(
              item.quantidade || 0
            )
        );
      },
      0
    );

  const frete =
    tipoEntrega === "entrega"
      ? VALOR_FRETE_ENTREGA
      : 0;

  const total =
    Math.max(
      0,
      subtotal -
        desconto +
        frete
    );

  if (subtotalEl) {

    subtotalEl.textContent =
      formatarPreco(subtotal);
  }

  if (descontoEl) {

    descontoEl.textContent =
      desconto > 0
        ? `-${formatarPreco(
            desconto
          )}`
        : formatarPreco(0);
  }

  if (freteEl) {

    freteEl.textContent =
      tipoEntrega === "retirada"
        ? "Grátis (retirada)"
        : formatarPreco(frete);
  }

  if (totalEl) {

    totalEl.textContent =
      formatarPreco(total);
  }
}


// =========================================================
// ENTREGA
// =========================================================

function configurarEntrega() {

  const opcoes =
    document.querySelectorAll(
      'input[name="delivery"]'
    );

  opcoes.forEach((radio) => {

    radio.addEventListener(
      "change",
      () => {

        if (!radio.checked) {
          return;
        }

        tipoEntrega =
          radio.value;

        atualizarInterfaceEntrega();

        atualizarResumo();
      }
    );
  });

  atualizarInterfaceEntrega();
}


// =========================================================
// INTERFACE ENTREGA
// =========================================================

function atualizarInterfaceEntrega() {

  if (!listaLojas) {
    return;
  }

  if (
    tipoEntrega === "retirada"
  ) {

    listaLojas.style.display =
      "";

    return;
  }

  listaLojas.style.display =
    "none";
}


// =========================================================
// LOJAS
// =========================================================

function configurarLojas() {

  const lojas =
    document.querySelectorAll(
      'input[name="store"]'
    );

  lojas.forEach((radio) => {

    radio.addEventListener(
      "change",
      () => {

        if (radio.checked) {

          lojaSelecionada =
            radio.value;
        }
      }
    );
  });
}


// =========================================================
// PAGAMENTO
// =========================================================

function configurarPagamento() {

  const opcoes =
    document.querySelectorAll(
      'input[name="payment"]'
    );

  opcoes.forEach((radio) => {

    radio.addEventListener(
      "change",
      () => {

        if (radio.checked) {

          formaPagamento =
            radio.value;
        }
      }
    );
  });
}


// =========================================================
// CONFIRMAR
// =========================================================

function configurarConfirmacao() {

  if (!btnConfirmar) {
    return;
  }

  btnConfirmar.addEventListener(
    "click",
    abrirModalConfirmacao
  );
}


// =========================================================
// ABRIR MODAL
// =========================================================

function abrirModalConfirmacao() {

  if (!carrinhoItens.length) {

    alert(
      "Seu carrinho está vazio."
    );

    return;
  }

  const total =
    calcularTotal();

  const modal =
    document.createElement("div");

  modal.className =
    "modal-confirmacao-overlay";

  modal.innerHTML = `
    <div
      class="modal-confirmacao"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tituloConfirmacao"
    >

      <button
        type="button"
        class="modal-fechar"
        id="modalFechar"
        aria-label="Fechar"
      >
        ×
      </button>

      <div class="modal-icone">
        <span>✓</span>
      </div>

      <div class="modal-conteudo">

        <p class="modal-etapa">
          ÚLTIMA ETAPA
        </p>

        <h2 id="tituloConfirmacao">
          Tudo pronto! 🛍️
        </h2>

        <p class="modal-descricao">
          Confira os detalhes abaixo antes
          de confirmar seu pedido.
        </p>

        <div class="modal-resumo">

          <div class="modal-resumo-item">

            <span>Itens</span>

            <strong>

              ${calcularQuantidadeItens()}

              ${
                calcularQuantidadeItens() === 1
                  ? "item"
                  : "itens"
              }

            </strong>

          </div>

          <div class="modal-resumo-item">

            <span>Recebimento</span>

            <strong>

              ${
                tipoEntrega === "retirada"
                  ? `Retirada · ${escaparHTML(
                      lojaSelecionada
                    )}`
                  : "Entrega em casa"
              }

            </strong>

          </div>

          <div class="modal-resumo-item">

            <span>Pagamento</span>

            <strong>
              ${nomeFormaPagamento()}
            </strong>

          </div>

          <div class="modal-total">

            <span>Total do pedido</span>

            <strong>
              ${formatarPreco(total)}
            </strong>

          </div>

        </div>

        <p class="modal-aviso">
          Ao confirmar, os produtos serão
          removidos do seu carrinho.
        </p>

        <div class="modal-acoes">

          <button
            type="button"
            class="modal-btn modal-btn-voltar"
            id="modalCancelar"
          >
            Voltar
          </button>

          <button
            type="button"
            class="modal-btn modal-btn-confirmar"
            id="modalConfirmar"
          >

            <span>Confirmar pedido</span>

            <span>→</span>

          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  requestAnimationFrame(() => {

    modal.classList.add(
      "ativo"
    );
  });

  const fechar = () =>
    fecharModal(modal);

  const modalFechar =
    document.getElementById(
      "modalFechar"
    );

  const modalCancelar =
    document.getElementById(
      "modalCancelar"
    );

  const modalConfirmar =
    document.getElementById(
      "modalConfirmar"
    );

  if (modalFechar) {

    modalFechar.addEventListener(
      "click",
      fechar
    );
  }

  if (modalCancelar) {

    modalCancelar.addEventListener(
      "click",
      fechar
    );
  }

  if (modalConfirmar) {

    modalConfirmar.addEventListener(
      "click",
      () =>
        finalizarPedido(modal)
    );
  }

  modal.addEventListener(
    "click",
    (evento) => {

      if (
        evento.target === modal
      ) {

        fechar();
      }
    }
  );

  function escHandler(evento) {

    if (
      evento.key === "Escape"
    ) {

      fechar();

      document.removeEventListener(
        "keydown",
        escHandler
      );
    }
  }

  document.addEventListener(
    "keydown",
    escHandler
  );
}


// =========================================================
// FECHAR MODAL
// =========================================================

function fecharModal(modal) {

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "ativo"
  );

  setTimeout(() => {

    if (modal.parentNode) {
      modal.remove();
    }

  }, 250);
}


// =========================================================
// FINALIZAR PEDIDO
// =========================================================

async function finalizarPedido(
  modal
) {

  const btn =
    document.getElementById(
      "modalConfirmar"
    );

  const btnCancelar =
    document.getElementById(
      "modalCancelar"
    );

  const btnFechar =
    document.getElementById(
      "modalFechar"
    );

  if (!btn) {
    return;
  }

  if (!ID_CLIENTE) {

    alert(
      "Cliente não identificado. Faça login novamente."
    );

    window.location.href =
      "login.html";

    return;
  }

  if (
    !Array.isArray(
      carrinhoItens
    ) ||
    carrinhoItens.length === 0
  ) {

    alert(
      "Seu carrinho está vazio."
    );

    return;
  }

  btn.disabled = true;

  if (btnCancelar) {
    btnCancelar.disabled = true;
  }

  if (btnFechar) {
    btnFechar.disabled = true;
  }

  btn.innerHTML = `
    <span class="spinner-confirmacao"></span>
    Confirmando...
  `;

  try {

    // =====================================================
    // GARANTIR TOKEN CSRF
    // =====================================================

    const csrfPreparado =
      await prepararCsrf();

    const tokenCsrf =
      obterTokenCsrf();

    console.log(
      "Token CSRF disponível:",
      !!tokenCsrf
    );

    if (
      !csrfPreparado ||
      !tokenCsrf
    ) {

      throw new Error(
        "Não foi possível obter o token de segurança CSRF."
      );
    }


    // =====================================================
    // MONTAR DADOS DO PEDIDO
    // =====================================================

    const valorFrete =
      calcularFrete();

    const pedidoRequest = {

      formaEntrega:
        tipoEntrega,

      valorFrete:
        valorFrete,

      idLoja:
        tipoEntrega === "retirada"
          ? obterIdLojaSelecionada()
          : null,

      codigoCupom:
        null,

      metodoPagamento:
        formaPagamento
    };

    console.log(
      "Enviando pedido:",
      pedidoRequest
    );

    console.log(
      "ID do cliente:",
      ID_CLIENTE
    );


    // =====================================================
    // CRIAR PEDIDO
    // =====================================================

    const res =
      await fetch(
        `${API_PEDIDO}/${ID_CLIENTE}`,
        {
          method: "POST",

          credentials: "include",

          headers: {

            "Content-Type":
              "application/json",

            ...csrfHeaders()
          },

          body: JSON.stringify(
            pedidoRequest
          )
        }
      );


    // =====================================================
    // LER RESPOSTA
    // =====================================================

    const texto =
      await res.text();

    let dados = {};

    try {

      dados =
        texto
          ? JSON.parse(texto)
          : {};

    } catch (erro) {

      console.warn(
        "Resposta não é JSON:",
        texto
      );

      dados = {};
    }

    console.log(
      "STATUS DO PEDIDO:",
      res.status
    );

    console.log(
      "RESPOSTA DO BACKEND:",
      dados
    );


    // =====================================================
    // TRATAMENTO DE ERROS
    // =====================================================

    if (!res.ok) {

      // Sessão não autenticada
      if (res.status === 401) {

        throw new Error(
          "O servidor não reconheceu sua sessão. Faça login novamente."
        );
      }

      // CSRF ou acesso negado
      if (res.status === 403) {

        throw new Error(
          dados?.mensagem ||
            "Acesso negado pelo servidor."
        );
      }

      // Dados inválidos
      if (res.status === 400) {

        throw new Error(
          dados?.mensagem ||
            "Os dados do pedido são inválidos."
        );
      }

      // Cliente ou loja inexistente
      if (res.status === 404) {

        throw new Error(
          dados?.mensagem ||
            "Cliente ou loja não encontrado."
        );
      }

      // Estoque insuficiente
      if (res.status === 409) {

        throw new Error(
          dados?.mensagem ||
            "Não foi possível criar o pedido. Verifique o estoque."
        );
      }

      throw new Error(
        dados?.mensagem ||
          `Erro ao criar pedido (${res.status}).`
      );
    }


    // =====================================================
    // PEDIDO CRIADO
    // =====================================================

    console.log(
      "Pedido criado com sucesso:",
      dados
    );

    /*
     * IMPORTANTE:
     *
     * NÃO fazemos DELETE no carrinho aqui.
     *
     * O PedidoService já executa:
     *
     * itemCarrinhoRepository.deleteAll(itens);
     *
     * dentro da mesma transação.
     *
     * Portanto:
     *
     * Pedido criado
     *       ↓
     * Estoque baixado
     *       ↓
     * Pagamento criado
     *       ↓
     * Carrinho limpo
     */

    sessionStorage.removeItem(
      STORAGE_CHECKOUT
    );

    sessionStorage.setItem(
      "pedidoFinalizado",
      JSON.stringify(dados)
    );


    // =====================================================
    // FEEDBACK
    // =====================================================

    btn.innerHTML = `
      <span>✓</span>
      Pedido confirmado!
    `;

    setTimeout(() => {

      window.location.href =
        "index.html";

    }, 700);

  } catch (erro) {

    console.error(
      "Erro ao finalizar pedido:",
      erro
    );

    btn.disabled = false;

    if (btnCancelar) {
      btnCancelar.disabled = false;
    }

    if (btnFechar) {
      btnFechar.disabled = false;
    }

    btn.innerHTML = `
      <span>Confirmar pedido</span>
      <span>→</span>
    `;

    alert(
      erro.message ||
        "Não foi possível finalizar o pedido."
    );
  }
}


// =========================================================
// OBTER LOJA SELECIONADA
// =========================================================

function obterIdLojaSelecionada() {

  const loja =
    document.querySelector(
      'input[name="store"]:checked'
    );

  /*
   * Se o value do radio for o ID numérico,
   * usamos ele.
   */

  if (
    loja &&
    loja.value
  ) {

    const id =
      Number(loja.value);

    if (!Number.isNaN(id)) {

      return id;
    }
  }

  /*
   * Caso o HTML atual esteja usando nomes
   * como "Ponte Alta Norte", não enviamos
   * esse texto para Integer idLoja.
   *
   * Nesse caso o backend recebe null.
   */

  return null;
}


// =========================================================
// CÁLCULOS
// =========================================================

function calcularSubtotal() {

  return carrinhoItens.reduce(
    (total, item) => {

      return (
        total +
        Number(
          item.precoProduto || 0
        ) *
          Number(
            item.quantidade || 0
          )
      );
    },
    0
  );
}

function calcularFrete() {

  return tipoEntrega === "entrega"
    ? VALOR_FRETE_ENTREGA
    : 0;
}

function calcularTotal() {

  return Math.max(
    0,
    calcularSubtotal() -
      desconto +
      calcularFrete()
  );
}

function calcularQuantidadeItens() {

  return carrinhoItens.reduce(
    (total, item) =>
      total +
      Number(
        item.quantidade || 0
      ),
    0
  );
}


// =========================================================
// NOME FORMA DE PAGAMENTO
// =========================================================

function nomeFormaPagamento() {

  const formas = {

    pix: "Pix",

    credito:
      "Cartão de crédito",

    debito:
      "Cartão de débito",

    boleto:
      "Boleto"
  };

  return (
    formas[formaPagamento] ||
    formaPagamento
  );
}


// =========================================================
// FORMATAÇÃO
// =========================================================

function formatarPreco(valor) {

  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}


// =========================================================
// SEGURANÇA HTML
// =========================================================

function escaparHTML(valor) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    valor ?? "";

  return div.innerHTML;
}


// =========================================================
// CSS DO MODAL
// =========================================================

const estiloModal =
  document.createElement(
    "style"
  );

estiloModal.textContent = `

  .modal-confirmacao-overlay {

    position: fixed;

    inset: 0;

    z-index: 9999;

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 24px;

    background:
      rgba(10, 20, 30, 0.58);

    backdrop-filter:
      blur(7px);

    -webkit-backdrop-filter:
      blur(7px);

    opacity: 0;

    transition:
      opacity 0.25s ease;
  }

  .modal-confirmacao-overlay.ativo {

    opacity: 1;
  }

  .modal-confirmacao {

    position: relative;

    width:
      min(470px, 100%);

    overflow: hidden;

    background: #ffffff;

    border-radius: 24px;

    box-shadow:
      0 30px 80px
      rgba(0, 0, 0, 0.25);

    transform:
      translateY(25px)
      scale(0.96);

    transition:
      transform 0.3s
      cubic-bezier(.2,.8,.2,1);
  }

  .modal-confirmacao-overlay.ativo
  .modal-confirmacao {

    transform:
      translateY(0)
      scale(1);
  }

  .modal-confirmacao::before {

    content: "";

    display: block;

    height: 6px;

    background:
      linear-gradient(
        90deg,
        #014892,
        #1976d2,
        #27dc7e
      );
  }

  .modal-fechar {

    position: absolute;

    top: 18px;

    right: 18px;

    width: 36px;

    height: 36px;

    border: none;

    border-radius: 50%;

    background: #f3f5f7;

    color: #68727d;

    font-size: 25px;

    line-height: 1;

    cursor: pointer;

    transition:
      background 0.2s,
      color 0.2s,
      transform 0.2s;
  }

  .modal-fechar:hover {

    background: #e8ecef;

    color: #17212b;

    transform:
      rotate(90deg);
  }

  .modal-conteudo {

    padding:
      38px 38px 32px;

    text-align: center;
  }

  .modal-icone {

    width: 76px;

    height: 76px;

    margin:
      0 auto 20px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 50%;

    background:
      linear-gradient(
        145deg,
        #e7fff2,
        #d4f8e5
      );

    box-shadow:
      0 0 0 8px #f3fcf7;
  }

  .modal-icone span {

    width: 48px;

    height: 48px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 50%;

    background: #27dc7e;

    color: #ffffff;

    font-size: 27px;

    font-weight: 800;

    box-shadow:
      0 8px 20px
      rgba(39, 220, 126, 0.3);
  }

  .modal-etapa {

    margin:
      0 0 7px;

    color: #014892;

    font-size: 11px;

    font-weight: 800;

    letter-spacing: 1.5px;
  }

  .modal-conteudo h2 {

    margin: 0;

    color: #101010;

    font-family:
      "Barlow Condensed",
      sans-serif;

    font-size: 32px;

    font-weight: 800;
  }

  .modal-descricao {

    margin:
      8px auto 24px;

    max-width: 340px;

    color: #69737d;

    font-size: 14px;

    line-height: 1.5;
  }

  .modal-resumo {

    padding:
      5px 18px;

    border:
      1px solid #e9edf0;

    border-radius: 16px;

    background: #fafbfc;

    text-align: left;
  }

  .modal-resumo-item {

    display: flex;

    align-items: center;

    justify-content:
      space-between;

    gap: 20px;

    padding:
      13px 0;

    border-bottom:
      1px solid #e9edf0;

    font-size: 13px;
  }

  .modal-resumo-item span {

    color: #747e88;
  }

  .modal-resumo-item strong {

    color: #202830;

    font-size: 13px;

    text-align: right;
  }

  .modal-total {

    display: flex;

    align-items: center;

    justify-content:
      space-between;

    padding:
      17px 0 14px;

    gap: 20px;
  }

  .modal-total span {

    color: #303943;

    font-size: 14px;

    font-weight: 600;
  }

  .modal-total strong {

    color: #014892;

    font-size: 23px;

    font-weight: 800;
  }

  .modal-aviso {

    margin:
      16px 0 20px;

    color: #8a949d;

    font-size: 11px;

    line-height: 1.4;
  }

  .modal-acoes {

    display: grid;

    grid-template-columns:
      1fr 1.6fr;

    gap: 10px;
  }

  .modal-btn {

    min-height: 48px;

    border: none;

    border-radius: 12px;

    font-family: inherit;

    font-size: 14px;

    font-weight: 700;

    cursor: pointer;

    transition:
      transform 0.2s,
      box-shadow 0.2s,
      background 0.2s;
  }

  .modal-btn:active {

    transform:
      scale(0.98);
  }

  .modal-btn:disabled {

    cursor:
      not-allowed;

    opacity: 0.7;
  }

  .modal-btn-voltar {

    background: #eef1f3;

    color: #4e5963;
  }

  .modal-btn-voltar:hover:not(:disabled) {

    background: #e2e6e9;
  }

  .modal-btn-confirmar {

    display: flex;

    align-items: center;

    justify-content: center;

    gap: 10px;

    background: #014892;

    color: #ffffff;

    box-shadow:
      0 8px 20px
      rgba(1, 72, 146, 0.22);
  }

  .modal-btn-confirmar:hover:not(:disabled) {

    background: #013b78;

    box-shadow:
      0 10px 25px
      rgba(1, 72, 146, 0.3);

    transform:
      translateY(-1px);
  }

  .spinner-confirmacao {

    width: 16px;

    height: 16px;

    border:
      2px solid
      rgba(255, 255, 255, 0.35);

    border-top-color:
      #ffffff;

    border-radius: 50%;

    animation:
      spinnerConfirmacao
      0.7s linear infinite;
  }

  @keyframes spinnerConfirmacao {

    to {

      transform:
        rotate(360deg);
    }
  }

  @media (max-width: 520px) {

    .modal-confirmacao-overlay {

      padding: 15px;
    }

    .modal-conteudo {

      padding:
        32px 22px 24px;
    }

    .modal-conteudo h2 {

      font-size: 28px;
    }

    .modal-acoes {

      grid-template-columns: 1fr;
    }

    .modal-btn-confirmar {

      order: -1;
    }
  }

`;

document.head.appendChild(
  estiloModal
);