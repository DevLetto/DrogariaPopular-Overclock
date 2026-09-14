const API_BASE_URL = "http://localhost:8080/api";

const estado = {
    pedidos: [],
    clientes: [],
    filtro: "todos",
    busca: ""
};

// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    inicializar();
});

async function inicializar() {
    configurarEventos();
    adicionarEstilosPagina();

    await carregarClientes();
    await carregarPedidos();
}

// ======================================================
// EVENTOS
// ======================================================

function configurarEventos() {

    // Busca
    const campoBusca = document.querySelector(
        'input[placeholder="Buscar pedido ou cliente..."]'
    );

    if (campoBusca) {
        campoBusca.addEventListener("input", (event) => {

            estado.busca =
                event.target.value
                    .toLowerCase()
                    .trim();

            renderizarTabela();
        });
    }

    // Filtros
    const botoesFiltro =
        document.querySelectorAll(".filter-pills .pill");

    botoesFiltro.forEach((botao) => {

        botao.addEventListener("click", () => {

            botoesFiltro.forEach((b) => {
                b.classList.remove("active");
            });

            botao.classList.add("active");

            estado.filtro =
                botao.dataset.filtro || "todos";

            renderizarTabela();
        });
    });
}

// ======================================================
// API
// ======================================================

async function requisicao(endpoint, opcoes = {}) {

    const resposta = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(opcoes.headers || {})
            },
            credentials: "include",
            ...opcoes
        }
    );

    if (!resposta.ok) {

        let mensagem =
            `Erro HTTP ${resposta.status}`;

        try {

            const erro =
                await resposta.json();

            mensagem =
                erro.message ||
                erro.mensagem ||
                erro.error ||
                mensagem;

        } catch (_) {
            // resposta não era JSON
        }

        throw new Error(mensagem);
    }

    if (resposta.status === 204) {
        return null;
    }

    const texto =
        await resposta.text();

    if (!texto) {
        return null;
    }

    try {
        return JSON.parse(texto);
    } catch (_) {
        return texto;
    }
}

// ======================================================
// CARREGAR CLIENTES
// ======================================================

async function carregarClientes() {

    try {

        const clientes =
            await requisicao("/cliente");

        if (Array.isArray(clientes)) {

            estado.clientes = clientes;

        } else if (
            Array.isArray(clientes?.content)
        ) {

            estado.clientes =
                clientes.content;

        } else {

            estado.clientes = [];
        }

        console.log(
            "Clientes carregados:",
            estado.clientes
        );

    } catch (erro) {

        console.warn(
            "Não foi possível carregar os clientes:",
            erro.message
        );

        estado.clientes = [];
    }
}

// ======================================================
// CARREGAR PEDIDOS
// ======================================================

async function carregarPedidos() {

    try {

        estado.pedidos =
            await requisicao("/pedido");

        if (!Array.isArray(estado.pedidos)) {

            if (
                Array.isArray(
                    estado.pedidos?.content
                )
            ) {

                estado.pedidos =
                    estado.pedidos.content;

            } else {

                estado.pedidos = [];
            }
        }

        console.log(
            "Pedidos carregados:",
            estado.pedidos
        );

        renderizarTabela();
        atualizarResumo();

    } catch (erro) {

        console.error(
            "Erro ao carregar pedidos:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar os pedidos: ${erro.message}`,
            "erro"
        );
    }
}

// ======================================================
// RENDERIZAR TABELA
// ======================================================

