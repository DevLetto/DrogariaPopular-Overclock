const API_BASE_URL = "http://localhost:8080/api";

const estado = {
    promocoes: [],
    produtos: []
};

document.addEventListener("DOMContentLoaded", () => {
    inicializar();
});

async function inicializar() {
    configurarEventos();
    await carregarProdutos();
    await carregarPromocoes();
}

/* ================================
   EVENTOS
================================ */

function configurarEventos() {
    const botaoNovaPromocao =
        document.querySelector("#btnNovaPromocao");

    if (botaoNovaPromocao) {
        botaoNovaPromocao.addEventListener(
            "click",
            () => abrirFormulario()
        );
    }
}

/* ================================
   REQUISIÇÃO
================================ */

async function requisicao(endpoint, opcoes = {}) {
    const resposta = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(opcoes.headers || {})
            },
            ...opcoes
        }
    );

    if (!resposta.ok) {
        let mensagem = `Erro HTTP ${resposta.status}`;

        try {
            const erro = await resposta.json();

            mensagem =
                erro.message ||
                erro.mensagem ||
                erro.error ||
                mensagem;
        } catch (_) {}

        throw new Error(mensagem);
    }

    if (resposta.status === 204) {
        return null;
    }

    const texto = await resposta.text();

    if (!texto) {
        return null;
    }

    try {
        return JSON.parse(texto);
    } catch (_) {
        return texto;
    }
}

/* ================================
   PRODUTOS
================================ */

async function carregarProdutos() {
    try {
        const produtos =
            await requisicao("/produto");

        estado.produtos =
            Array.isArray(produtos)
                ? produtos
                : [];

    } catch (erro) {
        console.error(
            "Erro ao carregar produtos:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar os produtos: ${erro.message}`,
            "erro"
        );
    }
}

/* ================================
   PROMOÇÕES
================================ */

async function carregarPromocoes() {
    try {
        const promocoes =
            await requisicao("/promocao");

        estado.promocoes =
            Array.isArray(promocoes)
                ? promocoes
                : [];

        renderizarTabela();

    } catch (erro) {
        console.error(
            "Erro ao carregar promoções:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar as promoções: ${erro.message}`,
            "erro"
        );
    }
}

/* ================================
   TABELA
================================ */

