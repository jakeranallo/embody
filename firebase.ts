// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  }
  
  const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyA7tLAvRxxAJfHtEnCMCLX3dLcwzWM-LDk",
  authDomain: "embody-5fa48.firebaseapp.com",
  databaseURL: "https://embody-5fa48-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "embody-5fa48",
  storageBucket: "embody-5fa48.appspot.com",
  messagingSenderId: "1025804753116",
  appId: "1:1025804753116:web:1510782022010bb5d23c19",
  measurementId: "G-G3YXH1YWCY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;