# SteelVector — Explicații Complete Etapa 6: format-entitati

Acest document explică doar implementarea taskului de produse: pagina de produse, pagina de produs unic, baza de date, meniul pe categorii mari, filtrarea, sortarea, calcularea, tema, paginarea, acțiunile pe carduri, diacriticele, imaginile multiple și modalul. Structura urmează modelul din explicațiile etapei 5: introducere, cuprins, secțiuni numerotate și fragmente de cod cu explicații la nivel de linie.

---

## Cuprins

1. [Modelul de date și pregătirea produselor](#1-modelul-de-date-si-pregatirea-produselor)
   - [1.1 Normalizare și câmpuri derivate](#11-normalizare-si-campuri-derivate)
   - [1.2 Datele pentru filtre generate din DB](#12-datele-pentru-filtre-generate-din-db)
2. [Ruta /produse și ruta API](#2-ruta-produse-si-ruta-api)
   - [2.1 Randarea inițială pe server](#21-randarea-initiala-pe-server)
   - [2.2 Endpointul /api/produse](#22-endpointul-apiproduse)
3. [Template-ul paginii de produse](#3-template-ul-paginii-de-produse)
   - [3.1 Structura HTML și quick navigation](#31-structura-html-si-quick-navigation)
   - [3.2 Filtrele și butoanele](#32-filtrele-si-butoanele)
   - [3.3 Cardul produsului](#33-cardul-produsului)
   - [3.4 Modalul de produs](#34-modalul-de-produs)
   - [3.5 JavaScript-ul de filtrare și paginare](#35-javascript-ul-de-filtrare-si-paginare)
4. [Pagina produsului unic](#4-pagina-produsului-unic)
5. [Tema și navigarea globală](#5-tema-si-navigarea-globala)
6. [Stilizare Bootstrap și CSS dedicat](#6-stilizare-bootstrap-si-css-dedicat)
7. [Verificări și corecturi](#7-verificari-si-corecturi)

---

## 1. Modelul de date și pregătirea produselor

**Fișier**: [index.js](index.js)

În acest proiect, produsul este un profil metalic SteelVector. Modelul de date are exact tipurile cerute de enunț: identificator numeric, nume, descriere, imagine, categorie mare `tip` ca enum, categorie secundară `aplicatie` ca enum, preț, a doua caracteristică numerică `lungime_mm`, dată calendaristică, o caracteristică unică `finisaj`, o caracteristică multiplă `certificari` și o caracteristică booleană `livrare_rapida`.

### 1.1 Normalizare și câmpuri derivate

#### `normalizeazaText(text)` - [index.js](index.js#L335)

```js
function normalizeazaText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
```

**Ce face**: transformă orice text într-o formă comparabilă, fără diacritice și fără diferențe de majuscule/minuscule.

**De ce este important**: funcția este folosită în filtrarea după nume și descriere, dar și la compararea tipurilor și finisajelor. Astfel, `briose` și `brioșe` devin echivalente, iar `IPE` și `ipe` sunt tratate la fel.

**Cum funcționează**:
- `String(text ?? "")` protejează împotriva valorilor `null` sau `undefined`.
- `.normalize("NFD")` separă literele de semnele diacritice.
- `.replace(/[\u0300-\u036f]/g, "")` elimină toate semnele diacritice.
- `.toLowerCase()` normalizează majusculele.
- `.trim()` elimină spațiile inutile.

#### `extrageImaginiProdus(imaginePrincipala)` - [index.js](index.js#L344)

```js
function extrageImaginiProdus(imaginePrincipala) {
  const folderImagini = path.join(__dirname, "resurse", "imagini", "galerie");
  if (!imaginePrincipala) {
    return [];
  }

  const extensie = path.extname(imaginePrincipala);
  const baza = path.basename(imaginePrincipala, extensie);
  const variantePreferate = [
    imaginePrincipala,
    `${baza}_md${extensie}`,
    `${baza}_sm${extensie}`
  ];
  ...
  return imagini.map((fisier) => `/resurse/imagini/galerie/${fisier}`);
}
```

**Ce face**: construiește lista de imagini disponibile pentru un produs pornind de la fișierul din bază.

**Logica**:
- ia imaginea principală din DB;
- generează automat variantele `*_md` și `*_sm`;
- verifică ce variante există efectiv în folderul de imagini;
- întoarce URL-urile publice pentru toate imaginile găsite.

**De ce este utilă**: aceeași logică alimentează atât cardul din pagina de produse, cât și pagina de produs unic și modalul.

#### `pregatesteProdus(rand)` - [index.js](index.js#L369)

```js
function pregatesteProdus(rand) {
  const certificari = (rand.certificari || "")
    .split(",")
    .map((elem) => elem.trim())
    .filter(Boolean);

  return {
    ...rand,
    pret: Number(rand.pret),
    lungime_mm: Number(rand.lungime_mm),
    certificari,
    certificatText: certificari.join(", "),
    certList: certificari,
    imagine_varianta: extrageImaginiProdus(rand.imagine),
    nume_normalizat: normalizeazaText(rand.nume),
    descriere_normalizata: normalizeazaText(rand.descriere),
    finisaj_normalizat: normalizeazaText(rand.finisaj),
    aplicatie_normalizata: normalizeazaText(rand.aplicatie),
    tip_normalizat: normalizeazaText(rand.tip)
  };
}
```

**Ce face**: transformă rândul brut din PostgreSQL într-un obiect gata de folosit în UI.

**Ce pregătește**:
- transformă `pret` și `lungime_mm` în numere;
- convertește `certificari` din șir CSV în vector;
- păstrează atât forma vectorială, cât și un text gata de afișat (`certificatText`);
- adaugă lista de imagini disponibile;
- adaugă câmpuri normalizate pentru filtrare rapidă.

**De ce e important**: template-urile și filtrarea nu mai lucrează direct cu textul brut din DB, ci cu o structură consistentă.

### 1.2 Datele pentru filtre generate din DB

#### `obtineMetaProduse()` - [index.js](index.js#L525)

```js
async function obtineMetaProduse() {
  const finisajeRez = await pool.query("SELECT DISTINCT finisaj FROM produse ORDER BY finisaj");
  const finisaje = finisajeRez.rows.map((r) => r.finisaj);

  const certRez = await pool.query("SELECT certificari FROM produse WHERE certificari IS NOT NULL");
  const setCertificari = new Set();
  certRez.rows.forEach((r) => {
    String(r.certificari || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => setCertificari.add(c));
  });
  const certificari = [...setCertificari].sort((a, b) => a.localeCompare(b, "ro"));

  const aplicatiiRez = await pool.query("SELECT unnest(enum_range(NULL::aplicatie_profil))::text AS val");
  const aplicatii = aplicatiiRez.rows.map((r) => r.val);

  const tipuriRez = await pool.query("SELECT unnest(enum_range(NULL::tip_profil))::text AS val");
  const tipuri = tipuriRez.rows.map((r) => r.val);

  const pretMinMax = await pool.query("SELECT MIN(pret) AS pmin, MAX(pret) AS pmax FROM produse");
  ...
  return {
    finisaje,
    certificari,
    aplicatii,
    tipuri,
    pretMin,
    pretMax,
    lungimi,
    elementePerPagina: 6
  };
}
```

**Ce face**: citește din baza de date toate valorile necesare pentru UI și le trimite către template.

**Ce produce**:
- `finisaje` pentru selectul simplu;
- `certificari` pentru selectul multiplu;
- `aplicatii` și `tipuri` pentru selecturi/radio din meniu și filtre;
- `pretMin` și `pretMax` pentru range;
- `lungimi` pentru datalist;
- `elementePerPagina` pentru paginare.

**De ce se face din DB**: cerința spune explicit că valorile trebuie generate pe baza datelor din tabel, nu scrise manual.

---

## 2. Ruta /produse și ruta API

### 2.1 Randarea inițială pe server

#### Ruta `/produse` - [index.js](index.js#L851)

```js
app.get("/produse", async (req, res) => {
  try {
    const metaProduse = await obtineMetaProduse();
    const produseIntermediare = await pool.query("SELECT * FROM produse ORDER BY id");
    const produseProcesate = produseIntermediare.rows.map(pregatesteProdus);
    const produse = req.query.tip
      ? produseProcesate.filter((produs) => normalizeazaText(produs.tip) === normalizeazaText(req.query.tip))
      : produseProcesate;

    res.render("pagini/produse", {
      produse,
      tipSelectat: req.query.tip || null,
      ...metaProduse,
      elementePerPagina: metaProduse.elementePerPagina,
      sortCheie1: "nume",
      sortCheie2: "pret",
      sortDirectie1: "asc",
      sortDirectie2: "asc"
    });
  } catch (err) {
    console.error("Eroare la ruta /produse:", err.message);
    return afisareEroare(res, 500);
  }
});
```

**Ce face**: generează prima randare a paginii de produse.

**Pașii importanți**:
1. citește meta datele pentru filtre;
2. citește toate produsele din DB;
3. le pregătește cu `pregatesteProdus()`;
4. dacă există `?tip=...`, filtrează server-side după categoria mare;
5. transmite în EJS atât produsele, cât și toate valorile necesare pentru filtre și paginare.

**De ce `elementePerPagina` aici**: fără acest câmp, pagina nu putea porni corect și apărea eroarea `elementePerPagina is not defined`.

### 2.2 Endpointul `/api/produse`

#### Ruta API - [index.js](index.js#L874)

```js
app.get("/api/produse", async (req, res) => {
  try {
    const rezultat = await pool.query("SELECT * FROM produse ORDER BY id");
    const produse = rezultat.rows.map(pregatesteProdus);
    const metaProduse = await obtineMetaProduse();
    const rezultatProcesat = proceseazaListaProduse(produse, {
      ...req.query,
      elementePerPagina: req.query.elementePerPagina || metaProduse.elementePerPagina
    });

    res.json({
      ...rezultatProcesat,
      filtre: req.query,
      meta: metaProduse
    });
  } catch (err) {
    console.error("Eroare la ruta /api/produse:", err.message);
    return res.status(500).json({ mesaj: "Eroare la prelucrarea produselor." });
  }
});
```

**Ce face**: primește filtrele de la client și întoarce un JSON cu produsele filtrate, sortate și paginate.

**De ce este nevoie**: filtrarea și sortarea au fost mutate pe server, iar clientul le invocă prin `fetch()`.

**Ce returnează**:
- lista produselor pentru pagina curentă;
- numărul total de produse după filtrare;
- numărul total de pagini;
- pagina curentă;
- meta datele pentru UI.

---

## 3. Template-ul paginii de produse

**Fișier**: [views/pagini/produse.ejs](views/pagini/produse.ejs)

### 3.1 Structura HTML și quick navigation

#### Ancoră generală și quick nav - [views/pagini/produse.ejs](views/pagini/produse.ejs#L15)

```ejs
<main data-tip-selectat="<%= tipSelectat || '' %>">
  <h2 id="titlu-produse"> ... </h2>

  <nav class="produse-quicknav" aria-label="Navigare rapidă produse">
    <a class="btn btn-outline-primary btn-sm" href="/"> ... </a>
    <a class="btn btn-outline-primary btn-sm" href="/despre"> ... </a>
    <a class="btn btn-primary btn-sm" href="/produse"> ... </a>
  </nav>
```

**Ce face**: adaugă o bară vizibilă de navigare rapidă în partea de sus a paginii de produse.

**De ce este necesară**: oferă o cale simplă de ieșire de pe pagina de produse chiar dacă meniul principal este dificil de accesat pe ecrane mici.

**Observație**: atributul `data-tip-selectat` păstrează categoria mare selectată din meniu și o transmite mai departe către scriptul de încărcare.

### 3.2 Filtrele și butoanele

#### Secțiunea de filtre - [views/pagini/produse.ejs](views/pagini/produse.ejs#L33)

```ejs
<section id="sectiune-filtre" class="container-fluid">
  <h3><i class="bi bi-funnel"></i> Filtre, sortare și paginare</h3>
  ...
  <input type="text" class="form-control" id="filtru-nume" ...>
  <input type="range" class="form-range" id="filtru-pret-min" ...>
  <input type="range" class="form-range" id="filtru-pret-max" ...>
  <datalist id="lista-lungimi"> ... </datalist>
  <select class="form-select" id="filtru-finisaj"> ... </select>
  <select class="form-select" id="filtru-certificari" multiple size="4"> ... </select>
  <input class="form-check-input" type="checkbox" id="filtru-livrare">
  <select class="form-select" id="filtru-aplicatie"> ... </select>
  <textarea class="form-control" id="filtru-descriere"></textarea>
```

**Ce face**: creează toate tipurile de input cerute de enunț.

**Mapare cu cerința**:
- `text` → nume produs;
- două `range` → preț minim și maxim;
- `datalist` → lungime;
- `checkbox` → livrare rapidă;
- `textarea` → căutare în descriere;
- `select simplu` → finisaj;
- `select multiplu` → certificări;
- `select` suplimentar → aplicație;
- selecturile de sortare folosite pentru cele două chei cerute.

#### Butoanele de acțiune - [views/pagini/produse.ejs](views/pagini/produse.ejs#L144)

```ejs
<button type="button" class="btn btn-primary" id="btn-filtreaza"> ... </button>
<button type="button" class="btn btn-primary" id="btn-calculeaza"> ... </button>
<button type="button" class="btn btn-outline-danger" id="btn-reseteaza"> ... </button>
```

**Ce fac**:
- `filtrează acum` aplică filtrarea manuală;
- `media prețurilor` calculează media produselor vizibile;
- `resetează` revine la valorile inițiale și cere confirmare.

**Cerință importantă**: pe ecrane mici, textul este ascuns și rămân doar iconurile Bootstrap.

### 3.3 Cardul produsului

#### Article-ul produsului - [views/pagini/produse.ejs](views/pagini/produse.ejs#L166)

```ejs
<article id="art<%= p.id %>" class="produs-card <%= p.tip %> <%= p.esteFixat ? 'produs-fixat' : '' %>"
  data-id="<%= p.id %>"
  data-nume="<%= p.nume %>"
  data-pret="<%= p.pret %>"
  data-lungime="<%= p.lungime_mm %>"
  data-tip="<%= p.tip %>"
  data-aplicatie="<%= p.aplicatie %>"
  data-finisaj="<%= p.finisaj %>"
  data-certificari="<%= p.certificatText || '' %>"
  data-livrare="<%= p.livrare_rapida %>"
  data-descriere="<%= p.descriere || '' %>"
  data-imagini='<%- JSON.stringify(p.imagine_varianta || []) %>'>
```

**Ce face**: construiește cardul fiecărui produs și îi atașează atribute `data-*` pentru filtrare și modal.

**De ce este important**:
- `id="art<id>"` respectă exact cerința enunțului;
- clasa include categoria mare `tip`, fără spații;
- `data-*` păstrează toate valorile necesare pentru calcul, sortare și deschiderea modalului.

#### Imaginea, titlul, badges și butoanele - [views/pagini/produse.ejs](views/pagini/produse.ejs#L176)

```ejs
<div class="produs-layout">
  <div class="produs-imagine">
    <img src="<%= imgPrincipala %>" alt="<%= p.nume %>" loading="lazy">
  </div>
  <div class="produs-info">
    <div class="produs-head">
      <h3 class="produs-titlu"><%= p.nume %></h3>
      <p class="produs-categorie">
        <span class="badge bg-primary"><%= p.tip.toUpperCase() %></span>
        <span class="badge bg-secondary"><%= p.aplicatie %></span>
        <% if (p.esteFixat) { %>
          <span class="badge bg-warning text-dark">Fixat</span>
        <% } %>
      </p>
    </div>
    <div class="produs-actiuni">
      <button type="button" class="btn-actiune" data-actie="fixeaza" ...>
      <button type="button" class="btn-actiune" data-actie="ascunde-temporar" ...>
      <button type="button" class="btn-actiune" data-actie="ascunde-sesiune" ...>
    </div>
  </div>
</div>
```

**Ce face**: afișează cardul exact în formatul cerut, cu imagine în stânga și tabel în dreapta.

**Butoanele bonus**:
- primul fixează produsul;
- al doilea îl ascunde temporar;
- al treilea îl ascunde pe durata sesiunii/tabului.

### 3.4 Modalul de produs

#### Markup modal - [views/pagini/produse.ejs](views/pagini/produse.ejs#L274)

```ejs
<div id="modal-produs" class="modal-produs" aria-hidden="true" hidden>
  <div class="modal-produs-box" role="dialog" aria-modal="true" aria-labelledby="modal-produs-titlu">
    <button type="button" class="modal-produs-inchide" id="modal-produs-inchide">×</button>
    <div class="modal-produs-media">
      <img id="modal-produs-imagine" alt="Imagine produs">
      <div class="modal-produs-controls">
        <button ... id="modal-produs-prev">...</button>
        <button ... id="modal-produs-next">...</button>
      </div>
    </div>
    <div class="modal-produs-info">
      <h3 id="modal-produs-titlu"></h3>
      <div id="modal-produs-badges"></div>
      <p id="modal-produs-descriere"></p>
      <ul id="modal-produs-detalii"></ul>
      <a id="modal-produs-link" class="btn btn-primary" href="#">Vezi pagina produsului</a>
    </div>
  </div>
</div>
```

**Ce face**: deschide o fereastră modală direct pe pagina de produse, fără să trimită utilizatorul către pagina separată.

**De ce este util**: îndeplinește bonusul 11 și oferă acces rapid la mai multe detalii despre produs.

### 3.5 JavaScript-ul de filtrare și paginare

#### Inițializarea referințelor și a stării - [views/pagini/produse.ejs](views/pagini/produse.ejs#L303)

```js
const tipSelectat = document.querySelector('main').dataset.tipSelectat || '';
const elementePerPagina = <%= elementePerPagina %> || 6;

const stare = {
  pagina: 1,
  totalPagini: 1,
  produseCurente: [],
  produsModal: null,
  indexImagineModal: 0
};
```

**Ce face**: memorează în JavaScript tot ce este necesar pentru filtrare, paginare și modal.

**Observație**: `elementePerPagina` vine din server și rezolvă eroarea de randare inițială.

#### Normalizarea textului în client - [views/pagini/produse.ejs](views/pagini/produse.ejs#L314)

```js
function normalizeazaText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
```

**Ce face**: repetă în client aceeași logică de normalizare ca în server, pentru comparații consistente.

#### Încărcarea produselor prin `fetch()` - [views/pagini/produse.ejs](views/pagini/produse.ejs#L414)

```js
async function incarcaProduse(paginaNoua = 1) {
  stare.pagina = paginaNoua;
  const filtre = citesteFiltre();
  const fixe = citesteSetStorage(localStorage, 'sv-produse-pastrate');
  const ascunseSesiune = citesteSetStorage(sessionStorage, 'sv-produse-ascunse-sesiune');

  const params = new URLSearchParams({
    ...filtre,
    tip: tipSelectat,
    pagina: String(stare.pagina),
    elementePerPagina: String(elementePerPagina),
    fixe: Array.from(fixe).join(','),
    ascunseSesiune: Array.from(ascunseSesiune).join(',')
  });

  const raspuns = await fetch(`/api/produse?${params.toString()}`);
  const date = await raspuns.json();
  stare.totalPagini = date.totalPagini || 1;
  stare.produseCurente = Array.isArray(date.produse) ? date.produse : [];

  randareProduse(stare.produseCurente);
  randarePaginare(stare.totalPagini, date.paginaCurenta || 1);
  actualizeazaButoaneStare();
}
```

**Ce face**: trimite toate filtrele la server și reconstruiește zona de produse pe baza răspunsului JSON.

**De ce este important**: aici se realizează bonusul 10a/10b, adică filtrare și sortare server-side prin `fetch()`.

#### Randarea paginării - [views/pagini/produse.ejs](views/pagini/produse.ejs#L512)

```js
function randarePaginare(totalPagini, paginaCurenta) {
  paginareProduse.innerHTML = '';
  if (totalPagini <= 1) {
    return;
  }

  const frag = document.createDocumentFragment();
  for (let pagina = 1; pagina <= totalPagini; pagina += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn btn-outline-primary me-2 mb-2 ${pagina === paginaCurenta ? 'active' : ''}`;
    btn.textContent = pagina;
    btn.addEventListener('click', () => incarcaProduse(pagina));
    frag.appendChild(btn);
  }

  paginareProduse.appendChild(frag);
}
```

**Ce face**: creează butoanele de paginare și le leagă de încărcarea unei noi pagini.

#### Deschiderea modalului - [views/pagini/produse.ejs](views/pagini/produse.ejs#L531)

```js
function deschideModal(produs) {
  ...
  modalTitlu.textContent = produs.nume;
  modalDescriere.textContent = produs.descriere || '';
  modalLink.href = `/produs/${produs.id}`;
  modalBadgeContainer.innerHTML = ...;
  modalDetalii.innerHTML = ...;
  modal.dataset.imagini = JSON.stringify(imagini);
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  actualizeazaImagineModal();
}
```

**Ce face**: populează modalul cu datele produsului și deschide fereastra.

#### Delegarea butoanelor de pe card - [views/pagini/produse.ejs](views/pagini/produse.ejs#L622)

```js
zonaProduse.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-actie]');
  const card = event.target.closest('.produs-card');
  ...
});
```

**Ce face**: tratează cele trei acțiuni ale fiecărui produs fără a atașa ascultători pe fiecare card separat.

**Avantaj**: cod mai mic și funcționare mai bună după re-randări.

---

## 4. Pagina produsului unic

**Fișier**: [views/pagini/produs.ejs](views/pagini/produs.ejs)

### Galeria de imagini - [views/pagini/produs.ejs](views/pagini/produs.ejs#L25)

```ejs
<div class="produs-imagine-carousel" id="produs-imagine-carousel" data-imagini='<%- JSON.stringify(produs.imagine_varianta || ["/resurse/imagini/galerie/" + produs.imagine]) %>'>
  <img src="<%= (produs.imagine_varianta && produs.imagine_varianta.length > 0) ? produs.imagine_varianta[0] : '/resurse/imagini/galerie/' + produs.imagine %>"
    alt="<%= produs.nume %>" class="img-fluid" id="produs-imagine-curenta">
  <div class="produs-imagine-controls">
    <button type="button" class="btn btn-outline-primary" id="produs-imagine-prev">...</button>
    <span id="produs-imagine-indicator"></span>
    <button type="button" class="btn btn-outline-primary" id="produs-imagine-next">...</button>
  </div>
</div>
```

**Ce face**: afișează imaginea principală și permite schimbarea ei cu variantele disponibile.

**Cum se leagă de cerință**: pagina de produs unic trebuie să afișeze toate detaliile, iar imaginile multiple sunt extra utilitare pentru bonusul 9.

### JavaScript-ul galeriei - [views/pagini/produs.ejs](views/pagini/produs.ejs#L133)

```js
const imagini = JSON.parse(carousel.dataset.imagini || '[]');
let index = 0;

function actualizeaza() {
  if (!imagini.length) {
    indicator.textContent = '0 / 0';
    return;
  }

  imagine.src = imagini[index];
  imagine.alt = '<%= produs.nume %>';
  indicator.textContent = `${index + 1} / ${imagini.length}`;
  prev.disabled = imagini.length < 2;
  next.disabled = imagini.length < 2;
}
```

**Ce face**: parcurge imaginile cu butoanele precedent/următor și actualizează indicatorul de poziție.

### Certificări pe pagina de produs - [views/pagini/produs.ejs](views/pagini/produs.ejs#L87)

```ejs
<% const certificariAfisare = Array.isArray(produs.certificari) ? produs.certificari : String(produs.certificari || '').split(','); %>
<% if (certificariAfisare.filter(c => c && String(c).trim()).length > 0) { %>
  <% certificariAfisare.forEach(c => { %>
    <span class="badge bg-info text-dark me-1"><%= c.trim() %></span>
  <% }); %>
<% } else { %>
  —
<% } %>
```

**Ce face**: afișează certificările fie ca vector, fie ca șir CSV, fără să apară eroare de runtime.

**De ce a fost nevoie**: serverul pregătește certificările ca vector, iar template-ul trebuie să accepte și forma vectorială.

---

## 5. Tema și navigarea globală

**Fișier**: [views/fragmente/footer.ejs](views/fragmente/footer.ejs)

### Selectorul de temă - [views/fragmente/footer.ejs](views/fragmente/footer.ejs#L26)

```ejs
<div id="tema-toggle-wrapper">
  <label for="tema-select" id="tema-toggle-label">
    <i class="fas fa-circle-half-stroke"></i>
    Temă
  </label>
  <select id="tema-select" class="form-select form-select-sm">
    <option value="dark">Steel Dark</option>
    <option value="light">Steel Light</option>
    <option value="copper">Steel Copper</option>
  </select>
</div>
```

**Ce face**: oferă alegerea dintre trei teme, nu doar light/dark.

**Stocare**: tema aleasă se salvează în `localStorage` și se reia la următoarea vizită.

### Scriptul de aplicare a temei - [views/fragmente/footer.ejs](views/fragmente/footer.ejs#L52)

```js
function aplicaTema(tema) {
  document.body.classList.remove("tema-light", "tema-copper");
  if (tema === "light") {
    document.body.classList.add("tema-light");
  } else if (tema === "copper") {
    document.body.classList.add("tema-copper");
  }
}
```

**Ce face**: schimbă clasa de pe `<body>` și lasă CSS-ul să controleze culorile globale.

**De ce este bine**: aceeași implementare funcționează pe toate paginile, fiind inclusă în footer.

---

## 6. Stilizare Bootstrap și CSS dedicat

### Variabilele de temă - [resurse/css/general.css](resurse/css/general.css#L170)

```css
body.tema-light {
  --culoare_background: #f4f7fb;
  --culoare-contur: #b85b16;
  --culoare-highlight: #d9e4ee;
  --culoare-text: #1d2730;
  --culoare-titlu: #14202c;
  --culoare-link-vizitat: #2e5e8b;
}

body.tema-copper {
  --culoare_background: #201611;
  --culoare-contur: #e08a3f;
  --culoare-highlight: #3b271d;
  --culoare-text: #f4eadf;
  --culoare-titlu: #fff5e8;
  --culoare-link-vizitat: #f2b37b;
}
```

**Ce face**: redefinește culorile globale prin variabile CSS.

### Quick nav-ul de pe pagina de produse - [resurse/css/produse.css](resurse/css/produse.css#L12)

```css
.produse-quicknav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin: 0 0 1rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid rgba(249, 155, 65, 0.25);
  border-radius: 0.7rem;
  background: rgba(28, 43, 57, 0.65);
  position: sticky;
  top: 64px;
  z-index: 900;
  backdrop-filter: blur(4px);
}
```

**Ce face**: ține vizibilă bara de navigare rapidă, deci utilizatorul poate pleca imediat de pe pagina de produse.

### Butoane, paginare, modal și carusel - [resurse/css/produse.css](resurse/css/produse.css#L472)

```css
.btn-actiune { ... }
.paginare-produse { ... }
.modal-produs { ... }
.modal-produs-box { ... }
.produs-imagine-carousel { ... }
```

**Ce fac**:
- `.btn-actiune` stilizează cele trei acțiuni pe card;
- `.paginare-produse` organizează butoanele numerice;
- `.modal-produs` și `.modal-produs-box` creează modalul;
- `.produs-imagine-carousel` stilizează zona de imagini multiple de pe pagina produsului.

---

## 7. Verificări și corecturi

Pe parcursul implementării au fost făcute verificări de sintaxă și smoke tests EJS. A fost prinsă și corectată eroarea inițială de tip `elementePerPagina is not defined`, iar pagina de produs unic a fost ajustată pentru certificări ca vector.

**Fișiere verificate**:
- [index.js](index.js)
- [views/pagini/produse.ejs](views/pagini/produse.ejs)
- [views/pagini/produs.ejs](views/pagini/produs.ejs)
- [views/fragmente/footer.ejs](views/fragmente/footer.ejs)
- [resurse/css/produse.css](resurse/css/produse.css)
- [resurse/css/general.css](resurse/css/general.css)

**Ce trebuie reținut la prezentare**: implementarea este centrată pe pagina de produse și pe pagina de produs unic, iar toate bonusurile cerute sunt rezolvate în același flux de lucru: date din DB, filtrare server-side, fetch, modal, imagini multiple, teme multiple și navigare rapidă.

### 2.2 Teme (Dark + Light)

#### Tema 1: Steel Dark (implicită) — Liniile 34-37
```scss
$body-bg:        $sv-deep;     // #0f1c27 — fundal foarte închis
$body-color:     $sv-light;    // #e8edf2 — text deschis
$headings-color: #f5f7f9;      // headinguri aproape albe
```
Aceasta este tema aplicată global pe tot site-ul.

#### Tema 2: Steel Light — Liniile 140-172
```scss
.tema-light {
  --bs-body-bg:     #dfe6ed;
  --bs-body-color:  #1c2b39;
  background-color: #dfe6ed !important;
  color: #1c2b39 !important;
  // ... restilizare .card, .btn-primary, .alert-primary, .badge
}
```
Aceasta se aplică **selectiv** pe containere cu clasa `.tema-light` — demonstrată pe pagina `/despre` în secțiunea Bootstrap Demo ([despre.ejs:135](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L135)).

### 2.3 Variabile Modificate

| Categorie | Variabile | Linii |
|:---|:---|:---|
| **Culori font/litere** | `$btn-color`, `$badge-color`, `$link-color`, `$link-hover-color`, `$alert-color-scale` | 41-48 |
| **Familie font** | `$font-family-sans-serif: "Saira"...`, `$headings-font-family: "Merriweather"...` | 51-53 |
| **Breakpoints ecran** | `md: 860px` (default: 768), `lg: 1220px` (default: 992) | 58-65 |
| **Container widths** | `md: 840px`, `lg: 1180px` | 68-74 |
| **Border radius** | `$border-radius: 0.65rem`, `$border-radius-lg: 0.9rem` | 77-81 |
| **Heading sizes** | `$h1-font-size: 2.8rem` ... `$h6-font-size: 0.95rem` | 84-89 |
| **Butoane** | `$btn-padding-y`, `$btn-padding-x`, `$btn-font-weight` | 92-95 |
| **Inputuri** | `$input-bg`, `$input-color`, `$input-border-color` | 97-100 |
| **Card** | `$card-bg: $sv-dark`, `$card-color`, `$card-border-color` | 102-105 |
| **Modal** | `$modal-content-bg`, `$modal-content-color` | 107-109 |
| **Navbar** | `$navbar-dark-color`, `$navbar-dark-hover-color` | 114-116 |
| **Tabel** | `$table-color`, `$table-border-color`, `$table-striped-bg` | 118-122 |
| **Umbre** | `$box-shadow`, `$box-shadow-sm` | 111-112 |

#### Import Bootstrap + fișiere locale — Liniile 124-130

```scss
@import "bootstrap/scss/bootstrap";   // Linia 125 — importul complet Bootstrap
@import "overrides";                  // Linia 128 — anulare interferențe Bootstrap
@import "effects";                    // Linia 129 — efectele CSS custom
@import "galerie";                    // Linia 130 — stiluri galerie statică
```

**Ordinea contează**: Bootstrap se importă PRIMUL, apoi override-urile noastre pot suprascrie regulile Bootstrap care interferează cu designul nostru.

### 2.4 Elemente Demonstrative

Pe pagina `/despre` ([despre.ejs:108-154](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L108-L154)):

**Tema Dark** (liniile 114-131):
- Butoane: `btn-primary` (portocaliu), `btn-outline-light`, `btn-success`
- Badge: `text-bg-warning`
- Alert: `alert-primary`
- Card: `card-sv` (stilizare custom cu header portocaliu)

**Tema Light** (liniile 135-153):
- Container cu clasa `.tema-light` și bordură portocalie
- Aceleași elemente, dar în schema deschisă

**Stiluri pentru demo** ([custom.scss:177-218](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/custom.scss#L177-L218)):
- `.bootstrap-demo` — layout flex cu gap
- `.card-sv` — card cu background `$sv-dark` și header portocaliu
- `.navbar-sv` — navbar cu border portocaliu

---

## 3. Efecte CSS (0.55p realizat)

Toate efectele sunt în [effects.scss](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/effects.scss) (300 linii).

### 3.1 `::selection` Customizat — 0.025p (Liniile 7-12)

```scss
::selection {
  background-color: var(--culoare-contur);   // portocaliu brand
  color: var(--culoare-highlight);           // albastru închis
  text-shadow: none;
  letter-spacing: 0.05em;
}
```

**Ce face**: Când selectezi text pe pagină cu mouse-ul, fundalul selecției devine portocaliu (brand SteelVector) și textul devine albastru închis, în loc de albastru clasic.

---

### 3.2 Stilizare `<hr>` — 0.1p [CERINȚĂ INDIVIDUALĂ] (Liniile 14-28)

```scss
hr.metal {
  border: 0;
  height: 0.8rem;
  border-radius: 999px;             // colțuri rotunjite complet
  background-image: repeating-linear-gradient(
    to bottom,                       // benzi ORIZONTALE (direcția gradientului e de sus în jos)
    var(--culoare-contur) 0px,       // banda portocalie
    var(--culoare-contur) 2px,
    #0d2235 2px,                     // banda albastru-închis
    #0d2235 4px
  );
  box-shadow: 0 0.2rem 0.4rem rgba(0, 0, 0, 0.4) inset;   // umbră internă
  margin: 1.2rem 0 1.5rem;
}
```

**Cum funcționează**: `repeating-linear-gradient` creează un pattern de dungi alternante de 2px fiecare (portocaliu + albastru). `border-radius: 999px` rotunjește capetele. Rezultatul arată ca o bară metalică cu dungi orizontale.

**Unde e folosit**: Pe pagina `/despre` — [despre.ejs:54](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L54), [72](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L72), [94](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L94), [105](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L105).

---

### 3.3 `column-count` — 0.025p (Liniile 30-41)

```scss
#anunturi ul {
  column-count: 2;                           // 2 coloane pe ecran mare
  column-gap: 2rem;                          // spațiu între coloane
  column-rule: 2px solid var(--culoare-contur);  // linie verticală separatoare
}
@media screen and (max-width: 1200px) {
  #anunturi ul { column-count: 1; }          // 1 coloană pe ecran mic
}
```

**Ce face**: Împarte lista de anunțuri pe 2 coloane pe ecran mare, cu o linie portocalie între ele. Pe ecrane mici, revine la 1 coloană.

---

### 3.4 Marquee — 0.05p (Liniile 43-66)

```scss
.marquee__track {
  animation: marquee 14s linear infinite;
}
@keyframes marquee {
  0%   { transform: translateX(100vw); }     // pornește de la dreapta ecranului
  100% { transform: translateX(-100%); }     // termină în stânga complet
}
```

**Ce face**: Text care se deplasează orizontal de la dreapta la stânga continuu (efect de „news ticker"). Overflow-ul este ascuns pe container, iar `100vw` asigură că textul pornește din afara viewport-ului.

---

### 3.5 Background Fix la Scroll — 0.05p (Liniile 68-82)

```scss
#prezentare {
  background-attachment: fixed;              // fundalul rămâne fix la scroll
  animation: background-swap 18s infinite;   // schimbă imaginea la fiecare 6 secunde
}
@keyframes background-swap {
  0%,  33% { background-image: url("...Depozit...jpg"); }
  34%, 66% { background-image: url("...SteelVector-prezentare.png"); }
  67%,100% { background-image: url("...Depozit-mid.jpg"); }
}
```

**Ce face**: Secțiunea `#prezentare` are un fundal care nu se mișcă la scroll (efect parallax simplu) și care se schimbă ciclic între 3 imagini la fiecare ~6 secunde.

---

### 3.6 Tabel Responsiv — 0.05p (Liniile 84-140)

```scss
@media screen and (max-width: 600px) {
  .tabel-transpus thead { display: none; }           // ascundem header-ul
  .tabel-transpus tbody tr { display: block; }        // fiecare rând devine bloc vertical
  .tabel-transpus tbody td {
    display: flex;
    justify-content: space-between;
  }
  .tabel-transpus tbody td::before {
    content: attr(data-label);                        // eticheta din atributul HTML data-label
    font-weight: 700;
    color: var(--culoare-contur);
  }
}
```

**Ce face**: Pe ecrane sub 600px, tabelul se transformă din format orizontal în format vertical: fiecare celulă devine o linie care arată eticheta (din `data-label`) în stânga și valoarea în dreapta. Astfel tabelul rămâne lizibil pe telefon fără scroll orizontal.

---

### 3.7 Efect Duotone — 0.05p [CERINȚĂ INDIVIDUALĂ] (Liniile 142-173)

```scss
.duotone-wrapper img {
  filter: grayscale(100%);           // convertim imaginea la alb-negru
  mix-blend-mode: luminosity;        // folosim doar luminozitatea imaginii
}
.duotone-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;                          // overlay pe toată imaginea
  background: linear-gradient(
    135deg,
    rgba(15, 28, 39, 0.85) 0%,       // albastru închis SteelVector
    rgba(249, 155, 65, 0.75) 100%    // portocaliu brand SteelVector
  );
  mix-blend-mode: color;             // aplicăm culorile gradientului peste luminozitatea imaginii
}
```

**Cum funcționează duotone**: 
1. Imaginea este convertită la grayscale (`filter: grayscale(100%)`) → rămân doar valorile de luminozitate
2. Se aplică `mix-blend-mode: luminosity` pe imagine → browserul ia doar informatia de luminozitate
3. Overlay-ul (`::after`) are un gradient cu culorile brand SteelVector și `mix-blend-mode: color` → browserul combină culorile gradientului cu luminozitatea imaginii
4. Rezultat: imagine bicoloră (duotone) în nuanțe de albastru-închis și portocaliu

**Unde e demonstrat**: [despre.ejs:74-92](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L74-L92) — 3 imagini cu duotone.

---

### 3.8 Reflexie Text — 0.15p [CERINȚĂ INDIVIDUALĂ] (Liniile 175-210)

```scss
.reflexie-text {
  position: relative;
  display: inline-block;
  color: var(--culoare-titlu);
  margin: 4.5rem 3rem 6rem 3rem; // Margini generoase pe toate laturile pentru a preveni coliziunea textului rotit cu cel de sus/jos
  z-index: 1;
  transform: rotate(-45deg); // Rotit la un unghi de -45 de grade pentru a asigura un aspect oblic premium conform cerintei

  &::after {
    content: attr(data-text);    // Linia 185 — ia textul din atributul data-text al elementului HTML
    position: absolute;
    top: calc(100% + 4px);       // Linia 187 — poziționat sub text cu un gap premium de 4px
    left: 0;
    width: 100%;
    transform: scaleY(-1) translateY(-100%); // Linia 190 — OGLINDIT vertical și transpus corect în jos
    transform-origin: top;       // Linia 191 — origine de transformare la marginea de sus
    color: inherit;
    opacity: 0.75;               // Linia 193 — vizibilă clar și discret înainte de hover
    filter: blur(1.5px);         // Linia 194 — blurată fin pentru un efect realist de reflexie pe sticlă
    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.6s ease, opacity 0.6s ease; // Linia 195 — tranziție fluidă
    pointer-events: none;
    z-index: 10;                 // Pus în față pentru vizibilitate maximă peste fundal

    // Gradient cu un portocaliu brand de mare contrast (#ff8c00) care se atenuează discret spre bază
    background: linear-gradient(to bottom, #ff8c00 0%, rgba(249, 155, 65, 0.4) 60%, rgba(249, 155, 65, 0) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &:hover::after {
    transform: scaleY(-1.8) translateY(-100%); // Linia 206 — se alungește spectaculos (exclusiv în jos) la hover
    opacity: 0.95;                              // Linia 207 — devine mai intensă la hover
    filter: blur(0.75px) drop-shadow(0px 0px 10px rgba(249, 155, 65, 0.9)); // Linia 208 — devine mai clară și luminează printr-un drop-shadow
  }
}
```

**Cum funcționează și cum rezolvă bug-urile de suprapunere**:
1. **`content: attr(data-text)`** — pseudo-elementul `::after` preia exact textul din atributul HTML `data-text` al elementului principal.
2. **Text Oblic la un unghi de 45 de grade**: Părintele `.reflexie-text` primește proprietatea `transform: rotate(-45deg)` care rotește întregul element (și implicit pseudo-elementul său copil) la un unghi de -45 de grade, făcând întregul scris oblic în mod dinamic și premium. Deoarece ambele sunt rotite în același sistem de coordonate, reflexia rămâne perfect centrată și aliniată la baza textului rotit! Am adăugat margini generoase (`margin: 4.5rem 3rem 6rem 3rem`) pentru a ne asigura că scrisul oblic nu interferează cu elementele din jur.
3. **Eliminarea suprapunerii (Bug-ul din Etapa anterioară)**: În versiunile anterioare, simpla folosire a `transform: scaleY(-1)` combinată cu `top: 100%` și `transform-origin: top` cauza oglindirea textului *în sus*, ducând la suprapunerea textului reflectat direct peste cel principal. Prin utilizarea formulei matematice perfecte `scaleY(-1) translateY(-100%)` aplicată pseudo-elementului copil, acesta este oglindit pe axa Y și transpus în jos exact cu înălțimea sa. Astfel, marginea sa de sus (originea transformării) rămâne lipită de baza textului real (cu un gap de 4px) și se alungește exclusiv *în jos* la hover (`scaleY(-1.8)`), eliminând complet suprapunerea.
4. **Contrast sporit și Cromatică premium**: Pentru a asigura o lizibilitate de excepție dinainte de hover pe fundalul întunecat industrial (eliminând blenduirea excesivă raportată anterior), reflexia are `opacity: 0.75` ca stare inițială, un blur de `1.5px` pentru realism, și un gradient premium ce pleacă de la un portocaliu intens solid (`#ff8c00` la `0%`), trecând prin `rgba(249, 155, 65, 0.4)` și stingându-se discret în totală transparență abia la `100%`.
5. **Tranziție fluidă și Glow pe Hover**: La hover, reflexia se alungește elegant (`scaleY(-1.8)`), devine mai clară (`blur(0.75px)`) și mai luminoasă (`opacity: 0.95`), primind de asemenea un efect de strălucire vibrant printr-un `drop-shadow` portocaliu cu rază de `10px`.

**HTML necesar** ([despre.ejs:101](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L101)):
```html
<h1 class="reflexie-text" data-text="SteelVector">SteelVector</h1>
```

---

### 3.9 Video ca Background — 0.05p (Liniile 212-271)

Implementează o secțiune cu un video care rulează în fundal conform tehnicii CSS-Tricks:
- `#video-bg-section video.video-bg` — video-ul este `position: absolute`, centrat cu `translate(-50%, -50%)` și acoperă tot container-ul
- `.video-bg-overlay` — gradient semi-transparent peste video
- `.video-bg-content` — conținutul text centrat cu `z-index: 2`

---

## 4. Galerie Statică

### Datele (galerie.json)

**Fișier**: [galerie.json](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/json/galerie.json) (131 linii, 15 imagini)

Fiecare imagine are:
```json
{
  "cale_relativa": "Depozit-produse-metalurgice.jpg",
  "nume": "Depozit produse metalurgice",
  "descriere": "Depozit cu profile metalice",
  "alt": "Depozit cu profile metalice",
  "timp": "zi",                    // "dimineata" | "zi" | "noapte"
  "galerie-animata": true,         // dacă participă la galeria dinamică
  "atribuire": { ... }             // opțional — date CC-BY
}
```

### Încărcarea datelor pe server

**`verificaGalerieJSON()`** — [index.js:235-283](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L235-L283)
- Verifică existența fișierului `galerie.json` pe disc
- Validează JSON-ul (parsare, existența vectorului `imagini`, existența folderului `cale_galerie`)
- Verifică existența fizică a fiecărui fișier imagine pe disc

**`initGalerie()`** — [index.js:285-303](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L285-L303)
- Citește `galerie.json` și salvează datele în `obGlobal.obGalerie`
- Normalizează `cale_galerie` într-o cale URL (cu `/`)
- Apelează `pregatesteGalerie()` pentru a genera versiunile redimensionate

### Generarea versiunilor de imagine

**`genereazaVersiuniImagine(caleOriginala)`** — [index.js:322-337](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L322-L337)
- Folosește pachetul `sharp` pentru a genera:
  - `_sm` — versiune mică (150px lățime) pentru mobil
  - `_md` — versiune medie (250px lățime) pentru tabletă
- Nu regenerează dacă fișierele există deja

**`pregatesteGalerie(imagini, caleGalerieDisc)`** — [index.js:339-351](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L339-L351)
- Iterează prin toate imaginile și apelează `genereazaVersiuniImagine` pentru fiecare

### Filtrarea pe interval orar

**`determinaTimpCurent(req)`** — [index.js:305-320](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L305-L320)
```
Ora 5-11  → "dimineata"
Ora 12-19 → "zi"
Ora 20-4  → "noapte"
```
**Override**: parametrul query `?ora=X` permite testarea (de ex. `/despre?ora=22` afișează imaginile de noapte).

### Număr multiplu de 3

**[index.js:534-535](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L534-L535)** (homepage) și **[index.js:560-561](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L560-L561)** (despre):
```js
const multiplu = Math.floor(imaginiFiltrate.length / 3) * 3;
const imaginiStatic = imaginiFiltrate.slice(0, multiplu);
```
Dacă sunt 4 imagini filtrate → `Math.floor(4/3)*3 = 3` → se afișează doar 3.
Dacă sunt 7 → `Math.floor(7/3)*3 = 6` → se afișează 6.

### Fragmentul EJS

**Fișier**: [galerie.ejs (fragment)](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/fragmente/galerie.ejs) (25 linii)

- Folosește `<picture>` cu `<source>` media queries pentru responsive:
  - `(max-width: 767px)` → `_sm` (linia 12)
  - `(max-width: 1099px)` → `_md` (linia 13)
  - Default → imaginea originală (linia 14)
- Counter CSS: fiecare `<figure class="galerie-item">` incrementează counter-ul → A, B, C...
- Afișează atribuirea CC-BY dacă există (liniile 18-20)

### Stiluri Galerie Statică

**Fișier**: [galerie.scss](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/galerie.scss) (91 linii)

| Breakpoint | Layout | Linii |
|:---|:---|:---|
| **< 860px** (mic) | 1 coloană | 84-89 |
| **860–1219px** (mediu) | Grid 4 coloane — **Checkerboard** | 56-73 |
| **≥ 1220px** (mare) | Grid 3 coloane uniforme | 76-82 |

**Checkerboard-ul** (ecran mediu):
```scss
grid-template-columns: repeat(4, 1fr);     // 4 coloane egale
.galerie-item:nth-child(3n + 1) { grid-column: 1 / 3; }   // prima din grup: stânga
.galerie-item:nth-child(3n + 2) { grid-column: 3 / 5; }   // a doua din grup: dreapta
.galerie-item:nth-child(3n)     { grid-column: 2 / 4; }   // a treia din grup: centru
```

Imaginile se aranjează în grupuri de 3:
```
[  █████  |  ░░░░░  |  █████  |  ░░░░░  ]   ← img 1 (col 1-2)    + img 2 (col 3-4)
[  ░░░░░  |  █████  |  █████  |  ░░░░░  ]   ← img 3 (col 2-3, centru)
[  █████  |  ░░░░░  |  █████  |  ░░░░░  ]   ← img 4 (col 1-2)    + img 5 (col 3-4)
[  ░░░░░  |  █████  |  █████  |  ░░░░░  ]   ← img 6 (col 2-3, centru)
```

**Hover pe imagine** (liniile 32-35):
```scss
.galerie-item:hover img {
  transform: rotate(360deg) scale(1.5);    // rotație completă + zoom 50%
  border-radius: 12px;                     // colțuri rotunjite
}
```

---

## 5. Galerie Dinamică (Animată)

### Pregătirea datelor — [index.js:566-573](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L566-L573)

```js
const eligibile = (obGalerie.imagini || []).filter((img) => img["galerie-animata"] === true);
const optiuni = [9, 12, 15];
const n = optiuni[Math.floor(Math.random() * optiuni.length)];   // aleator: 9, 12 sau 15
const imaginiDinamice = eligibile.slice(0, Math.min(n, eligibile.length));
```

**Ce face**: La fiecare request pe `/despre`, se alege aleator un set de 9, 12 sau 15 imagini care au `"galerie-animata": true` în JSON.

### Structura HTML — [despre.ejs:56-70](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs#L56-L70)

```html
<div class="galerie-animata-wrapper">          ← container centrat
  <div class="galerie-animata-grid">           ← viewport 280×280 cu overflow:hidden
    <div class="galerie-animata-inner">        ← grid ascuns 3×N cu animația
      <div class="galerie-animata-item">       ← fiecare celulă cu imagine 280×280
        <img src="..." alt="...">
      </div>
      <!-- ... repetă pentru fiecare imagine ... -->
    </div>
  </div>
</div>
```

### Cum funcționează vizual

Viewport-ul afișează **o singură celulă de 280×280**. Grid-ul intern este mult mai mare (de ex. 840×1400 pentru 15 imagini). Animația CSS `slideGalerie` mutează grid-ul prin `translate()` astfel încât diferite celule apar în viewport.

**Pauză la hover**: `animation-play-state: paused` oprește animația când treci mouse-ul pe galerie.

**Ascundere pe ecran mic**: `display: none` sub 1100px (media query din SCSS generat).

---

## 6. Bonusuri Implementate

### Bonus 1: Galerie Animată — 0.50p

Descrisă complet la secțiunea 5. Puncte cheie:
- SCSS generat dinamic pe server ([index.js:353-459](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L353-L459))
- Compilare prin `compileazaScss()` la fiecare request pe `/despre` ([index.js:573](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L573))
- Animație secvențială: glisare apoi rotație
- Nr. aleator de imagini (9/12/15)
- Pauză la hover

### Bonus 3: Backup cu Timestamp — 0.05p

- Fișierul CSS vechi e copiat în `backup/resurse/css/` cu formatul `${numeCss}_${Date.now()}.css`
- [scss-compiler.js:25-43](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/lib/scss-compiler.js#L25-L43)
- Exemplu: `galerie_1779691414581.css`

### Bonus 4: Fișiere SCSS cu Puncte în Nume — 0.025p

- `path.parse(scssAbsPath).name` (nu `basename(...).split('.')[0]`)
- [scss-compiler.js:19](file:///home/bogdan/VScode_Projects/facultate/proiect-tw/SteelVector/lib/scss-compiler.js#L19)
- Exemplu: `stil.frumos.scss` → `stil.frumos.css` (nu `stil.css`)

### Bonus 5: Validare JSON Galerie — 0.05p

- `verificaGalerieJSON()` verifică:
  - Existența fișierului pe disc
  - Validitatea JSON-ului
  - Existența folderului din `cale_galerie`
  - Existența fiecărui fișier imagine
- [index.js:235-283](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L235-L283)

### Bonus Extra: Override Timp (`?ora=X`)

- Parametrul query `?ora=X` pe rutele `/` și `/despre` permite testarea galeriei la orice oră
- [index.js:305-320](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L305-L320)
- Exemplu: `http://localhost:8080/despre?ora=3` → afișează imaginile de noapte

---

## Fișierul overrides.scss

**Fișier**: [overrides.scss](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/overrides.scss) (128 linii)

Acest fișier se importă DUPĂ Bootstrap (în `custom.scss` linia 128) și anulează interferențele Bootstrap cu stilurile originale ale site-ului:

| Ce suprascriem | Linii | Motiv |
|:---|:---|:---|
| `nav` padding/box-model | 8-14 | Bootstrap schimbă padding-ul pe nav |
| `nav a` color/decoration | 23-26 | Bootstrap colorează link-urile altfel |
| `main` background | 29-31 | Bootstrap setează un fundal pe main |
| `table` border-collapse | 34-36 | Bootstrap schimbă collapse-ul |
| `img/video/iframe` max-width | 46-52 | Bootstrap setează `max-width: 100%` |
| `h1-h6` color | 55-58 | Bootstrap recolorează heading-urile |
| `main a` color | 68-75 | Bootstrap schimbă culorile link-urilor |
| `main ul` list-style | 79-82 | Bootstrap elimină bullet-urile |
| `blockquote` border-left | 90-92 | Bootstrap stilizează diferit blockquote |
| `hr:not(.metal)` | 124-127 | Bootstrap setează `opacity` pe `<hr>` |