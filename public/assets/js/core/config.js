/* CRAI Club · configuración del sitio.
   Se carga antes que todo lo demás. Es el único lugar con datos del proyecto de Firebase
   y de contacto; el resto del código los lee de window.CRAI_CONFIG. */
(function () {
  'use strict';
  window.CRAI_CONFIG = {
    // Proyecto de Firebase (estos valores son públicos por diseño; la seguridad está en firestore.rules).
    firebase: {
      apiKey: 'AIzaSyATUt6oVceiOXCGsoMeEpjXFzFAOaYemuA',
      authDomain: 'club-de-robotica-crai.firebaseapp.com',
      projectId: 'club-de-robotica-crai',
      storageBucket: 'club-de-robotica-crai.firebasestorage.app',
      messagingSenderId: '879814844436',
      appId: '1:879814844436:web:d8e7f5482ded33f222c701',
      measurementId: 'G-9Y8MC4ECJM'
    },
    // Cuentas con panel de administración (correo verificado). Debe coincidir con isAdmin() en firestore.rules.
    admins: ['diego.martinez111213@gmail.com'],
    // Correo para dudas, privacidad y solicitudes de borrado. Vacío = no se muestra.
    contactEmail: '',
    // Con ?emulator en localhost, la app usa los emuladores locales de Auth y Firestore.
    emulators: { auth: 'http://127.0.0.1:9099', firestore: ['127.0.0.1', 8080] }
  };
  // Modo real: cuentas, perfiles y publicaciones en Firebase. En false, todo es demo local.
  window.CRAI_LIVE = true;
})();
