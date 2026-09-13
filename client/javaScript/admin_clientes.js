const API_CLIENTE = "http://localhost:8080/api/cliente";

let clientes = [];

const tabelaClientes = document.getElementById("tabelaClientes");
const campoBusca = document.getElementById("campoBusca");


// ==========================================
// CARREGAR CLIENTES
// ==========================================

async function carregarClientes() {

    try {

        const resposta = await fetch(API_CLIENTE);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar clientes.");
        }

        clientes = await resposta.json();

        renderizarClientes(clientes);

    } catch (erro) {

        console.error("Erro:", erro);

        tabelaClientes.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">
                    Não foi possível carregar os clientes.
                </td>
            </tr>
        `;
    }
}


// ==========================================
// RENDERIZAR CLIENTES
// ==========================================

function renderizarClientes(lista) {

    tabelaClientes.innerHTML = "";

    if (lista.length === 0) {

        tabelaClientes.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">
                    Nenhum cliente encontrado.
                </td>
            </tr>
        `;

        return;
    }


    lista.forEach(cliente => {

        const linha = document.createElement("tr");

        const cpfFormatado = formatarCPF(cliente.cpf);

        const aprovado = cliente.contaAprovada === true;


        linha.innerHTML = `
            <td>
                <strong>
                    ${escaparHTML(cliente.nome || "-")}
                </strong>
            </td>

            <td>
                ${cpfFormatado}
            </td>

            <td>
                ${escaparHTML(cliente.email || "-")}
            </td>

            <td>

                <span class="status-badge ${aprovado
                    ? "status-aprovado"
                    : "status-pendente"}">

                    ${aprovado ? "Aprovado" : "Não aprovado"}

                </span>

            </td>

            <td>

                <button
                    type="button"
                    class="btn-status ${aprovado
                        ? "btn-reprovar"
                        : "btn-aprovar"}"
                    onclick="alterarAprovacao(
                        ${cliente.idCliente},
                        ${!aprovado}
                    )"
                >

                    ${aprovado ? "Desaprovar" : "Aprovar"}

                </button>

            </td>
        `;

        tabelaClientes.appendChild(linha);

    });
}


// ==========================================
// ALTERAR APROVAÇÃO DO CLIENTE
// ==========================================

async function alterarAprovacao(idCliente, aprovado) {

    const acao = aprovado ? "aprovar" : "desaprovar";


    const confirmar = confirm(
        `Deseja realmente ${acao} este cliente?`
    );


    if (!confirmar) {
        return;
    }


    try {

        const resposta = await fetch(
            `${API_CLIENTE}/${idCliente}/aprovacao?aprovado=${aprovado}`,
            {
                method: "PUT"
            }
        );


        if (!resposta.ok) {

            const erro = await resposta.text();

            console.error("Erro da API:", erro);

            throw new Error(
                `Não foi possível ${acao} o cliente.`
            );
        }


        const clienteAtualizado = await resposta.json();


        // Procurar o cliente na lista
        const indice = clientes.findIndex(
            cliente => cliente.idCliente === idCliente
        );


        // Atualizar cliente localmente
        if (indice !== -1) {
            clientes[indice] = clienteAtualizado;
        }


        // Atualizar tabela
        aplicarFiltro();


        alert(
            aprovado
                ? "Cliente aprovado com sucesso!"
                : "Cliente desaprovado com sucesso!"
        );


    } catch (erro) {

        console.error("Erro:", erro);

        alert(erro.message);
    }
}


// ==========================================
// BUSCAR CLIENTE
// ==========================================

campoBusca.addEventListener(
    "input",
    aplicarFiltro
);


function aplicarFiltro() {

    const termo = campoBusca.value
        .toLowerCase()
        .trim();


    // Se não tiver busca, mostra todos
    if (!termo) {

        renderizarClientes(clientes);

        return;
    }


    const resultado = clientes.filter(cliente => {

        const nome = cliente.nome
            ? cliente.nome.toLowerCase()
            : "";


        const cpf = cliente.cpf
            ? cliente.cpf.replace(/\D/g, "")
            : "";


        const buscaCPF = termo.replace(/\D/g, "");


        return (
            nome.includes(termo) ||
            cpf.includes(buscaCPF)
        );

    });


    renderizarClientes(resultado);
}


// ==========================================
// FORMATAR CPF
// ==========================================

function formatarCPF(cpf) {

    if (!cpf) {
        return "-";
    }


    const numeros = cpf.replace(/\D/g, "");


    // Se não tiver 11 números,
    // mantém o valor original
    if (numeros.length !== 11) {
        return cpf;
    }


    return numeros.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        "$1.$2.$3-$4"
    );
}


// ==========================================
// EVITAR HTML INJETADO
// ==========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

carregarClientes();