function renderizarTabela() {
    const tabela =
        document.querySelector(
            "#tabelaPromocoes"
        );

    if (!tabela) {
        return;
    }

    tabela.innerHTML = "";

    if (estado.promocoes.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align: center; padding: 30px;"
                >
                    Nenhuma promoção cadastrada.
                </td>
            </tr>
        `;

        return;
    }

    estado.promocoes.forEach(
        (promocao) => {
            const linha =
                criarLinhaPromocao(promocao);

            tabela.appendChild(linha);
        }
    );

    adicionarEventosTabela();
}

/* ================================
   LINHA DA TABELA
================================ */

function criarLinhaPromocao(promocao) {
    const tr =
        document.createElement("tr");

    const produto =
        promocao.produto;

    const nomeProduto =
        produto?.nomeProduto ||
        promocao.nomeProduto ||
        "Produto";

    const precoOriginal =
        obterPrecoOriginal(produto);

    const precoPromocional =
        Number(
            promocao.precoPromocional || 0
        );

    const desconto =
        calcularDesconto(
            precoOriginal,
            precoPromocional
        );

    const dataFim =
        promocao.dataFim;

    const status =
        obterStatusPromocao(promocao);

    const classeStatus =
        obterClasseStatusPromocao(status);

    const idPromocao =
        promocao.idPromocao ??
        promocao.id;

    tr.innerHTML = `
        <td>
            <strong>
                ${escaparHTML(nomeProduto)}
            </strong>
        </td>

        <td>
            ${formatarMoeda(precoOriginal)}
        </td>

        <td>
            ${desconto}%
        </td>

        <td>
            <strong>
                ${formatarMoeda(precoPromocional)}
            </strong>
        </td>

        <td>
            ${formatarDataCurta(dataFim)}
        </td>

        <td>
            <span class="${classeStatus}">
                ${status}
            </span>
        </td>

        <td class="action-cell">

            <button
                type="button"
                class="btn-icon btn-editar-promocao"
                title="Editar"
                data-id="${idPromocao}"
            >
                <img
                    src="../img/edicao_icon.png"
                    alt="Editar"
                >
            </button>

            <button
                type="button"
                class="btn-icon btn-excluir-promocao"
                title="Excluir"
                data-id="${idPromocao}"
            >
                <img
                    src="../img/lixeira_icon.png"
                    alt="Excluir"
                >
            </button>

        </td>
    `;

    return tr;
}

/* ================================
   EVENTOS DA TABELA
================================ */

function adicionarEventosTabela() {
    const botoesEditar =
        document.querySelectorAll(
            ".btn-editar-promocao"
        );

    botoesEditar.forEach(
        (botao) => {
            botao.addEventListener(
                "click",
                async () => {
                    const id =
                        botao.dataset.id;

                    await editarPromocao(id);
                }
            );
        }
    );

    const botoesExcluir =
        document.querySelectorAll(
            ".btn-excluir-promocao"
        );

    botoesExcluir.forEach(
        (botao) => {
            botao.addEventListener(
                "click",
                async () => {
                    const id =
                        botao.dataset.id;

                    await excluirPromocao(id);
                }
            );
        }
    );
}

/* ================================
   NOVA / EDITAR
================================ */

function abrirFormulario(promocao = null) {
    const modalExistente =
        document.querySelector(
            ".modal-overlay"
        );

    if (modalExistente) {
        modalExistente.remove();
    }

    const editando =
        promocao !== null;

    const produtoSelecionado =
        promocao?.produto?.idProduto ??
        promocao?.produto?.id ??
        promocao?.idProduto ??
        "";

    const dataInicio =
        promocao?.dataInicio || "";

    const dataFim =
        promocao?.dataFim || "";

    const precoPromocional =
        promocao?.precoPromocional ?? "";

    const opcoesProdutos =
        estado.produtos.map(
            (produto) => {
                const id =
                    produto.idProduto ??
                    produto.id;

                const nome =
                    produto.nomeProduto ||
                    produto.nome ||
                    "Produto";

                const selecionado =
                    String(id) ===
                    String(produtoSelecionado)
                        ? "selected"
                        : "";

                return `
                    <option
                        value="${id}"
                        ${selecionado}
                    >
                        ${escaparHTML(nome)}
                    </option>
                `;
            }
        ).join("");

    /*
     * O elemento principal já é o overlay.
     * Não criamos outro .modal-overlay dentro dele.
     */

    const modal =
        document.createElement("div");

    modal.className =
        "modal-overlay";

    modal.innerHTML = `
        <div class="modal">

            <div class="modal-header">

                <div>
                    <h2>
                        ${
                            editando
                                ? "Editar promoção"
                                : "Nova promoção"
                        }
                    </h2>

                    <span>
                        Preencha os dados da promoção.
                    </span>
                </div>

                <button
                    type="button"
                    class="modal-fechar"
                >
                    ×
                </button>

            </div>

            <form id="formPromocao">

                <div class="campo-formulario">

                    <label for="promocaoProduto">
                        Produto
                    </label>

                    <select
                        id="promocaoProduto"
                        required
                    >

                        <option value="">
                            Selecione um produto
                        </option>

                        ${opcoesProdutos}

                    </select>

                </div>

                <div class="campo-formulario">

                    <label for="promocaoPreco">
                        Preço promocional
                    </label>

                    <input
                        type="number"
                        id="promocaoPreco"
                        min="0"
                        step="0.01"
                        value="${precoPromocional}"
                        placeholder="Ex.: 6.90"
                        required
                    >

                </div>

                <div class="campos-data">

                    <div class="campo-formulario">

                        <label for="promocaoInicio">
                            Data de início
                        </label>

                        <input
                            type="date"
                            id="promocaoInicio"
                            value="${dataInicio}"
                            required
                        >

                    </div>

                    <div class="campo-formulario">

                        <label for="promocaoFim">
                            Data de término
                        </label>

                        <input
                            type="date"
                            id="promocaoFim"
                            value="${dataFim}"
                            required
                        >

                    </div>

                </div>

                <div class="modal-acoes">

                    <button
                        type="button"
                        class="btn-cancelar"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-primary"
                    >
                        ${
                            editando
                                ? "Salvar alterações"
                                : "Criar promoção"
                        }
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    /* ================================
       FECHAR MODAL
    ================================= */

    const fechar =
        modal.querySelector(
            ".modal-fechar"
        );

    const cancelar =
        modal.querySelector(
            ".btn-cancelar"
        );

    fechar.addEventListener(
        "click",
        () => modal.remove()
    );

    cancelar.addEventListener(
        "click",
        () => modal.remove()
    );

    /*
     * Clicar no fundo fecha.
     * Clicar dentro do .modal não fecha.
     */

    modal.addEventListener(
        "click",
        (event) => {
            if (
                event.target === modal
            ) {
                modal.remove();
            }
        }
    );

    /* ================================
       FORMULÁRIO
    ================================= */

    const form =
        modal.querySelector(
            "#formPromocao"
        );

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const idProduto =
                Number(
                    form.querySelector(
                        "#promocaoProduto"
                    ).value
                );

            const preco =
                Number(
                    form.querySelector(
                        "#promocaoPreco"
                    ).value
                );

            const inicio =
                form.querySelector(
                    "#promocaoInicio"
                ).value;

            const fim =
                form.querySelector(
                    "#promocaoFim"
                ).value;

            if (!idProduto) {
                mostrarToast(
                    "Selecione um produto.",
                    "erro"
                );
                return;
            }

            if (!preco || preco <= 0) {
                mostrarToast(
                    "Informe um preço promocional válido.",
                    "erro"
                );
                return;
            }

            if (!inicio || !fim) {
                mostrarToast(
                    "Informe as datas da promoção.",
                    "erro"
                );
                return;
            }

            if (fim < inicio) {
                mostrarToast(
                    "A data de término não pode ser anterior à data de início.",
                    "erro"
                );
                return;
            }

            const dados = {
                precoPromocional: preco,
                dataInicio: inicio,
                dataFim: fim,
                idProduto: idProduto
            };

            const botao =
                form.querySelector(
                    "button[type='submit']"
                );

            try {
                botao.disabled = true;

                if (editando) {

                    await requisicao(
                        `/promocao/${promocao.idPromocao ?? promocao.id}`,
                        {
                            method: "PUT",
                            body: JSON.stringify(dados)
                        }
                    );

                    mostrarToast(
                        "Promoção atualizada com sucesso!",
                        "sucesso"
                    );

                } else {

                    await requisicao(
                        "/promocao",
                        {
                            method: "POST",
                            body: JSON.stringify(dados)
                        }
                    );

                    mostrarToast(
                        "Promoção criada com sucesso!",
                        "sucesso"
                    );
                }

                modal.remove();

                await carregarPromocoes();

            } catch (erro) {

                console.error(
                    "Erro ao salvar promoção:",
                    erro
                );

                mostrarToast(
                    `Não foi possível salvar a promoção: ${erro.message}`,
                    "erro"
                );

            } finally {

                if (botao) {
                    botao.disabled = false;
                }
            }
        }
    );
}

