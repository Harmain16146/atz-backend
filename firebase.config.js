// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8mDNRXIjK8xhUl2YsOIoU9Z5bN0yYR74",
  authDomain: "atzdatabase.firebaseapp.com",
  projectId: "atzdatabase",
  storageBucket: "atzdatabase.appspot.com",
  messagingSenderId: "357766415762",
  appId: "1:357766415762:web:11e69db8e311414c92ed4b",
  measurementId: "G-S27SZCHRH7",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
