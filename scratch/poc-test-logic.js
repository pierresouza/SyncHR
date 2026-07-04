/**
 * SyncHR - Prova de Conceito (PoC)
 * Teste de Lógica e Regras de Negócio Isoladas
 * 
 * Este script valida:
 * 1. Regra de Negócio F-05 (RN01 & RN02): Validação de histórico de 1:1 nos últimos 45 dias
 *    para abertura de mediação no RH, com bypass automático para desvios de ética/assédio.
 * 2. Filtro e Alinhamento de Privacidade (LGPD): Validação de segurança nos inputs enviados à IA.
 */

// Simulador de Banco de Dados Em Memória (Simulando Prisma)
const db = {
    // Tabela de Reuniões 1:1 registradas
    oneOnOnes: [
        { id: 101, leaderId: 1, collaboratorId: 10, date: new Date("2026-06-25"), context: "Alinhamento de tarefas e metas" },
        { id: 102, leaderId: 1, collaboratorId: 10, date: new Date("2026-06-10"), context: "PDI e plano de carreira" },
        { id: 103, leaderId: 2, collaboratorId: 11, date: new Date("2026-04-15"), context: "Feedback trimestral" }, // Antigo (>45 dias)
    ],
    // Tabela de Colaboradores
    collaborators: [
        { id: 10, name: "Colaborador A", level: "L2" },
        { id: 11, name: "Colaborador B", level: "L4" },
    ]
};

/**
 * RN01 / RN02: Função de Validação de Escalação de Conflito
 */
function checkEscalationRules(collaboratorId, incidentType, description) {
    console.log(`\n🔍 Analisando solicitação de mediação para Colaborador ID: ${collaboratorId} | Tipo: ${incidentType}`);
    
    // RN02: Denúncias graves de assédio ou quebra ética pulam a validação de 1:1
    if (incidentType === "ETHICS_VIOLATION" || incidentType === "HARASSMENT") {
        return {
            status: "APPROVED_DIRECT_BYPASS",
            protocol: `SHR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            message: "Escalação direta ao RH aprovada. Por se tratar de caso grave/ético, a regra de histórico de 1:1 foi ignorada."
        };
    }

    // RN01: Casos comuns exigem pelo menos uma 1:1 registrada recentemente (45 dias)
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    // Simulando query do Prisma: 
    // prisma.oneOnOne.findFirst({ where: { collaboratorId, date: { gte: fortyFiveDaysAgo } } })
    const recent1on1s = db.oneOnOnes.filter(item => 
        item.collaboratorId === collaboratorId && 
        item.date >= fortyFiveDaysAgo
    );

    if (recent1on1s.length === 0) {
        return {
            status: "BLOCKED",
            error: "REQUISITO_NAO_ATENDIDO",
            message: "Erro de Validação: Não há registros de reuniões de 1:1 nos últimos 45 dias com este colaborador. É obrigatório tentar resolver o desalinhamento em conversas diretas antes de escalar ao RH."
        };
    }

    // Se passou, gera protocolo
    return {
        status: "APPROVED_WITH_HISTORY",
        protocol: `SHR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        message: `Solicitação aceita. Histórico de ${recent1on1s.length} reuniões de 1:1 recente(s) anexado com sucesso.`,
        historyAttached: recent1on1s.map(r => ({ id: r.id, date: r.date.toISOString().split('T')[0], context: r.context }))
    };
}

/**
 * Validador LGPD: Detecta dados sensíveis pessoais antes de enviar o prompt à LLM
 */
function validateLGPDSecurity(inputText) {
    const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // Nomes próprios comuns ou indicativos de dados pessoais nominativos
    const blacklistWords = ["CPF", "RG", "nascimento", "médico", "saúde", "atestado", "advertência nominal"];
    
    const containsCPF = cpfRegex.test(inputText);
    const containsEmail = emailRegex.test(inputText);
    
    // Usar regex ou limites de palavras para evitar falso-positivo em substring como "rg" em "sobrecarga"
    const foundBlacklistWords = blacklistWords.filter(word => {
        if (word === "RG") {
            return new RegExp('\\bRG\\b', 'i').test(inputText);
        }
        return inputText.toLowerCase().includes(word.toLowerCase());
    });

    const isSafe = !containsCPF && !containsEmail && foundBlacklistWords.length === 0;

    return {
        isSafe,
        details: {
            containsCPF,
            containsEmail,
            foundBlacklistWords
        }
    };
}

// ==========================================
// EXECUÇÃO DOS CASOS DE TESTE (EXECUTE POc)
// ==========================================

console.log("=========================================");
console.log("INICIANDO EXECUÇÃO DE TESTE DA SOLUÇÃO (PoC)");
console.log("=========================================");

// CASO 1: Colaborador A (id: 10) tem 1:1 recente (Junho 2026, atualidade é Julho 2026)
const testCase1 = checkEscalationRules(10, "PERFORMANCE_DISPUTE", "Atrasos em entregas e desalinhamento");
console.log("Resultado Caso 1:", JSON.stringify(testCase1, null, 2));

// CASO 2: Colaborador B (id: 11) só tem 1:1 em Abril (mais de 45 dias)
const testCase2 = checkEscalationRules(11, "EXPECTATION_ALIGNMENT", "Colaborador cobrando promoção");
console.log("Resultado Caso 2:", JSON.stringify(testCase2, null, 2));

// CASO 3: Colaborador B (id: 11) - Denúncia Grave (Bypass de histórico)
const testCase3 = checkEscalationRules(11, "HARASSMENT", "Assédio moral sofrido em reunião");
console.log("Resultado Caso 3:", JSON.stringify(testCase3, null, 2));


console.log("\n=========================================");
console.log("INICIANDO TESTES DE SEGURANÇA E LGPD");
console.log("=========================================");

const promptUnsafe = "Solicito ajuda para o colaborador João Silva, CPF 123.456.789-00 que está de atestado médico.";
console.log(`Prompt Analisado: "${promptUnsafe}"`);
console.log("Resultado Segurança:", validateLGPDSecurity(promptUnsafe));

const promptSafe = "Colaborador sênior L4 com perfil analítico demonstrando frustração com sobrecarga de prazos na sprint.";
console.log(`\nPrompt Analisado: "${promptSafe}"`);
console.log("Resultado Segurança:", validateLGPDSecurity(promptSafe));