function renderizarTabela() {

    const tabela =
        document.querySelector("tbody");

    if (!tabela) {
        return;
    }

    const pedidosFiltrados =
        estado.pedidos.filter((pedido) => {

            // -----------------------------
            // BUSCA
            // -----------------------------

            const id =
                obterIdPedido(pedido);

            const cliente =
                obterNomeCliente(pedido);

            const textoBusca =
                `${id} ${cliente}`.toLowerCase();

            const correspondeBusca =
                !estado.busca ||
                textoBusca.includes(
                    estado.busca
                );

            // -----------------------------
            // FILTRO DE STATUS
            // -----------------------------

            const status =
                normalizarStatus(
                    pedido.status
                );

            let correspondeFiltro = true;

            if (
                estado.filtro !== "todos"
            ) {

                const mapaFiltro = {

                    preparando:
                        "PREPARANDO",

                    caminho:
                        "A_CAMINHO",

                    entregue:
                        "ENTREGUE"
                };

                correspondeFiltro =
                    status ===
                    mapaFiltro[
                        estado.filtro
                    ];
            }

            return (
                correspondeBusca &&
                correspondeFiltro
            );
        });

    tabela.innerHTML = "";

    if (
        pedidosFiltrados.length === 0
    ) {

        tabela.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align: center;
                        padding: 30px;
                    "
                >
                    Nenhum pedido encontrado.
                </td>
            </tr>
        `;

        return;
    }

    pedidosFiltrados.forEach(
        (pedido) => {

            const linha =
                criarLinhaPedido(pedido);

            tabela.appendChild(linha);
        }
    );

    adicionarEventosTabela();
}

// ======================================================
// CRIAR LINHA
// ======================================================

function criarLinhaPedido(pedido) {

    const tr =
        document.createElement("tr");

    const id =
        obterIdPedido(pedido);

    const cliente =
        obterNomeCliente(pedido);

    const entrega =
        obterFormaEntrega(pedido);

    const total =
        obterValorTotal(pedido);

    const status =
        normalizarStatus(
            pedido.status
        );

    const statusTexto =
        obterTextoStatus(status);

    const classeStatus =
        obterClasseStatus(status);

    tr.innerHTML = `

        <td>
            <strong>#${id}</strong>
        </td>

        <td>
            ${escaparHTML(cliente)}
        </td>

        <td>
            ${escaparHTML(entrega)}
        </td>

        <td>
            <strong>
                ${formatarMoeda(total)}
            </strong>
        </td>

        <td>

            <select
                class="status-select ${classeStatus}"
                data-id="${id}"
                title="Alterar status do pedido"
            >

                <option
                    value="PENDENTE"
                    ${status === "PENDENTE"
                        ? "selected"
                        : ""}
                >
                    Pendente
                </option>

                <option
                    value="PREPARANDO"
                    ${status === "PREPARANDO"
                        ? "selected"
                        : ""}
                >
                    Preparando
                </option>

                <option
                    value="A_CAMINHO"
                    ${status === "A_CAMINHO"
                        ? "selected"
                        : ""}
                >
                    A caminho
                </option>

                <option
                    value="ENTREGUE"
                    ${status === "ENTREGUE"
                        ? "selected"
                        : ""}
                >
                    Entregue
                </option>

                <option
                    value="CANCELADO"
                    ${status === "CANCELADO"
                        ? "selected"
                        : ""}
                >
                    Cancelado
                </option>

            </select>

        </td>

        <td>

            <button
                type="button"
                class="btn-detalhes"
                data-id="${id}"
            >
                Ver detalhes
            </button>

        </td>
    `;

    return tr;
}

// ======================================================
// EVENTOS DA TABELA
// ======================================================

function adicionarEventosTabela() {

    // -----------------------------
    // STATUS
    // -----------------------------

    const selects =
        document.querySelectorAll(
            ".status-select"
        );

    selects.forEach((select) => {

        select.addEventListener(
            "change",
            async () => {

                await mudarStatus(select);
            }
        );
    });

    // -----------------------------
    // DETALHES
    // -----------------------------

    const botoes =
        document.querySelectorAll(
            ".btn-detalhes"
        );

    botoes.forEach((botao) => {

        botao.addEventListener(
            "click",
            async () => {

                const id =
                    botao.dataset.id;

                await abrirDetalhes(id);
            }
        );
    });
}

// ======================================================
// ALTERAR STATUS
// ======================================================

async function mudarStatus(
    selectElement
) {

    const idPedido =
        selectElement.dataset.id;

    const novoStatus =
        selectElement.value;

    if (
        !idPedido ||
        !novoStatus
    ) {
        return;
    }

    const statusAnterior =
        estado.pedidos.find(
            (pedido) =>
                String(
                    obterIdPedido(pedido)
                ) ===
                String(idPedido)
        )?.status;

    try {

        selectElement.disabled = true;

        const pedidoAtualizado =
            await requisicao(
                `/pedido/${idPedido}/status?valor=${encodeURIComponent(
                    novoStatus
                )}`,
                {
                    method: "PUT"
                }
            );

        const indice =
            estado.pedidos.findIndex(
                (pedido) =>
                    String(
                        obterIdPedido(pedido)
                    ) ===
                    String(idPedido)
            );

        if (indice !== -1) {

            if (pedidoAtualizado) {

                estado.pedidos[indice] =
                    pedidoAtualizado;

            } else {

                estado.pedidos[
                    indice
                ].status =
                    novoStatus;
            }
        }

        atualizarCorStatus(
            selectElement
        );

        atualizarResumo();

        mostrarToast(
            "Status do pedido atualizado!",
            "sucesso"
        );

    } catch (erro) {

        console.error(
            "Erro ao atualizar status:",
            erro
        );

        if (statusAnterior) {

            selectElement.value =
                normalizarStatus(
                    statusAnterior
                );

            atualizarCorStatus(
                selectElement
            );
        }

        mostrarToast(
            `Não foi possível atualizar o status: ${erro.message}`,
            "erro"
        );

    } finally {

        selectElement.disabled = false;
    }
}

// ======================================================
// COR DO STATUS
// ======================================================

function atualizarCorStatus(
    selectElement
) {

    selectElement.classList.remove(
        "pendente",
        "preparando",
        "caminho",
        "entregue",
        "cancelado"
    );

    const classe =
        obterClasseStatus(
            selectElement.value
        );

    if (classe) {

        selectElement.classList.add(
            classe
        );
    }
}

// ======================================================
// RESUMO / CARDS
// ======================================================

function atualizarResumo() {

    const pedidos =
        estado.pedidos;

    const hoje =
        new Date();

    const pedidosHoje =
        pedidos.filter(
            (pedido) => {

                const data =
                    obterDataPedido(
                        pedido
                    );

                if (!data) {
                    return false;
                }

                return (
                    data.getDate() ===
                        hoje.getDate() &&

                    data.getMonth() ===
                        hoje.getMonth() &&

                    data.getFullYear() ===
                        hoje.getFullYear()
                );
            }
        );

    const novosHoje =
        pedidosHoje.filter(
            (pedido) =>
                normalizarStatus(
                    pedido.status
                ) === "PENDENTE"
        ).length;

    const emPreparo =
        pedidos.filter(
            (pedido) =>
                normalizarStatus(
                    pedido.status
                ) === "PREPARANDO"
        ).length;

    const aCaminho =
        pedidos.filter(
            (pedido) =>
                normalizarStatus(
                    pedido.status
                ) === "A_CAMINHO"
        ).length;

    const entreguesHoje =
        pedidosHoje.filter(
            (pedido) =>
                normalizarStatus(
                    pedido.status
                ) === "ENTREGUE"
        );

    const vendasHoje =
        entreguesHoje.reduce(
            (total, pedido) =>
                total +
                obterValorTotal(
                    pedido
                ),
            0
        );

    atualizarCardResumo(
        "NOVOS HOJE",
        novosHoje
    );

    atualizarCardResumo(
        "EM PREPARO",
        emPreparo
    );

    atualizarCardResumo(
        "A CAMINHO",
        aCaminho
    );

    atualizarCardResumo(
        "ENTREGUES HOJE",
        entreguesHoje.length,
        `${formatarMoeda(vendasHoje)} em vendas`
    );
}

// ======================================================
// ATUALIZAR CARD
// ======================================================

function atualizarCardResumo(
    titulo,
    valor,
    subtitulo = null
) {

    const elementos = [
        ...document.querySelectorAll(
            "div, section, article"
        )
    ];

    const elemento =
        elementos.find(
            (el) =>
                el.children.length > 0 &&
                el.textContent
                    .trim()
                    .toUpperCase()
                    .includes(titulo)
        );

    if (!elemento) {
        return;
    }

    const numero =
        elemento.querySelector(
            ".numero, .valor, .card-numero, strong, h2, h3"
        );

    if (numero) {

        numero.textContent =
            valor;
    }

    if (subtitulo) {

        const textos =
            elemento.querySelectorAll(
                "span, p, small"
            );

        const texto =
            [...textos].find(
                (el) =>
                    el.textContent
                        .toLowerCase()
                        .includes(
                            "em vendas"
                        )
            );

        if (texto) {

            texto.textContent =
                subtitulo;
        }
    }
}

// ======================================================
// DETALHES DO PEDIDO
// ======================================================

async function abrirDetalhes(id) {

    try {

        const pedido =
            await requisicao(
                `/pedido/${id}`
            );

        criarModalDetalhes(
            pedido
        );

    } catch (erro) {

        console.error(
            "Erro ao buscar detalhes:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar o pedido: ${erro.message}`,
            "erro"
        );
    }
}

