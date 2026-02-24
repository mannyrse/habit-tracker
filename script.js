// Get current date info
const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth(); // 0-11
const TODAY = now.getDate();

// current view state (can be different from actual current date)
let viewYear = YEAR;
let viewMonth = MONTH;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
    return new Date(year, month, 1).getDay();
}

function generateDays() {
    const row = document.getElementById('daysRow');

    // clear existing day headers (keep the "Habits" header)
    while (row.children.length > 1) {
        row.removeChild(row.lastChild);
    }

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDOW = getFirstDayOfWeek(viewYear, viewMonth);
    const isCurrentMonth = (viewYear === YEAR && viewMonth === MONTH);

    for (let day = 1; day <= daysInMonth; day++) {
        const th = document.createElement('th');
        const dow = (firstDOW + day - 1) % 7;

        // only highlight today if viewing current month
        const isToday = isCurrentMonth && day === TODAY;
        th.className = isToday ? 'today' : '';

        th.innerHTML = `
            <div class="weekday">${WEEKDAYS[dow]}</div>
            <div class="date-number">${day}</div>
        `;

        row.appendChild(th);
    }

    // scroll to today only if viewing current month
    if (isCurrentMonth) {
        setTimeout(() => {
            const todayHeader = document.querySelector('th.today');
            if (todayHeader) {
                todayHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 100);
    }
}

function updateMonthHeader() {
    document.getElementById('monthHeader').innerHTML =
        `${MONTH_NAMES[viewMonth]}<div class="month-year">${viewYear}</div>`;
}

function regenerateTable() {
    const tableBody = document.getElementById('tableBody');
    const existingRows = tableBody.querySelectorAll('tr');
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const currentMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

    let visibleRowCount = 0;

    existingRows.forEach(row => {
        const rowMonthKey = row.dataset.month;

        if (rowMonthKey === currentMonthKey) {
            row.style.display = '';
            visibleRowCount++;

            const dayCells = row.querySelectorAll('.day-cell');
            dayCells.forEach(cell => cell.remove());

            for (let i = 1; i <= daysInMonth; i++) {
                const td = document.createElement('td');
                td.className = 'day-cell';
                td.dataset.day = i;
                td.dataset.row = row.id;
                row.appendChild(td);
            }
        } else {
            row.style.display = 'none';
        }
    });

    const emptyState = document.getElementById('empty-state');
    if (visibleRowCount === 0) {
        if (!emptyState) {
            const newEmptyState = document.createElement('div');
            newEmptyState.id = 'empty-state';
            newEmptyState.innerHTML = `Start tracking your daily habits- click <strong>Add Habit</strong> to begin.`;
            document.querySelector('.table-wrapper').appendChild(newEmptyState);
        }
    } else if (emptyState) {
        emptyState.remove();
    }

    renderAllStamps();
}

function renderAllStamps() {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(row => {
        const rowId = row.id;
        const cells = row.querySelectorAll('.day-cell');

        cells.forEach(cell => {
            const day = cell.dataset.day;
            const cellKey = getMonthCellKey(rowId, day);
            const stamp = cellData.get(cellKey);

            if (stamp) {
                renderCellStamp(cell, stamp);
            }
        });
    });
}

function switchMonth(offset) {
    viewMonth += offset;

    // handle year rollover
    if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
    } else if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
    }

    // update everything
    updateMonthHeader();
    generateDays();
    regenerateTable();
    updateChart();
}

