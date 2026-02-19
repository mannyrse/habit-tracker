function generateDays(days) {
    const row = document.getElementById('daysRow');

    // start on monday for now - day of week
    const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    for (let i = 1; i <= days; i++) {
        const th = document.createElement('th');

        const dayLetter = weekdays[(i - 1) % 7];

        th.innerHTML = `
            <div class="weekday">${dayLetter}</div>
            <div class="date-number">${i}</div>
        `;

        row.appendChild(th);
    }
}

document.getElementById('monthHeader').innerHTML = `February<div class="month-year">2026</div>`;

document.addEventListener('DOMContentLoaded', () => {
    generateDays(28);

    const emptyState = document.createElement('div');
    emptyState.id = 'empty-state';
    emptyState.innerHTML = `Start tracking your daily habits - click <strong>Add Habit</strong> to begin.`;
    document.querySelector('.table-wrapper').appendChild(emptyState);

    const tableBody = document.getElementById('tableBody');
    const addHabitBtn = document.getElementById('add-habit');

    addHabitBtn.addEventListener('click', () => {
        // require users to input habit before being able to add a new row
        const unfinished = document.querySelector('.habit-input');
        if (unfinished) {
            unfinished.classList.add('invalid', 'shake');
            unfinished.placeholder = "Enter a habit first";
            unfinished.focus();
            unfinished.addEventListener('animationend', () => unfinished.classList.remove('shake'), { once: true });

            unfinished.addEventListener('input', () => {
                unfinished.classList.remove('invalid');
                unfinished.placeholder = "Enter habit";
            }, { once: true })
            return;
        }

        addRow(tableBody);
    });

});

function addRow(tableBody) {
    const empty = document.getElementById('empty-state');
    if (empty) empty.remove();
    const days = document.querySelectorAll('#daysRow th').length - 1;

    const rowId = 'row-' + Date.now();
    const newRow = document.createElement('tr');
    newRow.id = rowId;

    let checkboxes = '';
    for (let i = 1; i <= days; i++) {
        checkboxes += `<td class="day-cell" data-day="${i}" data-row="${rowId}"></td>`;
    }
    newRow.innerHTML = `
        <td class="habit-cell">
            <input type="text" class="habit-input" placeholder="Enter Habit">
        </td>
        ${checkboxes}
    `;

    tableBody.appendChild(newRow);
}

// press enter to lock in habit

document.getElementById('tableBody').addEventListener('keydown', (e) => {
    if (!e.target.classList.contains('habit-input')) return;

    if (e.key === 'Enter') {
        const input = e.target;
        const value = input.value.trim();
        if (!value) return;

        const td = input.closest('.habit-cell');
        td.innerHTML = `
            <span class="habit-text">${value}</span>
            <button class="delete-btn" title="Delete habit">×</button>
        `;
    }
});

// double click to edit

document.getElementById('tableBody').addEventListener('dblclick', (e) => {
    if (!e.target.classList.contains('habit-text')) return;

    const span = e.target;
    const td = span.closest('.habit-cell');
    const currentText = span.textContent;

    td.innerHTML = `
        <input type="text" class="habit-input" value="${currentText}">
        <button class="delete-btn" title="Delete habit">×</button>
    `;

    td.querySelector('input').focus();
});

// delete habit row

document.getElementById('tableBody').addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete-btn')) return;

    const row = e.target.closest('tr');
    row.remove();

    // show empty state if no rows left
    const remainingRows = document.querySelectorAll('#tableBody tr');
    if (remainingRows.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.id = 'empty-state';
        emptyState.innerHTML = `Start tracking your daily habits - click <strong>Add Habit</strong> to begin.`;
        document.querySelector('.table-wrapper').appendChild(emptyState);
    }
});

// stamp popup feature

// cellData: Map<cellKey, { x, y }> — ONE stamp per cell (ok.png position)
const cellData = new Map();

// current popup context
let currentCell = null;
let currentCellKey = null;
let currentStamp = null; // { x, y } — position where stamp is placed

const overlay = document.getElementById('stampOverlay');
const canvas = document.getElementById('stampCanvas');
const hint = document.getElementById('canvasHint');

