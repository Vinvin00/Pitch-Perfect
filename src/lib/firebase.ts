import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyA-6AaLS6kr0ZrfiT4d-ha-UGBVb9njrqs',
  authDomain: 'real-life-saga-9d220.firebaseapp.com',
  projectId: 'real-life-saga-9d220',
  storageBucket: 'real-life-saga-9d220.firebasestorage.app',
  messagingSenderId: '19204530608',
  appId: '1:19204530608:web:a68ca9087ba2e7a2f3f675',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
