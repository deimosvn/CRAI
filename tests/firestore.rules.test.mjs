// Pruebas de firestore.rules contra el emulador de Firestore.
// Se corren con: npm run test:rules (levanta el emulador, corre esto y lo apaga).
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, serverTimestamp, setDoc, updateDoc, where, writeBatch
} from 'firebase/firestore';

let env;
const ANA = 'ana';
const BETO = 'beto';
const CARLA = 'carla';

// Igual a lo que escribe la app al terminar la bienvenida (profileDoc en services/live.js).
const profile = (name, extra = {}) => ({
  name, role: 'Diseño de producto', door: 'both', building: 'Una app para reservar canchas', bio: '', skills: [], learn: [],
  seeking: ['colaboradores'], offers: '', needsTags: ['software'], offerTags: ['diseno'], tags: ['diseno'], avail: ['tardes'], open: true,
  interests: [], links: { linkedin: '', github: '', web: '' }, privacy: { indexable: true, attendee: true }, zone: '', langs: ['Español'],
  prefers: 'Café en persona', style: '', hue: 210, toon: { skin: 1, hair: 2, acc: 'ninguno', beard: false },
  updatedAt: serverTimestamp(), createdAt: serverTimestamp(), lastSeen: serverTimestamp(), ...extra
});
const db = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
const post = (uid, extra = {}) => ({ type: 'building', text: 'Avance de esta semana', tags: ['software'], project: null, authorId: uid, commentCount: 0, createdAt: serverTimestamp(), ...extra });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-crai-club',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') }
  });
});
after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

describe('perfiles', () => {
  test('cualquiera con sesión crea su propio perfil al registrarse', async () => {
    await assertSucceeds(setDoc(doc(db(ANA), 'profiles', ANA), profile('Ana')));
  });
  test('no se puede crear el perfil de otra persona', async () => {
    await assertFails(setDoc(doc(db(ANA), 'profiles', BETO), profile('Beto')));
  });
  test('sin sesión no se crea ni se lee nada', async () => {
    await assertFails(setDoc(doc(db(null), 'profiles', ANA), profile('Ana')));
    await seed((f) => setDoc(doc(f, 'profiles', ANA), profile('Ana')));
    await assertFails(getDoc(doc(db(null), 'profiles', ANA)));
  });
  test('campos desconocidos, puerta inválida o enlaces enormes se rechazan', async () => {
    await assertFails(setDoc(doc(db(ANA), 'profiles', ANA), profile('Ana', { admin: true })));
    await assertFails(setDoc(doc(db(ANA), 'profiles', ANA), profile('Ana', { door: 'vip' })));
    await assertFails(setDoc(doc(db(ANA), 'profiles', ANA), profile('Ana', { links: { web: 'x'.repeat(300) } })));
    await assertFails(setDoc(doc(db(ANA), 'profiles', ANA), profile('')));
  });
  test('la dueña edita su perfil y marca su última visita, pero no cambia la fecha de alta', async () => {
    await assertSucceeds(setDoc(doc(db(ANA), 'profiles', ANA), profile('Ana')));
    await assertSucceeds(setDoc(doc(db(ANA), 'profiles', ANA), { bio: 'Hola', updatedAt: serverTimestamp() }, { merge: true }));
    await assertSucceeds(updateDoc(doc(db(ANA), 'profiles', ANA), { lastSeen: serverTimestamp() }));
    await assertFails(updateDoc(doc(db(ANA), 'profiles', ANA), { createdAt: new Date(2020, 0, 1) }));
    await assertFails(updateDoc(doc(db(BETO), 'profiles', ANA), { bio: 'hackeado' }));
  });
  test('los miembros con sesión leen perfiles', async () => {
    await seed((f) => setDoc(doc(f, 'profiles', ANA), profile('Ana')));
    await assertSucceeds(getDoc(doc(db(BETO), 'profiles', ANA)));
  });
});