// click cell -> open popup
document.getElementById('tableBody').addEventListener('click', (e) => {
    const cell = e.target.closest('.day-cell');
    if (!cell) return;

    const row = cell.closest('tr');
    const habitCell = row.querySelector('.habit-cell');
    const habitText = habitCell.querySelector('.habit-text');

    if (!habitText) {
        const input = habitCell.querySelector('.habit-input');
        input.classList.add('invalid', 'shake');
        input.placeholder = "Enter a habit first";
        input.focus();
        input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });

        input.addEventListener('input', () => {
            input.classList.remove('invalid');
            input.placeholder = "Enter habit";
        }, { once: true });

        return;
    }

    openStampPopup(cell, habitText.textContent);
});

function openStampPopup(cell, habitName) {
    currentCell = cell;
    currentCellKey = cell.dataset.row + '_' + cell.dataset.day;

    // load existing stamp for this cell (if any)
    currentStamp = cellData.get(currentCellKey) || null;

    // set popup header info
    document.getElementById('popupHabitName').textContent = habitName;
    document.getElementById('popupDate').textContent = `Day ${cell.dataset.day}`;

    // render existing stamp in canvas
    renderCanvasStamp();
    updateHint();

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePopup() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    currentCell = null;
    currentCellKey = null;
    currentStamp = null;
}

// click outside popup to close
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePopup();
});

document.getElementById('popupClose').addEventListener('click', closePopup);

// canvas: place stamp exactly where clicked — replaces any previous stamp
canvas.addEventListener('click', (e) => {
    if (e.target.closest('.canvas-hint')) return;

    const rect = canvas.getBoundingClientRect();
    // store as % so it's resolution-independent
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    currentStamp = { x, y };

    renderCanvasStamp();
    updateHint();
});

function renderCanvasStamp() {
    canvas.querySelectorAll('.placed-stamp').forEach(s => s.remove());
    if (!currentStamp) return;

    const el = document.createElement('div');
    el.className = 'placed-stamp new';
    el.style.left = currentStamp.x + '%';
    el.style.top = currentStamp.y + '%';
    // Show ok.png image — sized to match cell proportion (35/48 = ~73%)
    el.style.backgroundImage = 'url("ok.png")';
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    // 73% of 200px canvas = 146px (matches 35px in 48px cell)
    el.style.width = '146px';
    el.style.height = '146px';
    el.addEventListener('animationend', () => el.classList.remove('new'), { once: true });
    canvas.appendChild(el);
}

function updateHint() {
    if (currentStamp) {
        hint.classList.add('hidden');
    } else {
        hint.classList.remove('hidden');
    }
}

// clear button
document.getElementById('popupClear').addEventListener('click', () => {
    currentStamp = null;
    renderCanvasStamp();
    updateHint();
});

// delete/remove button (clear and save empty)
document.getElementById('popupDelete').addEventListener('click', () => {
    currentStamp = null;
    saveAndClose();
});

// save button
document.getElementById('popupSave').addEventListener('click', saveAndClose);

function saveAndClose() {
    if (!currentCell || !currentCellKey) { closePopup(); return; }

    if (!currentStamp) {
        cellData.delete(currentCellKey);
        renderCellStamp(currentCell, null);
    } else {
        cellData.set(currentCellKey, currentStamp);
        renderCellStamp(currentCell, currentStamp);
    }

    closePopup();
}

function renderCellStamp(cell, stamp) {
    // clear old
    cell.querySelectorAll('.cell-stamp').forEach(s => s.remove());
    if (!stamp) return;

    const el = document.createElement('div');
    el.className = 'cell-stamp';
    // Use the same % coordinates — position maps 1:1 from popup canvas to cell
    el.style.left = stamp.x + '%';
    el.style.top = stamp.y + '%';
    // Show ok.png image scaled to cell — larger for better visibility
    el.style.backgroundImage = 'url("ok.png")';
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    // Increase to 35px for better visibility in the 48px cell
    el.style.width = '35px';
    el.style.height = '35px';
    cell.appendChild(el);
}

// escape to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closePopup();
});