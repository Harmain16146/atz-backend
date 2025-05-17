'use client'

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD8mDNRXIjK8xhUl2YsOIoU9Z5bN0yYR74",
  authDomain: "atzdatabase.firebaseapp.com",
  projectId: "atzdatabase",
  storageBucket: "atzdatabase.appspot.com",
  messagingSenderId: "357766415762",
  appId: "1:357766415762:web:11e69db8e311414c92ed4b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
