// CRAI Club · conexión con Firebase: Analytics, Auth y Firestore.
// Expone una API pequeña en window.CRAI.attachFirebase(api); el resto de la app no importa el SDK.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js';
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signOut
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, collection, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, writeBatch, increment
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const app = initializeApp({
  apiKey: 'AIzaSyATUt6oVceiOXCGsoMeEpjXFzFAOaYemuA',
  authDomain: 'club-de-robotica-crai.firebaseapp.com',
  projectId: 'club-de-robotica-crai',
  storageBucket: 'club-de-robotica-crai.firebasestorage.app',
  messagingSenderId: '879814844436',
  appId: '1:879814844436:web:d8e7f5482ded33f222c701',
  measurementId: 'G-9Y8MC4ECJM'
});
isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});

const auth = getAuth(app);
auth.languageCode = 'es';
const db = getFirestore(app);

const ts = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : Date.now());
const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));

const api = {
  ts,
  currentUser: () => auth.currentUser,
  onUser: (cb) => onAuthStateChanged(auth, cb),

  async google() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      return await signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(auth, provider);
      throw e;
    }
  },
  async signUp(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    return cred;
  },
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  reset: (email) => sendPasswordResetEmail(auth, email),
  signOut: () => signOut(auth),

  async getProfile(uid) {
    const snap = await getDoc(doc(db, 'profiles', uid));
    return snap.exists() ? { uid, ...snap.data({ serverTimestamps: 'estimate' }) } : null;
  },
  saveProfile: (uid, data, isNew) => setDoc(doc(db, 'profiles', uid),
    { ...data, updatedAt: serverTimestamp(), ...(isNew ? { createdAt: serverTimestamp(), lastSeen: serverTimestamp() } : {}) }, { merge: true }),
  touch: (uid) => setDoc(doc(db, 'profiles', uid), { lastSeen: serverTimestamp() }, { merge: true }),
  watchProfiles: (cb, err) => onSnapshot(query(collection(db, 'profiles'), limit(500)), (s) => cb(rows(s).map((r) => ({ ...r, uid: r.id }))), err),

  watchPosts: (cb, err) => onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(80)), (s) => cb(rows(s)), err),
  addPost: (uid, post) => addDoc(collection(db, 'posts'), { ...post, authorId: uid, commentCount: 0, createdAt: serverTimestamp() }),
  deletePost: (id) => deleteDoc(doc(db, 'posts', id)),
  watchComments: (postId, cb, err) => onSnapshot(query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'), limit(100)), (s) => cb(rows(s)), err),
  addComment(uid, postId, text) {
    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'posts', postId, 'comments')), { authorId: uid, text, createdAt: serverTimestamp() });
    batch.update(doc(db, 'posts', postId), { commentCount: increment(1) });
    return batch.commit();
  },

  sendRequest: (uid, toId, text, fmt) => addDoc(collection(db, 'requests'), { fromId: uid, toId, text, fmt, read: false, createdAt: serverTimestamp() }),
  watchInbox: (uid, cb, err) => onSnapshot(query(collection(db, 'requests'), where('toId', '==', uid), limit(100)), (s) => cb(rows(s)), err),
  watchOutbox: (uid, cb, err) => onSnapshot(query(collection(db, 'requests'), where('fromId', '==', uid), limit(200)), (s) => cb(rows(s)), err),
  markRead: (id) => updateDoc(doc(db, 'requests', id), { read: true }),

  saveApplication: (uid, data) => setDoc(doc(db, 'applications', uid), { ...data, createdAt: serverTimestamp() }),
  report: (uid, targetId, kind) => addDoc(collection(db, 'reports'), { reporterId: uid, targetId, kind, createdAt: serverTimestamp() })
};

getRedirectResult(auth).catch(() => {});
if (window.CRAI && typeof window.CRAI.attachFirebase === 'function') window.CRAI.attachFirebase(api);
else window.CRAI_FB = api;
