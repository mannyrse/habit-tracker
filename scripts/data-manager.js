// data manager - handles all firestone operations

// get current user ID
function getCurrentUserId() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user signed in');
    }
    return user.uid;
}

// habits

// save a habit
async function saveHabit(monthKey, habitId, habitName) {
    const userId = getCurrentUserId();

    try {
        await db.collection('users').doc(userId)
            .collection('habits').doc(habitId).set({
                name: habitName,
                monthKey: monthKey,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        console.log('Habit saved:', habitId);
    } catch (error) {
        console.error('Error saving habit:', error);
        throw error;
    }
}

// delete a habit
async function deleteHabit(habitId) {
    const userId = getCurrentUserId();

    try {
        await db.collection('users').doc(userId)
            .collection('habits').doc(habitId).delete();
        console.log('Habit deleted:', habitId);
    } catch (error) {
        console.error('Error deleting habit:', error);
        throw error;
    }
}

// load habits for a specific month
async function loadHabits(monthKey) {
    const userId = getCurrentUserId();

    try {
        const snapshot = await db.collection('users').doc(userId)
            .collection('habits')
            .where('monthKey', '==', monthKey)
            .orderBy('createdAt')
            .get();

        const habits = [];
        snapshot.forEach(doc => {
            habits.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`Loaded ${habits.length} habits for ${monthKey}`);
        return habits;
    } catch (error) {
        console.error('Error loading habits:', error);
        throw error;
    }
}

// stamps

// save a stamp
async function saveStamp(monthKey, habitId, day, stampData) {
    const userId = getCurrentUserId();
    const stampKey = `${habitId}_${day}`;

    try {
        await db.collection('users').doc(userId)
            .collection('stamps').doc(monthKey).set({
                [stampKey]: stampData
            }, { merge: true });

        console.log('Stamp saved:', stampKey);
    } catch (error) {
        console.error('Error saving stamp:', error);
        throw error;
    }
}

// delete a stamp
async function deleteStamp(monthKey, habitId, day) {
    const userId = getCurrentUserId();
    const stampKey = `${habitId}_${day}`;

    try {
        await db.collection('users').doc(userId)
            .collection('stamps').doc(monthKey).update({
                [stampKey]: firebase.firestore.FieldValue.delete()
            });

        console.log('Stamp deleted:', stampKey);
    } catch (error) {
        console.error('Error deleting stamp:', error);
        throw error;
    }
}

// delete all stamps for a habit
async function deleteHabitStamps(habitId) {
    const userId = getCurrentUserId();

    try {
        // get all stamp documents
        const snapshot = await db.collection('users').doc(userId)
            .collection('stamps').get();

        const batch = db.batch();

        snapshot.forEach(doc => {
            const data = doc.data();
            const updates = {};

            // find all stamps for this habit
            Object.keys(data).forEach(key => {
                if (key.startsWith(habitId + '_')) {
                    updates[key] = firebase.firestore.FieldValue.delete();
                }
            });

            if (Object.keys(updates).length > 0) {
                batch.update(doc.ref, updates);
            }
        });

        await batch.commit();
        console.log('All stamps deleted for habit:', habitId);
    } catch (error) {
        console.error('Error deleting habit stamps:', error);
        throw error;
    }
}

// load stamps for a specific month
async function loadStamps(monthKey) {
    const userId = getCurrentUserId();

    try {
        const doc = await db.collection('users').doc(userId)
            .collection('stamps').doc(monthKey).get();

        if (doc.exists) {
            console.log(`Loaded stamps for ${monthKey}`);
            return doc.data();
        } else {
            console.log(`No stamps found for ${monthKey}`);
            return {};
        }
    } catch (error) {
        console.error('Error loading stamps:', error);
        throw error;
    }
}

// load all user data

// load habits and stamps for current viewing month
async function loadUserData() {
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

    try {
        // load habits
        const habits = await loadHabits(monthKey);

        // clear existing table
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        // recreate habits
        habits.forEach(habit => {
            const daysInMonth = getDaysInMonth(viewYear, viewMonth);
            const newRow = document.createElement('tr');
            newRow.id = habit.id;
            newRow.dataset.month = monthKey;

            let checkboxes = '';
            for (let i = 1; i <= daysInMonth; i++) {
                checkboxes += `<td class="day-cell" data-day="${i}" data-row="${habit.id}"></td>`;
            }

            newRow.innerHTML = `
                <td class="habit-cell">
                    <span class="habit-text">${habit.name}</span>
                    <button class="delete-btn" title="Delete habit">×</button>
                </td>
                ${checkboxes}
            `;

            tableBody.appendChild(newRow);
        });

        // load stamps
        const stamps = await loadStamps(monthKey);

        // clear existing cellData and populate with loaded stamps
        cellData.clear();
        Object.entries(stamps).forEach(([key, value]) => {
            const fullKey = `${monthKey}_${key}`;
            cellData.set(fullKey, value);
        });

        // render stamps on table
        renderAllStamps();

        // update chart
        updateChart();

        // remove empty state if habits exist
        const emptyState = document.getElementById('empty-state');
        if (habits.length > 0 && emptyState) {
            emptyState.remove();
        } else if (habits.length === 0 && !emptyState) {
            const newEmptyState = document.createElement('div');
            newEmptyState.id = 'empty-state';
            newEmptyState.innerHTML = `Start tracking your daily habits - click <strong>Add Habit</strong> to begin.`;
            document.querySelector('.table-wrapper').appendChild(newEmptyState);
        }

        console.log('User data loaded successfully');
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}