/* ================================
   EDITAR
================================ */

async function editarPromocao(id) {
    try {
        const promocao =
            await requisicao(
                `/promocao/${id}`
            );

        abrirFormulario(promocao);

    } catch (erro) {

        console.error(
            "Erro ao buscar promoção:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar a promoção: ${erro.message}`,
            "erro"
        );
    }
}

/* ================================
   EXCLUIR
================================ */

async function excluirPromocao(id) {
    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta promoção?"
        );

    if (!confirmar) {
        return;
    }

    try {

        await requisicao(
            `/promocao/${id}`,
            {
                method: "DELETE"
            }
        );

        mostrarToast(
            "Promoção excluída com sucesso!",
            "sucesso"
        );

        await carregarPromocoes();

    } catch (erro) {

        console.error(
            "Erro ao excluir promoção:",
            erro
        );

        mostrarToast(
            `Não foi possível excluir a promoção: ${erro.message}`,
            "erro"
        );
    }
}

/* ================================
   STATUS
================================ */

function obterStatusPromocao(promocao) {
    const hoje =
        new Date();

    hoje.setHours(
        0,
        0,
        0,
        0
    );

    const inicio =
        converterDataLocal(
            promocao.dataInicio
        );

    const fim =
        converterDataLocal(
            promocao.dataFim
        );

    if (!inicio || !fim) {
        return "Indefinida";
    }

    if (hoje < inicio) {
        return "Agendada";
    }

    if (hoje > fim) {
        return "Expirada";
    }

    return "Ativa";
}

function obterClasseStatusPromocao(status) {
    const mapa = {
        "Ativa":
            "status-promo-ativa",

        "Expirada":
            "status-promo-expirada",

        "Agendada":
            "status-promo-agendada"
    };

    return mapa[status] ||
        "status-promo-expirada";
}

/* ================================
   PREÇO / DESCONTO
================================ */

function obterPrecoOriginal(produto) {
    if (!produto) {
        return 0;
    }

    return Number(
        produto.precoProduto ??
        produto.preco ??
        produto.valor ??
        0
    );
}

function calcularDesconto(
    precoOriginal,
    precoPromocional
) {
    if (
        precoOriginal <= 0 ||
        precoPromocional >= precoOriginal
    ) {
        return 0;
    }

    const desconto =
        (
            1 -
            (
                precoPromocional /
                precoOriginal
            )
        ) * 100;

    return Math.round(
        desconto
    );
}

/* ================================
   DATAS
================================ */

function converterDataLocal(valor) {
    if (!valor) {
        return null;
    }

    const partes =
        String(valor).split("-");

    if (partes.length !== 3) {
        return null;
    }

    const ano =
        Number(partes[0]);

    const mes =
        Number(partes[1]) - 1;

    const dia =
        Number(partes[2]);

    return new Date(
        ano,
        mes,
        dia
    );
}

function formatarDataCurta(valor) {
    const data =
        converterDataLocal(valor);

    if (!data) {
        return "-";
    }

    return data.toLocaleDateString(
        "pt-BR"
    );
}

/* ================================
   UTILIDADES
================================ */

function formatarMoeda(valor) {
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
        document.createElement("div");

    div.textContent =
        valor ?? "";

    return div.innerHTML;
}

/* ================================
   TOAST
================================ */

function mostrarToast(
    mensagem,
    tipo = "sucesso"
) {
    const toastExistente =
        document.querySelector(
            ".toast-promocao"
        );

    if (toastExistente) {
        toastExistente.remove();
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast-promocao ${tipo}`;

    toast.textContent =
        mensagem;

    document.body.appendChild(toast);

    setTimeout(
        () => toast.remove(),
        3500
    );
}