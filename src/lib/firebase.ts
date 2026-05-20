import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAwIPVpi4ijIan8jzzjuE27g4ET8WXMYNg',
  authDomain: 'customer-data-bd35d.firebaseapp.com',
  projectId: 'customer-data-bd35d',
  storageBucket: 'customer-data-bd35d.firebasestorage.app',
  messagingSenderId: '933716999924',
  appId: '1:933716999924:web:ddd0405be90b5877e2a8a1'
};

export const isFirebaseReady = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
