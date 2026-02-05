function generateDays(days) {
    const row = document.getElementById('daysRow');

    for (let i = 1; i <= days; i++) {
        const th = document.createElement('th');
        th.textContent = i;
        row.appendChild(th);
    }
}

document.getElementById('monthHeader').textContent = "February"

document.addEventListener('DOMContentLoaded', () => {
    generateDays(28);

    const tableBody = document.getElementById('tableBody');
    const addHabitBtn = document.getElementById('add-habit');

    addHabitBtn.addEventListener('click', () => addRow(tableBody));
});

function addRow(tableBody) {
    const days = document.querySelectorAll('#daysRow th').length - 1;

    const newRow = document.createElement('tr');

    let checkboxes = '';
    for (let i = 0; i < days; i++) {
        checkboxes += `<td class="day-cell"></td>`;
    }
    newRow.innerHTML = `
        <td class="habit-cell"><input type="text" class="habit-input" placeholder="Enter Habit"></td>
        ${checkboxes}
    `;

    tableBody.appendChild(newRow);
}

document.getElementById('tableBody').addEventListener('click', (e) => {
    const cell = e.target.closest('.day-cell');
    if (!cell) return;

    cell.classList.toggle('checked');
})

// press enter to lock in habit

document.getElementById('tableBody').addEventListener('keydown', (e) => {
    if (!e.target.classList.contains('habit-input')) return;

    if (e.key === 'Enter') {
        const input = e.target;
        const value = input.value.trim();
        if (!value) return;

        const td = input.closest('.habit-cell');
        td.innerHTML = `<span class="habit-text">${value}</span>`;
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
    `;

    td.querySelector('input').focus();
})