describe('publicaciones y comentarios', () => {
  beforeEach(() => seed(async (f) => { await setDoc(doc(f, 'profiles', ANA), profile('Ana')); await setDoc(doc(f, 'profiles', BETO), profile('Beto')); }));

  test('se publica solo con perfil y a nombre propio', async () => {
    await assertSucceeds(addDoc(collection(db(ANA), 'posts'), post(ANA)));
    await assertFails(addDoc(collection(db(ANA), 'posts'), post(BETO)));
    await assertFails(addDoc(collection(db(CARLA), 'posts'), post(CARLA)));
    await assertFails(addDoc(collection(db(ANA), 'posts'), post(ANA, { type: 'anuncio' })));
    await assertFails(addDoc(collection(db(ANA), 'posts'), post(ANA, { commentCount: 50 })));
  });
  test('comentar suma uno al contador en el mismo lote; sumar más se rechaza', async () => {
    await seed((f) => setDoc(doc(f, 'posts', 'p1'), post(ANA)));
    const beto = db(BETO);
    const b = writeBatch(beto);
    b.set(doc(collection(beto, 'posts', 'p1', 'comments')), { authorId: BETO, text: 'Te ayudo', createdAt: serverTimestamp() });
    b.update(doc(beto, 'posts', 'p1'), { commentCount: increment(1) });
    await assertSucceeds(b.commit());
    await assertFails(updateDoc(doc(db(BETO), 'posts', 'p1'), { commentCount: increment(5) }));
    await assertFails(updateDoc(doc(db(BETO), 'posts', 'p1'), { text: 'cambiado' }));
  });
  test('solo la autora borra su publicación', async () => {
    await seed((f) => setDoc(doc(f, 'posts', 'p1'), post(ANA)));
    await assertFails(deleteDoc(doc(db(BETO), 'posts', 'p1')));
    await assertSucceeds(deleteDoc(doc(db(ANA), 'posts', 'p1')));
  });
});

describe('mensajes de primer contacto', () => {
  beforeEach(() => seed(async (f) => { await setDoc(doc(f, 'profiles', ANA), profile('Ana')); await setDoc(doc(f, 'profiles', BETO), profile('Beto')); }));
  const req = (from, to, extra = {}) => ({ fromId: from, toId: to, text: 'Hola, ¿un café?', fmt: 'cafe', read: false, createdAt: serverTimestamp(), ...extra });

  test('se envían a miembros que existen, nunca a nombre de otra persona', async () => {
    await assertSucceeds(addDoc(collection(db(ANA), 'requests'), req(ANA, BETO)));
    await assertFails(addDoc(collection(db(ANA), 'requests'), req(BETO, ANA)));
    await assertFails(addDoc(collection(db(ANA), 'requests'), req(ANA, 'fantasma')));
    await assertFails(addDoc(collection(db(ANA), 'requests'), req(ANA, ANA)));
  });
  test('solo quien envía y quien recibe pueden leerlos', async () => {
    await seed((f) => setDoc(doc(f, 'requests', 'r1'), req(ANA, BETO)));
    await assertSucceeds(getDocs(query(collection(db(BETO), 'requests'), where('toId', '==', BETO))));
    await assertSucceeds(getDocs(query(collection(db(ANA), 'requests'), where('fromId', '==', ANA))));
    await assertFails(getDoc(doc(db(CARLA), 'requests', 'r1')));
    await assertFails(getDocs(collection(db(CARLA), 'requests')));
  });
  test('quien recibe solo puede marcarlo como leído', async () => {
    await seed((f) => setDoc(doc(f, 'requests', 'r1'), req(ANA, BETO)));
    await assertSucceeds(updateDoc(doc(db(BETO), 'requests', 'r1'), { read: true }));
    await assertFails(updateDoc(doc(db(BETO), 'requests', 'r1'), { text: 'otro' }));
    await assertFails(updateDoc(doc(db(ANA), 'requests', 'r1'), { read: true }));
  });
});

