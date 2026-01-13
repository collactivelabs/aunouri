/**
 * AuNouri - Firebase Configuration
 * 
 * IMPORTANT: Replace these placeholder values with your actual Firebase config.
 * 
 * To get your Firebase config:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing
 * 3. Add a Web app to your project
 * 4. Copy the firebaseConfig object
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import {
    getAuth,
    // @ts-ignore - React Native specific
    getReactNativePersistence,
    initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration - REPLACE WITH YOUR OWN VALUES
const firebaseConfig = {
    apiKey: "REDACTED_FIREBASE_API_KEY",
    authDomain: "aunouri.firebaseapp.com",
    projectId: "aunouri",
    storageBucket: "aunouri.firebasestorage.app",
    messagingSenderId: "REDACTED_SENDER_ID",
    appId: "1:REDACTED_SENDER_ID:web:51e23aa903c0553aead38f",
    measurementId: "REDACTED_MEASUREMENT_ID"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Auth with persistence for React Native
let auth: ReturnType<typeof getAuth>;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
