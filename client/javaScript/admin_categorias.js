const API_BASE_URL = "http://localhost:8080/api";

const estado = {
    categorias: []
};

document.addEventListener("DOMContentLoaded", () => {
    inicializar();
});

async function inicializar() {
    configurarEventos();
    await carregarCategorias();
}

/* ================================
   EVENTOS
================================ */

function configurarEventos() {
    const botaoNovaCategoria =
        document.querySelector(
            "#btnNovaCategoria"
        );

    if (botaoNovaCategoria) {
        botaoNovaCategoria.addEventListener(
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

        } catch (_) {}

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

/* ================================
   CARREGAR CATEGORIAS
================================ */

async function carregarCategorias() {
    try {
        const categorias =
            await requisicao(
                "/categoria"
            );

        estado.categorias =
            Array.isArray(categorias)
                ? categorias
                : [];

        renderizarTabela();

    } catch (erro) {

        console.error(
            "Erro ao carregar categorias:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar as categorias: ${erro.message}`,
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
            "#tabelaCategorias"
        );

    if (!tabela) {
        return;
    }

    tabela.innerHTML = "";

    if (estado.categorias.length === 0) {

        tabela.innerHTML = `
            <tr>
                <td
                    colspan="2"
                    style="text-align: center; padding: 30px;"
                >
                    Nenhuma categoria cadastrada.
                </td>
            </tr>
        `;

        return;
    }

    estado.categorias.forEach(
        (categoria) => {

            const linha =
                criarLinhaCategoria(
                    categoria
                );

            tabela.appendChild(linha);
        }
    );

    adicionarEventosTabela();
}

/* ================================
   LINHA DA TABELA
================================ */

function criarLinhaCategoria(categoria) {
    const tr =
        document.createElement("tr");

    const id =
        categoria.id;

    const nome =
        categoria.nome ||
        "Categoria";

    const icone =
        obterIconeCategoria(nome);

    tr.innerHTML = `
        <td>

            <div class="categoria-nome-celula">

                <div class="categoria-icon-box">

                    <img
                        src="${icone}"
                        alt=""
                    >

                </div>

                <strong>
                    ${escaparHTML(nome)}
                </strong>

            </div>

        </td>

        <td class="action-cell">

            <button
                type="button"
                class="btn-icon btn-editar-categoria"
                title="Editar"
                data-id="${id}"
            >
                <img
                    src="../img/edicao_icon.png"
                    alt="Editar"
                >
            </button>

            <button
                type="button"
                class="btn-icon btn-excluir-categoria"
                title="Excluir"
                data-id="${id}"
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
            ".btn-editar-categoria"
        );

    botoesEditar.forEach(
        (botao) => {

            botao.addEventListener(
                "click",
                async () => {

                    const id =
                        botao.dataset.id;

                    await editarCategoria(id);
                }
            );
        }
    );

    const botoesExcluir =
        document.querySelectorAll(
            ".btn-excluir-categoria"
        );

    botoesExcluir.forEach(
        (botao) => {

            botao.addEventListener(
                "click",
                async () => {

                    const id =
                        botao.dataset.id;

                    await excluirCategoria(id);
                }
            );
        }
    );
}

/* ================================
   NOVA / EDITAR
================================ */

function abrirFormulario(categoria = null) {

    const modalExistente =
        document.querySelector(
            ".modal-overlay"
        );

    if (modalExistente) {
        modalExistente.remove();
    }

    const editando =
        categoria !== null;

    const nomeAtual =
        categoria?.nome || "";

    const modal =
        document.createElement("div");

    /*
     * O elemento principal já é o overlay.
     * Não existe outro .modal-overlay dentro dele.
     */

    modal.className =
        "modal-overlay";

    modal.innerHTML = `
        <div class="modal">

            <div class="modal-header">

                <div>

                    <h2>
                        ${
                            editando
                                ? "Editar categoria"
                                : "Nova categoria"
                        }
                    </h2>

                    <span>
                        Informe o nome da categoria.
                    </span>

                </div>

                <button
                    type="button"
                    class="modal-fechar"
                >
                    ×
                </button>

            </div>

            <form id="formCategoria">

                <div class="campo-formulario">

                    <label for="categoriaNome">
                        Nome da categoria
                    </label>

                    <input
                        type="text"
                        id="categoriaNome"
                        value="${escaparHTML(nomeAtual)}"
                        placeholder="Ex.: Medicamentos"
                        maxlength="100"
                        required
                    >

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
                                : "Criar categoria"
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
     * Fecha somente quando clicar
     * no fundo escuro.
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
            "#formCategoria"
        );

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const nome =
                form.querySelector(
                    "#categoriaNome"
                ).value.trim();

            if (!nome) {

                mostrarToast(
                    "Informe o nome da categoria.",
                    "erro"
                );

                return;
            }

            const dados = {
                nome: nome
            };

            const botao =
                form.querySelector(
                    "button[type='submit']"
                );

            try {

                botao.disabled = true;

                if (editando) {

                    await requisicao(
                        `/categoria/${categoria.id}`,
                        {
                            method: "PUT",
                            body: JSON.stringify(dados)
                        }
                    );

                    mostrarToast(
                        "Categoria atualizada com sucesso!",
                        "sucesso"
                    );

                } else {

                    await requisicao(
                        "/categoria",
                        {
                            method: "POST",
                            body: JSON.stringify(dados)
                        }
                    );

                    mostrarToast(
                        "Categoria criada com sucesso!",
                        "sucesso"
                    );
                }

                modal.remove();

                await carregarCategorias();

            } catch (erro) {

                console.error(
                    "Erro ao salvar categoria:",
                    erro
                );

                mostrarToast(
                    `Não foi possível salvar a categoria: ${erro.message}`,
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

async function editarCategoria(id) {

    try {

        const categoria =
            await requisicao(
                `/categoria/${id}`
            );

        abrirFormulario(categoria);

    } catch (erro) {

        console.error(
            "Erro ao buscar categoria:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar a categoria: ${erro.message}`,
            "erro"
        );
    }
}

/* ================================
   EXCLUIR
================================ */

async function excluirCategoria(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta categoria?"
        );

    if (!confirmar) {
        return;
    }

    try {

        await requisicao(
            `/categoria/${id}`,
            {
                method: "DELETE"
            }
        );

        mostrarToast(
            "Categoria excluída com sucesso!",
            "sucesso"
        );

        await carregarCategorias();

    } catch (erro) {

        console.error(
            "Erro ao excluir categoria:",
            erro
        );

        mostrarToast(
            `Não foi possível excluir a categoria: ${erro.message}`,
            "erro"
        );
    }
}

/* ================================
   ÍCONE DA CATEGORIA
================================ */

function obterIconeCategoria(nome) {

    const texto =
        String(nome)
            .toLowerCase();

    if (
        texto.includes("medic") ||
        texto.includes("farm")
    ) {
        return "../img/medicamentos_icon.png";
    }

    if (
        texto.includes("higiene") ||
        texto.includes("cuidado")
    ) {
        return "../img/higiene_icon.png";
    }

    if (
        texto.includes("infantil") ||
        texto.includes("bebê") ||
        texto.includes("bebe")
    ) {
        return "../img/infantil_icon.png";
    }

    if (
        texto.includes("cabel") ||
        texto.includes("capilar")
    ) {
        return "../img/cabelos_icon.png";
    }

    if (
        texto.includes("unha")
    ) {
        return "../img/unhas_icon.png";
    }

    return "../img/categorias_icon.png";
}

/* ================================
   UTILIDADES
================================ */

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
            ".toast-categoria"
        );

    if (toastExistente) {
        toastExistente.remove();
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast-categoria ${tipo}`;

    toast.textContent =
        mensagem;

    document.body.appendChild(toast);

    setTimeout(
        () => toast.remove(),
        3500
    );
}