const API_URL = 'https://script.google.com/macros/s/AKfycbxHJcgE1V5unNExnWXbfKnHRm4U_J2z9bfTwwXsPU2-jjx3i9KP8wtWbOuWz4K5RgIf/exec';

const form = document.getElementById('accounting-form');
const transactionList = document.getElementById('transaction-list');
const dailyBudgetDisplay = document.getElementById('daily-budget-display');
const todaySpentDisplay = document.getElementById('today-spent-display');
const remainingAmountDisplay = document.getElementById('remaining-amount-display');
const transactionsTitle = document.getElementById('transactions-title');
const toggleViewButton = document.getElementById('toggle-view-button');
const showSummaryButton = document.getElementById('show-summary-button');
const tableHeaders = document.getElementById('table-headers');
const submitButton = document.getElementById('submit-button');
const loadingSpinner = document.getElementById('loading-spinner');
const dateInput = document.getElementById('date');
const monthlyRemainingTotal = document.getElementById('monthly-remaining-total');

let allTransactions = [];
let dailySummaries = {};
let isShowingSummary = false;
let isShowingToday = true;

async function fetchTransactions() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        allTransactions = data.transactions;
        dailySummaries = data.dailySummaries;

        dailyBudgetDisplay.textContent = `$${data.daily_budget}`;
        todaySpentDisplay.textContent = `$${data.today_spent}`;
        remainingAmountDisplay.textContent = `$${data.remaining_amount}`;

        remainingAmountDisplay.classList.remove('positive', 'negative');
        if (data.remaining_amount >= 0) {
            remainingAmountDisplay.classList.add('positive');
        } else {
            remainingAmountDisplay.classList.add('negative');
        }

        updateTableDisplay();

    } catch (error) {
        console.error('Error fetching data:', error);
        transactionList.innerHTML = `<tr><td colspan="5" style="text-align: center;">載入失敗</td></tr>`;
    }
}

function updateTableDisplay() {
    if (isShowingSummary) {
        displayDailySummaries();
    } else {
        displayTransactions(isShowingToday ? 'today' : 'month');
    }
}

function displayTransactions(filter) {
    let recordsToShow = [];
    const today = new Date().toISOString().split('T')[0];

    if (filter === 'today') {
        recordsToShow = allTransactions.filter(record => record.日期 === today);
        transactionsTitle.textContent = `今日紀錄`;
    } else if (filter === 'month') {
        const monthString = today.substring(0, 7);
        recordsToShow = allTransactions.filter(record => record.日期.startsWith(monthString));
        transactionsTitle.textContent = "當月所有紀錄";
    }
    
    tableHeaders.innerHTML = `
        <th>日期</th>
        <th>類別</th>
        <th>項目</th>
        <th>金額</th>
        <th>備註</th>
    `;

    transactionList.innerHTML = '';
    
    if (recordsToShow && recordsToShow.length > 0) {
        recordsToShow.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.日期}</td>
                <td>${record.類別}</td>
                <td>${record.項目}</td>
                <td>${record.金額}</td>
                <td>${record.備註 || ''}</td>
            `;
            transactionList.appendChild(row);
        });
    } else {
        transactionList.innerHTML = `<tr><td colspan="5" style="text-align: center;">尚無紀錄</td></tr>`;
    }
    monthlyRemainingTotal.style.display = 'none';
}

function displayDailySummaries() {
    transactionsTitle.textContent = '每日總結';
    tableHeaders.innerHTML = `
        <th>日期</th>
        <th>每日預算</th>
        <th>每日花費</th>
        <th>每日剩餘</th>
    `;
    
    transactionList.innerHTML = '';
    
    let totalRemaining = 0;
    const today = new Date().toISOString().split('T')[0];
    const monthString = today.substring(0, 7);
    
    if (Object.keys(dailySummaries).length > 0) {
        const sortedDates = Object.keys(dailySummaries).sort((a, b) => new Date(a) - new Date(b));
        sortedDates.forEach(date => {
            const summary = dailySummaries[date];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>$${summary.daily_budget}</td>
                <td>$${summary.today_spent}</td>
                <td>$${summary.remaining_amount}</td>
            `;
            transactionList.appendChild(row);

            if (date.startsWith(monthString)) {
                totalRemaining += summary.remaining_amount;
            }
        });
    } else {
        transactionList.innerHTML = `<tr><td colspan="4" style="text-align: center;">尚無總結紀錄</td></tr>`;
    }
    monthlyRemainingTotal.textContent = `當月每日剩餘總和：$${totalRemaining.toFixed(0)}`;
    monthlyRemainingTotal.style.display = 'inline';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitButton.style.display = 'none';
    loadingSpinner.style.display = 'block';
    submitButton.disabled = true;
    
    const newRecord = {
        日期: dateInput.value,
        類別: document.getElementById('category').value,
        項目: document.getElementById('item').value,
        金額: parseFloat(document.getElementById('amount').value),
        備註: document.getElementById('notes').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(newRecord),
            redirect: 'follow'
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert('新增成功！');
            form.reset();
            dateInput.value = new Date().toISOString().split('T')[0];
            fetchTransactions();
        } else {
            alert(`新增失敗：${result.message}`);
        }

    } catch (error) {
        console.error('Error submitting form:', error);
        alert('新增失敗，請稍後再試。');
    } finally {
        submitButton.style.display = 'block';
        loadingSpinner.style.display = 'none';
        submitButton.disabled = false;
    }
});

toggleViewButton.addEventListener('click', () => {
    isShowingSummary = false;
    isShowingToday = !isShowingToday;
    if (isShowingToday) {
        toggleViewButton.textContent = "顯示所有當月紀錄";
    } else {
        toggleViewButton.textContent = "只顯示今日紀錄";
    }
    showSummaryButton.style.display = 'block';
    showSummaryButton.textContent = "顯示每日總結";
    monthlyRemainingTotal.style.display = 'none';
    updateTableDisplay();
});

showSummaryButton.addEventListener('click', () => {
  isShowingSummary = !isShowingSummary;
  if (isShowingSummary) {
    showSummaryButton.textContent = "顯示所有紀錄";
    toggleViewButton.style.display = 'none';
    monthlyRemainingTotal.style.display = 'inline-block';
  } else {
    showSummaryButton.textContent = "顯示每日總結";
    toggleViewButton.style.display = 'block';
    monthlyRemainingTotal.style.display = 'none';
  }
  updateTableDisplay();
});

window.onload = () => {
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  fetchTransactions();
};
