// Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyBoZP-3qKjPkHKfo_RRJNiKlJz6rIX0GDc",
    authDomain: "habit-tracker-743f0.firebaseapp.com",
    projectId: "habit-tracker-743f0",
    storageBucket: "habit-tracker-743f0.firebasestorage.app",
    messagingSenderId: "1026978658583",
    appId: "1:1026978658583:web:799f934535b4ecbbfedf52",
    measurementId: "G-HXN094C44D"
};

// initialize Firebase
firebase.initializeApp(firebaseConfig);

// initialize services  
const auth = firebase.auth();
const db = firebase.firestore();

// export for use in other files
window.auth = auth;
window.db = db;
