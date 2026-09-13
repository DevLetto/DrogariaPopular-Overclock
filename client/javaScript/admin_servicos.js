const API_SERVICO = "http://localhost:8080/api/servico";
const API_LOJA = "http://localhost:8080/api/loja";

let servicos = [];
let lojas = [];
let servicoEditando = null;


// ==========================================
// ELEMENTOS
// ==========================================

const tabelaServicos =
    document.getElementById("tabelaServicos");

const btnNovoServico =
    document.getElementById("btnNovoServico");

const modalServico =
    document.getElementById("modalServico");

const btnFecharModal =
    document.getElementById("btnFecharModal");

const btnCancelar =
    document.getElementById("btnCancelar");

const formServico =
    document.getElementById("formServico");

const tituloModal =
    document.getElementById("tituloModal");

const nomeServico =
    document.getElementById("nomeServico");

const descricaoServico =
    document.getElementById("descricaoServico");

const valorServico =
    document.getElementById("valorServico");

const lojaServico =
    document.getElementById("lojaServico");


// ==========================================
// CARREGAR SERVIÇOS
// ==========================================

async function carregarServicos() {

    try {

        const resposta = await fetch(API_SERVICO);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar serviços.");
        }

        servicos = await resposta.json();

        renderizarServicos();

    } catch (erro) {

        console.error("Erro:", erro);

        tabelaServicos.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    style="text-align: center;"
                >
                    Não foi possível carregar os serviços.
                </td>
            </tr>
        `;
    }
}


// ==========================================
// CARREGAR LOJAS
// ==========================================

async function carregarLojas() {

    try {

        const resposta = await fetch(API_LOJA);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar lojas.");
        }

        lojas = await resposta.json();

        preencherSelectLojas();

    } catch (erro) {

        console.error(
            "Erro ao carregar lojas:",
            erro
        );

        lojaServico.innerHTML = `
            <option value="">
                Erro ao carregar lojas
            </option>
        `;
    }
}


// ==========================================
// PREENCHER SELECT DE LOJAS
// ==========================================

function preencherSelectLojas() {

    lojaServico.innerHTML = `
        <option value="">
            Selecione uma loja
        </option>
    `;


    lojas.forEach(loja => {

        const option =
            document.createElement("option");

        option.value = loja.id;

        option.textContent = loja.nome;

        lojaServico.appendChild(option);

    });
}


// ==========================================
// RENDERIZAR SERVIÇOS
// ==========================================

function renderizarServicos() {

    tabelaServicos.innerHTML = "";


    if (servicos.length === 0) {

        tabelaServicos.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    style="text-align: center;"
                >
                    Nenhum serviço cadastrado.
                </td>
            </tr>
        `;

        return;
    }


    servicos.forEach(servico => {

        const linha =
            document.createElement("tr");


        const loja =
            lojas.find(
                loja => loja.id === servico.idLoja
            );


        const nomeLoja =
            loja
                ? loja.nome
                : `Loja #${servico.idLoja}`;


        linha.innerHTML = `

            <td>
                <strong>
                    ${escaparHTML(
                        servico.nome || "-"
                    )}
                </strong>
            </td>


            <td>
                ${escaparHTML(
                    servico.descricao || "-"
                )}
            </td>


            <td>
                ${formatarValor(
                    servico.valor
                )}
            </td>


            <td>
                ${escaparHTML(
                    nomeLoja
                )}
            </td>


            <td class="action-cell">


                <button
                    type="button"
                    class="btn-icon"
                    title="Editar"
                    onclick="abrirEdicao(${servico.id})"
                >

                    <img
                        src="../img/edicao_icon.png"
                        alt="Editar"
                    >

                </button>


                <button
                    type="button"
                    class="btn-icon btn-excluir"
                    title="Excluir"
                    onclick="excluirServico(${servico.id})"
                >

                    🗑️

                </button>


            </td>

        `;


        tabelaServicos.appendChild(linha);

    });
}


// ==========================================
// NOVO SERVIÇO
// ==========================================

btnNovoServico.addEventListener(
    "click",
    abrirNovoServico
);