// ======================================================
// MODAL
// ======================================================

function criarModalDetalhes(
    pedido
) {

    const modalExistente =
        document.querySelector(
            ".modal-pedido"
        );

    if (modalExistente) {
        modalExistente.remove();
    }

    const id =
        obterIdPedido(pedido);

    const cliente =
        obterNomeCliente(pedido);

    const status =
        normalizarStatus(
            pedido.status
        );

    const entrega =
        obterFormaEntrega(pedido);

    const data =
        obterDataPedido(pedido);

    const frete =
        Number(
            pedido.valorFrete || 0
        );

    const total =
        obterValorTotal(pedido);

    let itensHTML = "";

    if (
        Array.isArray(
            pedido.itens
        ) &&
        pedido.itens.length > 0
    ) {

        itensHTML =
            pedido.itens
                .map((item) => {

                    const produto =
                        item.produto?.nomeProduto ||
                        item.produto?.nome ||
                        item.nomeProduto ||
                        "Produto";

                    const quantidade =
                        item.quantidade || 0;

                    const preco =
                        Number(
                            item.precoUnitario ||
                            item.produto?.precoProduto ||
                            0
                        );

                    return `
                        <div class="item-pedido">

                            <div>

                                <strong>
                                    ${escaparHTML(
                                        produto
                                    )}
                                </strong>

                                <span>
                                    ${quantidade}x
                                </span>

                            </div>

                            <strong>
                                ${formatarMoeda(
                                    preco *
                                    quantidade
                                )}
                            </strong>

                        </div>
                    `;
                })
                .join("");

    } else {

        itensHTML = `
            <p>
                Nenhum item encontrado.
            </p>
        `;
    }

    const modal =
        document.createElement(
            "div"
        );

    modal.className =
        "modal-pedido";

    modal.innerHTML = `

        <div class="modal-overlay"></div>

        <div class="modal-conteudo">

            <div class="modal-header">

                <div>

                    <h2>
                        Pedido #${id}
                    </h2>

                    <span>
                        ${escaparHTML(cliente)}
                    </span>

                </div>

                <button
                    type="button"
                    class="modal-fechar"
                >
                    ×
                </button>

            </div>

            <div class="modal-info">

                <div>
                    <small>STATUS</small>

                    <strong>
                        ${obterTextoStatus(
                            status
                        )}
                    </strong>
                </div>

                <div>
                    <small>ENTREGA</small>

                    <strong>
                        ${escaparHTML(
                            entrega
                        )}
                    </strong>
                </div>

                <div>
                    <small>DATA</small>

                    <strong>
                        ${
                            data
                                ? formatarData(
                                      data
                                  )
                                : "-"
                        }
                    </strong>
                </div>

                <div>
                    <small>FRETE</small>

                    <strong>
                        ${formatarMoeda(
                            frete
                        )}
                    </strong>
                </div>

            </div>

            <div class="modal-itens">

                <h3>
                    Produtos
                </h3>

                ${itensHTML}

            </div>

            <div class="modal-total">

                <span>
                    Total
                </span>

                <strong>
                    ${formatarMoeda(
                        total
                    )}
                </strong>

            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    // Fechar pelo X
    const fechar =
        modal.querySelector(
            ".modal-fechar"
        );

    fechar.addEventListener(
        "click",
        () => modal.remove()
    );

    // Fechar clicando fora
    const overlay =
        modal.querySelector(
            ".modal-overlay"
        );

    overlay.addEventListener(
        "click",
        () => modal.remove()
    );

    // ESC
    const fecharESC =
        (event) => {

            if (
                event.key ===
                "Escape"
            ) {

                modal.remove();

                document.removeEventListener(
                    "keydown",
                    fecharESC
                );
            }
        };

    document.addEventListener(
        "keydown",
        fecharESC
    );
}

// ======================================================
// STATUS
// ======================================================

function normalizarStatus(
    status
) {

    if (!status) {
        return "PENDENTE";
    }

    return String(status)
        .trim()
        .toUpperCase()
        .replace(
            /[\s-]+/g,
            "_"
        );
}

function obterTextoStatus(
    status
) {

    const mapa = {

        PENDENTE:
            "Pendente",

        PREPARANDO:
            "Preparando",

        A_CAMINHO:
            "A caminho",

        ENTREGUE:
            "Entregue",

        CANCELADO:
            "Cancelado"
    };

    return (
        mapa[
            normalizarStatus(status)
        ] ||
        status
    );
}

function obterClasseStatus(
    status
) {

    const mapa = {

        PENDENTE:
            "pendente",

        PREPARANDO:
            "preparando",

        A_CAMINHO:
            "caminho",

        ENTREGUE:
            "entregue",

        CANCELADO:
            "cancelado"
    };

    return (
        mapa[
            normalizarStatus(status)
        ] ||
        "pendente"
    );
}

// ======================================================
// DADOS DO PEDIDO
// ======================================================

function obterIdPedido(
    pedido
) {

    return (
        pedido.idPedido ??
        pedido.id ??
        pedido.pedidoId ??
        "-"
    );
}

// ======================================================
// NOME DO CLIENTE
// ======================================================

function obterNomeCliente(
    pedido
) {

    // Caso o pedido venha com objeto cliente
    if (pedido.cliente) {

        const cliente =
            pedido.cliente;

        return (
            cliente.nomeCompleto ??
            cliente.nomeCliente ??
            cliente.nome ??
            cliente.nomeUsuario ??
            cliente.usuario?.nome ??
            cliente.usuario?.nomeCompleto ??
            "Cliente"
        );
    }

    // Outros formatos possíveis
    const nomeDireto =
        pedido.nomeCliente ??
        pedido.clienteNome ??
        pedido.nomeCompletoCliente ??
        pedido.clienteNomeCompleto;

    if (nomeDireto) {
        return nomeDireto;
    }

    // Caso venha somente o ID
    const idCliente =
        pedido.idCliente ??
        pedido.clienteId ??
        pedido.cliente?.idCliente;

    if (idCliente) {

        const clienteEncontrado =
            estado.clientes.find(
                (cliente) =>
                    String(
                        cliente.idCliente ??
                        cliente.id
                    ) ===
                    String(idCliente)
            );

        if (clienteEncontrado) {

            return (
                clienteEncontrado.nome ??
                clienteEncontrado.nomeCompleto ??
                clienteEncontrado.nomeCliente ??
                "Cliente"
            );
        }

        return `Cliente #${idCliente}`;
    }

    return "Cliente";
}

