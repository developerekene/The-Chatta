import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyClj3ds_ihla894SZWcJYGdAzj9QzqTB1Q",
  authDomain: "chatta-7cf3b.firebaseapp.com",
  projectId: "chatta-7cf3b",
  storageBucket: "chatta-7cf3b.firebasestorage.app",
  messagingSenderId: "742381393101",
  appId: "1:742381393101:web:43f65820b095dca61e4584",
  measurementId: "G-D75STHRZL2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  updateDoc
};