function abrirNovoServico() {

    servicoEditando = null;

    tituloModal.textContent =
        "Novo serviço";

    formServico.reset();

    lojaServico.value = "";

    modalServico.style.display = "flex";

    nomeServico.focus();
}


// ==========================================
// EDITAR SERVIÇO
// ==========================================

function abrirEdicao(id) {

    const servico =
        servicos.find(
            servico => servico.id === id
        );


    if (!servico) {
        return;
    }


    servicoEditando = id;


    tituloModal.textContent =
        "Editar serviço";


    nomeServico.value =
        servico.nome || "";


    descricaoServico.value =
        servico.descricao || "";


    valorServico.value =
        servico.valor ?? "";


    lojaServico.value =
        servico.idLoja ?? "";


    modalServico.style.display =
        "flex";


    nomeServico.focus();
}


// ==========================================
// FECHAR MODAL
// ==========================================

function fecharModal() {

    modalServico.style.display =
        "none";

    servicoEditando = null;

    formServico.reset();

}


btnFecharModal.addEventListener(
    "click",
    fecharModal
);


btnCancelar.addEventListener(
    "click",
    fecharModal
);


// Fechar clicando fora

modalServico.addEventListener(
    "click",
    function (evento) {

        if (
            evento.target === modalServico
        ) {
            fecharModal();
        }

    }
);


// ==========================================
// SALVAR / ATUALIZAR
// ==========================================

formServico.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();


        const dados = {

            nome:
                nomeServico.value.trim(),

            descricao:
                descricaoServico.value.trim(),

            valor:
                Number(valorServico.value),

            idLoja:
                Number(lojaServico.value)

        };


        // ==================================
        // VALIDAÇÃO
        // ==================================

        if (!dados.nome) {

            alert(
                "Informe o nome do serviço."
            );

            nomeServico.focus();

            return;
        }


        if (
            isNaN(dados.valor) ||
            dados.valor < 0
        ) {

            alert(
                "Informe um valor válido."
            );

            valorServico.focus();

            return;
        }


        if (
            !dados.idLoja ||
            dados.idLoja <= 0
        ) {

            alert(
                "Selecione uma loja."
            );

            lojaServico.focus();

            return;
        }


        try {

            let resposta;


            // ==================================
            // ATUALIZAR
            // ==================================

            if (servicoEditando !== null) {

                resposta = await fetch(
                    `${API_SERVICO}/${servicoEditando}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(dados)
                    }
                );

            }


            // ==================================
            // CRIAR
            // ==================================

            else {

                resposta = await fetch(
                    API_SERVICO,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(dados)
                    }
                );

            }


            if (!resposta.ok) {

                const erro =
                    await resposta.text();

                console.error(
                    "Erro da API:",
                    erro
                );


                throw new Error(
                    servicoEditando !== null
                        ? "Não foi possível atualizar o serviço."
                        : "Não foi possível cadastrar o serviço."
                );
            }


            fecharModal();


            await carregarServicos();


            alert(
                servicoEditando !== null
                    ? "Serviço atualizado com sucesso!"
                    : "Serviço cadastrado com sucesso!"
            );


        } catch (erro) {

            console.error(
                "Erro:",
                erro
            );

            alert(
                erro.message
            );
        }

    }
);


// ==========================================
// EXCLUIR SERVIÇO
// ==========================================

async function excluirServico(id) {

    const servico =
        servicos.find(
            servico => servico.id === id
        );


    if (!servico) {
        return;
    }


    const confirmar = confirm(
        `Deseja realmente excluir o serviço "${servico.nome}"?`
    );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_SERVICO}/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!resposta.ok) {

            const erro =
                await resposta.text();

            console.error(
                "Erro da API:",
                erro
            );


            throw new Error(
                "Não foi possível excluir o serviço."
            );
        }


        await carregarServicos();


        alert(
            "Serviço excluído com sucesso!"
        );


    } catch (erro) {

        console.error(
            "Erro:",
            erro
        );

        alert(
            erro.message
        );
    }
}


// ==========================================
// FORMATAR VALOR
// ==========================================

function formatarValor(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "-";
    }


    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function inicializar() {

    await carregarLojas();

    await carregarServicos();

}


inicializar();