describe('administración', () => {
  const ADMIN = 'diego';
  const admin = () => env.authenticatedContext(ADMIN, { email: 'diego.martinez111213@gmail.com', email_verified: true }).firestore();
  const impostor = () => env.authenticatedContext('falso', { email: 'diego.martinez111213@gmail.com', email_verified: false }).firestore();
  const ban = (extra = {}) => ({ by: ADMIN, name: 'Beto', reason: 'spam', createdAt: serverTimestamp(), ...extra });
  beforeEach(() => seed(async (f) => {
    await setDoc(doc(f, 'profiles', ANA), profile('Ana'));
    await setDoc(doc(f, 'profiles', BETO), profile('Beto'));
    await setDoc(doc(f, 'posts', 'pb'), post(BETO));
    await setDoc(doc(f, 'applications', BETO), { name: 'Beto', building: 'x', need: '', door: 'both', createdAt: new Date() });
    await setDoc(doc(f, 'reports', 'rep1'), { reporterId: ANA, targetId: BETO, kind: 'perfil', createdAt: new Date() });
  }));

  test('la cuenta admin verificada modera: borra perfiles y publicaciones, lee denuncias y solicitudes', async () => {
    await assertSucceeds(getDocs(collection(admin(), 'reports')));
    await assertSucceeds(getDocs(collection(admin(), 'applications')));
    await assertSucceeds(deleteDoc(doc(admin(), 'posts', 'pb')));
    await assertSucceeds(deleteDoc(doc(admin(), 'profiles', BETO)));
    await assertSucceeds(deleteDoc(doc(admin(), 'reports', 'rep1')));
  });
  test('un correo sin verificar o un miembro normal no tienen poderes de admin', async () => {
    await assertFails(getDocs(collection(impostor(), 'reports')));
    await assertFails(deleteDoc(doc(impostor(), 'profiles', BETO)));
    await assertFails(getDocs(collection(db(ANA), 'applications')));
    await assertFails(setDoc(doc(db(ANA), 'bans', BETO), ban({ by: ANA })));
  });
  test('el equipo no puede leer mensajes privados', async () => {
    await seed((f) => setDoc(doc(f, 'requests', 'r1'), { fromId: ANA, toId: BETO, text: 'Hola', fmt: 'cafe', read: false, createdAt: new Date() }));
    await assertFails(getDoc(doc(admin(), 'requests', 'r1')));
  });
  test('una cuenta bloqueada no puede volver a crear perfil ni publicar', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'bans', BETO), ban()));
    await assertFails(setDoc(doc(admin(), 'bans', ADMIN), ban()));
    await assertSucceeds(getDoc(doc(db(BETO), 'bans', BETO)));
    await assertFails(addDoc(collection(db(BETO), 'posts'), post(BETO)));
    await seed((f) => deleteDoc(doc(f, 'profiles', BETO)));
    await assertFails(setDoc(doc(db(BETO), 'profiles', BETO), profile('Beto')));
    await assertSucceeds(deleteDoc(doc(admin(), 'bans', BETO)));
    await assertSucceeds(setDoc(doc(db(BETO), 'profiles', BETO), profile('Beto')));
  });
});

describe('solicitudes, denuncias y borrado de cuenta', () => {
  test('la solicitud de fundador es privada', async () => {
    const app = { name: 'Ana', building: 'Sensor de calor', need: 'firmware', door: 'founders', createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(db(ANA), 'applications', ANA), app));
    await assertFails(getDoc(doc(db(BETO), 'applications', ANA)));
    await assertFails(setDoc(doc(db(BETO), 'applications', ANA), app));
  });
  test('las denuncias se crean, pero ningún miembro las puede leer', async () => {
    const ref = await assertSucceeds(addDoc(collection(db(ANA), 'reports'), { reporterId: ANA, targetId: BETO, kind: 'perfil', createdAt: serverTimestamp() }));
    await assertFails(getDoc(doc(db(ANA), 'reports', ref.id)));
  });
  test('borrar la cuenta elimina lo propio y nada ajeno', async () => {
    await seed(async (f) => {
      await setDoc(doc(f, 'profiles', ANA), profile('Ana'));
      await setDoc(doc(f, 'profiles', BETO), profile('Beto'));
      await setDoc(doc(f, 'posts', 'pa'), post(ANA));
      await setDoc(doc(f, 'posts', 'pb'), post(BETO));
      await setDoc(doc(f, 'requests', 'r1'), { fromId: ANA, toId: BETO, text: 'Hola', fmt: 'cafe', read: false, createdAt: new Date() });
      await setDoc(doc(f, 'requests', 'r2'), { fromId: BETO, toId: CARLA, text: 'Hola', fmt: 'cafe', read: false, createdAt: new Date() });
      await setDoc(doc(f, 'applications', ANA), { name: 'Ana', building: 'x', need: '', door: 'both', createdAt: new Date() });
    });
    const ana = db(ANA);
    const b = writeBatch(ana);
    ['posts/pa', 'requests/r1', 'applications/' + ANA, 'profiles/' + ANA].forEach((p) => b.delete(doc(ana, p)));
    await assertSucceeds(b.commit());
    await assertFails(deleteDoc(doc(db(ANA), 'posts', 'pb')));
    await assertFails(deleteDoc(doc(db(ANA), 'requests', 'r2')));
    await assertFails(deleteDoc(doc(db(ANA), 'profiles', BETO)));
  });
});