// ======================================================
// FORMA DE ENTREGA
// ======================================================

function obterFormaEntrega(
    pedido
) {

    const forma =
        pedido.formaEntrega ??
        pedido.tipoEntrega ??
        pedido.entrega;

    if (!forma) {
        return "-";
    }

    const valor =
        String(forma)
            .toUpperCase();

    if (
        valor.includes("RETIR")
    ) {
        return "Retirada";
    }

    if (
        valor.includes("ENTREG")
    ) {
        return "Entrega";
    }

    return forma;
}

// ======================================================
// VALOR TOTAL
// ======================================================

function obterValorTotal(
    pedido
) {

    return Number(
        pedido.valorTotal ??
        pedido.total ??
        0
    );
}

// ======================================================
// DATA
// ======================================================

function obterDataPedido(
    pedido
) {

    const valor =
        pedido.dataPedido ??
        pedido.data ??
        pedido.createdAt;

    if (!valor) {
        return null;
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return null;
    }

    return data;
}

// ======================================================
// FORMATAÇÃO
// ======================================================

function formatarMoeda(
    valor
) {

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

function formatarData(
    data
) {

    return data.toLocaleString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

// ======================================================
// SEGURANÇA HTML
// ======================================================

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

// ======================================================
// ESTILOS DA PÁGINA
// ======================================================

function adicionarEstilosPagina() {

    if (
        document.querySelector(
            "#estilos-admin-pedidos"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "estilos-admin-pedidos";

    style.textContent = `

        /* ==========================================
           BOTÃO VER DETALHES
           ========================================== */

        .btn-detalhes {

            display: inline-flex;

            align-items: center;

            justify-content: center;

            min-width: 115px;

            padding: 9px 15px;

            border: 1px solid #014892;

            border-radius: 7px;

            background: #ffffff;

            color: #014892;

            font-family: inherit;

            font-size: 13px;

            font-weight: 600;

            line-height: 1;

            cursor: pointer;

            transition:
                background 0.2s ease,
                color 0.2s ease,
                border-color 0.2s ease,
                transform 0.15s ease,
                box-shadow 0.2s ease;
        }

        .btn-detalhes:hover {

            background: #014892;

            color: #ffffff;

            border-color: #014892;

            box-shadow:
                0 4px 10px rgba(1, 72, 146, 0.18);

            transform: translateY(-1px);
        }

        .btn-detalhes:active {

            transform:
                translateY(0);

            box-shadow: none;
        }

        .btn-detalhes:focus-visible {

            outline: 3px solid
                rgba(1, 72, 146, 0.22);

            outline-offset: 2px;
        }


        /* ==========================================
           FILTROS
           ========================================== */

        .filter-pills .pill {

            cursor: pointer;

            transition:
                background 0.2s ease,
                color 0.2s ease,
                border-color 0.2s ease;
        }


        /* ==========================================
           MODAL
           ========================================== */

        .modal-pedido {

            position: fixed;

            inset: 0;

            z-index: 9999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            box-sizing: border-box;
        }

        .modal-overlay {

            position: absolute;

            inset: 0;

            background:
                rgba(0, 0, 0, 0.55);

            backdrop-filter:
                blur(2px);
        }

        .modal-conteudo {

            position: relative;

            z-index: 1;

            width: min(
                600px,
                100%
            );

            max-height: 85vh;

            overflow-y: auto;

            box-sizing: border-box;

            background: #ffffff;

            border-radius: 14px;

            padding: 25px;

            box-shadow:
                0 20px 50px
                rgba(0, 0, 0, 0.25);
        }

        .modal-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 20px;

            margin-bottom: 25px;
        }

        .modal-header h2 {

            margin: 0;

            color: #222;
        }

        .modal-header span {

            display: block;

            margin-top: 5px;

            color: #777;
        }

        .modal-fechar {

            width: 38px;

            height: 38px;

            display: flex;

            align-items: center;

            justify-content: center;

            flex-shrink: 0;

            border: none;

            border-radius: 8px;

            background: #f1f1f1;

            color: #555;

            font-size: 26px;

            line-height: 1;

            cursor: pointer;

            transition:
                background 0.2s ease,
                color 0.2s ease;
        }

        .modal-fechar:hover {

            background: #e5e5e5;

            color: #222;
        }

        .modal-info {

            display: grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap: 15px;

            margin-bottom: 25px;
        }

        .modal-info div {

            display: flex;

            flex-direction: column;

            gap: 5px;

            padding: 12px;

            background: #f7f7f7;

            border-radius: 8px;
        }

        .modal-info small {

            color: #777;

            font-size: 11px;

            font-weight: bold;
        }

        .modal-itens h3 {

            margin-bottom: 12px;
        }

        .item-pedido {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;

            padding: 12px 0;

            border-bottom:
                1px solid #eee;
        }

        .item-pedido div {

            display: flex;

            flex-direction: column;

            gap: 4px;
        }

        .item-pedido span {

            color: #777;

            font-size: 13px;
        }

        .modal-total {

            display: flex;

            justify-content: space-between;

            align-items: center;

            margin-top: 20px;

            padding-top: 20px;

            border-top:
                2px solid #eee;

            font-size: 18px;
        }

        @media (max-width: 600px) {

            .modal-info {

                grid-template-columns: 1fr;
            }

            .btn-detalhes {

                min-width: auto;

                padding:
                    8px 10px;

                font-size: 12px;
            }
        }
    `;

    document.head.appendChild(
        style
    );
}

// ======================================================
// TOAST
// ======================================================

function mostrarToast(
    mensagem,
    tipo = "sucesso"
) {

    const toastExistente =
        document.querySelector(
            ".toast-pedido"
        );

    if (toastExistente) {
        toastExistente.remove();
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `toast-pedido ${tipo}`;

    toast.textContent =
        mensagem;

    document.body.appendChild(
        toast
    );

    if (
        !document.querySelector(
            "#estilos-toast-pedido"
        )
    ) {

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "estilos-toast-pedido";

        style.textContent = `

            .toast-pedido {

                position: fixed;

                right: 25px;

                bottom: 25px;

                z-index: 10000;

                padding:
                    14px 20px;

                border-radius: 8px;

                background: #222;

                color: white;

                font-size: 14px;

                box-shadow:
                    0 5px 20px
                    rgba(0, 0, 0, 0.2);

                animation:
                    aparecerToast
                    0.2s ease;
            }

            .toast-pedido.erro {

                background:
                    #c62828;
            }

            .toast-pedido.sucesso {

                background:
                    #2e7d32;
            }

            @keyframes aparecerToast {

                from {

                    opacity: 0;

                    transform:
                        translateY(10px);
                }

                to {

                    opacity: 1;

                    transform:
                        translateY(0);
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    setTimeout(() => {

        toast.remove();

    }, 3500);
}