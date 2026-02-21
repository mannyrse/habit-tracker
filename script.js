// get current date info
const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth(); // 0-11
const TODAY = now.getDate();
const DAYS_IN_MONTH = new Date(YEAR, MONTH + 1, 0).getDate();
const FIRST_DOW = new Date(YEAR, MONTH, 1).getDay();

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function generateDays() {
    const row = document.getElementById('daysRow');

    for (let day = 1; day <= DAYS_IN_MONTH; day++) {
        const th = document.createElement('th');
        const dow = (FIRST_DOW + day - 1) % 7;

        // add 'today' class if this is today's date
        const isToday = day === TODAY;
        th.className = isToday ? 'today' : '';

        th.innerHTML = `
            <div class="weekday">${WEEKDAYS[dow]}</div>
            <div class="date-number">${day}</div>
        `;

        row.appendChild(th);
    }

    // scroll to today's date
    setTimeout(() => {
        const todayHeader = document.querySelector('th.today');
        if (todayHeader) {
            todayHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, 100);
}

// set month header
document.getElementById('monthHeader').innerHTML = `${MONTH_NAMES[MONTH]}<div class="month-year">${YEAR}</div>`;

// stamp mode: 'simple' or 'manual'
let stampMode = 'manual'; // default to manual (popup) mode

document.addEventListener('DOMContentLoaded', () => {
    generateDays();

    const emptyState = document.createElement('div');
    emptyState.id = 'empty-state';
    emptyState.innerHTML = `Start tracking your daily habits - click <strong>Add Habit</strong> to begin.`;
    document.querySelector('.table-wrapper').appendChild(emptyState);

    const tableBody = document.getElementById('tableBody');
    const addHabitBtn = document.getElementById('add-habit');

    // stamp mode toggle
    const modeToggle = document.getElementById('stamp-mode-toggle');
    modeToggle.addEventListener('click', () => {
        stampMode = stampMode === 'simple' ? 'manual' : 'simple';
        modeToggle.textContent = stampMode === 'simple' ? 'Switch to Manual Mode' : 'Switch to Simple Mode';
    });

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

    const rowId = 'row-' + Date.now();
    const newRow = document.createElement('tr');
    newRow.id = rowId;

    let checkboxes = '';
    for (let i = 1; i <= DAYS_IN_MONTH; i++) {
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

// click cell -> toggle stamp (simple mode) or open popup (manual mode)
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

    // simple mode: just toggle centered stamp
    if (stampMode === 'simple') {
        const cellKey = cell.dataset.row + '_' + cell.dataset.day;

        if (cellData.has(cellKey)) {
            // remove stamp
            cellData.delete(cellKey);
            renderCellStamp(cell, null);
        } else {
            // add centered stamp
            const centeredStamp = { x: 50, y: 50 };
            cellData.set(cellKey, centeredStamp);
            renderCellStamp(cell, centeredStamp);
        }
    }
    // manual mode: open popup
    else {
        openStampPopup(cell, habitText.textContent);
    }
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

    if (!stamp) {
        cell.classList.remove('has-stamp');
        return;
    }

    cell.classList.add('has-stamp');

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