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

// checkbox - can only be checked if habit is entered

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