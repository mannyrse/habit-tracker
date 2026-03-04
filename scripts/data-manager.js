// data manager - handles all firestore operations

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
    const tableBody = document.getElementById('tableBody');

    // show skeleton rows immediately so the table isn't blank while fetching
    if (typeof showSkeletonRows === 'function') {
        showSkeletonRows(tableBody, monthKey);
    }

    try {
        // fetch habits and stamps in parallel — cuts wait time roughly in half
        const [habits, stamps] = await Promise.all([
            loadHabits(monthKey),
            loadStamps(monthKey)
        ]);

        // build all rows in a fragment before touching the live DOM
        const daysInMonth = getDaysInMonth(viewYear, viewMonth);
        const fragment = document.createDocumentFragment();

        habits.forEach(habit => {
            const newRow = document.createElement('tr');
            newRow.id = habit.id;
            newRow.dataset.month = monthKey;

            const habitTd = document.createElement('td');
            habitTd.className = 'habit-cell';

            const span = document.createElement('span');
            span.className = 'habit-text';
            span.textContent = habit.name;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = 'Delete habit';
            deleteBtn.textContent = '×';

            habitTd.appendChild(span);
            habitTd.appendChild(deleteBtn);
            newRow.appendChild(habitTd);

            for (let i = 1; i <= daysInMonth; i++) {
                const td = document.createElement('td');
                td.className = 'day-cell';
                td.dataset.day = i;
                td.dataset.row = habit.id;
                newRow.appendChild(td);
            }

            fragment.appendChild(newRow);
        });

        // single atomic DOM swap — skeleton out, real rows in
        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);

        // populate cellData with loaded stamps
        cellData.clear();
        Object.entries(stamps).forEach(([key, value]) => {
            const fullKey = `${monthKey}_${key}`;
            cellData.set(fullKey, value);
        });

        // render stamps on table
        renderAllStamps();

        // defer chart update to after the browser has painted the new rows
        requestAnimationFrame(() => updateChart());

        // manage empty state
        const emptyState = document.getElementById('empty-state');
        if (habits.length > 0) {
            if (emptyState) emptyState.remove();
        } else {
            if (!emptyState) {
                const newEmptyState = document.createElement('div');
                newEmptyState.id = 'empty-state';
                newEmptyState.innerHTML = `Start tracking your daily habits - click <strong>Add Habit</strong> to begin.`;
                document.querySelector('.table-wrapper').appendChild(newEmptyState);
            }
        }

        console.log('User data loaded successfully');
    } catch (error) {
        console.error('Error loading user data:', error);

        // on error, clear skeleton so user isn't stuck staring at fake rows
        tableBody.innerHTML = '';
        const emptyState = document.getElementById('empty-state');
        if (!emptyState) {
            const newEmptyState = document.createElement('div');
            newEmptyState.id = 'empty-state';
            newEmptyState.innerHTML = `Start tracking your daily habits - click <strong>Add Habit</strong> to begin.`;
            document.querySelector('.table-wrapper').appendChild(newEmptyState);
        }
    }
}