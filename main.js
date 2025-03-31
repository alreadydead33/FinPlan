// Configurações e utilitários
const INVESTMENT_TYPES = {
    stock: { name: 'Ação', icon: 'fa-chart-line', color: 'text-blue-500' },
    fii: { name: 'FII', icon: 'fa-building', color: 'text-green-500' },
    etf: { name: 'ETF', icon: 'fa-boxes', color: 'text-purple-500' },
    fixed: { name: 'Renda Fixa', icon: 'fa-coins', color: 'text-yellow-500' }
};

function formatMoney(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calculateProfit(current, invested) {
    const value = current - invested;
    const percent = (value / invested) * 100;
    return { value, percent };
}

// Gerenciamento de investimentos
function getInvestments() {
    return JSON.parse(localStorage.getItem('investments')) || [];
}

function saveInvestments(data) {
    localStorage.setItem('investments', JSON.stringify(data));
}

// Simulação de API (substituir por API real)
async function fetchInvestmentData(code, type) {
    // Simulação - retorna dados aleatórios para demonstração
    return new Promise(resolve => {
        setTimeout(() => {
            const baseValue = 50 + Math.random() * 150;
            const variation = (Math.random() - 0.5) * 20;
            resolve({
                currentValue: baseValue + variation,
                lastUpdate: new Date().toISOString()
            });
        }, 500);
    });
}

// Atualiza a tabela de investimentos
async function updateInvestmentsTable() {
    const investments = getInvestments();
    const tableBody = document.getElementById('investmentTable');
    const totalInvestedEl = document.getElementById('totalInvested');
    const currentValueEl = document.getElementById('currentValue');
    const profitLossEl = document.getElementById('profitLoss');
    
    if (!tableBody) return;

    let totalInvested = 0;
    let currentTotal = 0;
    
    tableBody.innerHTML = '';

    for (const inv of investments) {
        const data = await fetchInvestmentData(inv.code, inv.type);
        const currentValue = data.currentValue * inv.shares;
        const { value: profit, percent } = calculateProfit(currentValue, inv.amount);
        
        totalInvested += inv.amount;
        currentTotal += currentValue;

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <i class="fas ${INVESTMENT_TYPES[inv.type].icon} ${INVESTMENT_TYPES[inv.type].color} mr-2"></i>
                    <span>${INVESTMENT_TYPES[inv.type].name}</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap font-mono">${inv.code}</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatMoney(inv.amount)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatMoney(currentValue)}</td>
            <td class="px-6 py-4 whitespace-nowrap ${profit >= 0 ? 'text-green-500' : 'text-red-500'}">
                ${formatMoney(profit)} (${percent.toFixed(2)}%)
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-red-500 hover:text-red-700 delete-btn" data-id="${inv.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    }

    if (totalInvestedEl && currentValueEl && profitLossEl) {
        totalInvestedEl.textContent = formatMoney(totalInvested);
        currentValueEl.textContent = formatMoney(currentTotal);
        const { value: totalProfit, percent: totalPercent } = calculateProfit(currentTotal, totalInvested);
        profitLossEl.textContent = `${formatMoney(totalProfit)} (${totalPercent.toFixed(2)}%)`;
        profitLossEl.className = `font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`;
    }
}

// Exportar investimentos para CSV
function exportInvestmentsToCSV() {
    const investments = getInvestments();
    if (investments.length === 0) {
        alert('Nenhum investimento para exportar');
        return;
    }

    const headers = ['Tipo', 'Código', 'Valor Investido', 'Data'];
    const rows = investments.map(inv => [
        INVESTMENT_TYPES[inv.type].name,
        inv.code,
        inv.amount,
        new Date(inv.date).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `investimentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Exportar orçamento para Excel
function exportBudgetToExcel() {
    const income = parseFloat(localStorage.getItem('monthlyIncome'));
    if (!income) {
        alert('Por favor, insira sua renda primeiro');
        return;
    }

    const needsPercent = parseInt(localStorage.getItem('needsPercent')) || 50;
    const wantsPercent = parseInt(localStorage.getItem('wantsPercent')) || 30;
    const savingsPercent = parseInt(localStorage.getItem('savingsPercent')) || 20;

    const expenses = JSON.parse(localStorage.getItem('expenses')) || { needs: 0, wants: 0, savings: 0 };

    const csvContent = [
        ['Categoria', 'Percentual', 'Valor Alocado', 'Valor Gasto', 'Saldo'],
        ['Renda Total', '100%', formatMoney(income), '', ''],
        ['Necessidades', `${needsPercent}%`, formatMoney(income * needsPercent / 100), formatMoney(expenses.needs), formatMoney(income * needsPercent / 100 - expenses.needs)],
        ['Desejos', `${wantsPercent}%`, formatMoney(income * wantsPercent / 100), formatMoney(expenses.wants), formatMoney(income * wantsPercent / 100 - expenses.wants)],
        ['Poupança', `${savingsPercent}%`, formatMoney(income * savingsPercent / 100), formatMoney(expenses.savings), formatMoney(income * savingsPercent / 100 - expenses.savings)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orcamento_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Registrar gastos
function registerExpense(category, amount) {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || { needs: 0, wants: 0, savings: 0 };
    expenses[category] = (expenses[category] || 0) + amount;
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateBudgetDisplay();
}

// Atualizar exibição do orçamento
function updateBudgetDisplay() {
    const income = parseFloat(localStorage.getItem('monthlyIncome'));
    if (!income) return;

    const expenses = JSON.parse(localStorage.getItem('expenses')) || { needs: 0, wants: 0, savings: 0 };
    const needsPercent = parseInt(localStorage.getItem('needsPercent')) || 50;
    const wantsPercent = parseInt(localStorage.getItem('wantsPercent')) || 30;
    const savingsPercent = parseInt(localStorage.getItem('savingsPercent')) || 20;

    const needs = income * needsPercent / 100;
    const wants = income * wantsPercent / 100;
    const savings = income * savingsPercent / 100;

    if (document.getElementById('needsAmount')) {
        document.getElementById('needsAmount').textContent = formatMoney(needs - expenses.needs);
        document.getElementById('wantsAmount').textContent = formatMoney(wants - expenses.wants);
        document.getElementById('savingsAmount').textContent = formatMoney(savings - expenses.savings);
    }
}

// Inicialização da página de investimentos
function initInvestmentPage() {
    document.getElementById('investmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.getElementById('investmentType').value;
        const code = document.getElementById('investmentCode').value.trim().toUpperCase();
        const amount = parseFloat(document.getElementById('investmentValue').value);
        
        if (!code || isNaN(amount) || amount <= 0) {
            alert('Preencha todos os campos corretamente');
            return;
        }

        const data = await fetchInvestmentData(code, type);
        const shares = amount / data.currentValue;
        
        const investments = getInvestments();
        investments.push({
            id: Date.now(),
            type,
            code,
            amount,
            shares,
            date: new Date().toISOString()
        });
        
        saveInvestments(investments);
        document.getElementById('investmentForm').reset();
        await updateInvestmentsTable();
    });

    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await updateInvestmentsTable();
    });

    document.getElementById('exportInvestmentsBtn').addEventListener('click', exportInvestmentsToCSV);

    // Delegation para botões de deletar
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const id = parseInt(e.target.dataset.id || e.target.closest('.delete-btn').dataset.id);
            const investments = getInvestments().filter(inv => inv.id !== id);
            saveInvestments(investments);
            await updateInvestmentsTable();
        }
    });

    updateInvestmentsTable();
}

// Geração de sugestões
function generateSuggestions() {
    const income = parseFloat(localStorage.getItem('monthlyIncome'));
    if (!income) return;

    const needsPercent = parseInt(localStorage.getItem('needsPercent')) || 50;
    const wantsPercent = parseInt(localStorage.getItem('wantsPercent')) || 30;
    const savingsPercent = parseInt(localStorage.getItem('savingsPercent')) || 20;

    const needs = income * needsPercent / 100;
    const wants = income * wantsPercent / 100;
    const savings = income * savingsPercent / 100;

    const expenses = JSON.parse(localStorage.getItem('expenses')) || { needs: 0, wants: 0, savings: 0 };
    
    const suggestions = [
        `Aloque até ${formatMoney(needs * 0.4)} para moradia (40% das necessidades)`,
        `Reserve ${formatMoney(wants * 0.2)} para lazer (20% dos desejos)`,
        `Considere investir ${formatMoney(savings * 0.5)} em fundos de renda fixa (50% da poupança)`,
        expenses.needs > needs * 0.8 ? `⚠️ Atenção: Você já gastou ${formatMoney(expenses.needs)} em necessidades (${(expenses.needs/needs*100).toFixed(0)}% do orçamento)` : '',
        expenses.wants > wants * 0.7 ? `⚠️ Cuidado: Você já gastou ${formatMoney(expenses.wants)} em desejos (${(expenses.wants/wants*100).toFixed(0)}% do orçamento)` : '',
        `Saldo disponível para investir: ${formatMoney(savings - expenses.savings)}`
    ].filter(Boolean); // Remove strings vazias

    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestionsList) {
        suggestionsList.innerHTML = '';
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.className = 'flex items-start';
            li.innerHTML = `
                <i class="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                <span>${suggestion}</span>
            `;
            suggestionsList.appendChild(li);
        });
    }
}

// Inicialização principal
document.addEventListener('DOMContentLoaded', function() {
    // Página inicial
    if (document.getElementById('incomeForm')) {
        document.getElementById('incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const income = parseFloat(document.getElementById('income').value);
            
            if (isNaN(income) || income <= 0) {
                alert('Por favor, insira um valor válido para a renda');
                return;
            }
            
            localStorage.setItem('monthlyIncome', income);
            window.location.href = 'dashboard.html';
        });
    }
    
    // Dashboard
    if (document.getElementById('needsProgress')) {
        updateBudgetDisplay();
        generateSuggestions();
        
        // Exportar para Excel
        if (document.getElementById('exportBtn')) {
            document.getElementById('exportBtn').addEventListener('click', exportBudgetToExcel);
        }
        
        // Registrar gastos
        if (document.getElementById('expenseForm')) {
            document.getElementById('expenseForm').addEventListener('submit', (e) => {
                e.preventDefault();
                const category = document.getElementById('expenseCategory').value;
                const amount = parseFloat(document.getElementById('expenseAmount').value);
                
                if (isNaN(amount) || amount <= 0) {
                    alert('Por favor, insira um valor válido');
                    return;
                }
                
                registerExpense(category, amount);
                document.getElementById('expenseForm').reset();
                alert('Gasto registrado com sucesso!');
                updateBudgetDisplay();
                generateSuggestions();
            });
        }
    }
    
    // Página de configurações
    if (document.getElementById('settingsForm')) {
        document.getElementById('needsPercent').value = localStorage.getItem('needsPercent') || 50;
        document.getElementById('wantsPercent').value = localStorage.getItem('wantsPercent') || 30;
        document.getElementById('savingsPercent').value = localStorage.getItem('savingsPercent') || 20;
        
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const needsPercent = parseInt(document.getElementById('needsPercent').value);
            const wantsPercent = parseInt(document.getElementById('wantsPercent').value);
            const savingsPercent = parseInt(document.getElementById('savingsPercent').value);
            
            if (needsPercent + wantsPercent + savingsPercent !== 100) {
                alert('A soma dos percentuais deve ser igual a 100%');
                return;
            }
            
            localStorage.setItem('needsPercent', needsPercent);
            localStorage.setItem('wantsPercent', wantsPercent);
            localStorage.setItem('savingsPercent', savingsPercent);
            alert('Configurações salvas com sucesso!');
            updateBudgetDisplay();
            generateSuggestions();
        });
    }
    
    // Página de investimentos
    if (document.getElementById('investmentForm')) {
        initInvestmentPage();
    }
});