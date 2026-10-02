/* =============================================================
   INDY · Cuidá a quien te acompaña.   —   script.js
   JavaScript vanilla. Sin librerías. Datos en localStorage.

   ÍNDICE
    1. CONFIGURACIÓN (marca, CONFIGURACION DE ENLACES, opciones)
    2. DATOS (constantes y estado en memoria)
    3. LOCALSTORAGE (leer, guardar, copia de seguridad)
    4. NAVEGACIÓN (pantallas, barra superior, hojas, formularios)
    5. MASCOTA (inicio, perfil, formulario, datos de ejemplo)
    6. RECORDATORIOS
    7. HISTORIAL
    8. PESO
    9. IDENTIDAD
   10. QR
   11. MASCOTA PERDIDA (y vista pública)
   12. MOMENTOS
   13. TIENDA, ENLACES Y "MÁS"
   14. UTILIDADES
   15. ARRANQUE
   ============================================================= */
(function () {
  'use strict';

  /* ===========================================================
     1. CONFIGURACIÓN
     =========================================================== */

  // Textos de la marca. Cambiá acá el nombre y los textos principales.
  // (La palabra del logotipo está en index.html, etiqueta <text class="lg-word">.)
  const BRAND = {
    name: 'INDY',
    tagline: 'Cuidá a quien te acompaña.',
    intro: 'Todo lo que necesitás para cuidar, organizar y proteger a tu mascota, en un solo lugar.',
    about: 'INDY es una aplicación gratuita para personas que tienen mascotas. Te ayuda a cuidar, organizar, recordar, identificar, proteger y conservar los recuerdos de quien te acompaña todos los días.',
    version: '1.0'
  };

  /* ===========================================================
     CONFIGURACION DE ENLACES
     -----------------------------------------------------------
     Cambiá los enlaces acá (o desde la app: Más > Enlaces de INDY).
     Si un enlace queda vacío (""), su botón se desactiva.
     - whatsapp: número con código de país (ej. "5491122334455") o enlace https://wa.me/...
     - instagram: usuario (ej. "@indy") o URL completa
     - Los demás: URL completa (ej. "https://mitienda.com")
     - accesorios / juguetes: si están vacíos usan "productos", y luego "tienda".
     =========================================================== */
  const LINKS = {
    whatsapp: '',
    tienda: '',
    instagram: '',
    placas: 'https://go.hotmart.com/E107531961F?dp=1',
    accesorios: 'https://go.hotmart.com/V107847023K?dp=1',
    juguetes: '',
    productos: ''
  };
  const LINK_LABELS = {
    whatsapp: 'WhatsApp de INDY',
    tienda: 'Tienda',
    instagram: 'Instagram',
    placas: 'Placas INDY',
    accesorios: 'Accesorios',
    juguetes: 'Juguetes',
    productos: 'Otros productos'
  };

  // Opciones generales
  const CONFIG = {
    // QR de identidad:
    //  ''      → el QR contiene los datos públicos como texto (funciona sin internet ni servidor).
    //  'auto'  → si la app está publicada en internet, el QR apunta a esta misma página con los datos codificados.
    //  'https://tusitio.com/m/' → URL pública permanente (ver buildQrContent para adaptarlo a un backend).
    publicBaseUrl: '',
    maxMoments: 40,
    petPhotoMax: 640,
    petPhotoQuality: 0.82,
    momentPhotoMax: 800,
    momentPhotoQuality: 0.74,
    toastMs: 3200
  };

  /* ===========================================================
     2. DATOS
     =========================================================== */
  const KEYS = {
    pet: 'indy_pet',
    reminders: 'indy_reminders',
    history: 'indy_history',
    moments: 'indy_moments',
    settings: 'indy_settings'
  };

  const SPECIES = ['Perro', 'Gato', 'Conejo', 'Ave', 'Roedor', 'Reptil', 'Otro'];
  const SEXES = ['Hembra', 'Macho', 'No especificado'];
  const REMINDER_TYPES = ['Vacuna', 'Desparasitación', 'Medicación', 'Veterinario', 'Baño', 'Peluquería', 'Otro'];
  const REMINDER_ICONS = { 'Vacuna': 'shield', 'Desparasitación': 'bug', 'Medicación': 'pill', 'Veterinario': 'cross', 'Baño': 'drop', 'Peluquería': 'scissors', 'Otro': 'bell' };
  const REPEATS = [
    { v: 'none', l: 'No se repite' }, { v: 'weekly', l: 'Cada semana' }, { v: 'monthly', l: 'Cada mes' },
    { v: 'quarterly', l: 'Cada 3 meses' }, { v: 'biannual', l: 'Cada 6 meses' }, { v: 'yearly', l: 'Cada año' }
  ];
  const HISTORY_CATS = ['Salud', 'Vacuna', 'Medicación', 'Veterinario', 'Alimentación', 'Peso', 'Otro'];
  const CAT_ICONS = { 'Salud': 'heart', 'Vacuna': 'shield', 'Medicación': 'pill', 'Veterinario': 'cross', 'Alimentación': 'bowl', 'Peso': 'scale', 'Otro': 'star' };

  // Datos que el dueño puede hacer públicos (short = clave abreviada para el QR en modo URL)
  const PUBLIC_FIELDS = [
    { key: 'photo', label: 'Foto', short: null },
    { key: 'name', label: 'Nombre', short: 'n' },
    { key: 'species', label: 'Especie', short: 's' },
    { key: 'breed', label: 'Raza', short: 'b' },
    { key: 'sex', label: 'Sexo', short: 'x' },
    { key: 'age', label: 'Edad', short: 'a' },
    { key: 'color', label: 'Color', short: 'c' },
    { key: 'characteristics', label: 'Características', short: 'h' },
    { key: 'importantInfo', label: 'Información importante', short: 'i' },
    { key: 'contactName', label: 'Nombre del contacto', short: 'cn' },
    { key: 'phone', label: 'Teléfono', short: 'p' },
    { key: 'whatsapp', label: 'WhatsApp', short: 'w' },
    { key: 'address', label: 'Dirección', short: 'd' }
  ];

  function defaultSettings() {
    return {
      ownerName: '',
      contact: { name: '', phone: '', whatsapp: '', address: '' },
      publicFields: {
        photo: true, name: true, species: true, breed: true, sex: true, age: false, color: true,
        characteristics: true, importantInfo: false, contactName: true, phone: true, whatsapp: true, address: false
      },
      lost: { active: false, since: null },
      links: {},
      largeText: false,
      demoContact: false
    };
  }

  const state = {
    pet: null,
    reminders: [],
    history: [],
    moments: [],
    settings: defaultSettings(),
    ui: { petTab: 'profile', idTab: 'card' }
  };

  /* ===========================================================
     3. LOCALSTORAGE
     =========================================================== */
  let storageOK = true;
  const memory = {};
  const store = (function () {
    try {
      const t = '__indy_test__';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return localStorage;
    } catch (e) {
      storageOK = false; // sin localStorage: se usa memoria (se pierde al cerrar)
      return {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; },
        setItem: function (k, v) { memory[k] = String(v); },
        removeItem: function (k) { delete memory[k]; }
      };
    }
  })();

  function storageGet(key, fallback) {
    try {
      const raw = store.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function storageSet(key, value) {
    try { store.setItem(key, JSON.stringify(value)); return true; }
    catch (e) {
      toast('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado. Probá con una foto más chica.', 'error');
      return false;
    }
  }

  // Lee todo desde localStorage al estado en memoria
  function loadAll() {
    const pet = storageGet(KEYS.pet, null);
    state.pet = pet && typeof pet === 'object' && pet.name ? Object.assign({ weights: [] }, pet, { weights: Array.isArray(pet.weights) ? pet.weights : [] }) : null;
    const list = function (k) { const a = storageGet(k, []); return Array.isArray(a) ? a : []; };
    state.reminders = list(KEYS.reminders).filter(function (r) { return r && r.id && r.date; });
    state.history = list(KEYS.history).filter(function (r) { return r && r.id && r.date; });
    state.moments = list(KEYS.moments).filter(function (r) { return r && r.id; });
    const s = storageGet(KEYS.settings, {}) || {};
    const d = defaultSettings();
    state.settings = Object.assign({}, d, s, {
      contact: Object.assign({}, d.contact, s.contact || {}),
      publicFields: Object.assign({}, d.publicFields, s.publicFields || {}),
      lost: Object.assign({}, d.lost, s.lost || {}),
      links: Object.assign({}, s.links || {})
    });
  }

  // Cambia un valor del estado y lo guarda. Si falla, deja todo como estaba.
  function commit(name, value) {
    const prev = state[name];
    state[name] = value;
    if (!storageSet(KEYS[name], value)) { state[name] = prev; return false; }
    return true;
  }

  // Borra mascota y todo lo asociado (recordatorios, historial, momentos, estado perdida)
  function wipePetData() {
    Object.keys(KEYS).forEach(function (k) { if (k !== 'settings') { store.removeItem(KEYS[k]); } });
    state.pet = null; state.reminders = []; state.history = []; state.moments = [];
    const s = Object.assign({}, state.settings, { lost: { active: false, since: null } });
    if (s.demoContact) { s.contact = defaultSettings().contact; s.demoContact = false; }
    commit('settings', s);
    state.ui.petTab = 'profile'; state.ui.idTab = 'card';
  }

  function storageUsageKB() {
    let n = 0;
    Object.keys(KEYS).forEach(function (k) { const v = store.getItem(KEYS[k]); if (v) n += v.length; });
    return Math.round(n / 1024);
  }

  function exportBackup() {
    const data = { app: 'INDY', version: BRAND.version, exportedAt: new Date().toISOString(),
      pet: state.pet, reminders: state.reminders, history: state.history, moments: state.moments, settings: state.settings };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    downloadBlob(blob, 'indy-copia-' + todayISO() + '.json');
    toast('Copia de seguridad descargada ❤️');
  }

  function importBackup(file) {
    const fr = new FileReader();
    fr.onload = function () {
      let o;
      try { o = JSON.parse(fr.result); } catch (e) { o = null; }
      if (!o || o.app !== 'INDY' || !Array.isArray(o.reminders) || !Array.isArray(o.history) || !Array.isArray(o.moments)) {
        toast('Ese archivo no es una copia de seguridad de INDY.', 'error'); return;
      }
      confirmDialog({ title: 'Restaurar copia', message: 'Se va a reemplazar todo lo que hay ahora en este dispositivo por el contenido de la copia. ¿Continuamos?', ok: 'RESTAURAR', danger: true }).then(function (yes) {
        if (!yes) return;
        const d = defaultSettings(); const s = o.settings || {};
        const settings = Object.assign({}, d, s, { contact: Object.assign({}, d.contact, s.contact || {}), publicFields: Object.assign({}, d.publicFields, s.publicFields || {}), lost: Object.assign({}, d.lost, s.lost || {}), links: s.links || {} });
        const ok = commit('pet', o.pet && o.pet.name ? Object.assign({ weights: [] }, o.pet) : null) &&
          commit('reminders', o.reminders) && commit('history', o.history) && commit('moments', o.moments) && commit('settings', settings);
        if (!ok) return;
        applyTextSize(); toast('Copia restaurada ❤️'); navigate('home');
      });
    };
    fr.onerror = function () { toast('No pude leer el archivo.', 'error'); };
    fr.readAsText(file);
  }

  function resetAll() {
    Object.keys(KEYS).forEach(function (k) { store.removeItem(KEYS[k]); });
    state.pet = null; state.reminders = []; state.history = []; state.moments = [];
    state.settings = defaultSettings();
    state.ui = { petTab: 'profile', idTab: 'card' };
    applyTextSize();
  }

  /* ===========================================================
     4. NAVEGACIÓN
     =========================================================== */
  const SCREENS = {
    home: { title: 'Inicio', tab: 'home' },
    pet: { title: 'Mi mascota', tab: 'pet' },
    reminders: { title: 'Recordatorios', tab: 'reminders' },
    identity: { title: 'Identidad INDY', tab: 'identity' },
    more: { title: 'Más', tab: 'more' },
    moments: { title: 'Momentos', tab: 'more', parent: 'more' },
    store: { title: 'Tienda INDY', tab: 'more', parent: 'more' },
    owner: { title: 'Mi información', tab: 'more', parent: 'more' },
   /*   settings: { title: 'Configuración', tab: 'more', parent: 'more' },
    links: { title: 'Enlaces de INDY', tab: 'more', parent: 'more' },*/
    help: { title: 'Ayuda', tab: 'more', parent: 'more' },
    about: { title: 'Acerca de INDY', tab: 'more', parent: 'more' }
  };
  const RENDERERS = {
    home: renderHome, pet: renderPet, reminders: renderReminders, identity: renderIdentity, more: renderMore,
    moments: renderMoments, store: renderStore, owner: renderOwner, settings: renderSettings,
    links: renderLinks, help: renderHelp, about: renderAbout
  };
  const ACTIONS = {};   // acciones de botones (data-action)
  const FORMS = {};     // envío de formularios (data-form)
  const CHANGES = {};   // cambios en inputs (data-change)
  let current = 'home';
  let publicOpen = false;

  function navigate(screen, opts) {
    opts = opts || {};
    if (!SCREENS[screen]) screen = 'home';
    if (opts.sub) {
      if (screen === 'pet') state.ui.petTab = opts.sub;
      if (screen === 'identity') state.ui.idTab = opts.sub;
    }
    const changed = screen !== current;
    current = screen;
    if (opts.push !== false) {
      try { history[changed ? 'pushState' : 'replaceState']({ screen: screen }, ''); } catch (e) { /* sin historial */ }
    }
    renderCurrent();
    if (changed) { window.scrollTo(0, 0); const c = $('#content'); if (c) c.focus({ preventScroll: true }); }
  }

  function renderCurrent() {
    $$('.screen').forEach(function (s) {
      const on = s.id === 'screen-' + current;
      s.classList.toggle('active', on);
      s.hidden = !on;
      if (!on) s.innerHTML = '';   // evita ids duplicados entre pantallas
    });
    $('#screen-' + current).innerHTML = RENDERERS[current]();
    updateChrome();
    afterRender();
  }
  function refresh() {
    const y = window.scrollY;
    renderCurrent();
    window.scrollTo(0, y);
  }

  function updateChrome() {
    const meta = SCREENS[current];
    $$('.nav-btn').forEach(function (b) {
      if (b.dataset.tab === meta.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const sub = !!meta.parent;
    $('#appbar-back').hidden = !sub;
    $('#appbar-brand').hidden = sub;
    const t = $('#appbar-title');
    t.hidden = !sub; t.textContent = meta.title;
    $('#appbar-lost').hidden = !(state.pet && state.settings.lost.active);
    document.title = meta.title + ' · ' + BRAND.name;
  }

  function afterRender() {
    if (current === 'identity' && state.ui.idTab === 'qr') drawQRInto();
  }

  function enterApp() {
    $('#welcome').hidden = true;
    $('#app').hidden = false;
    try { history.pushState({ screen: 'home' }, ''); } catch (e) { /* ignorar */ }
    current = 'home';
    renderCurrent();
    window.scrollTo(0, 0);
  }
  function showWelcome() {
    $('#welcome').hidden = false;
    $('#app').hidden = true;
    $('#welcome-start').textContent = state.pet ? 'CONTINUAR' : 'COMENZAR';
    $('#welcome-demo').hidden = !!state.pet;
  }

  /* ---------- Hojas (formularios y confirmaciones) ---------- */
  let sheetOpen = false;
  let sheetLastFocus = null;
  let confirmResolve = null;

  function updateInert() {
    const app = $('#app'), pv = $('#public-view');
    if (app) app.inert = sheetOpen || publicOpen;
    if (pv) pv.inert = sheetOpen;
  }
  function openSheet(title, bodyHTML, onOpen) {
    const root = $('#sheet-root');
    root.innerHTML = '<div class="sheet-backdrop" data-action="sheet-close"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">' +
      '<div class="sheet-head"><h2 id="sheet-title">' + esc(title) + '</h2>' +
      '<button type="button" class="icon-btn" data-action="sheet-close" aria-label="Cerrar">' + icon('close') + '</button></div>' +
      '<div class="sheet-body">' + bodyHTML + '</div></div>';
    if (!sheetOpen) sheetLastFocus = document.activeElement;
    sheetOpen = true;
    document.body.classList.add('sheet-open');
    updateInert();
    const sh = $('.sheet', root);
    try { sh.focus({ preventScroll: true }); } catch (e) { /* ignorar */ }
    if (onOpen) onOpen($('.sheet-body', root));
  }
  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    if (confirmResolve) { const r = confirmResolve; confirmResolve = null; r(false); }
    $('#sheet-root').innerHTML = '';
    document.body.classList.remove('sheet-open');
    updateInert();
    if (sheetLastFocus && sheetLastFocus.focus) { try { sheetLastFocus.focus({ preventScroll: true }); } catch (e) { /* ignorar */ } }
  }
  function confirmDialog(o) {
    return new Promise(function (resolve) {
      openSheet(o.title || '¿Confirmás?',
        '<p class="confirm-msg">' + esc(o.message) + '</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-ghost" data-action="confirm-no">CANCELAR</button>' +
        '<button type="button" class="btn ' + (o.danger ? 'btn-accent' : 'btn-primary') + '" data-action="confirm-yes">' + esc(o.ok || 'CONFIRMAR') + '</button></div>');
      confirmResolve = resolve;
    });
  }
  ACTIONS['sheet-close'] = function () { closeSheet(); };
  ACTIONS['confirm-yes'] = function () { const r = confirmResolve; confirmResolve = null; closeSheet(); if (r) r(true); };
  ACTIONS['confirm-no'] = function () { closeSheet(); };

  /* ---------- Acciones de navegación ---------- */
  ACTIONS.go = function (d) { navigate(d.screen, { sub: d.sub }); };
  ACTIONS.back = function () { navigate((SCREENS[current] && SCREENS[current].parent) || 'home'); };
  ACTIONS.start = function () { enterApp(); };
  ACTIONS.demo = function () {
    if (state.pet) { toast('Ya tenés una mascota guardada. No se sobrescribió nada.'); return; }
    createDemo();
    if (!$('#welcome').hidden) enterApp(); else navigate('home');
    toast('Cargamos a Indy como ejemplo 🐾');
  };

  /* ---------- Helpers de formularios ---------- */
  function opts(list) { return list.map(function (v) { return { v: v, l: v }; }); }
  function fieldHTML(o) {
    const id = 'f-' + o.name, type = o.type || 'text', val = o.value == null ? '' : o.value;
    let control;
    if (type === 'select') {
      control = '<select id="' + id + '" name="' + o.name + '" ' + (o.attrs || '') + '>' + o.options.map(function (x) {
        return '<option value="' + esc(x.v) + '"' + (x.v === val ? ' selected' : '') + '>' + esc(x.l) + '</option>';
      }).join('') + '</select>';
    } else if (type === 'textarea') {
      control = '<textarea id="' + id + '" name="' + o.name + '" rows="' + (o.rows || 3) + '" placeholder="' + esc(o.placeholder || '') + '" ' + (o.attrs || '') + '>' + esc(val) + '</textarea>';
    } else {
      control = '<input id="' + id + '" name="' + o.name + '" type="' + type + '" value="' + esc(val) + '" placeholder="' + esc(o.placeholder || '') + '" ' + (o.attrs || '') + '>';
    }
    return '<div class="field" data-field="' + o.name + '"><label for="' + id + '">' + esc(o.label) + (o.required ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' +
      control + (o.hint ? '<p class="hint">' + esc(o.hint) + '</p>' : '') + '<p class="field-error" id="err-' + o.name + '" role="alert"></p></div>';
  }
  function setError(form, name, msg) {
    const w = form.querySelector('[data-field="' + name + '"]');
    if (!w) return;
    w.classList.add('has-error');
    w.querySelector('.field-error').textContent = msg;
    const i = w.querySelector('input,select,textarea');
    if (i) { i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', 'err-' + name); }
  }
  function clearErrors(form) {
    form.querySelectorAll('.has-error').forEach(function (w) {
      w.classList.remove('has-error');
      w.querySelector('.field-error').textContent = '';
      const i = w.querySelector('input,select,textarea');
      if (i) i.removeAttribute('aria-invalid');
    });
  }
  function focusFirstError(form) {
    const w = form.querySelector('.has-error');
    if (!w) return;
    const i = w.querySelector('input,select,textarea');
    if (i) { i.focus(); i.scrollIntoView({ block: 'center' }); }
  }
  function fd(form) {
    const o = {};
    new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
    return o;
  }
  function saved() { toast('Guardado correctamente ❤️'); }

  // Selector de foto reutilizable (guarda la imagen reducida en un input oculto "photo")
  function photoPickerHTML(maxSide, quality, label) {
    return '<div class="photo-picker" data-photo-picker><div class="photo photo-ph" data-preview>' + icon('paw') + '</div>' +
      '<div class="photo-actions"><button type="button" class="btn btn-soft" data-action="photo-pick">' + icon('camera') + esc(label || 'ELEGIR FOTO') + '</button>' +
      '<button type="button" class="btn btn-ghost" data-action="photo-clear">QUITAR FOTO</button></div>' +
      '<input type="hidden" name="photo" value=""><input type="file" accept="image/*" hidden data-change="photo-file" data-max="' + maxSide + '" data-q="' + quality + '"></div>';
  }
  function updatePhotoPreview(form) {
    const box = form.querySelector('[data-preview]'); if (!box) return;
    const src = safeImageSrc(form.elements.photo.value);
    if (src) { box.className = 'photo'; box.innerHTML = '<img src="' + esc(src) + '" alt="Vista previa" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">'; }
    else { box.className = 'photo photo-ph'; box.innerHTML = icon('paw'); }
  }
  ACTIONS['photo-pick'] = function (d, el) { const p = el.closest('[data-photo-picker]'); p.querySelector('input[type=file]').click(); };
  ACTIONS['photo-clear'] = function (d, el) { const f = el.closest('form'); f.elements.photo.value = ''; updatePhotoPreview(f); };
  CHANGES['photo-file'] = function (el) {
    const f = el.closest('form'); const file = el.files && el.files[0];
    if (!file) return;
    readImage(file, Number(el.dataset.max) || 640, Number(el.dataset.q) || 0.8).then(function (url) {
      f.elements.photo.value = url; updatePhotoPreview(f);
    }).catch(function () { toast('No pude leer esa imagen. Probá con otra foto.', 'error'); });
    el.value = '';
  };

  /* ===========================================================
     5. MASCOTA
     =========================================================== */
  function speciesLabel(p) { return p.species === 'Otro' ? (p.speciesOther || 'Otro') : p.species; }
  function sexText(p) { return p.sex && p.sex !== 'No especificado' ? p.sex : ''; }
  function petPhotoHTML(p, cls) {
    const src = safeImageSrc(p && p.photo);
    return src ? '<img class="photo ' + cls + '" src="' + esc(src) + '" alt="Foto de ' + esc(p.name) + '">'
      : '<div class="photo photo-ph ' + cls + '" role="img" aria-label="Sin foto">' + icon('paw') + '</div>';
  }
  function genCode() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
    for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return 'IND-' + s.slice(0, 3) + '-' + s.slice(3);
  }
  function requirePet() {
    if (state.pet) return true;
    toast('Primero creá el perfil de tu mascota.');
    openPetForm();
    return false;
  }
  function emptyPetHTML() {
    return '<div class="card empty-card"><div class="empty-ico">' + icon('paw') + '</div>' +
      '<h3>Todavía no agregaste a tu mascota</h3>' +
      '<p class="muted">Creá su perfil para guardar sus datos, recordar sus cuidados y generar su identidad INDY.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-accent btn-block" data-action="pet-edit">' + icon('plus') + 'CREAR MI MASCOTA</button>' +
      '<button type="button" class="btn btn-ghost btn-block" data-action="demo">Probar con una mascota de ejemplo</button></div></div>';
  }

  /* ---------- Pantalla de inicio ---------- */
  function renderHome() {
    const s = state.settings, p = state.pet;
    let h = '<div class="screen-inner"><h1 class="greeting">Hola' + (s.ownerName ? ', ' + esc(s.ownerName) : '') + ' <span aria-hidden="true">👋</span></h1>';
    if (p && s.lost.active) h += lostBannerHTML();
    if (p && p.isDemo) {
      h += '<div class="banner">' + icon('info') + '<div class="banner-body"><strong>Estás viendo una mascota de ejemplo</strong>' +
        '<span>Cuando quieras, reemplazala por tu mascota real.</span>' +
        '<button type="button" class="btn btn-sm btn-primary" data-action="demo-replace">REEMPLAZAR POR MI MASCOTA</button></div></div>';
    }
    h += '<h2 class="section-title">Mi mascota</h2>';
    if (!p) { h += emptyPetHTML(); return h + '</div>'; }
    const age = ageText(p.birthdate);
    h += '<article class="pet-card"><div class="pet-card-top">' + petPhotoHTML(p, '') +
      '<div><h3 class="pet-card-name">' + esc(p.name) + '</h3><p class="muted">' + esc(speciesLabel(p)) + (p.breed ? ' · ' + esc(p.breed) : '') + '</p>' +
      '<div class="chips" style="margin-top:8px">' + (age ? '<span class="chip">' + icon('calendar') + esc(age) + '</span>' : '') +
      (sexText(p) ? '<span class="chip">' + esc(sexText(p)) + '</span>' : '') + '</div></div></div>' +
      '<div class="pet-card-body">' + nextReminderBox() +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="go" data-screen="pet">VER MASCOTA</button>' +
      '<button type="button" class="btn btn-accent" data-action="reminder-new">' + icon('plus') + 'AGREGAR RECORDATORIO</button></div></div></article>';
    const tiles = [
      ['book', 'Historial', 'pet', 'history'], ['scale', 'Peso', 'pet', 'weight'], ['heart', 'Momentos', 'moments', ''],
      ['qr', 'QR de identidad', 'identity', 'qr'], ['alert', 'Mascota perdida', 'identity', 'lost', true], ['store', 'Tienda INDY', 'store', '']
    ];
    h += '<h2 class="section-title">Accesos rápidos</h2><div class="tile-grid">' + tiles.map(function (t) {
      return '<button type="button" class="tile' + (t[4] ? ' tile--alert' : '') + '" data-action="go" data-screen="' + t[2] + '" data-sub="' + t[3] + '"><span class="tile-ico">' + icon(t[0]) + '</span>' + esc(t[1]) + '</button>';
    }).join('') + '</div>';
    const pend = pendingSorted().slice(0, 3);
    h += '<div class="section-head"><h2 class="section-title">Para no olvidar</h2><button type="button" class="link-btn" data-action="go" data-screen="reminders">Ver todos</button></div>';
    h += pend.length ? pend.map(reminderCardHTML).join('') : '<div class="card"><p class="muted">No tenés recordatorios pendientes.</p></div>';
    return h + '</div>';
  }

  function nextReminderBox() {
    const r = nextReminder();
    if (!r) return '<div class="next-box"><span class="next-ico">' + icon('bell') + '</span><div><p class="next-label">Próximo recordatorio</p><p class="next-title">Sin recordatorios pendientes</p></div></div>';
    const st = reminderStatus(r);
    return '<div class="next-box"><span class="next-ico">' + icon(REMINDER_ICONS[r.type] || 'bell') + '</span><div><p class="next-label">Próximo recordatorio</p>' +
      '<p class="next-title">' + esc(r.title) + '</p><p class="next-meta">' + esc(fmtDate(r.date)) + ' · ' + esc(relDay(r.date)) + (st === 'overdue' ? ' (vencido)' : '') + '</p></div></div>';
  }

  /* ---------- Pantalla Mascota ---------- */
  function renderPet() {
    const p = state.pet;
    if (!p) return '<div class="screen-inner"><div class="page-head"><h1>Mi mascota</h1></div>' + emptyPetHTML() + '</div>';
    const tab = state.ui.petTab;
    const age = ageText(p.birthdate);
    const tabs = [['profile', 'Perfil', 'paw'], ['weight', 'Peso', 'scale'], ['history', 'Historial', 'book']];
    return '<div class="screen-inner"><h1 class="sr-only">Mi mascota</h1>' +
      '<div class="pet-hero">' + petPhotoHTML(p, '') + '<div><h2 class="pet-name">' + esc(p.name) + '</h2><p class="muted">' + esc(speciesLabel(p)) + (p.breed ? ' · ' + esc(p.breed) : '') + '</p>' +
      '<div class="chips" style="margin-top:8px">' + (age ? '<span class="chip">' + icon('calendar') + esc(age) + '</span>' : '') + (sexText(p) ? '<span class="chip">' + esc(sexText(p)) + '</span>' : '') + '</div></div></div>' +
      segHTML(tabs, tab, 'pet') +
      '<div class="panel" role="tabpanel">' + (tab === 'weight' ? weightPanelHTML(p) : tab === 'history' ? historyPanelHTML() : profilePanelHTML(p)) + '</div></div>';
  }
  function segHTML(tabs, active, screen) {
    return '<div class="seg" role="tablist">' + tabs.map(function (t) {
      return '<button type="button" role="tab" class="seg-btn" aria-selected="' + (t[0] === active) + '" data-action="go" data-screen="' + screen + '" data-sub="' + t[0] + '">' + icon(t[2]) + '<span>' + esc(t[1]) + '</span></button>';
    }).join('') + '</div>';
  }
  function profilePanelHTML(p) {
    const lw = latestWeight(p);
    const rows = [
      ['Especie', speciesLabel(p)], ['Raza', p.breed], ['Sexo', sexText(p)],
      ['Fecha de nacimiento', p.birthdate ? fmtDate(p.birthdate) : ''], ['Edad', ageText(p.birthdate)], ['Color', p.color],
      ['Peso actual', lw ? fmtKg(lw.kg) : ''], ['Características', p.characteristics], ['Información importante', p.importantInfo]
    ];
    return '<div class="card"><dl class="detail-list">' + rows.map(function (r) {
      return '<div class="detail-row"><dt>' + r[0] + '</dt><dd>' + (r[1] ? esc(r[1]) : '<span class="muted">Sin completar</span>') + '</dd></div>';
    }).join('') + '</dl></div>' +
      '<button type="button" class="btn btn-primary btn-block btn-lg" data-action="pet-edit">' + icon('edit') + 'EDITAR DATOS</button>' +
      '<button type="button" class="btn btn-danger btn-block" data-action="pet-delete">' + icon('trash') + 'ELIMINAR MASCOTA</button>';
  }

  function openPetForm() {
    const old = state.pet, p = old || {};
    const lw = old ? latestWeight(old) : null;
    const body = '<form class="form" data-form="pet" novalidate>' +
      photoPickerHTML(CONFIG.petPhotoMax, CONFIG.petPhotoQuality) +
      fieldHTML({ name: 'name', label: 'Nombre', required: true, value: p.name, placeholder: 'Ej. Indy', attrs: 'maxlength="40" autocomplete="off"' }) +
      fieldHTML({ name: 'species', label: 'Especie', type: 'select', options: opts(SPECIES), value: p.species || 'Perro', attrs: 'data-change="species"' }) +
      '<div data-species-other' + ((p.species === 'Otro') ? '' : ' hidden') + '>' + fieldHTML({ name: 'speciesOther', label: '¿Qué especie es?', value: p.speciesOther, attrs: 'maxlength="30"' }) + '</div>' +
      fieldHTML({ name: 'breed', label: 'Raza', value: p.breed, placeholder: 'Ej. Mestiza', attrs: 'maxlength="40"' }) +
      fieldHTML({ name: 'sex', label: 'Sexo', type: 'select', options: opts(SEXES), value: p.sex || 'No especificado' }) +
      fieldHTML({ name: 'birthdate', label: 'Fecha de nacimiento', type: 'date', value: p.birthdate, attrs: 'max="' + todayISO() + '"', hint: 'La edad se calcula sola.' }) +
      fieldHTML({ name: 'color', label: 'Color', value: p.color, placeholder: 'Ej. Canela con pecho blanco', attrs: 'maxlength="60"' }) +
      fieldHTML({ name: 'characteristics', label: 'Características', type: 'textarea', value: p.characteristics, placeholder: 'Señas particulares, manchas, tamaño…', attrs: 'maxlength="300"' }) +
      fieldHTML({ name: 'weight', label: 'Peso actual (kg)', value: lw ? String(lw.kg).replace('.', ',') : '', placeholder: 'Ej. 8,5', attrs: 'inputmode="decimal"', hint: 'Si lo cambiás, se agrega una medición de hoy.' }) +
      fieldHTML({ name: 'importantInfo', label: 'Información importante', type: 'textarea', value: p.importantInfo, placeholder: 'Alergias, medicación, miedos, cuidados especiales…', attrs: 'maxlength="400"' }) +
      '<button type="submit" class="btn btn-primary btn-lg btn-block">GUARDAR</button></form>';
    openSheet(old ? 'Editar datos' : 'Crear mi mascota', body, function (b) {
      const f = $('form', b); f.elements.photo.value = p.photo || ''; updatePhotoPreview(f);
    });
  }
  ACTIONS['pet-edit'] = function () { openPetForm(); };
  CHANGES.species = function (el) {
    const w = el.closest('form').querySelector('[data-species-other]');
    w.hidden = el.value !== 'Otro';
  };
  FORMS.pet = function (f) {
    clearErrors(f);
    const d = fd(f); let ok = true;
    if (!d.name) { setError(f, 'name', 'Escribí el nombre de tu mascota.'); ok = false; }
    if (d.species === 'Otro' && !d.speciesOther) { setError(f, 'speciesOther', 'Contanos qué especie es.'); ok = false; }
    if (d.birthdate && d.birthdate > todayISO()) { setError(f, 'birthdate', 'La fecha de nacimiento no puede ser futura.'); ok = false; }
    const kg = d.weight ? parseKg(d.weight) : null;
    if (d.weight && kg === null) { setError(f, 'weight', 'Ingresá un peso válido, por ejemplo 8,5.'); ok = false; }
    if (!ok) { focusFirstError(f); return; }
    const old = state.pet, now = new Date().toISOString();
    const pet = {
      id: old ? old.id : uid(), code: old ? old.code : genCode(), name: d.name, species: d.species,
      speciesOther: d.species === 'Otro' ? d.speciesOther : '', breed: d.breed || '', sex: d.sex, birthdate: d.birthdate || '',
      color: d.color || '', characteristics: d.characteristics || '', importantInfo: d.importantInfo || '', photo: d.photo || '',
      weights: old ? old.weights.slice() : [], isDemo: old ? !!old.isDemo : false, createdAt: old ? old.createdAt : now, updatedAt: now
    };
    if (kg !== null) { const lw = latestWeight(pet); if (!lw || lw.kg !== kg) pet.weights.push({ id: uid(), date: todayISO(), kg: kg }); }
    if (!commit('pet', pet)) return;
    closeSheet(); saved(); refresh(); updateChrome();
  };
  ACTIONS['pet-delete'] = function () {
    confirmDialog({ title: 'Eliminar mascota', message: 'Se van a borrar su perfil, recordatorios, historial, pesos y momentos de este dispositivo. Esta acción no se puede deshacer.', ok: 'ELIMINAR', danger: true }).then(function (yes) {
      if (!yes) return;
      wipePetData(); toast('Mascota eliminada.'); navigate('home');
    });
  };
  ACTIONS['demo-replace'] = function () {
    confirmDialog({ title: 'Reemplazar el ejemplo', message: 'Se van a quitar los datos de ejemplo (Indy, sus recordatorios, historial y momentos) para que cargues a tu mascota real.', ok: 'CONTINUAR', danger: false }).then(function (yes) {
      if (!yes) return;
      wipePetData(); navigate('home');
      setTimeout(openPetForm, 50);
    });
  };

  /* ---------- Datos de ejemplo ---------- */
  function svgURI(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
  function demoDogAvatar() {
    return svgURI("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#CFC6F7'/><stop offset='1' stop-color='#A9BBFA'/></linearGradient></defs>" +
      "<rect width='200' height='200' fill='url(#g)'/><path d='M36 200c4-34 30-50 64-50s60 16 64 50z' fill='#D9954F'/>" +
      "<ellipse cx='52' cy='98' rx='23' ry='45' fill='#9A5F3A' transform='rotate(12 52 98)'/><ellipse cx='148' cy='98' rx='23' ry='45' fill='#9A5F3A' transform='rotate(-12 148 98)'/>" +
      "<ellipse cx='100' cy='102' rx='52' ry='56' fill='#D9954F'/><path d='M91 50h18l6 44H85z' fill='#FFF3E6'/><ellipse cx='100' cy='128' rx='28' ry='22' fill='#FFF3E6'/>" +
      "<circle cx='79' cy='97' r='6.500' fill='#2B2230'/><circle cx='121' cy='97' r='6.500' fill='#2B2230'/><circle cx='81' cy='95' r='2' fill='#fff'/><circle cx='123' cy='95' r='2' fill='#fff'/>" +
      "<ellipse cx='100' cy='117' rx='10' ry='7' fill='#2B2230'/><path d='M100 124v8M100 132c-6 6-14 4-16-2M100 132c6 6 14 4 16-2' stroke='#2B2230' stroke-width='3' fill='none' stroke-linecap='round'/>" +
      "<ellipse cx='100' cy='143' rx='7' ry='9' fill='#FF7A66'/><path d='M64 160c22 14 50 14 72 0' stroke='#2B4FD8' stroke-width='9' fill='none' stroke-linecap='round'/><circle cx='100' cy='177' r='8' fill='#FF7A66'/></svg>");
  }
  function demoArt(kind) {
    const head = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + (kind === 'cake' ? '#FFE3DD' : '#DCD5FA') + "'/><stop offset='1' stop-color='" + (kind === 'cake' ? '#E3DBFB' : '#B7C6FB') + "'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/>";
    if (kind === 'cake') {
      return svgURI(head + "<rect x='110' y='170' width='180' height='80' rx='16' fill='#fff'/><rect x='130' y='130' width='140' height='50' rx='14' fill='#9C8CEB'/><rect x='196' y='90' width='8' height='40' rx='3' fill='#2B4FD8'/><ellipse cx='200' cy='82' rx='8' ry='12' fill='#FF7A66'/><path d='M110 200q20 14 40 0t40 0 40 0 40 0' stroke='#FFE3DD' stroke-width='6' fill='none'/></svg>");
    }
    return svgURI(head + "<circle cx='320' cy='70' r='34' fill='#FFE3DD'/><path d='M120 170 200 100l80 70v80H120z' fill='#fff'/><rect x='178' y='190' width='44' height='60' rx='6' fill='#2B4FD8'/><path d='M200 140c-10-12-28 0-16 14l16 14 16-14c12-14-6-26-16-14z' fill='#FF7A66'/></svg>");
  }
  function createDemo() {
    if (state.pet) return;    // nunca pisa datos reales
    const t = todayISO(), now = new Date().toISOString();
    const w = function (m, kg, d) { return { id: uid(), date: d ? addDays(t, d) : addMonths(t, m), kg: kg }; };
    const pet = {
      id: uid(), code: genCode(), name: 'Indy', species: 'Perro', speciesOther: '', breed: 'Mestiza', sex: 'Hembra', birthdate: addMonths(t, -27),
      color: 'Canela con pecho blanco', characteristics: 'Mancha blanca en la patita derecha, orejas caídas y mirada dulce.',
      importantInfo: 'Le asustan los ruidos fuertes. Es alérgica al pollo.', photo: demoDogAvatar(),
      weights: [w(-8, 7.4), w(-6, 8.2), w(-4, 8.9), w(-2, 9.3), w(0, 9.6, -5)], isDemo: true, createdAt: now, updatedAt: now
    };
    const rem = function (title, type, d, repeat, notes, done) {
      return { id: uid(), title: title, type: type, date: addDays(t, d), repeat: repeat, notes: notes, status: done ? 'done' : 'pending', doneAt: done ? addDays(t, d) : undefined, createdAt: now };
    };
    const reminders = [
      rem('Refuerzo de vacuna anual', 'Vacuna', 12, 'yearly', 'Llevar la libreta sanitaria.'),
      rem('Pastilla antiparasitaria', 'Desparasitación', 3, 'monthly', 'Con la comida de la noche.'),
      rem('Baño y cepillado', 'Baño', 7, 'monthly', ''),
      rem('Control con el veterinario', 'Veterinario', -4, 'none', 'Consultar por el alimento.'),
      rem('Corte de uñas', 'Peluquería', -20, 'none', '', true)
    ];
    const h = function (d, cat, title, desc) { return { id: uid(), date: addDays(t, d), category: cat, title: title, description: desc, createdAt: now }; };
    const hist = [
      h(-90, 'Vacuna', 'Vacuna séxtuple', 'Aplicada sin reacciones. Próximo refuerzo en un año.'),
      h(-40, 'Veterinario', 'Control general', 'Todo en orden. Dientes y pelaje en buen estado.'),
      h(-15, 'Alimentación', 'Cambio de alimento', 'Probamos un alimento sin pollo. Lo come muy bien.'),
      h(-5, 'Peso', 'Pesaje mensual', 'Pesó 9,6 kg.')
    ];
    const mo = function (date, title, desc, kind) { return { id: uid(), date: date, title: title, description: desc, photo: demoArt(kind), createdAt: now }; };
    const moments = [
      mo(addMonths(t, -25), 'Su primer día en casa', 'Se animó a explorar todos los rincones y se durmió en nuestros pies.', 'home'),
      mo(addMonths(t, -15), 'Cumplió 1 año', 'Hubo torta de zanahoria, globos y muchos mimos.', 'cake')
    ];
    const s = Object.assign({}, state.settings);
    if (!s.contact.name && !s.contact.phone && !s.contact.whatsapp) {
      s.contact = { name: 'Familia de Indy', phone: '+54 9 11 0000-0000', whatsapp: '5491100000000', address: '' }; s.demoContact = true;
    }
    commit('pet', pet); commit('reminders', reminders); commit('history', hist); commit('moments', moments); commit('settings', s);
  }

  /* ===========================================================
     6. RECORDATORIOS
     =========================================================== */
  const STATUS_META = {
    upcoming: { label: 'Próximo', icon: 'clock' }, today: { label: 'Hoy', icon: 'bell' },
    overdue: { label: 'Vencido', icon: 'alert' }, done: { label: 'Realizado', icon: 'check' }
  };
  function reminderStatus(r) {
    if (r.status === 'done') return 'done';
    const d = diffDays(r.date, todayISO());
    return d < 0 ? 'overdue' : d === 0 ? 'today' : 'upcoming';
  }
  function byDateAsc(a, b) { return a.date.localeCompare(b.date); }
  function pendingSorted() { return state.reminders.filter(function (r) { return r.status !== 'done'; }).sort(byDateAsc); }
  function nextReminder() {
    const t = todayISO(), p = pendingSorted();
    return p.find(function (r) { return r.date >= t; }) || p[0] || null;
  }
  function nextDate(iso, rep) {
    switch (rep) {
      case 'weekly': return addDays(iso, 7);
      case 'monthly': return addMonths(iso, 1);
      case 'quarterly': return addMonths(iso, 3);
      case 'biannual': return addMonths(iso, 6);
      case 'yearly': return addMonths(iso, 12);
      default: return iso;
    }
  }

  function reminderCardHTML(r) {
    const st = reminderStatus(r), m = STATUS_META[st];
    const rep = REPEATS.find(function (x) { return x.v === r.repeat; });
    return '<article class="rem rem--' + st + '"><div class="rem-top"><span class="rem-ico">' + icon(REMINDER_ICONS[r.type] || 'bell') + '</span>' +
      '<div><h3 class="rem-title">' + esc(r.title) + '</h3><p class="rem-meta">' + esc(r.type) + ' · ' + esc(fmtDate(r.date)) + (st === 'done' ? '' : ' · ' + esc(relDay(r.date))) + '</p></div></div>' +
      '<div class="rem-tags"><span class="badge badge--' + st + '">' + icon(m.icon) + m.label + '</span>' +
      (rep && r.repeat !== 'none' ? '<span class="badge badge--plain">' + icon('repeat') + esc(rep.l) + '</span>' : '') + '</div>' +
      (r.notes ? '<p class="rem-notes">' + esc(r.notes) + '</p>' : '') +
      '<div class="rem-actions">' +
      (st === 'done'
        ? '<button type="button" class="btn btn-sm btn-soft" data-action="reminder-undo" data-id="' + r.id + '">' + icon('back') + 'Reabrir</button>'
        : '<button type="button" class="btn btn-sm btn-primary" data-action="reminder-done" data-id="' + r.id + '">' + icon('check') + 'Marcar realizado</button>') +
      '<button type="button" class="btn btn-sm btn-ghost" data-action="reminder-edit" data-id="' + r.id + '">' + icon('edit') + 'Editar</button>' +
      '<button type="button" class="btn btn-sm btn-ghost" data-action="reminder-delete" data-id="' + r.id + '">' + icon('trash') + 'Eliminar</button></div></article>';
  }

  function renderReminders() {
    const head = '<div class="page-head"><h1>Recordatorios</h1><p class="muted">Vacunas, medicación, baños y todo lo que no querés olvidar.</p></div>';
    if (!state.pet) return '<div class="screen-inner">' + head + emptyPetHTML() + '</div>';
    const t = todayISO(), R = state.reminders;
    const upcoming = R.filter(function (r) { return r.status !== 'done' && r.date >= t; }).sort(byDateAsc);
    const overdue = R.filter(function (r) { return r.status !== 'done' && r.date < t; }).sort(byDateAsc);
    const done = R.filter(function (r) { return r.status === 'done'; }).sort(function (a, b) { return (b.doneAt || b.date).localeCompare(a.doneAt || a.date); });
    const sec = function (title, list) {
      return list.length ? '<h2 class="section-title">' + title + ' (' + list.length + ')</h2>' + list.map(reminderCardHTML).join('') : '';
    };
    let h = '<div class="screen-inner">' + head + '<button type="button" class="btn btn-accent btn-lg btn-block" data-action="reminder-new">' + icon('plus') + 'NUEVO RECORDATORIO</button>';
    if (!R.length) h += '<div class="card empty-card"><div class="empty-ico">' + icon('bell') + '</div><h3>Todavía no hay recordatorios</h3><p class="muted">Agregá el primero: una vacuna, un baño o una medicación.</p></div>';
    h += sec('Próximos', upcoming) + sec('Vencidos', overdue) + sec('Realizados', done);
    return h + '</div>';
  }

  function openReminderForm(id) {
    if (!requirePet()) return;
    const r = id ? state.reminders.find(function (x) { return x.id === id; }) : null, v = r || {};
    const body = '<form class="form" data-form="reminder" novalidate><input type="hidden" name="id" value="' + (r ? r.id : '') + '">' +
      fieldHTML({ name: 'title', label: 'Título', required: true, value: v.title, placeholder: 'Ej. Vacuna antirrábica', attrs: 'maxlength="80"' }) +
      fieldHTML({ name: 'type', label: 'Tipo', type: 'select', options: opts(REMINDER_TYPES), value: v.type || 'Vacuna' }) +
      fieldHTML({ name: 'date', label: 'Fecha', type: 'date', required: true, value: v.date || todayISO() }) +
      fieldHTML({ name: 'repeat', label: 'Periodicidad', type: 'select', options: REPEATS, value: v.repeat || 'none' }) +
      fieldHTML({ name: 'notes', label: 'Observaciones', type: 'textarea', value: v.notes, placeholder: 'Dosis, lugar, qué llevar…', attrs: 'maxlength="300"' }) +
      '<button type="submit" class="btn btn-primary btn-lg btn-block">GUARDAR</button></form>';
    openSheet(r ? 'Editar recordatorio' : 'Nuevo recordatorio', body);
  }
  FORMS.reminder = function (f) {
    clearErrors(f);
    const d = fd(f); let ok = true;
    if (!d.title) { setError(f, 'title', 'Escribí un título para el recordatorio.'); ok = false; }
    if (!d.date) { setError(f, 'date', 'Elegí una fecha.'); ok = false; }
    if (!ok) { focusFirstError(f); return; }
    const list = state.reminders.map(function (x) { return Object.assign({}, x); });
    if (d.id) {
      const r = list.find(function (x) { return x.id === d.id; });
      if (r) Object.assign(r, { title: d.title, type: d.type, date: d.date, repeat: d.repeat, notes: d.notes || '' });
    } else {
      list.push({ id: uid(), title: d.title, type: d.type, date: d.date, repeat: d.repeat, notes: d.notes || '', status: 'pending', createdAt: new Date().toISOString() });
    }
    if (!commit('reminders', list)) return;
    closeSheet(); saved(); refresh();
  };
  ACTIONS['reminder-new'] = function () { openReminderForm(); };
  ACTIONS['reminder-edit'] = function (d) { openReminderForm(d.id); };
  ACTIONS['reminder-done'] = function (d) {
    const list = state.reminders.map(function (x) { return Object.assign({}, x); });
    const r = list.find(function (x) { return x.id === d.id; });
    if (!r) return;
    r.status = 'done'; r.doneAt = todayISO();
    let msg = '¡Listo! Recordatorio realizado ✔';
    if (r.repeat && r.repeat !== 'none') {
      let nd = nextDate(r.date, r.repeat), guard = 0;
      while (nd < todayISO() && guard++ < 500) nd = nextDate(nd, r.repeat);
      const nid = uid();
      list.push({ id: nid, title: r.title, type: r.type, date: nd, repeat: r.repeat, notes: r.notes, status: 'pending', createdAt: new Date().toISOString() });
      r.spawnedId = nid;
      msg += ' Próximo: ' + fmtDate(nd) + '.';
    }
    if (commit('reminders', list)) { toast(msg); refresh(); }
  };
  ACTIONS['reminder-undo'] = function (d) {
    let list = state.reminders.map(function (x) { return Object.assign({}, x); });
    const r = list.find(function (x) { return x.id === d.id; });
    if (!r) return;
    r.status = 'pending'; delete r.doneAt;
    if (r.spawnedId) {
      const sid = r.spawnedId;
      list = list.filter(function (x) { return !(x.id === sid && x.status !== 'done'); });
      delete r.spawnedId;
    }
    if (commit('reminders', list)) { toast('Recordatorio reabierto.'); refresh(); }
  };
  ACTIONS['reminder-delete'] = function (d) {
    confirmDialog({ title: 'Eliminar recordatorio', message: '¿Querés eliminar este recordatorio?', ok: 'ELIMINAR', danger: true }).then(function (yes) {
      if (!yes) return;
      if (commit('reminders', state.reminders.filter(function (x) { return x.id !== d.id; }))) { toast('Recordatorio eliminado.'); refresh(); }
    });
  };

  /* ===========================================================
     7. HISTORIAL
     =========================================================== */
  function historyPanelHTML() {
    const list = state.history.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''); });
    let h = '<button type="button" class="btn btn-accent btn-block" data-action="history-new">' + icon('plus') + 'NUEVO REGISTRO</button>';
    if (!list.length) return h + '<div class="card empty-card"><div class="empty-ico">' + icon('book') + '</div><h3>El historial está vacío</h3><p class="muted">Anotá consultas, vacunas, cambios de alimento y todo lo importante de su salud.</p></div>';
    return h + '<div class="timeline">' + list.map(function (e) {
      return '<article class="hist"><div class="hist-top"><span class="badge badge--upcoming">' + icon(CAT_ICONS[e.category] || 'star') + esc(e.category) + '</span><span class="hist-date">' + esc(fmtDate(e.date)) + '</span></div>' +
        '<h3>' + esc(e.title) + '</h3>' + (e.description ? '<p>' + esc(e.description) + '</p>' : '') +
        '<div class="hist-foot"><button type="button" class="btn btn-sm btn-ghost" data-action="history-delete" data-id="' + e.id + '">' + icon('trash') + 'Eliminar</button></div></article>';
    }).join('') + '</div>';
  }
  ACTIONS['history-new'] = function () {
    if (!requirePet()) return;
    openSheet('Nuevo registro', '<form class="form" data-form="history" novalidate>' +
      fieldHTML({ name: 'date', label: 'Fecha', type: 'date', required: true, value: todayISO(), attrs: 'max="' + todayISO() + '"' }) +
      fieldHTML({ name: 'category', label: 'Categoría', type: 'select', options: opts(HISTORY_CATS), value: 'Salud' }) +
      fieldHTML({ name: 'title', label: 'Título', required: true, placeholder: 'Ej. Control anual', attrs: 'maxlength="80"' }) +
      fieldHTML({ name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Detalles que quieras recordar…', attrs: 'maxlength="500"' }) +
      '<button type="submit" class="btn btn-primary btn-lg btn-block">GUARDAR</button></form>');
  };
  FORMS.history = function (f) {
    clearErrors(f);
    const d = fd(f); let ok = true;
    if (!d.date) { setError(f, 'date', 'Elegí una fecha.'); ok = false; }
    else if (d.date > todayISO()) { setError(f, 'date', 'La fecha no puede ser futura.'); ok = false; }
    if (!d.title) { setError(f, 'title', 'Escribí un título.'); ok = false; }
    if (!ok) { focusFirstError(f); return; }
    const list = state.history.concat([{ id: uid(), date: d.date, category: d.category, title: d.title, description: d.description || '', createdAt: new Date().toISOString() }]);
    if (!commit('history', list)) return;
    closeSheet(); saved(); refresh();
  };
  ACTIONS['history-delete'] = function (d) {
    confirmDialog({ title: 'Eliminar registro', message: '¿Querés eliminar este registro del historial?', ok: 'ELIMINAR', danger: true }).then(function (yes) {
      if (!yes) return;
      if (commit('history', state.history.filter(function (x) { return x.id !== d.id; }))) { toast('Registro eliminado.'); refresh(); }
    });
  };

  /* ===========================================================
     8. PESO
     =========================================================== */
  function sortedWeights(p) { return (p.weights || []).slice().sort(function (a, b) { return a.date.localeCompare(b.date); }); }
  function latestWeight(p) { const l = sortedWeights(p); return l.length ? l[l.length - 1] : null; }

  function weightPanelHTML(p) {
    const list = sortedWeights(p), lw = list[list.length - 1];
    let h = '<div class="weight-hero">' + icon('scale') + '<div><small>Peso actual</small><strong>' + (lw ? esc(fmtKg(lw.kg)) : 'Sin registrar') + '</strong>' +
      (lw ? '<small>Medido el ' + esc(fmtDate(lw.date)) + '</small>' : '') + '</div></div>' +
      '<button type="button" class="btn btn-accent btn-block" data-action="weight-new">' + icon('plus') + 'REGISTRAR PESO</button>';
    if (list.length >= 2) {
      h += '<div class="card"><h3>Evolución del peso</h3>' + weightChartHTML(p, list) + '</div>';
    } else {
      h += '<div class="card"><p class="muted">' + (list.length ? 'Registrá una medición más para ver la gráfica de evolución.' : 'Registrá el peso para empezar a seguir su evolución. Con dos mediciones aparece la gráfica.') + '</p></div>';
    }
    if (list.length) {
      h += '<div class="card"><h3>Mediciones</h3><div class="mini-list">' + list.slice().reverse().map(function (w) {
        const i = list.indexOf(w), prev = i > 0 ? list[i - 1] : null;
        let delta = '';
        if (prev) { const dd = Math.round((w.kg - prev.kg) * 100) / 100; delta = '<span class="delta">' + (dd > 0 ? '+' : dd < 0 ? '−' : '') + esc(fmtNum(Math.abs(dd))) + ' kg</span>'; }
        return '<div class="mini-row"><div class="grow"><strong>' + esc(fmtKg(w.kg)) + '</strong><small>' + esc(fmtDate(w.date)) + '</small></div>' + delta +
          '<button type="button" class="icon-link" data-action="weight-delete" data-id="' + w.id + '" aria-label="Eliminar medición del ' + esc(fmtDate(w.date)) + '">' + icon('trash') + '</button></div>';
      }).join('') + '</div></div>';
    }
    return h;
  }

  // Gráfica de línea en SVG (sin librerías)
  function weightChartHTML(p, list) {
    const W = 300, H = 210, L = 46, R = 16, T = 24, B = 40;
    const vals = list.map(function (w) { return w.kg; });
    let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * 0.2; min = Math.max(0, min - pad); max += pad;
    const t0 = parseISO(list[0].date).getTime(), t1 = parseISO(list[list.length - 1].date).getTime();
    const X = function (i) { return t1 === t0 ? L + (i / (list.length - 1)) * (W - L - R) : L + ((parseISO(list[i].date).getTime() - t0) / (t1 - t0)) * (W - L - R); };
    const Y = function (v) { return T + (1 - (v - min) / (max - min)) * (H - T - B); };
    const pts = list.map(function (w, i) { return [X(i), Y(w.kg)]; });
    const line = pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
    const area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - B) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - B) + ' Z';
    const ticks = [max, (max + min) / 2, min];
    const withYear = list[0].date.slice(0, 4) !== list[list.length - 1].date.slice(0, 4);
    const sd = function (iso) { return parseISO(iso).toLocaleDateString('es-AR', withYear ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' }); };
    const last = pts[pts.length - 1], lastAnchor = last[0] > W - 60 ? 'end' : 'middle';
    let svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfica de evolución del peso de ' + esc(p.name) + ': de ' + esc(fmtKg(list[0].kg)) + ' a ' + esc(fmtKg(list[list.length - 1].kg)) + '">' +
      '<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="g1"/><stop offset="1" class="g2"/></linearGradient></defs>';
    ticks.forEach(function (tk) {
      svg += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(tk).toFixed(1) + '" y2="' + Y(tk).toFixed(1) + '"/>' +
        '<text class="axis-t" x="' + (L - 8) + '" y="' + (Y(tk) + 5).toFixed(1) + '" text-anchor="end">' + (Math.round(tk * 10) / 10).toString().replace('.', ',') + '</text>';
    });
    svg += '<path d="' + area + '" fill="url(#wg)"/><path class="line" d="' + line + '"/>';
    pts.forEach(function (q, i) { svg += '<circle class="' + (i === pts.length - 1 ? 'dot-last' : 'dot') + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (i === pts.length - 1 ? 6.5 : 4.5) + '"/>'; });
    svg += '<text class="val-t" x="' + last[0].toFixed(1) + '" y="' + (last[1] - 13).toFixed(1) + '" text-anchor="' + lastAnchor + '">' + esc(fmtNum(list[list.length - 1].kg)) + ' kg</text>' +
      '<text class="axis-t" x="' + L + '" y="' + (H - 12) + '" text-anchor="start">' + esc(sd(list[0].date)) + '</text>' +
      '<text class="axis-t" x="' + (W - R) + '" y="' + (H - 12) + '" text-anchor="end">' + esc(sd(list[list.length - 1].date)) + '</text></svg>';
    return svg;
  }

  ACTIONS['weight-new'] = function () {
    if (!requirePet()) return;
    openSheet('Registrar peso', '<form class="form" data-form="weight" novalidate>' +
      fieldHTML({ name: 'date', label: 'Fecha', type: 'date', required: true, value: todayISO(), attrs: 'max="' + todayISO() + '"' }) +
      fieldHTML({ name: 'kg', label: 'Peso (kg)', required: true, placeholder: 'Ej. 9,6', attrs: 'inputmode="decimal" autocomplete="off"' }) +
      '<button type="submit" class="btn btn-primary btn-lg btn-block">GUARDAR</button></form>');
  };
  FORMS.weight = function (f) {
    clearErrors(f);
    const d = fd(f); let ok = true;
    if (!d.date) { setError(f, 'date', 'Elegí una fecha.'); ok = false; }
    else if (d.date > todayISO()) { setError(f, 'date', 'La fecha no puede ser futura.'); ok = false; }
    const kg = parseKg(d.kg);
    if (kg === null) { setError(f, 'kg', 'Ingresá un peso válido, por ejemplo 9,6.'); ok = false; }
    if (!ok) { focusFirstError(f); return; }
    const pet = Object.assign({}, state.pet, { weights: state.pet.weights.concat([{ id: uid(), date: d.date, kg: kg }]), updatedAt: new Date().toISOString() });
    if (!commit('pet', pet)) return;
    closeSheet(); saved(); refresh();
  };
  ACTIONS['weight-delete'] = function (d) {
    confirmDialog({ title: 'Eliminar medición', message: '¿Querés eliminar esta medición de peso?', ok: 'ELIMINAR', danger: true }).then(function (yes) {
      if (!yes) return;
      const pet = Object.assign({}, state.pet, { weights: state.pet.weights.filter(function (w) { return w.id !== d.id; }) });
      if (commit('pet', pet)) { toast('Medición eliminada.'); refresh(); }
    });
  };

  /* ===========================================================
     9. IDENTIDAD
     =========================================================== */
  function contactName() { const c = state.settings.contact; return c.name || state.settings.ownerName || ''; }

  function renderIdentity() {
    const p = state.pet;
    const head = '<div class="page-head"><h1>Identidad INDY</h1><p class="muted">La tarjeta digital de tu mascota.</p></div>';
    if (!p) return '<div class="screen-inner">' + head + emptyPetHTML() + '</div>';
    const tab = state.ui.idTab, lost = state.settings.lost.active;
    const tabs = [['card', 'Tarjeta', 'idcard'], ['qr', 'QR', 'qr'], ['lost', lost ? 'Perdida (activa)' : 'Perdida', 'alert']];
    return '<div class="screen-inner">' + head + segHTML(tabs, tab, 'identity') +
      '<div class="panel" role="tabpanel">' + (tab === 'qr' ? qrPanelHTML(p) : tab === 'lost' ? lostPanelHTML(p) : idCardPanelHTML(p)) + '</div></div>';
  }

  function priv(key) { return state.settings.publicFields[key] ? '' : '<span class="mini-tag">' + icon('lock') + 'Privado</span>'; }
  function idField(label, value, key, wide) {
    if (!value) return '';
    return '<div class="id-field' + (wide ? ' id-field--wide' : '') + '"><small>' + label + priv(key) + '</small><span class="v">' + esc(value) + '</span></div>';
  }

  function idCardPanelHTML(p) {
    const s = state.settings, c = s.contact, pf = s.publicFields;
    const card = '<article class="id-card" aria-label="Tarjeta de identidad de ' + esc(p.name) + '">' +
      '<div class="id-head">' + logo('logo--light logo--sm') + '<span class="id-code">' + esc(p.code) + '</span></div>' +
      (s.lost.active ? '<div class="id-lost" style="margin-top:14px">' + icon('alert') + 'ESTA MASCOTA ESTÁ PERDIDA</div>' : '') +
      '<div class="id-body"><div class="id-main">' + petPhotoHTML(p, '') + '<div><h2 class="id-name">' + esc(p.name) + priv('name') + '</h2>' +
      '<p class="id-sub">' + esc(speciesLabel(p)) + priv('species') + (p.breed ? '<br>' + esc(p.breed) + priv('breed') : '') + '</p></div></div>' +
      '<div class="id-fields">' + idField('Sexo', sexText(p), 'sex') + idField('Edad', ageText(p.birthdate), 'age') + idField('Color', p.color, 'color') +
      idField('Características', p.characteristics, 'characteristics', true) + idField('Información importante', p.importantInfo, 'importantInfo', true) + '</div></div></article>';
    const hasContact = c.name || c.phone || c.whatsapp || c.address || s.ownerName;
    const contact = '<section class="card"><h3>Contacto</h3>' + (hasContact
      ? '<dl class="detail-list">' + [['Nombre', contactName(), 'contactName'], ['Teléfono', c.phone, 'phone'], ['WhatsApp', c.whatsapp, 'whatsapp'], ['Dirección (opcional)', c.address, 'address']].map(function (r) {
        return r[1] ? '<div class="detail-row"><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + (pf[r[2]] ? '' : ' <span class="hint">(privado)</span>') + '</dd></div>' : '';
      }).join('') + '</dl>'
      : '<p class="muted">Agregá un teléfono o WhatsApp para que puedan avisarte si la encuentran.</p>') +
      '<button type="button" class="btn btn-soft btn-block" data-action="contact-edit">' + icon('edit') + (hasContact ? 'EDITAR CONTACTO' : 'AGREGAR CONTACTO') + '</button></section>';
    const toggles = '<section class="card"><h3>¿Qué datos son públicos?</h3><p class="muted">Solo lo que actives se muestra en la vista pública y en el QR.</p><div class="contact-list">' +
      PUBLIC_FIELDS.map(function (f) {
        const on = !!pf[f.key];
        return '<label class="switch-row"><span class="switch-text"><strong>' + f.label + '</strong></span><span class="switch-state">' + (on ? 'Público' : 'Privado') + '</span>' +
          '<input type="checkbox" role="switch" data-change="public-toggle" data-key="' + f.key + '"' + (on ? ' checked' : '') + '><span class="switch-ui" aria-hidden="true"></span></label>';
      }).join('') + '</div></section>';
    return card + contact + toggles +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="public-preview">' + icon('eye') + 'VER VISTA PÚBLICA</button>' +
      '<button type="button" class="btn btn-accent" data-action="go" data-screen="identity" data-sub="qr">' + icon('qr') + 'VER MI QR</button></div>' +
      '<button type="button" class="btn btn-danger btn-block" data-action="go" data-screen="identity" data-sub="lost">' + icon('alert') + 'MASCOTA PERDIDA</button>';
  }

  CHANGES['public-toggle'] = function (el) {
    const key = el.dataset.key;
    const s = Object.assign({}, state.settings, { publicFields: Object.assign({}, state.settings.publicFields, (function () { const o = {}; o[key] = el.checked; return o; })()) });
    if (!commit('settings', s)) { el.checked = !el.checked; return; }
    refresh();
    const n = $('[data-key="' + key + '"]'); if (n) n.focus({ preventScroll: true });
  };

  // Formulario compartido: datos del dueño y contacto (Mi información / Contacto)
  function openOwnerForm(title) {
    const s = state.settings, c = s.contact;
    openSheet(title || 'Mis datos de contacto', '<form class="form" data-form="owner" novalidate>' +
      fieldHTML({ name: 'ownerName', label: 'Tu nombre', value: s.ownerName, placeholder: 'Para saludarte en el inicio', attrs: 'maxlength="40"' }) +
      fieldHTML({ name: 'contactName', label: 'Nombre del contacto', value: c.name, hint: 'Si lo dejás vacío se usa tu nombre.', attrs: 'maxlength="60"' }) +
      fieldHTML({ name: 'phone', label: 'Teléfono', type: 'tel', value: c.phone, placeholder: 'Ej. +54 9 11 1234-5678', attrs: 'inputmode="tel" maxlength="30"' }) +
      fieldHTML({ name: 'whatsapp', label: 'WhatsApp', type: 'tel', value: c.whatsapp, placeholder: 'Número con código de país', attrs: 'inputmode="tel" maxlength="60"', hint: 'Ej. 5491112345678' }) +
      fieldHTML({ name: 'address', label: 'Dirección (opcional)', value: c.address, attrs: 'maxlength="120"' }) +
      '<button type="submit" class="btn btn-primary btn-lg btn-block">GUARDAR</button></form>');
  }
  ACTIONS['contact-edit'] = function () { openOwnerForm('Datos de contacto'); };
  ACTIONS['owner-edit'] = function () { openOwnerForm('Mis datos'); };
  FORMS.owner = function (f) {
    clearErrors(f);
    const d = fd(f); let ok = true;
    if (d.phone && !/^[\d\s()+\-.]{6,25}$/.test(d.phone)) { setError(f, 'phone', 'Revisá el teléfono: usá solo números, espacios, + y guiones.'); ok = false; }
    if (d.whatsapp && !/^https?:\/\//i.test(d.whatsapp) && d.whatsapp.replace(/\D/g, '').length < 8) { setError(f, 'whatsapp', 'Ingresá el número con código de país, por ejemplo 5491112345678.'); ok = false; }
    if (!ok) { focusFirstError(f); return; }
    const s = Object.assign({}, state.settings, { ownerName: d.ownerName || '', contact: { name: d.contactName || '', phone: d.phone || '', whatsapp: d.whatsapp || '', address: d.address || '' }, demoContact: false });
    if (!commit('settings', s)) return;
    closeSheet(); saved(); refresh();
  };

  // Datos públicos autorizados (forPayload: sin foto; limit: recorta textos largos)
  function buildPublicData(forPayload, limit) {
    const p = state.pet, s = state.settings; if (!p) return null;
    const cut = function (v) { v = v || ''; return limit && v.length > limit ? v.slice(0, limit - 1) + '…' : v; };
    const full = { photo: safeImageSrc(p.photo), name: p.name, species: speciesLabel(p), breed: p.breed, sex: sexText(p), age: ageText(p.birthdate), color: p.color,
      characteristics: cut(p.characteristics), importantInfo: cut(p.importantInfo), contactName: contactName(), phone: s.contact.phone, whatsapp: s.contact.whatsapp, address: cut(s.contact.address) };
    const out = { lost: !!s.lost.active, since: s.lost.since || null, code: p.code };
    PUBLIC_FIELDS.forEach(function (f) {
      if (!s.publicFields[f.key]) return;
      if (f.key === 'photo' && forPayload) return;
      if (full[f.key]) out[f.key] = full[f.key];
    });
    return out;
  }
  function compactPublic(d) {
    const o = { v: 1, k: d.code };
    if (d.lost) { o.l = 1; if (d.since) o.t = String(d.since).slice(0, 10); }
    PUBLIC_FIELDS.forEach(function (f) { if (f.short && d[f.key]) o[f.short] = d[f.key]; });
    return o;
  }
  function expandPublic(o) {
    const d = { lost: !!o.l, since: o.t || null, code: o.k || '' };
    PUBLIC_FIELDS.forEach(function (f) { if (f.short && o[f.short]) d[f.key] = String(o[f.short]); });
    return d;
  }
  function waLink(v) {
    if (/^https?:\/\//i.test(v)) return v;
    const dg = String(v).replace(/\D/g, ''); return dg ? 'https://wa.me/' + dg : '';
  }
  function publicText(d) {
    const L = [BRAND.name + ' · Identidad de mascota'];
    if (d.lost) L.push('*** ESTA MASCOTA ESTÁ PERDIDA ***', 'AYUDAME A VOLVER A CASA');
    const line = function (a, v) { if (v) L.push(a + ': ' + v); };
    line('Nombre', d.name); line('Especie', d.species); line('Raza', d.breed); line('Sexo', d.sex); line('Edad', d.age); line('Color', d.color);
    line('Características', d.characteristics); line('Importante', d.importantInfo);
    line('Contacto', d.contactName); line('Teléfono', d.phone); if (d.whatsapp) line('WhatsApp', waLink(d.whatsapp)); line('Dirección', d.address);
    return L.join('\n');
  }

  /* ===========================================================
     10. QR
     =========================================================== */

  // Qué contiene el QR. >>> PUNTO DE REEMPLAZO <<<
  // Cuando exista una URL pública permanente (con backend), reemplazá el contenido de
  // esta función para devolver, por ejemplo: { mode:'url', value:'https://indy.app/m/' + state.pet.code }
  function buildQrContent() {
    const base = resolvePublicBase();
    const limits = [220, 120, 60];
    for (let i = 0; i < limits.length; i++) {
      const data = buildPublicData(true, limits[i]); if (!data) return null;
      const mode = base ? 'url' : 'text';
      const value = base ? base + '#indy=' + b64urlEncode(JSON.stringify(compactPublic(data))) : publicText(data);
      try { return { mode: mode, value: value, qr: QR.encode(value), data: data }; } catch (e) { /* demasiado largo: reintenta con textos más cortos */ }
    }
    return null;
  }
  function resolvePublicBase() {
    const b = CONFIG.publicBaseUrl;
    if (!b) return '';
    if (b === 'auto') return /^https?:$/.test(location.protocol) ? location.href.split('#')[0] : '';
    return String(b).split('#')[0];
  }

  function qrPanelHTML(p) {
    const q = buildQrContent();
    if (!q) return '<div class="card"><p>Hay demasiados datos públicos para un QR. Desactivá alguno en la pestaña Tarjeta.</p></div>';
    return '<div class="card qr-card">' + logo('logo--sm') + '<p class="qr-title">QR de identidad</p>' +
      '<div class="qr-frame"><canvas id="qr-canvas" role="img" aria-label="Código QR de identidad de ' + esc(p.name) + '"></canvas></div>' +
      '<p><strong>' + esc(p.name) + '</strong> · ' + esc(p.code) + '</p>' +
      '<p class="qr-explain">Este QR puede acompañar a tu mascota en una placa, collar o tarjeta de identificación.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="qr-download">' + icon('download') + 'DESCARGAR QR</button>' +
      '<button type="button" class="btn btn-accent" data-action="qr-share">' + icon('share') + 'COMPARTIR</button>' +
      '<button type="button" class="btn btn-ghost" data-action="qr-copy">' + icon('copy') + (q.mode === 'url' ? 'COPIAR ENLACE' : 'COPIAR DATOS') + '</button></div>' +
      '<details class="qr-details"><summary>Qué contiene este QR</summary><pre class="qr-pre">' + esc(q.value) + '</pre>' +
      '<p class="hint">En esta primera versión el QR lleva adentro los datos que marcaste como públicos, por eso funciona sin internet. Si cambiás esos datos o activás “Mascota perdida”, descargá un QR nuevo. Más adelante podrá reemplazarse por una URL pública permanente.</p></details></div>';
  }

  function paintQR(canvas, qr, px) {
    const quiet = 4, total = qr.size + quiet * 2, scale = Math.max(2, Math.floor(px / total)), size = scale * total;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#111';
    for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) if (qr.modules[y][x]) ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
  }
  function drawQRInto() {
    const c = $('#qr-canvas'); if (!c) return;
    const q = buildQrContent(); if (!q) return;
    paintQR(c, q.qr, 480);
  }
  function qrDownloadCanvas(q) {
    const qrc = document.createElement('canvas');
    paintQR(qrc, q.qr, 1000);
    const capH = 150, c = document.createElement('canvas');
    c.width = qrc.width; c.height = qrc.height + capH;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(qrc, 0, 0);
    ctx.textAlign = 'center'; ctx.fillStyle = '#1C329E';
    const title = BRAND.name + ' · ' + (q.data.name || state.pet.name);
    let fs = 56; ctx.font = '800 ' + fs + 'px ' + 'system-ui, sans-serif';
    while (ctx.measureText(title).width > c.width - 60 && fs > 24) { fs -= 2; ctx.font = '800 ' + fs + 'px system-ui, sans-serif'; }
    ctx.fillText(title, c.width / 2, qrc.height + 20);
    ctx.fillStyle = '#585C6B'; ctx.font = '600 32px system-ui, sans-serif';
    ctx.fillText(q.data.lost ? 'ESTA MASCOTA ESTÁ PERDIDA' : 'Escaneá para ver su identidad', c.width / 2, qrc.height + 78);
    return c;
  }
  ACTIONS['qr-download'] = function () {
    const q = buildQrContent(); if (!q) return;
    qrDownloadCanvas(q).toBlob(function (b) {
      if (!b) { toast('No pude generar la imagen.', 'error'); return; }
      downloadBlob(b, 'indy-qr-' + slug(state.pet.name) + '.png'); toast('QR descargado ❤️');
    }, 'image/png');
  };
  ACTIONS['qr-copy'] = function () {
    const q = buildQrContent(); if (!q) return;
    copyText(q.value).then(function (ok) { toast(ok ? 'Copiado ❤️' : 'No pude copiar. Mantené apretado el texto en “Qué contiene este QR”.', ok ? '' : 'error'); });
  };
  ACTIONS['qr-share'] = function () { shareIdentity(); };
  function shareIdentity() {
    const q = buildQrContent(); if (!q) return;
    const text = q.mode === 'url' ? q.value : q.value;
    const base = { title: BRAND.name + ' · ' + state.pet.name, text: q.mode === 'url' ? BRAND.name + ' · ' + state.pet.name : text };
    if (q.mode === 'url') base.url = q.value;
    const fallback = function () { copyText(q.value).then(function (ok) { toast(ok ? 'Tu navegador no permite compartir: copié los datos para que los pegues donde quieras.' : 'Tu navegador no permite compartir.', ok ? '' : 'error'); }); };
    if (!navigator.share) { fallback(); return; }
    qrDownloadCanvas(q).toBlob(function (b) {
      const withFile = Object.assign({}, base);
      try {
        if (b) {
          const file = new File([b], 'indy-qr-' + slug(state.pet.name) + '.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) withFile.files = [file];
        }
      } catch (e) { /* sin archivos */ }
      navigator.share(withFile).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        navigator.share(base).catch(function (e2) { if (!e2 || e2.name !== 'AbortError') fallback(); });
      });
    }, 'image/png');
  }

  /* ----- Generador de códigos QR (versiones 1 a 40, nivel de corrección M, modo bytes UTF-8) ----- */
  const QR = (function () {
    const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
    const NUM_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];

    function rawModules(v) {
      let r = (16 * v + 128) * v + 64;
      if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
      return r;
    }
    function dataCodewords(v) { return Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[v] * NUM_BLOCKS[v]; }
    function pushBits(arr, val, len) { for (let i = len - 1; i >= 0; i--) arr.push((val >>> i) & 1); }
    function gfMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
    function rsDivisor(deg) {
      const res = new Array(deg).fill(0); res[deg - 1] = 1; let root = 1;
      for (let i = 0; i < deg; i++) {
        for (let j = 0; j < res.length; j++) { res[j] = gfMul(res[j], root); if (j + 1 < res.length) res[j] ^= res[j + 1]; }
        root = gfMul(root, 2);
      }
      return res;
    }
    function rsRemainder(data, div) {
      const res = div.map(function () { return 0; });
      data.forEach(function (b) {
        const f = b ^ res.shift(); res.push(0);
        div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
      });
      return res;
    }
    function alignPositions(v) {
      if (v === 1) return [];
      const n = Math.floor(v / 7) + 2, size = v * 4 + 17;
      const step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
      const r = [6];
      for (let pos = size - 7; r.length < n; pos -= step) r.splice(1, 0, pos);
      return r;
    }

    function encode(text) {
      const bytes = Array.from(new TextEncoder().encode(text));
      let ver = 1;
      for (; ; ver++) {
        if (ver > 40) throw new Error('too long');
        if (4 + (ver < 10 ? 8 : 16) + bytes.length * 8 <= dataCodewords(ver) * 8) break;
      }
      const bits = [];
      pushBits(bits, 4, 4); pushBits(bits, bytes.length, ver < 10 ? 8 : 16);
      bytes.forEach(function (b) { pushBits(bits, b, 8); });
      const cap = dataCodewords(ver) * 8;
      pushBits(bits, 0, Math.min(4, cap - bits.length));
      pushBits(bits, 0, (8 - bits.length % 8) % 8);
      for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) pushBits(bits, pad, 8);
      const data = [];
      for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }

      // Bloques + corrección de errores + intercalado
      const nb = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver) / 8);
      const shortBlocks = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(eccLen), blocks = [];
      for (let i = 0, k = 0; i < nb; i++) {
        const dat = data.slice(k, k + shortLen - eccLen + (i < shortBlocks ? 0 : 1)); k += dat.length;
        const ecc = rsRemainder(dat, div);
        if (i < shortBlocks) dat.push(0);
        blocks.push(dat.concat(ecc));
      }
      const all = [];
      for (let i = 0; i < blocks[0].length; i++) blocks.forEach(function (bl, j) { if (i !== shortLen - eccLen || j >= shortBlocks) all.push(bl[i]); });

      // Matriz
      const size = ver * 4 + 17;
      const mod = [], fn = [];
      for (let y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
      const setFn = function (x, y, d) { mod[y][x] = d; fn[y][x] = true; };
      const bit = function (x, i) { return ((x >>> i) & 1) !== 0; };
      for (let i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
      const finder = function (cx, cy) {
        for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
          if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, dist !== 2 && dist !== 4);
        }
      };
      finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
      const ap = alignPositions(ver), na = ap.length;
      for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFn(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
      const drawFormat = function (mask) {
        const d = (0 << 3) | mask; let rem = d;           // nivel M = 0
        for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        const b = ((d << 10) | rem) ^ 0x5412;
        for (let i = 0; i <= 5; i++) setFn(8, i, bit(b, i));
        setFn(8, 7, bit(b, 6)); setFn(8, 8, bit(b, 7)); setFn(7, 8, bit(b, 8));
        for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(b, i));
        for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(b, i));
        for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(b, i));
        setFn(8, size - 8, true);
      };
      drawFormat(0);
      if (ver >= 7) {
        let rem = ver;
        for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
        const b = (ver << 12) | rem;
        for (let i = 0; i < 18; i++) { const c = bit(b, i), a = size - 11 + i % 3, d = Math.floor(i / 3); setFn(a, d, c); setFn(d, a, c); }
      }
      // Datos en zigzag
      let idx = 0;
      for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (!fn[y][x] && idx < all.length * 8) { mod[y][x] = bit(all[idx >>> 3], 7 - (idx & 7)); idx++; }
        }
      }
      // Máscaras
      const applyMask = function (m) {
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          let inv;
          switch (m) {
            case 0: inv = (x + y) % 2 === 0; break;
            case 1: inv = y % 2 === 0; break;
            case 2: inv = x % 3 === 0; break;
            case 3: inv = (x + y) % 3 === 0; break;
            case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
            case 5: inv = x * y % 2 + x * y % 3 === 0; break;
            case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
            default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
          }
          if (!fn[y][x] && inv) mod[y][x] = !mod[y][x];
        }
      };
      const PAT = [[1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]];
      const penalty = function () {
        let r = 0, dark = 0;
        for (let a = 0; a < size; a++) for (let dir = 0; dir < 2; dir++) {
          const g = function (b) { return dir ? mod[b][a] : mod[a][b]; };
          let run = 1;
          for (let b = 1; b < size; b++) {
            if (g(b) === g(b - 1)) { run++; if (run === 5) r += 3; else if (run > 5) r++; } else run = 1;
          }
          for (let b = 0; b + 11 <= size; b++) PAT.forEach(function (p) {
            let m = true; for (let k = 0; k < 11; k++) if ((g(b + k) ? 1 : 0) !== p[k]) { m = false; break; }
            if (m) r += 40;
          });
        }
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          if (mod[y][x]) dark++;
          if (x < size - 1 && y < size - 1 && mod[y][x] === mod[y][x + 1] && mod[y][x] === mod[y + 1][x] && mod[y][x] === mod[y + 1][x + 1]) r += 3;
        }
        const total = size * size, k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
        return r + Math.max(0, k) * 10;
      };
      let best = 0, bestP = Infinity;
      for (let m = 0; m < 8; m++) {
        applyMask(m); drawFormat(m);
        const pn = penalty();
        if (pn < bestP) { bestP = pn; best = m; }
        applyMask(m);
      }
      applyMask(best); drawFormat(best);
      return { size: size, modules: mod, version: ver };
    }
    return { encode: encode };
  })();

  /* ===========================================================
     11. MASCOTA PERDIDA (y vista pública)
     =========================================================== */
  function lostBannerHTML() {
    return '<div class="banner banner--lost" role="alert">' + icon('alert') + '<div class="banner-body"><strong>ESTA MASCOTA ESTÁ PERDIDA</strong>' +
      '<span>La identidad pública está en modo emergencia.</span>' +
      '<button type="button" class="btn btn-sm btn-primary" data-action="go" data-screen="identity" data-sub="lost">VER / DESACTIVAR</button></div></div>';
  }
  function sinceText(since) {
    if (!since) return '';
    return fmtDate(String(since).length > 10 ? toISO(new Date(since)) : since);
  }

  function lostPanelHTML(p) {
    const L = state.settings.lost;
    if (L.active) {
      return '<div class="lost-card lost-card--on"><span class="lost-flag">' + icon('alert') + 'ESTA MASCOTA ESTÁ PERDIDA</span>' +
        '<h2 class="lost-title">AYUDAME A VOLVER A CASA</h2>' +
        '<p>Modo emergencia activo desde el ' + esc(sinceText(L.since)) + '. La vista pública muestra solo los datos que autorizaste.</p>' +
        '<button type="button" class="btn btn-primary btn-block btn-lg" data-action="lost-off">' + icon('home') + 'YA VOLVIÓ A CASA</button>' +
        '<div class="btn-row"><button type="button" class="btn btn-soft" data-action="public-preview">' + icon('eye') + 'VER VISTA PÚBLICA</button>' +
        '<button type="button" class="btn btn-soft" data-action="qr-share">' + icon('share') + 'COMPARTIR ALERTA</button></div>' +
        '<p class="hint">Para que el QR muestre la alerta, descargá un QR nuevo desde la pestaña QR. Los QR impresos antes no cambian en esta primera versión.</p></div>';
    }
    return '<div class="lost-card"><div class="empty-ico">' + icon('pin') + '</div><h2 class="section-title">Mascota perdida</h2>' +
      '<p>Si ' + esc(p.name) + ' se pierde, activá este modo. La identidad pública pasa a un estado de emergencia con el mensaje “AYUDAME A VOLVER A CASA” y un botón para contactarte.</p>' +
      '<button type="button" class="btn btn-accent btn-block btn-lg" data-action="lost-on">' + icon('alert') + 'ACTIVAR MASCOTA PERDIDA</button>' +
      '<p class="hint">Se muestra solo lo que marcaste como público en la pestaña Tarjeta. Revisá que tu teléfono o WhatsApp estén activados como públicos.</p></div>';
  }
  ACTIONS['lost-on'] = function () {
    if (!requirePet()) return;
    confirmDialog({ title: 'Activar mascota perdida', message: 'La identidad de ' + state.pet.name + ' pasará a estado de emergencia.', ok: 'ACTIVAR', danger: true }).then(function (yes) {
      if (!yes) return;
      const s = Object.assign({}, state.settings, { lost: { active: true, since: new Date().toISOString() } });
      if (commit('settings', s)) { toast('Modo mascota perdida activado. Ojalá vuelva pronto 🧡'); refresh(); }
    });
  };
  ACTIONS['lost-off'] = function () {
    confirmDialog({ title: '¡Qué alegría!', message: '¿Confirmás que ' + state.pet.name + ' ya volvió a casa?', ok: 'YA VOLVIÓ A CASA' }).then(function (yes) {
      if (!yes) return;
      const s = Object.assign({}, state.settings, { lost: { active: false, since: null } });
      if (commit('settings', s)) { toast('¡Bienvenida a casa! Desactivamos el modo perdida ❤️'); refresh(); }
    });
  };

  // Vista pública: lo que ve quien escanea el QR
  function publicViewHTML(d, preview) {
    const name = d.name || 'Mascota';
    const links = [];
    const wa = waLink(d.whatsapp || '');
    if (wa) links.push({ href: wa + (/wa\.me/.test(wa) ? '?text=' + encodeURIComponent('Hola, encontré a ' + name + '.') : ''), label: 'WhatsApp', ic: 'whatsapp', ext: true });
    const ph = String(d.phone || '').replace(/[^\d+]/g, '');
    if (ph) links.push({ href: 'tel:' + ph, label: 'Llamar', ic: 'phone', ext: false });
    const rows = [['Raza', d.breed], ['Sexo', d.sex], ['Edad', d.age], ['Color', d.color], ['Características', d.characteristics], ['Información importante', d.importantInfo], ['Contacto', d.contactName], ['Dirección', d.address]];
    let h = '';
    if (preview) h += '<div class="public-bar"><p>Vista previa: así lo ve quien escanee el QR</p><button type="button" class="btn btn-sm btn-primary" data-action="public-close">' + icon('close') + 'CERRAR</button></div>';
    h += '<div class="public-wrap"><div class="public-brand">' + logo('logo--lg') + '</div>';
    if (d.lost) {
      h += '<div class="public-lost"><span class="lost-flag">' + icon('alert') + 'ESTA MASCOTA ESTÁ PERDIDA</span><h1>AYUDAME A VOLVER A CASA</h1>' + (d.since ? '<p>Perdida desde el ' + esc(sinceText(d.since)) + '</p>' : '') + '</div>';
    } else {
      h += '<p class="public-eyebrow">Identidad de mascota</p>';
    }
    h += '<div class="public-hero">' + (safeImageSrc(d.photo) ? '<img class="photo" src="' + esc(safeImageSrc(d.photo)) + '" alt="Foto de ' + esc(name) + '">' : '') +
      (d.name ? '<h2 class="public-name">' + esc(d.name) + '</h2>' : '') + (d.species ? '<p class="muted">' + esc(d.species) + '</p>' : '') + '</div>';
    const shown = rows.filter(function (r) { return r[1]; });
    if (shown.length) h += '<div class="card"><dl class="detail-list">' + shown.map(function (r) { return '<div class="detail-row"><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></div>';
    if (links.length) {
      h += '<a class="btn btn-accent btn-lg btn-block" href="' + esc(links[0].href) + '"' + (links[0].ext ? ' target="_blank" rel="noopener"' : '') + '>' + icon(links[0].ic) + 'CONTACTAR AL RESPONSABLE</a>';
      if (links[1]) h += '<a class="btn btn-soft btn-block" href="' + esc(links[1].href) + '"' + (links[1].ext ? ' target="_blank" rel="noopener"' : '') + '>' + icon(links[1].ic) + esc(links[1].label.toUpperCase()) + '</a>';
    } else {
      h += '<div class="card"><p class="muted">El responsable no compartió datos de contacto públicos.</p></div>';
    }
    h += '<p class="public-foot">' + esc(BRAND.name) + ' · ' + esc(BRAND.tagline) + (d.code ? '<br>' + esc(d.code) : '') + '</p></div>';
    return h;
  }
  function showPublic(d, preview) {
    const v = $('#public-view');
    v.innerHTML = publicViewHTML(d, preview);
    v.hidden = false; v.scrollTop = 0;
    publicOpen = true; document.body.classList.add('public-open'); updateInert();
  }
  function hidePublic() {
    $('#public-view').hidden = true; $('#public-view').innerHTML = '';
    publicOpen = false; document.body.classList.remove('public-open'); updateInert();
  }
  ACTIONS['public-preview'] = function () { const d = buildPublicData(false); if (d) showPublic(d, true); };
  ACTIONS['public-close'] = function () { hidePublic(); };
  function readPublicFromHash() {
    const m = location.hash.match(/#indy=([A-Za-z0-9_-]+)/);
    if (!m) return null;
    try { return expandPublic(JSON.parse(b64urlDecode(m[1]))); } catch (e) { return null; }
  }

  /* ===========================================================
     12. MOMENTOS
     =========================================================== */
  function renderMoments() {
    const head = '<h1 class="sr-only">Momentos</h1>';
    if (!state.pet) return '<div class="screen-inner">' + head + emptyPetHTML() + '</div>';
    const list = state.moments.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    let h = '<div class="screen-inner">' + head + '<p class="muted">Guardá los recuerdos importantes de ' + esc(state.pet.name) + '. (' + list.length + ' de ' + CONFIG.maxMoments + ')</p>' +
      '<button type="button" class="btn btn-accent btn-lg btn-block" data-action="moment-new">' + icon('plus') + 'NUEVO MOMENTO</button>';
    if (!list.length) return h + '<div class="card empty-card"><div class="empty-ico">' + icon('heart') + '</div><h3>Todavía no hay momentos</h3><p class="muted">Por ejemplo: “Su primer día en casa”, “Cumplió 1 año” o “Su primer paseo”.</p></div></div>';
    h += '<div class="moment-grid">' + list.map(function (m) {
      const src = safeImageSrc(m.photo);
      return '<button type="button" class="moment-card" data-action="moment-open" data-id="' + m.id + '">' +
        (src ? '<img class="moment-img" src="' + esc(src) + '" alt="">' : '<div class="moment-img photo-ph">' + icon('heart') + '</div>') +
        '<div class="moment-info"><h3>' + esc(m.title) + '</h3><p>' + esc(fmtDate(m.date)) + '</p></div></button>';
    }).join('') + '</div>';
    return h + '</div>';
  }
  ACTIONS['moment-new'] = function () {
    if (!requirePet()) return;
    if (state.moments.length >= CONFIG.maxMoments) { toast('Llegaste al límite de ' + CONFIG.maxMoments + ' momentos. Eliminá alguno para agregar otro.', 'error'); return; }
    openSheet('Nuevo momento', '<form class="form" data-form="moment" novalidate>' + photoPickerHTML(CONFIG.momentPhotoMax, CONFIG.momentPhotoQuality, 'ELEGIR FOTO (OPCIONAL)') +
      fieldHTML({ name: 'date', label: 'Fecha', type: 'date', required: true, value: todayISO(), attrs: 'max="' + todayISO() + '"' }) +
      fieldHTML({ name: 'title', label: 'Título', required: true, placeholder: 'Ej. Su primer paseo', attrs: 'maxlength="60"' }) +
      fieldHTML({ name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Contá cómo fue…', attrs: 'maxlength="500"' }) +
      '<button type="submit" class="btn btn-primary btn-lg btn-block">GUARDAR</button></form>');
  };
  FORMS.moment = function (f) {
    clearErrors(f);
    const d = fd(f); let ok = true;
    if (!d.date) { setError(f, 'date', 'Elegí una fecha.'); ok = false; }
    else if (d.date > todayISO()) { setError(f, 'date', 'La fecha no puede ser futura.'); ok = false; }
    if (!d.title) { setError(f, 'title', 'Escribí un título para este momento.'); ok = false; }
    if (!ok) { focusFirstError(f); return; }
    const list = state.moments.concat([{ id: uid(), date: d.date, title: d.title, description: d.description || '', photo: d.photo || '', createdAt: new Date().toISOString() }]);
    if (!commit('moments', list)) return;
    closeSheet(); saved(); refresh();
  };
  ACTIONS['moment-open'] = function (d) {
    const m = state.moments.find(function (x) { return x.id === d.id; }); if (!m) return;
    const src = safeImageSrc(m.photo);
    openSheet(m.title, '<div class="moment-detail">' + (src ? '<img src="' + esc(src) + '" alt="Foto del momento: ' + esc(m.title) + '">' : '') + '</div>' +
      '<p class="muted">' + esc(fmtDate(m.date)) + '</p>' + (m.description ? '<p style="white-space:pre-line">' + esc(m.description) + '</p>' : '') +
      '<button type="button" class="btn btn-danger btn-block" data-action="moment-delete" data-id="' + m.id + '">' + icon('trash') + 'ELIMINAR MOMENTO</button>');
  };
  ACTIONS['moment-delete'] = function (d) {
    confirmDialog({ title: 'Eliminar momento', message: '¿Querés eliminar este momento? No se puede deshacer.', ok: 'ELIMINAR', danger: true }).then(function (yes) {
      if (!yes) return;
      if (commit('moments', state.moments.filter(function (x) { return x.id !== d.id; }))) { toast('Momento eliminado.'); refresh(); }
    });
  };

  /* ===========================================================
     13. TIENDA, ENLACES Y "MÁS"
     =========================================================== */
  // Enlaces efectivos: lo guardado en la app tiene prioridad sobre LINKS
  function normalizeLink(key, val) {
    val = String(val || '').trim(); if (!val) return '';
    if (key === 'whatsapp') { if (/^https?:\/\//i.test(val)) return val; const dg = val.replace(/\D/g, ''); return dg.length >= 8 ? 'https://wa.me/' + dg : ''; }
    if (key === 'instagram' && !/^https?:\/\//i.test(val)) { const u = val.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '').replace(/\/$/, ''); return /^[\w.]+$/.test(u) ? 'https://instagram.com/' + u : ''; }
    if (!/^https?:\/\//i.test(val)) val = 'https://' + val;
    try { const u = new URL(val); return u.hostname.indexOf('.') > 0 ? val : ''; } catch (e) { return ''; }
  }
  function getLink(key) {
    const o = state.settings.links;
    const raw = o && Object.prototype.hasOwnProperty.call(o, key) ? o[key] : LINKS[key];
    return normalizeLink(key, raw);
  }
  function resolveLink(keys) { for (let i = 0; i < keys.length; i++) { const v = getLink(keys[i]); if (v) return v; } return ''; }

  const STORE_ITEMS = [
    { title: 'Mascotas Sanas', text: 'Con el masterclass MASCOTAS SANAS Aprenderás las bases de la nutrición natural casera de perros y gatos.', 
         cta: 'VER / PEDIR', keys: ['placas', 'tienda'], ic: 'tag', art: 1 },
    { title: 'Aprende a hacer jabones naturales', text: 'En esta master class aprende a elaborar jabones naturales para tu mascota..', 
         cta: 'VER PRODUCTOS', keys: ['accesorios', 'productos', 'tienda'], ic: 'collar', art: 2 },
    { title: 'Juguetes', text: 'Porque también cuidar es jugar.', 
         cta: 'VER', keys: ['juguetes', 'productos', 'tienda'], ic: 'ball', art: 3 }
  ];
  function linkButton(href, label, cls, ic) {
    return href
      ? '<a class="btn ' + cls + ' btn-block" href="' + esc(href) + '" target="_blank" rel="noopener">' + (ic ? icon(ic) : '') + esc(label) + '</a>'
      : '<span class="btn btn-block" aria-disabled="true" role="link">PRÓXIMAMENTE</span>';
  }
  function renderStore() {
    let h = '<div class="screen-inner"><h1 class="sr-only">Tienda INDY</h1><p class="muted">Cosas lindas para cuidar y acompañar a tu mascota.</p>';
    STORE_ITEMS.forEach(function (it) {
      h += '<article class="store-card"><div class="store-art store-art--' + it.art + '">' + icon(it.ic) + '</div><div class="store-body"><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p>' +
        linkButton(resolveLink(it.keys), it.cta, it.art === 1 ? 'btn-accent' : 'btn-primary') + '</div></article>';
    });
    const wa = getLink('whatsapp'), ig = getLink('instagram');
    if (wa || ig) {
      h += '<div class="card"><h3>¿Tenés dudas?</h3><div class="btn-row">' + (wa ? '<a class="btn btn-soft" href="' + esc(wa) + '" target="_blank" rel="noopener">' + icon('whatsapp') + 'ESCRIBIR POR WHATSAPP</a>' : '') +
        (ig ? '<a class="btn btn-soft" href="' + esc(ig) + '" target="_blank" rel="noopener">' + icon('instagram') + 'VER INSTAGRAM</a>' : '') + '</div></div>';
    }
    if (!STORE_ITEMS.some(function (it) { return resolveLink(it.keys); })) {
      h += '<div class="banner">' + icon('info') + '<div class="banner-body"><span>Los botones se activan cuando cargás los enlaces de la tienda.</span><button type="button" class="btn btn-sm btn-primary" data-action="go" data-screen="links">CONFIGURAR ENLACES</button></div></div>';
    }
    return h + '</div>';
  }

  function renderMore() {
    const rows = [
      ['heart', 'Momentos', 'Tus recuerdos más lindos', 'moments'], ['store', 'Tienda INDY', 'Placas, accesorios y juguetes', 'store'],
      ['user', 'Mi información', 'Tu nombre y datos de contacto', 'owner'], ['settings', 'Configuración', 'Texto, copia de seguridad y datos', 'settings'],
      ['link', 'Enlaces de INDY', 'WhatsApp, tienda e Instagram', 'links'], ['help', 'Ayuda', 'Preguntas frecuentes', 'help'], ['info', 'Acerca de INDY', 'Versión y propósito', 'about']
    ];
    return '<div class="screen-inner"><div class="page-head"><h1>Más</h1></div><div class="list">' + rows.map(function (r) {
      return '<button type="button" class="row" data-action="go" data-screen="' + r[3] + '"><span class="row-ico">' + icon(r[0]) + '</span><span class="row-text"><strong>' + r[1] + '</strong><small>' + r[2] + '</small></span>' + icon('chevron') + '</button>';
    }).join('') + '</div><div class="card empty-card">' + logo('logo--lg') + '<p><strong>' + esc(BRAND.tagline) + '</strong></p></div></div>';
  }

  function renderOwner() {
    const s = state.settings, c = s.contact;
    const row = function (a, v) { return '<div class="detail-row"><dt>' + a + '</dt><dd>' + (v ? esc(v) : '<span class="muted">Sin completar</span>') + '</dd></div>'; };
    return '<div class="screen-inner"><h1 class="sr-only">Mi información</h1>' +
      '<div class="card"><h3>Tus datos</h3><dl class="detail-list">' + row('Tu nombre', s.ownerName) + row('Nombre del contacto', c.name) + row('Teléfono', c.phone) + row('WhatsApp', c.whatsapp) + row('Dirección', c.address) + '</dl>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="owner-edit">' + icon('edit') + 'EDITAR MIS DATOS</button></div>' +
      '<div class="card"><h3>Tus datos en INDY</h3><dl class="detail-list">' + row('Mascota', state.pet ? state.pet.name : '') + row('Recordatorios', String(state.reminders.length)) +
      row('Registros de historial', String(state.history.length)) + row('Momentos', String(state.moments.length)) + row('Espacio usado', storageUsageKB() + ' KB de unos 5000 KB') + '</dl>' +
      '<p class="hint">' + (storageOK ? 'Tus datos se guardan solo en este navegador y este dispositivo.' : 'Tu navegador bloquea el almacenamiento: los datos se perderán al cerrar.') + '</p></div></div>';
  }

  function renderSettings() {
    return '<div class="screen-inner"><h1 class="sr-only">Configuración</h1>' +
      '<div class="card"><h3>Lectura</h3><label class="switch-row"><span class="switch-text"><strong>Texto más grande</strong><small>Agranda las letras de toda la app</small></span>' +
      '<span class="switch-state">' + (state.settings.largeText ? 'Activado' : 'Desactivado') + '</span><input type="checkbox" role="switch" data-change="large-text"' + (state.settings.largeText ? ' checked' : '') + '><span class="switch-ui" aria-hidden="true"></span></label></div>' +
      '<div class="card"><h3>Copia de seguridad</h3><p class="muted">Descargá todos tus datos en un archivo, o restaurá una copia anterior.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="backup-export">' + icon('download') + 'EXPORTAR COPIA</button>' +
      '<button type="button" class="btn btn-soft" data-action="backup-import">' + icon('upload') + 'IMPORTAR COPIA</button></div>' +
      '<input type="file" accept="application/json,.json" hidden id="import-file" data-change="import-file"></div>' +
      '<div class="card"><h3>Borrar todo</h3><p class="muted">Elimina la mascota y todos los datos guardados en este dispositivo.</p>' +
      '<button type="button" class="btn btn-danger btn-block" data-action="reset-all">' + icon('trash') + 'BORRAR TODOS LOS DATOS</button></div></div>';
  }
  CHANGES['large-text'] = function (el) {
    if (commit('settings', Object.assign({}, state.settings, { largeText: el.checked }))) { applyTextSize(); refresh(); const n = $('[data-change="large-text"]'); if (n) n.focus({ preventScroll: true }); }
  };
  ACTIONS['backup-export'] = function () { exportBackup(); };
  ACTIONS['backup-import'] = function () { $('#import-file').click(); };
  CHANGES['import-file'] = function (el) { const f = el.files && el.files[0]; if (f) importBackup(f); el.value = ''; };
  ACTIONS['reset-all'] = function () {
    confirmDialog({ title: 'Borrar todos los datos', message: 'Se va a borrar todo lo guardado en INDY en este dispositivo. No se puede deshacer. Si querés conservarlo, primero exportá una copia.', ok: 'BORRAR TODO', danger: true }).then(function (yes) {
      if (!yes) return;
      resetAll(); toast('Se borraron todos los datos.'); navigate('home');
    });
  };

  function renderLinks() {
    const wa = getLink('whatsapp'), ig = getLink('instagram'), st = getLink('tienda');
    let h = '<div class="screen-inner"><h1 class="sr-only">Enlaces de INDY</h1>';
    if (wa || ig || st) {
      h += '<div class="card"><h3>Encontrá a INDY</h3><div class="btn-row">' + (wa ? '<a class="btn btn-soft" href="' + esc(wa) + '" target="_blank" rel="noopener">' + icon('whatsapp') + 'WHATSAPP</a>' : '') +
        (ig ? '<a class="btn btn-soft" href="' + esc(ig) + '" target="_blank" rel="noopener">' + icon('instagram') + 'INSTAGRAM</a>' : '') +
        (st ? '<a class="btn btn-soft" href="' + esc(st) + '" target="_blank" rel="noopener">' + icon('store') + 'TIENDA</a>' : '') + '</div></div>';
    }
    h += '<form class="card form" data-form="links" novalidate><h3>Editar enlaces</h3><p class="muted">Estos enlaces activan los botones de la Tienda INDY. Dejá un campo vacío para desactivar su botón.</p>' +
      Object.keys(LINKS).map(function (k) {
        const o = state.settings.links, raw = Object.prototype.hasOwnProperty.call(o, k) ? o[k] : LINKS[k];
        return fieldHTML({ name: k, label: LINK_LABELS[k], value: raw, type: 'text', placeholder: k === 'whatsapp' ? '5491112345678' : k === 'instagram' ? '@tuusuario' : 'https://…', attrs: 'inputmode="url" autocapitalize="off" autocomplete="off" spellcheck="false"' });
      }).join('') +
      '<button type="submit" class="btn btn-primary btn-lg btn-block">GUARDAR ENLACES</button>' +
      '<button type="button" class="btn btn-ghost btn-block" data-action="links-reset">RESTAURAR ENLACES ORIGINALES</button>' +
      '<p class="hint">Los enlaces originales se definen en script.js, en la sección CONFIGURACION DE ENLACES.</p></form></div>';
    return h;
  }
  FORMS.links = function (f) {
    clearErrors(f);
    const overrides = {}; let ok = true;
    Object.keys(LINKS).forEach(function (k) {
      const raw = String(f.elements[k].value || '').trim(), norm = normalizeLink(k, raw);
      if (raw && !norm) { setError(f, k, 'Revisá este enlace: tiene que ser una dirección válida.'); ok = false; return; }
      if (norm !== normalizeLink(k, LINKS[k])) overrides[k] = norm;
    });
    if (!ok) { focusFirstError(f); return; }
    if (commit('settings', Object.assign({}, state.settings, { links: overrides }))) { saved(); refresh(); }
  };
  ACTIONS['links-reset'] = function () {
    if (commit('settings', Object.assign({}, state.settings, { links: {} }))) { toast('Enlaces restaurados.'); refresh(); }
  };

  function renderHelp() {
    const qa = [
      ['¿Cómo creo el perfil de mi mascota?', 'En Inicio tocá “Crear mi mascota”. Completá al menos el nombre; el resto lo podés editar cuando quieras desde Mascota > Editar datos.'],
      ['¿Cómo funcionan los recordatorios?', 'Creá un recordatorio con fecha y periodicidad. Cuando lo marcás como realizado y se repite, INDY crea el siguiente automáticamente. Los vencidos aparecen marcados con la palabra “Vencido”.'],
      ['¿Cómo veo la evolución del peso?', 'En Mascota > Peso registrá mediciones. Con dos o más aparece la gráfica.'],
      ['¿Para qué sirve el QR?', 'Podés imprimirlo en una placa, collar o tarjeta. Quien lo escanee verá solo los datos que marcaste como públicos.'],
      ['¿Qué pasa si mi mascota se pierde?', 'En Identidad > Perdida activá el modo emergencia. Después descargá un QR nuevo para que muestre la alerta, y cuando vuelva tocá “Ya volvió a casa”.'],
      ['¿Dónde se guardan mis datos?', 'Solo en este navegador, en este dispositivo. No hay cuentas ni servidores. Si cambiás de teléfono, usá Configuración > Exportar copia.'],
      ['¿Puedo usar INDY sin internet?', 'Sí. Una vez abierta, INDY funciona sin conexión. Solo los enlaces de la tienda necesitan internet.']
    ];
    return '<div class="screen-inner"><h1 class="sr-only">Ayuda</h1><div class="list">' + qa.map(function (x) {
      return '<details class="qr-details"><summary>' + esc(x[0]) + '</summary><p style="padding:4px 0 10px">' + esc(x[1]) + '</p></details>';
    }).join('') + '</div></div>';
  }
  function renderAbout() {
    return '<div class="screen-inner"><h1 class="sr-only">Acerca de INDY</h1><div class="card empty-card">' + logo('logo--lg') +
      '<p><strong>' + esc(BRAND.tagline) + '</strong></p><p>' + esc(BRAND.about) + '</p><p class="hint">Versión ' + esc(BRAND.version) + ' · Gratis · Sin cuentas ni suscripciones</p></div></div>';
  }

  /* ===========================================================
     14. UTILIDADES
     =========================================================== */
  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(name, cls) { return '<svg class="icon ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  function logo(cls) { return '<svg class="logo ' + (cls || '') + '" viewBox="0 0 176 60" role="img" aria-label="' + esc(BRAND.name) + '"><use href="#logo-full"/></svg>'; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function slug(s) { return String(s || 'mascota').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mascota'; }
  function safeImageSrc(s) { return typeof s === 'string' && /^data:image\/(jpeg|png|webp|gif|svg\+xml)[;,]/.test(s) ? s : ''; }

  // Fechas (siempre en hora local, formato AAAA-MM-DD)
  function pad(n) { return String(n).padStart(2, '0'); }
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayISO() { return toISO(new Date()); }
  function parseISO(s) { const a = String(s).slice(0, 10).split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); }
  function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
  function addMonths(iso, n) {
    const d = parseISO(iso), day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    return toISO(d);
  }
  function diffDays(a, b) { return Math.round((parseISO(a) - parseISO(b)) / 86400000); }
  function fmtDate(iso) { return iso ? parseISO(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
  function relDay(iso) {
    const d = diffDays(iso, todayISO());
    if (d === 0) return 'Hoy'; if (d === 1) return 'Mañana'; if (d === -1) return 'Ayer';
    return d > 1 ? 'En ' + d + ' días' : 'Hace ' + (-d) + ' días';
  }
  // Edad calculada automáticamente
  function ageText(birth) {
    if (!birth) return '';
    const b = parseISO(birth), n = new Date();
    if (b > n) return '';
    let years = n.getFullYear() - b.getFullYear(), months = n.getMonth() - b.getMonth();
    if (n.getDate() < b.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years <= 0 && months <= 0) return 'Menos de 1 mes';
    const y = years > 0 ? years + (years === 1 ? ' año' : ' años') : '', m = months > 0 ? months + (months === 1 ? ' mes' : ' meses') : '';
    return y && m ? y + ' y ' + m : y || m;
  }
  function parseKg(s) {
    const n = parseFloat(String(s).replace(',', '.'));
    return isFinite(n) && n > 0 && n <= 250 && /^\s*\d+([.,]\d{1,2})?\s*(kg)?\s*$/i.test(String(s)) ? Math.round(n * 100) / 100 : null;
  }
  function fmtNum(n) { return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function fmtKg(n) { return fmtNum(n) + ' kg'; }

  function b64urlEncode(str) {
    let bin = ''; new TextEncoder().encode(str).forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    const bin = atob(s), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // Lee una imagen del dispositivo y la reduce (para que entre en localStorage)
  function readImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('type')); return; }
      const fr = new FileReader();
      fr.onload = function () {
        const img = new Image();
        img.onload = function () {
          const s = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = function () { reject(new Error('img')); };
        img.src = fr.result;
      };
      fr.onerror = function () { reject(new Error('read')); };
      fr.readAsDataURL(file);
    });
  }
  function downloadBlob(blob, name) {
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    try {
      const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;opacity:0';
      document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok;
    } catch (e) { return false; }
  }
  let toastTimer = null;
  function toast(msg, type) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, type === 'error' ? CONFIG.toastMs + 2000 : CONFIG.toastMs);
  }
  function applyTextSize() { document.documentElement.classList.toggle('large-text', !!state.settings.largeText); }
  function applyBrand() {
    $$('[data-brand]').forEach(function (el) { if (BRAND[el.dataset.brand]) el.textContent = BRAND[el.dataset.brand]; });
    $$('.lg-word').forEach(function (t) { t.textContent = BRAND.name; });
  }

  /* ---------- Eventos globales (delegación) ---------- */
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    const fn = ACTIONS[el.dataset.action];
    if (fn) fn(el.dataset, el, e);
  });
  document.addEventListener('submit', function (e) {
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    if (FORMS[f.dataset.form]) FORMS[f.dataset.form](f);
  });
  document.addEventListener('change', function (e) {
    const el = e.target.closest('[data-change]');
    if (el && CHANGES[el.dataset.change]) CHANGES[el.dataset.change](el, e);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (sheetOpen) closeSheet(); else if (publicOpen && !$('#app').hidden) hidePublic();
  });
  // Botón "atrás" del teléfono / navegador
  window.addEventListener('popstate', function (e) {
    const st = e.state || {};
    if (sheetOpen || publicOpen) {
      // Cierra la hoja o vista previa y se queda en la pantalla actual
      if (sheetOpen) closeSheet(); else hidePublic();
      try { history.pushState({ screen: current }, ''); } catch (err) { /* ignorar */ }
      return;
    }
    if (st.screen === 'welcome' || !st.screen) { if (!$('#app').hidden) showWelcome(); return; }
    navigate(st.screen, { push: false });
  });
  window.addEventListener('hashchange', function () { if (readPublicFromHash()) location.reload(); });

  /* ===========================================================
     15. ARRANQUE
     =========================================================== */
  function init() {
    loadAll();
    applyBrand();
    applyTextSize();
    try { history.replaceState({ screen: 'welcome' }, ''); } catch (e) { /* ignorar */ }
    const pub = readPublicFromHash();
    if (pub) {                       // Alguien abrió un enlace de identidad: solo vista pública
      $('#welcome').hidden = true;
      showPublic(pub, false);
      return;
    }
    showWelcome();
    if (!storageOK) toast('Tu navegador no permite guardar datos de forma permanente. Lo que cargues se perderá al cerrar.', 'error');
  }
  init();
})();
