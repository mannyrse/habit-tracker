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
    newRow.innerHTML = `
        <td><input type="text" placeholder="Enter Habit"></td>
        ${'<td><input type="checkbox"></td>'.repeat(days)}
    `;

    tableBody.appendChild(newRow);
}