// set initial month header
updateMonthHeader();

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

    // month navigation buttons
    document.getElementById('prevMonth').addEventListener('click', () => switchMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => switchMonth(1));

    // settings dropdown
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const openSettingsBtn = document.getElementById('openSettings');
    const settingsCloseBtn = document.getElementById('settingsClose');

    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('open');
    });

    // close dropdown when clicking outside
    document.addEventListener('click', () => {
        settingsMenu.classList.remove('open');
    });

    // open settings menu
    openSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        settingsMenu.classList.remove('open');
        settingsOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    });

    // close settings menu
    settingsCloseBtn.addEventListener('click', () => {
        settingsOverlay.classList.remove('open');
        document.body.style.overflow = '';
    });

    // close settings on overlay click
    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
            settingsOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

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

    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const rowId = `${monthKey}_row-${Date.now()}`;
    const newRow = document.createElement('tr');
    newRow.id = rowId;
    newRow.dataset.month = monthKey;

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    let checkboxes = '';
    for (let i = 1; i <= daysInMonth; i++) {
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
        // clear cell safely - fixed xss issue
        td.innerHTML = '';

        const span = document.createElement('span');
        span.className = 'habit-text';
        span.textContent = value;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete habit';
        deleteBtn.textContent = '×';

        td.appendChild(span);
        td.appendChild(deleteBtn);
    }
});

// double click to edit

document.getElementById('tableBody').addEventListener('dblclick', (e) => {
    if (!e.target.classList.contains('habit-text')) return;

    const span = e.target;
    const td = span.closest('.habit-cell');
    const currentText = span.textContent;

    td.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'habit-input';
    input.value = currentText;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete habit';
    deleteBtn.textContent = '×';

    td.appendChild(input);
    td.appendChild(deleteBtn);

    input.focus();

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

// helper function to create month-specific cell key
function getMonthCellKey(rowId, day) {
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return `${monthKey}_${rowId}_${day}`;
}

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
        const cellKey = getMonthCellKey(cell.dataset.row, cell.dataset.day);

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

        updateChart(); // update chart when stamp changes
    }
    // manual mode: open popup
    else {
        openStampPopup(cell, habitText.textContent);
    }
});

function openStampPopup(cell, habitName) {
    currentCell = cell;
    currentCellKey = getMonthCellKey(cell.dataset.row, cell.dataset.day);

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

    updateChart(); // update chart when stamp changes
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

// progress chart 

let progressChart = null;

function initChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);

    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            datasets: [{
                label: 'Habits Completed',
                data: [],
                borderColor: '#2c2820',
                backgroundColor: 'rgba(44, 40, 32, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#2c2820',
                pointBorderColor: '#fffef9',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#2c2820',
                    titleColor: '#fffef9',
                    bodyColor: '#fffef9',
                    padding: 12,
                    borderColor: '#d4d0c8',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: (context) => `Day ${context[0].label}`,
                        label: (context) => `${context.parsed.y} habit${context.parsed.y !== 1 ? 's' : ''} completed`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Day of Month',
                        color: '#8a8070',
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    },
                    grid: {
                        color: 'rgba(212, 208, 200, 0.3)'
                    },
                    ticks: {
                        color: '#8a8070',
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Habits Completed',
                        color: '#8a8070',
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    },
                    grid: {
                        color: 'rgba(212, 208, 200, 0.3)'
                    },
                    ticks: {
                        color: '#8a8070',
                        stepSize: 1,
                        font: {
                            family: 'Inter'
                        }
                    }
                }
            }
        }
    });

    updateChart();
}

function updateChart() {
    if (!progressChart) return;

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const currentMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

    // update labels if month changed
    progressChart.data.labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // count completed habits per day for CURRENT viewing month only
    const dailyCounts = new Array(daysInMonth).fill(0);

    // iterate through all stamps in cellData
    cellData.forEach((stamp, cellKey) => {
        // cellKey format: "YYYY-MM_row-timestamp_dayNumber"
        if (cellKey.startsWith(currentMonthKey)) {
            const parts = cellKey.split('_');
            const day = parseInt(parts[parts.length - 1]);
            if (day >= 1 && day <= daysInMonth) {
                dailyCounts[day - 1]++;
            }
        }
    });

    // update chart data
    progressChart.data.datasets[0].data = dailyCounts;
    progressChart.update();
}

// initialize chart on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initChart, 200);
});