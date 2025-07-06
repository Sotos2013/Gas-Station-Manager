window.addEventListener('load', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
});

function addItem(containerId, singleField = false, value = '', amount = '') {
  const container = document.getElementById(containerId);
  const div = document.createElement('div');
  div.className = 'inline';
  let html = '';
  if (singleField) {
    html = `<input type="text" value="${value}" placeholder="Περιγραφή">`;
  } else {
    html = `<input type="text" value="${value}" placeholder="Περιγραφή">
            <input type="number" value="${amount}" placeholder="€" step="0.01">`;
  }
  html += `<button onclick="removeItem(this)">✖</button>`;
  div.innerHTML = html;
  container.appendChild(div);

  // Αυτόματη ενημέρωση αναφοράς όταν πληκτρολογεί ο χρήστης
  div.querySelectorAll('input').forEach(input =>
    input.addEventListener('input', generateReport)
  );

  generateReport();
}

function addCreditTriple(client = '', plate = '', amount = '') {
  const container = document.getElementById('creditTripleList');
  const div = document.createElement('div');
  div.className = 'inline';
  div.innerHTML = `
    <input type="text" value="${client}" placeholder="Πελάτης">
    <input type="text" value="${plate}" placeholder="Πινακίδα">
    <input type="number" value="${amount}" placeholder="Ποσό (€)" step="0.01">
    <button onclick="removeItem(this)">✖</button>`;
  container.appendChild(div);

  div.querySelectorAll('input').forEach(input =>
    input.addEventListener('input', generateReport)
  );

  generateReport();
}

function removeItem(btn) {
  if (confirm("Να διαγραφεί αυτό το στοιχείο;")) {
    btn.parentElement.remove();
    generateReport();
  }
}

function collectItems(containerId, withAmounts = false) {
  const items = [];
  const container = document.getElementById(containerId);
  const divs = container.querySelectorAll('div');
  divs.forEach(div => {
    const inputs = div.querySelectorAll('input');
    if (inputs.length === 1) {
      if (inputs[0].value.trim()) items.push(inputs[0].value.trim());
    } else if (inputs.length >= 2) {
      const label = inputs[0].value.trim();
      const amount = parseFloat(inputs[1].value.trim() || 0);
      if (label) items.push({ label, amount });
    }
  });
  return items;
}

function collectCreditTriples() {
  const triples = [];
  const divs = document.getElementById('creditTripleList').querySelectorAll('div');
  divs.forEach(div => {
    const inputs = div.querySelectorAll('input');
    if (inputs.length === 3) {
      const client = inputs[0].value.trim();
      const plate = inputs[1].value.trim();
      const amount = parseFloat(inputs[2].value.trim() || 0);
      if (client || plate || amount) triples.push({ client, plate, amount });
    }
  });
  return triples;
}

function saveState() {
  const state = {
    employees: document.getElementById('employees').value,
    date: document.getElementById('date').value,
    oilList: collectItems('oilList'),
    accessoryList: collectItems('accessoryList'),
    creditTripleList: collectCreditTriples(),
    expensesList: collectItems('expensesList', true),
    collectionsList: collectItems('collectionsList', true),
    report: document.getElementById('report').textContent || ''
  };
  localStorage.setItem('shiftData', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('shiftData');
  if (!saved) return;
  const state = JSON.parse(saved);
  document.getElementById('employees').value = state.employees || '';
  document.getElementById('date').value = state.date || '';

  ['oilList', 'accessoryList'].forEach(id => {
    document.getElementById(id).innerHTML = '';
    state[id].forEach(item => addItem(id, false, item.label, item.amount));
  });

  ['expensesList', 'collectionsList'].forEach(id => {
    document.getElementById(id).innerHTML = '';
    state[id].forEach(item => addItem(id, false, item.label, item.amount));
  });

  document.getElementById('creditTripleList').innerHTML = '';
  state.creditTripleList.forEach(t => addCreditTriple(t.client, t.plate, t.amount));

  document.getElementById('report').textContent = state.report || '';
}

function formatFullDate(dateStr) {
  const daysGR = ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'];
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dayName = daysGR[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${dayName} ${day}/${month}/${year}`;
}

function generateReport() {
  const employees = document.getElementById('employees').value;
  const date = document.getElementById('date').value;
  const dateFormatted = formatFullDate(date);

  const oils = collectItems('oilList');
  const accessories = collectItems('accessoryList');
  const credits = collectCreditTriples();
  const expenses = collectItems('expensesList', true);
  const collections = collectItems('collectionsList', true);

  const oilTotal = oils.reduce((sum, item) => sum + item.amount, 0);
  const accTotal = accessories.reduce((sum, item) => sum + item.amount, 0);
  const creditTotal = credits.reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const collectionTotal = collections.reduce((sum, item) => sum + item.amount, 0);

  let report = '';
  report += `Ημερομηνία: ${dateFormatted}\n`;
  report += `Ονόματα: ${employees}\n\n`;

  report += `ΠΩΛΗΣΕΙΣ ΛΑΔΙΩΝ\n`;
  oils.forEach(o => report += `- ${o.label}: ${o.amount.toFixed(2)} €\n`);
  report += `Σύνολο Λαδιών: ${oilTotal.toFixed(2)} €\n\n`;

  report += `ΠΩΛΗΣΕΙΣ ΑΞΕΣΟΥΑΡ\n`;
  accessories.forEach(a => report += `- ${a.label}: ${a.amount.toFixed(2)} €\n`);
  report += `Σύνολο Αξεσουάρ: ${accTotal.toFixed(2)} €\n\n`;

  report += `ΠΕΛΑΤΕΣ ΠΙΣΤΩΣΗΣ\n`;
  credits.forEach(c => report += `- ${c.client} (${c.plate}): ${c.amount.toFixed(2)} €\n`);
  report += `Σύνολο Πιστώσεων: ${creditTotal.toFixed(2)} €\n\n`;

  report += `ΕΞΟΔΑ\n`;
  expenses.forEach(e => report += `- ${e.label}: ${e.amount.toFixed(2)} €\n`);
  report += `Σύνολο Εξόδων: ${expenseTotal.toFixed(2)} €\n\n`;

  report += `ΕΙΣΠΡΑΞΕΙΣ ΠΕΛΑΤΩΝ\n`;
  collections.forEach(c => report += `- ${c.label}: ${c.amount.toFixed(2)} €\n`);
  report += `Σύνολο Εισπράξεων: ${collectionTotal.toFixed(2)} €\n\n`;

  report += `--------------------------------------------------\n\n`;

  document.getElementById('report').textContent = report;
  saveState();
}

function resetShift() {
  if (confirm("Θέλεις σίγουρα να ξεκινήσεις νέα βάρδια; Όλα τα δεδομένα θα διαγραφούν.")) {
    localStorage.removeItem('shiftData');
    location.reload();
  }
}

window.onload = () => {
  loadState();
  generateReport(); // Δημιουργεί αναφορά αμέσως μόλις φορτωθεί

  // Αυτόματη ανανέωση αναφοράς όταν αλλάζει όνομα ή ημερομηνία
  document.getElementById('employees').addEventListener('input', generateReport);
  document.getElementById('date').addEventListener('input', generateReport);
};
