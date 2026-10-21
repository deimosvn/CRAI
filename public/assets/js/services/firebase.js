// CRAI Club · conexión con Firebase: Analytics, Auth y Firestore.
// Expone una API pequeña en window.CRAI.attachFirebase(api); el resto de la app no importa el SDK.
// La configuración del proyecto vive en assets/js/core/config.js.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js';
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, updateProfile, signOut, deleteUser
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, updateDoc, collection, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, writeBatch, increment
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const CFG = window.CRAI_CONFIG || {};
const app = initializeApp(CFG.firebase);
const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const useEmulators = isLocal && new URLSearchParams(location.search).has('emulator');

const auth = getAuth(app);
auth.languageCode = 'es';
const db = getFirestore(app);
if (useEmulators) {
  connectAuthEmulator(auth, CFG.emulators.auth, { disableWarnings: true });
  connectFirestoreEmulator(db, CFG.emulators.firestore[0], CFG.emulators.firestore[1]);
} else {
  isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});
}

const ts = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : Date.now());
const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
// Firebase pide un inicio de sesión reciente para borrar la cuenta.
const RECENT_MS = 4.5 * 60 * 1000;
const recentLogin = (user) => Date.now() - new Date(user.metadata.lastSignInTime || 0).getTime() < RECENT_MS;

const api = {
  ts,
  emulators: useEmulators,
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
    if (name) await updateProfile(cred.user, { displayName: name }).catch(() => {});
    sendEmailVerification(cred.user).catch(() => {});
    return cred;
  },
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  reset: (email) => sendPasswordResetEmail(auth, email),
  resendVerification: () => (auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.resolve()),
  signOut: () => signOut(auth),

  async getProfile(uid) {
    const snap = await getDoc(doc(db, 'profiles', uid));
    return snap.exists() ? { uid, ...snap.data({ serverTimestamps: 'estimate' }) } : null;
  },
  saveProfile: (uid, data, isNew) => setDoc(doc(db, 'profiles', uid),
    { ...data, updatedAt: serverTimestamp(), ...(isNew ? { createdAt: serverTimestamp(), lastSeen: serverTimestamp() } : {}) }, { merge: true }),
  touch: (uid) => updateDoc(doc(db, 'profiles', uid), { lastSeen: serverTimestamp() }),
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
  report: (uid, targetId, kind) => addDoc(collection(db, 'reports'), { reporterId: uid, targetId, kind, createdAt: serverTimestamp() }),

  isBanned: async (uid) => (await getDoc(doc(db, 'bans', uid))).exists(),

  // Administración (las reglas solo lo permiten a las cuentas de la lista de admins).
  watchReports: (cb, err) => onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(200)), (s) => cb(rows(s)), err),
  watchApplications: (cb, err) => onSnapshot(query(collection(db, 'applications'), limit(300)), (s) => cb(rows(s)), err),
  watchBans: (cb, err) => onSnapshot(query(collection(db, 'bans'), limit(300)), (s) => cb(rows(s)), err),
  deleteReport: (id) => deleteDoc(doc(db, 'reports', id)),
  unban: (uid) => deleteDoc(doc(db, 'bans', uid)),
  // Saca a un miembro del club: borra su perfil, sus publicaciones y su solicitud; con «block», no puede volver.
  // La cuenta de acceso (correo o Google) se borra desde la consola de Firebase > Authentication.
  async removeMember(uid, { block = false, name = '', reason = '' } = {}) {
    const posts = await getDocs(query(collection(db, 'posts'), where('authorId', '==', uid), limit(300)));
    const batch = writeBatch(db);
    posts.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'applications', uid));
    batch.delete(doc(db, 'profiles', uid));
    if (block) batch.set(doc(db, 'bans', uid), { by: auth.currentUser.uid, name: String(name).slice(0, 60), reason: String(reason).slice(0, 200), createdAt: serverTimestamp() });
    return batch.commit();
  },

  // Borra perfil, publicaciones, mensajes y solicitud de la persona, y al final su cuenta.
  // Los comentarios en publicaciones ajenas se quedan y se muestran como «Miembro de CRAI».
  async deleteAccount() {
    const user = auth.currentUser;
    if (!user) throw Object.assign(new Error('Sin sesión'), { code: 'auth/no-current-user' });
    if (!recentLogin(user)) throw Object.assign(new Error('Inicio de sesión antiguo'), { code: 'auth/requires-recent-login' });
    const uid = user.uid;
    const [posts, sent, got] = await Promise.all([
      getDocs(query(collection(db, 'posts'), where('authorId', '==', uid), limit(200))),
      getDocs(query(collection(db, 'requests'), where('fromId', '==', uid), limit(150))),
      getDocs(query(collection(db, 'requests'), where('toId', '==', uid), limit(150)))
    ]);
    const batch = writeBatch(db);
    [...posts.docs, ...sent.docs, ...got.docs].forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'applications', uid));
    batch.delete(doc(db, 'profiles', uid));
    await batch.commit();
    await deleteUser(user);
  }
};

getRedirectResult(auth).catch(() => {});
if (window.CRAI && typeof window.CRAI.attachFirebase === 'function') window.CRAI.attachFirebase(api);
else window.CRAI_FB = api;
