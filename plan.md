# Plan de Implementare — Etapa 5
## SCSS Automat · Bootstrap Custom · Efecte CSS · Galerie Statică & Animată

---

## Sumar punctaj

| Cerință | Punctaj | Prioritate |
|---|---|---|
| Galerie statică (cerință individuală) | 0.35p | 🔴 Maximă |
| Compilare automată SCSS | 0.25p | 🟠 Ridicată |
| Customizare Bootstrap | 0.25p | 🟠 Ridicată |
| Efecte CSS | 0.25p | 🟡 Medie |
| Bonus 1 — Galerie animată | 0.5p | 🟢 Opțional |
| Bonus 3 — Timestamp backup | 0.05p | 🟢 Opțional |
| Bonus 4 — Fișiere cu puncte în nume | 0.025p | 🟢 Opțional |
| Bonus 5 — Validare JSON galerie | 0.05p | 🟢 Opțional |

---

---

## 1. Compilare automată SCSS — 0.25p

### 1.1 Cadru de lucru (`index.js`)

Definește **imediat după `require`-uri**, înainte de orice altă logică:

```js
global.folderScss = path.join(__dirname, 'resurse', 'scss');
global.folderCss  = path.join(__dirname, 'resurse', 'css');
```

La crearea automată a folderelor la pornire (acolo unde creezi `temp`), adaugă și:

```js
path.join(__dirname, 'backup', 'resurse', 'css')
```

Folosind `fs.mkdirSync(..., { recursive: true })` — nu opri execuția dacă folderul există deja.

---

### 1.2 Modul `lib/scss-compiler.js` — funcția `compileazaScss`

**Semnătură:** `async function compileazaScss(caleScss, caleCss)`

**Logică pas cu pas:**

**Pasul 1 — Rezolvă căile:**
```
- dacă caleScss este relativă → path.join(global.folderScss, caleScss)
- dacă caleCss lipsește sau e null/undefined →
    → extrage corect numele fișierului SCSS (Bonus 4: folosește path.extname() + path.basename(file, ext)
       pentru a gestiona corect fișiere de tip "stil.frumos.scss" → "stil.frumos.css")
    → construiește calea output în global.folderCss cu extensia .css
- dacă caleCss este relativă → path.join(global.folderCss, caleCss)
```

**Bonus 4 — implementare corectă a numelui cu puncte multiple:**
```js
// GREȘIT (nu funcționează pentru "stil.frumos.scss"):
const numeCss = numeScss.replace('.scss', '.css');

// CORECT:
const ext = path.extname(caleScss);           // → ".scss"
const bazaNume = path.basename(caleScss, ext); // → "stil.frumos"
const numeCss = bazaNume + '.css';             // → "stil.frumos.css"
```

**Pasul 2 — Backup fișier CSS existent:**
```
- verifică dacă fișierul CSS de output există deja (fs.existsSync)
- dacă da:
    - construiește calea de backup:
      path.join(__dirname, 'backup', 'resurse', 'css', numeCssBackup)
    - Bonus 3: numeCssBackup = bazaNume + '_' + Date.now() + '.css'
      (ex: "custom_1681124489791.css")
    - fără Bonus 3: numeCssBackup = numeCss (suprascrie backup-ul anterior)
    - creează directoarele intermediare: fs.mkdirSync(dirBackup, { recursive: true })
    - copiază: fs.copyFileSync(caleCaleCss, caleBackup)
    - dacă copierea eșuează (try/catch): console.error('[SCSS Backup] Eroare la copierea...')
      → continuă compilarea chiar și dacă backup-ul eșuează
```

**Pasul 3 — Compilare SCSS → CSS:**
```js
const sass = require('sass');
const result = await sass.compileAsync(caleScssRezolvata);
await fs.promises.writeFile(caleCssRezolvata, result.css);
console.log(`[SCSS] Compilat: ${path.basename(caleScss)} → ${path.basename(caleCss)}`);
```

**Pasul 4 — Tratare erori:**
```
- învelește totul în try/catch
- la eroare: console.error('[SCSS Eroare]', err.message) și nu propaga eroarea
  (serverul nu trebuie să crape dacă un SCSS are eroare de sintaxă)
```

**Exportă:**
```js
module.exports = { compileazaScss };
```

---

### 1.3 Compilare inițială la pornire

În `index.js`, **după definirea global vars și crearea folderelor**, înainte de `app.listen()`:

```js
const { compileazaScss } = require('./lib/scss-compiler');

async function compilareInitiala() {
  const fisiere = fs.readdirSync(global.folderScss)
    .filter(f => f.endsWith('.scss'));

  for (const fisier of fisiere) {
    await compileazaScss(fisier); // cale relativă → se rezolvă în funcție
  }
  console.log('[SCSS] Compilare inițială completă.');
}

compilareInitiala();
```

> **Notă:** Dacă folderul SCSS are subfoldere, folosește o funcție recursivă sau `fs.readdirSync` cu `{ recursive: true }` (Node 18+).

---

### 1.4 Watcher pentru compilare pe parcurs

În `lib/scss-compiler.js` sau `index.js`:

```js
const debounceTimers = {};

fs.watch(global.folderScss, { recursive: true }, (eventType, filename) => {
  if (!filename || !filename.endsWith('.scss')) return;

  // Debounce per fișier (200ms)
  clearTimeout(debounceTimers[filename]);
  debounceTimers[filename] = setTimeout(async () => {
    console.log(`[SCSS Watcher] Modificat: ${filename}`);
    await compileazaScss(filename);
  }, 200);
});
```

**Comportament așteptat la watcher:**
- Detectează `change` și `rename` pe orice `.scss`
- Debounce 200ms previne recompilări duble la o singură salvare
- Log clar pentru fiecare recompilare (succes și eroare)
- Backup se face automat (logica e deja în `compileazaScss`)

---

---

## 2. Customizare Bootstrap — 0.25p

### 2.1 Fișier `resurse/scss/custom.scss`

**Structura obligatorie:**

```scss
// =============================================
// PASUL 1: Variabile Bootstrap — înainte de @import!
// =============================================

// --- Culori background pentru 2 teme ---
$body-bg:           #[culoare-tema-1];
$body-color:        #[culoare-litere-tema-1];

// Tema 2 (aplicată pe o clasă sau secțiune specifică, ex: .tema-dark)
$dark-bg:           #[culoare-tema-2];

// --- Culori font ---
$link-color:        #[culoare];
$btn-color:         #[culoare]; // sau variabilă componentă

// --- Breakpoints diferite pentru md și lg ---
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 900px,   // ← DIFERIT față de Bootstrap default (768px)
  lg: 1100px,  // ← DIFERIT față de Bootstrap default (992px)
  xl: 1400px
);

// --- Border radius ---
$border-radius:     0.5rem;   // default Bootstrap: 0.375rem
$border-radius-lg:  1rem;

// --- Dimensiuni headinguri ---
$h1-font-size:      2.5rem;
$h2-font-size:      2rem;
$h3-font-size:      1.6rem;
$h4-font-size:      1.3rem;
$h5-font-size:      1.1rem;
$h6-font-size:      0.95rem;

// --- Font family ---
$font-family-base:  'Nunito', sans-serif; // sau alt font ales de voi

// --- Variabile suplimentare (minim 1) ---
$container-max-widths: (
  sm: 540px,
  md: 820px,
  lg: 1020px,
  xl: 1280px,
  xxl: 1480px
);

// =============================================
// PASUL 2: Import Bootstrap (după variabile!)
// =============================================
@import '../../node_modules/bootstrap/scss/bootstrap';

// =============================================
// PASUL 3: Override-uri site (după Bootstrap!)
// =============================================
@import 'overrides';

// =============================================
// PASUL 4: Efecte CSS
// =============================================
@import 'effects';
```

### 2.2 Elemente Bootstrap pentru demonstrare (cerință obligatorie)

Trebuie să folosești în pagini **minim 2-3 componente Bootstrap** care să demonstreze vizibil customizarea. Exemple recomandate:

- `.btn.btn-primary` — culoare custom, border-radius custom
- `.card` — background color custom, shadow
- `.navbar` — culoare, font
- `.badge` — schema cromatică
- `.accordion` — border-radius

Asigură-te că aceste componente sunt **vizibile în pagini existente** (nu doar adăugate și ascunse).

### 2.3 Fișier `resurse/scss/overrides.scss` — Corectare Bootstrap (pas critic!)

Bootstrap resetează multe stiluri implicite. Creează `overrides.scss` importat după Bootstrap în `custom.scss`.

Identifică elementele afectate în site-ul tău și rescrie regulile. Tipice:

```scss
// Exemplu de overrides — adaptează la site-ul tău:

// Nav / Header (Bootstrap poate reseta padding, background)
nav, header {
  // rescrie stilurile originale ale site-ului
}

// Imagini (Bootstrap adaugă max-width: 100%)
img.logo { /* stilul original */ }

// Butoane custom (dacă ai butoane non-Bootstrap stilizate)
.buton-custom { /* stilul original */ }

// Tabele (Bootstrap adaugă stiluri proprii)
table.tabel-site { /* stilul original */ }
```

**Ordinea obligatorie a `<link>`-urilor în template-ul EJS:**
```html
<link rel="stylesheet" href="/resurse/css/custom.css"> <!-- Bootstrap compilat + variabile -->
<link rel="stylesheet" href="/resurse/css/general.css"> <!-- stiluri site (suprascriu Bootstrap) -->
```

### 2.4 Compilare `custom.scss`

La pornire și la modificare, `custom.scss` este compilat automat prin `compileazaScss('custom.scss')` — mecanismul de compilare inițială și watcher de la punctul 1 se ocupă de asta fără cod suplimentar.

---

---

## 3. Efecte CSS — 0.25p

Toate efectele se implementează în `resurse/scss/effects.scss`, importat în `custom.scss`.

### 3.1 (0.1p) Stilizare `hr` — `efect-css-stilizare-hr` ⚠️ CERINȚĂ INDIVIDUALĂ

**Cerința vizuală (conform imaginii furnizate):**
- `hr`-ul arată ca o bară îngustă, cu gradient liniar repetitiv (nu culoare solidă)
- Colțurile sunt rotunjite (`border-radius`)
- **Nu folosi culorile din imaginea exemplu** — folosește culorile din schema ta cromatică
- Dimensiunile sunt la alegerea ta (atât timp cât sunt vizibile)

**Indicație de implementare:**
```scss
hr {
  height: 6px;           // sau altă valoare vizibilă
  border: none;
  border-radius: 3px;    // colțuri rotunjite
  background: repeating-linear-gradient(
    90deg,
    $culoare-primara 0px,
    $culoare-secundara 20px,
    $culoare-primara 40px  // repetitiv
  );
  opacity: 1;            // override Bootstrap care pune opacity: 0.25
}
```

Plasare: adaugă `<hr>` între secțiuni pe paginile relevante (ex: `index.ejs`, `despre.ejs`).

---

### 3.2 (0.05p) Background fix + imagine schimbătoare

```scss
.sectiune-background-fix {
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  animation: schimbaBackground 15s infinite; // t = 15s (alege tu)
}

@keyframes schimbaBackground {
  0%   { background-image: url('/resurse/imagini/bg1.jpg'); }
  33%  { background-image: url('/resurse/imagini/bg2.jpg'); }
  66%  { background-image: url('/resurse/imagini/bg3.jpg'); }
  100% { background-image: url('/resurse/imagini/bg1.jpg'); }
}
```

> **Alternativă mai bună (browser support):** Folosește pseudo-elemente cu `opacity` animation în loc de `background-image` animation (tranziția între imagini e mai fluidă):
> ```scss
> .bg-fix { position: relative; overflow: hidden; }
> .bg-fix::before, .bg-fix::after {
>   content: '';
>   position: absolute; inset: 0;
>   background-attachment: fixed;
>   background-size: cover;
>   animation: fadeBg 15s infinite;
> }
> .bg-fix::before { background-image: url('...bg1.jpg'); }
> .bg-fix::after  { background-image: url('...bg2.jpg'); animation-delay: 7.5s; }
> ```

---

### 3.3 (0.025p) `::selection` custom

```scss
// Folosește variabilele din schema cromatică:
::selection {
  background-color: $culoare-primara;  // minim 2 proprietăți
  color: $culoare-contrast;
  // opțional: text-shadow, opacity
}
```

---

### 3.4 (0.025p) `column-count` cu `column-rule`

```scss
.sectiune-coloane {
  // Ecran mic și mediu: o singură coloană
  column-count: 1;

  // Ecran large:
  @media (min-width: map-get($grid-breakpoints, 'lg')) {
    column-count: 3;
    column-gap: 2rem;
    column-rule: 2px solid $culoare-primara;
  }
}
```

Aplică pe o secțiune cu text lung (ex: un paragraf de `despre.ejs`).

---

### 3.5 (0.05p) Text animat orizontal (keyframes)

```scss
.text-animat-container {
  overflow: hidden;   // fără scrollbar orizontal pe pagină!
  width: 100%;
  white-space: nowrap;
}

.text-animat {
  display: inline-block;
  animation: defilarText 12s linear infinite;
}

@keyframes defilarText {
  0%   { transform: translateX(100vw); }
  100% { transform: translateX(-100%); }
}
```

> **Responsivitate:** Datorită `overflow: hidden` pe container și `100vw`/`100%` în animație, nu apare scrollbar orizontal.

---

### 3.6 (0.1p) Efect Duotone — `efect-css-duotone` ⚠️ CERINȚĂ INDIVIDUALĂ

**Descriere:** Un `div` cu `background-image` pe care se aplică efectul duotone (două culori c1, c2). La hover, trece treptat la un duotone cu alte două culori (c3, c4). Efectul se realizează cu `::before`, `::after` și `mix-blend-mode`.

**Implementare:**

```scss
$duotone-c1: #culoare1;  // ex: albastru închis
$duotone-c2: #culoare2;  // ex: portocaliu
$duotone-c3: #culoare3;  // hover culoare 1
$duotone-c4: #culoare4;  // hover culoare 2

.duotone-img {
  position: relative;
  display: inline-block;
  overflow: hidden;
  // background-image setat în HTML via style sau în SCSS direct

  // Imaginea de bază în grayscale:
  > img, &[style] {
    filter: grayscale(100%);
    display: block;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: $duotone-c1;
    mix-blend-mode: multiply;
    transition: background-color 0.8s ease;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: $duotone-c2;
    mix-blend-mode: screen;
    transition: background-color 0.8s ease;
    z-index: 2;
  }

  &:hover::before { background-color: $duotone-c3; }
  &:hover::after  { background-color: $duotone-c4; }
}
```

**HTML corespunzător:**
```html
<div class="duotone-img" style="background-image: url('/resurse/imagini/foto.jpg'); width: 400px; height: 300px; background-size: cover;">
</div>
```

> **Notă:** `mix-blend-mode: multiply` funcționează pe fundaluri ne-albe. Dacă fundalul paginii este deschis, adaugă un fundal negru intermediar sau testează cu `mix-blend-mode: color`.

---

### 3.7 (0.15p) Reflexie text — `efect-css-reflexie-text` ⚠️ CERINȚĂ INDIVIDUALĂ

**Descriere:** Un heading pe care se aplică reflexia prin dublarea elementului (metodă portabilă). Reflexia este:
- Ușor blurată (`filter: blur()`)
- La hover, reflexia se **alungește** (observat în videoclip)

**Implementare (metodă portabilă prin duplicare element):**

```html
<!-- EJS / HTML -->
<div class="container-reflexie">
  <h2 class="text-reflexie">Titlul Paginii</h2>
  <div class="reflexie" aria-hidden="true">Titlul Paginii</div>
</div>
```

```scss
.container-reflexie {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.text-reflexie {
  margin-bottom: 0;
  position: relative;
  z-index: 1;
  transition: transform 0.4s ease;
}

.reflexie {
  transform: scaleY(-1);
  filter: blur(2px);
  opacity: 0.4;
  transform-origin: top center;
  height: 40px;      // înălțimea vizibilă a reflexiei (initial)
  overflow: hidden;
  transition: height 0.4s ease, filter 0.4s ease, opacity 0.4s ease;

  // Gradient care "estompează" reflexia de jos
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
}

// La hover pe container: reflexia se alungește
.container-reflexie:hover .reflexie {
  height: 80px;      // alungire la hover
  filter: blur(4px);
  opacity: 0.25;
}
```

> **Alternativă JS pentru sincronizare text:** Dacă textul reflexiei trebuie generat dinamic (ex: titlu venind din server), adaugă în EJS sau client-side JS: `document.querySelector('.reflexie').textContent = document.querySelector('.text-reflexie').textContent;`

---

---

## 4. Galerie statică — 0.35p ⚠️ CERINȚĂ INDIVIDUALĂ (necesită prezentare)

### 4.1 Structura JSON — `resurse/json/galerie.json`

```json
{
  "cale_galerie": "resurse/imagini/galerie",
  "imagini": [
    {
      "cale_relativa": "plaja.jpg",
      "nume": "Plajă la apus",
      "descriere": "O plajă liniștită în lumina apusului",
      "timp": "seara",
      "alt": "Plajă cu nisip auriu la apus de soare",
      "galerie-animata": true,
      "atribuire": {
        "autor": "Nume Fotograf",
        "sursa": "https://unsplash.com/...",
        "licenta": "CC-BY 2.0"
      }
    },
    {
      "cale_relativa": "padure.jpg",
      "nume": "Pădure de brad",
      "descriere": "Lumina dimineții prin copaci",
      "timp": "dimineata",
      "alt": "Pădure de brazi cu lumină filtrată",
      "galerie-animata": true
    }
    // ... minim 6 imagini cu timp: "dimineata"/"zi"/"noapte"
    // și suficiente imagini cu galerie-animata: true (minim 15 pentru bonus)
  ]
}
```

**Reguli JSON:**
- `timp` acceptă: `"dimineata"` (5:00–12:00), `"zi"` (12:00–20:00), `"noapte"` (20:00–5:00)
- `alt` este opțional — dacă lipsește, se folosește `nume`
- `atribuire` este opțional — obligatoriu pentru minim 1 imagine CC-BY
- `galerie-animata: true` marchează imaginile pentru Bonus 1

---

### 4.2 Bonus 5 — Funcție de validare JSON

Creează funcție `valideazaGalerieJson(json)` apelată la pornire:

```js
const fs = require('fs');
const path = require('path');

function valideazaGalerieJson(json) {
  let erori = 0;

  // Verificare 1 (0.025p): folderul cale_galerie există?
  const caleGalerie = path.join(__dirname, json.cale_galerie);
  if (!fs.existsSync(caleGalerie)) {
    console.error(
      `[Galerie JSON] EROARE: Folderul specificat în "cale_galerie" nu există pe disc!\n` +
      `  Cale așteptată: ${caleGalerie}\n` +
      `  Verificați proprietatea "cale_galerie" din galerie.json`
    );
    erori++;
  }

  // Verificare 2 (0.025p): fiecare fișier imagine există?
  if (json.imagini && Array.isArray(json.imagini)) {
    for (const img of json.imagini) {
      const caleFisier = path.join(caleGalerie, img.cale_relativa);
      if (!fs.existsSync(caleFisier)) {
        console.error(
          `[Galerie JSON] EROARE: Fișierul imagine lipsește din sistemul de fișiere!\n` +
          `  Fișier: "${img.cale_relativa}"\n` +
          `  Cale completă așteptată: ${caleFisier}\n` +
          `  Imaginea este listată în JSON dar nu există pe disc.`
        );
        erori++;
      }
    }
  }

  if (erori === 0) {
    console.log('[Galerie JSON] Validare completă — toate fișierele sunt prezente.');
  } else {
    console.error(`[Galerie JSON] Validare finalizată cu ${erori} eroare(i). Remediați înainte de prezentare!`);
  }
}

// La pornire:
const galerieJson = JSON.parse(fs.readFileSync('./resurse/json/galerie.json', 'utf8'));
valideazaGalerieJson(galerieJson);
```

---

### 4.3 Generare imagini responsive cu `sharp`

La cererea paginii de galerie (sau la pornire), generează versiuni reduse pentru ecran mediu și mic:

```js
const sharp = require('sharp');

async function genereazaVersioniImagine(caleOriginala, numeBase) {
  const dirOut = path.dirname(caleOriginala);

  const versiuni = [
    { sufix: '_md', latime: 250 },
    { sufix: '_sm', latime: 150 },
  ];

  for (const v of versiuni) {
    const caleOut = path.join(dirOut, numeBase + v.sufix + path.extname(caleOriginala));
    if (!fs.existsSync(caleOut)) {
      await sharp(caleOriginala)
        .resize({ width: v.latime })
        .toFile(caleOut);
    }
  }
}
```

Apelează această funcție pentru fiecare imagine din JSON la cererea rutei `/galerie`.

---

### 4.4 Route în `index.js`

```js
app.get('/galerie', async (req, res) => {
  const galerieJson = JSON.parse(
    fs.readFileSync('./resurse/json/galerie.json', 'utf8')
  );

  // Determină intervalul de timp curent
  const ora = new Date().getHours(); // ← pentru testare, schimbă cu o valoare fixă
  let timpCurent;
  if (ora >= 5 && ora < 12)       timpCurent = 'dimineata';
  else if (ora >= 12 && ora < 20) timpCurent = 'zi';
  else                             timpCurent = 'noapte';

  // Filtrare imagini după timp
  let imaginiFiltrate = galerieJson.imagini
    .filter(img => img.timp === timpCurent);

  // Trunchiere la multiplu de 3 (minim 6)
  const numar = Math.floor(imaginiFiltrate.length / 3) * 3;
  imaginiFiltrate = imaginiFiltrate.slice(0, Math.max(numar, 6));

  // Generare versiuni responsive
  for (const img of imaginiFiltrate) {
    const caleOriginala = path.join(__dirname, galerieJson.cale_galerie, img.cale_relativa);
    const ext = path.extname(img.cale_relativa);
    const numeBase = path.basename(img.cale_relativa, ext);
    await genereazaVersioniImagine(caleOriginala, numeBase);
  }

  res.render('pagini/galerie', {
    imagini: imaginiFiltrate,
    caleGalerie: '/' + galerieJson.cale_galerie,
    timpCurent
  });
});
```

---

### 4.5 Fragmente EJS

**`views/fragmente/galerie.ejs`** — conține DOAR grila de imagini (fără `<html>`, `<head>` etc.):

```html
<section class="galerie-wrapper">
  <% imagini.forEach((img, index) => {
    const ext = img.cale_relativa.lastIndexOf('.');
    const numeBase = img.cale_relativa.substring(0, ext);
    const extStr = img.cale_relativa.substring(ext);
    const altText = img.alt || img.nume;
  %>
  <figure class="galerie-item">
    <picture>
      <!-- Ecran mic: imagine redusă -->
      <source 
        media="(max-width: 768px)" 
        srcset="<%= caleGalerie %>/<%= numeBase %>_sm<%= extStr %>">
      <!-- Ecran mediu -->
      <source 
        media="(max-width: 1100px)" 
        srcset="<%= caleGalerie %>/<%= numeBase %>_md<%= extStr %>">
      <!-- Ecran mare: originală -->
      <img 
        src="<%= caleGalerie %>/<%= img.cale_relativa %>"
        alt="<%= altText %>"
        title="<%= img.descriere %>"
        loading="lazy">
    </picture>
    <figcaption>
      <span class="index-imagine"></span><!-- indexul A, B, C... via CSS counter -->
      <%= img.descriere %>
      <% if (img.atribuire) { %>
        <small class="atribuire">
          Foto: <a href="<%= img.atribuire.sursa %>" target="_blank"><%= img.atribuire.autor %></a>
          (<%= img.atribuire.licenta %>)
        </small>
      <% } %>
    </figcaption>
  </figure>
  <% }); %>
</section>
```

**`views/pagini/galerie.ejs`** — pagina dedicată:
```html
<!-- layout normal cu header/footer -->
<%- include('../fragmente/galerie', { imagini, caleGalerie, timpCurent }) %>
```

**`views/pagini/index.ejs`** — pagina principală (include același fragment):
```html
<%- include('../fragmente/galerie', { imagini, caleGalerie, timpCurent }) %>
```

> ⚠️ **Nu duplica codul!** Ambele pagini includ **același fragment** `galerie.ejs`.

---

### 4.6 CSS Galerie — `resurse/scss/galerie.scss`

**Counter CSS pentru indexare A, B, C...:**
```scss
.galerie-wrapper {
  counter-reset: galerie-index;
}

.galerie-item {
  counter-increment: galerie-index;
}

.galerie-item .index-imagine::before {
  content: counter(galerie-index, upper-alpha) '. ';
  font-weight: bold;
}
```

**Grid ecran mare (Nx3, fără spații libere):**
```scss
@media (min-width: 1100px) {
  .galerie-wrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    width: 100%;
  }

  .galerie-item {
    // Ordinea specifică (conform imaginii furnizate cu numerele 1,5,6/2,4,3/8,9,7):
    // Imaginile umplu grila column-by-column sau se folosesc grid-area-uri explicite
    // Dacă cerința e simplu Nx3 fără spații, grid auto-flow row e suficient.
  }
}
```

**Grid ecran mediu (pattern cărămidă 2+1 / 1+2 alternant, pe 3 coloane):**

Conform imaginii furnizate — pe ecran mediu, imaginile alternează între:
- Rând impar: primul item ocupă 2 coloane (stânga), al doilea ocupă 1 coloană (dreapta)
- Rând par: primul item ocupă 1 coloană (stânga), al doilea ocupă 2 coloane (dreapta)

```scss
@media (min-width: 768px) and (max-width: 1099px) {
  .galerie-wrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    width: 100%;
  }

  // Pattern alternant: 2col+1col, 1col+2col, 2col+1col...
  .galerie-item:nth-child(4n + 1) { grid-column: span 2; }
  .galerie-item:nth-child(4n + 2) { grid-column: span 1; }
  .galerie-item:nth-child(4n + 3) { grid-column: span 1; }
  .galerie-item:nth-child(4n + 4) { grid-column: span 2; }
}
```

**Grid ecran mic (o coloană):**
```scss
@media (max-width: 767px) {
  .galerie-wrapper {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    width: 100%;
  }
}
```

**Imagini — toate aceeași dimensiune:**
```scss
.galerie-item {
  overflow: hidden;
  margin: 0;

  picture, img {
    display: block;
    width: 100%;
    height: 300px;       // sau aspect-ratio: 1 / 1
    object-fit: cover;
    object-position: center;
  }

  figcaption {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
}
```

**Tranziție la hover (obligatorie):**
```scss
.galerie-item img {
  transition: transform 0.6s ease, border-radius 0.6s ease;
}

.galerie-item:hover img {
  transform: rotate(360deg) scale(1.5);
  border-radius: 12px;
}
```

> **Notă:** `rotate(360deg) scale(1.5)` — rotație rapidă (0.3–1s alege tu) cu mărire 50%.

**Galeria se întinde pe toată lățimea paginii:**
```scss
.galerie-wrapper {
  width: 100%;
  max-width: 100%;
  // Dacă layout-ul are container cu padding, adaugă:
  margin-left: calc(-1 * var(--padding-container));
  margin-right: calc(-1 * var(--padding-container));
}
```

---

---

## 5. Bonus 1 — Galerie animată — `galerie-animata` (0.5p)

### 5.1 Cerința

- Număr aleator de imagini: **9, 12 sau 15** (ales random la fiecare încărcare)
- Imagini din JSON cu `"galerie-animata": true`
- Imagini distincte, primele N din JSON care au proprietatea setată
- Grid ascuns `n × 3` — containerul arată doar o imagine la un moment dat
- Trecerea la următoarea imagine: **rotație centrată pe imaginea curentă + translație** (pe linie sau coloană)
- Animație **cu direcție alternată** (`animation-direction: alternate`)
- Reluare continuă după ultima imagine
- **Pauză la hover** pe galerie
- **Nu se afișează pe ecran mediu și mic**
- Galeria are **`border-image`** cu o imagine aleasă de voi
- CSS-ul **trebuie generat prin Node pe baza SASS** (numărul de imagini afectează CSS-ul)

### 5.2 Route

```js
app.get('/galerie-animata', async (req, res) => {
  const galerieJson = JSON.parse(
    fs.readFileSync('./resurse/json/galerie.json', 'utf8')
  );

  // Selectează imaginile cu galerie-animata: true
  const eligibile = galerieJson.imagini.filter(img => img['galerie-animata'] === true);

  // Număr aleator: 9, 12 sau 15
  const optiuni = [9, 12, 15];
  const n = optiuni[Math.floor(Math.random() * optiuni.length)];
  const imaginiAnimate = eligibile.slice(0, n);

  // Generează SCSS dinamic și compilează
  await genereazaScssGalerieAnimata(n);
  await compileazaScss('galerie-animata.scss');

  res.render('pagini/galerie-animata', {
    imagini: imaginiAnimate,
    caleGalerie: '/' + galerieJson.cale_galerie,
    n
  });
});
```

### 5.3 Generare SCSS dinamic

```js
async function genereazaScssGalerieAnimata(n) {
  const nrRanduri = Math.ceil(n / 3); // rânduri în grid
  const scssContent = `
// Auto-generat la ${new Date().toISOString()} pentru ${n} imagini

.galerie-animata-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(${nrRanduri}, 1fr);
  width: calc(3 * 300px); // sau lățimea unei imagini * 3
  height: 300px;           // o singură imagine vizibilă
  overflow: hidden;
  
  border-image: url('/resurse/imagini/border-galerie.png') 30 round;
  border-width: 8px;
  border-style: solid;

  &:hover .galerie-animata-inner {
    animation-play-state: paused;
  }
}

.galerie-animata-inner {
  display: contents; // imaginile sunt în grid direct
  animation: slideGalerie ${n * 2}s linear infinite alternate;
  // Ajustează durata după numărul de imagini
}

@keyframes slideGalerie {
  // Keyframes generate dinamic în funcție de n
  ${Array.from({ length: n }, (_, i) => {
    const progres = (i / (n - 1)) * 100;
    const rand = Math.floor(i / 3);
    const col = i % 3;
    return `${progres.toFixed(1)}% { transform: translate(-${col * 100}%, -${rand * 100}%) rotate(${i % 2 === 0 ? 0 : 360}deg); }`;
  }).join('\n  ')}
}
`;

  fs.writeFileSync(
    path.join(global.folderScss, 'galerie-animata.scss'),
    scssContent,
    'utf8'
  );
}
```

### 5.4 View `views/pagini/galerie-animata.ejs`

```html
<div class="galerie-animata-wrapper">
  <div class="galerie-animata-grid">
    <div class="galerie-animata-inner">
      <% imagini.forEach(img => { %>
        <div class="galerie-animata-item">
          <img src="<%= caleGalerie %>/<%= img.cale_relativa %>" 
               alt="<%= img.alt || img.nume %>">
        </div>
      <% }); %>
    </div>
  </div>
</div>

<!-- Ascunde galeria animată pe ecran mic și mediu -->
<style>
  @media (max-width: 1099px) {
    .galerie-animata-wrapper { display: none; }
  }
</style>
```

---

---

## 6. Structura fișierelor finale

```
├── index.js                        ← global vars, compilare inițială, watcher, rute
├── lib/
│   └── scss-compiler.js            ← compileazaScss(), watcher, backup logic
├── resurse/
│   ├── scss/
│   │   ├── custom.scss             ← variabile Bootstrap + @import bootstrap
│   │   ├── effects.scss            ← toate efectele CSS (hr, duotone, reflexie, etc.)
│   │   ├── overrides.scss          ← corectare stiluri rupte de Bootstrap
│   │   ├── galerie.scss            ← CSS galerie statică (grid, tranziții)
│   │   └── galerie-animata.scss    ← generat automat de Node (Bonus 1)
│   ├── css/                        ← output compilat (generat automat)
│   │   ├── custom.css
│   │   ├── effects.css
│   │   └── general.css
│   ├── json/
│   │   └── galerie.json
│   └── imagini/
│       └── galerie/                ← imagini originale + versiuni _sm, _md
├── backup/
│   └── resurse/
│       └── css/                    ← backup-uri CSS (create automat)
├── views/
│   ├── fragmente/
│   │   └── galerie.ejs             ← fragmentul reutilizabil (inclus în index + galerie)
│   └── pagini/
│       ├── index.ejs               ← include galerie.ejs
│       ├── galerie.ejs             ← pagina dedicată, include galerie.ejs
│       └── galerie-animata.ejs     ← Bonus 1
└── package.json                    ← dependințe: sass, sharp, express, etc.
```

---

---

## 7. Verificare înainte de prezentare

### Compilare SCSS
- [ ] Pornire server → log "Compilare inițială completă" + mesaje per fișier
- [ ] Modificare `custom.scss` → `custom.css` se regenerează automat (max 200ms)
- [ ] Backup creat în `backup/resurse/css/` cu timestamp (Bonus 3)
- [ ] Fișier `stil.frumos.scss` compilat corect în `stil.frumos.css` (Bonus 4)

### Bootstrap
- [ ] Componente Bootstrap (btn, card, navbar) reflectă variabilele customizate
- [ ] Breakpoint-uri `md` și `lg` sunt diferite față de Bootstrap default
- [ ] Site-ul arată identic cu înainte de Bootstrap (overrides funcționează)
- [ ] `custom.css` este primul `<link>` în `<head>`

### Efecte CSS
- [ ] `hr` arată cu gradient + colțuri rotunjite (culorile tale, nu din exemplu)
- [ ] Duotone: tranziție fluidă c1/c2 → c3/c4 la hover
- [ ] Reflexie: blurată + se alungește la hover
- [ ] Background fix: imaginea se schimbă animat după t secunde
- [ ] `::selection` cu 2 proprietăți custom
- [ ] `column-count`: 1 col pe mic/mediu, >1 pe large
- [ ] Text animat: fără scrollbar orizontal pe nicio dimensiune

### Galerie statică
- [ ] Route `/galerie` funcțional
- [ ] Filtru timp funcționează (testează schimbând `new Date().getHours()` manual)
- [ ] Trunchiere la multiplu de 3 funcționează (ex: 7 imagini → afișate 6)
- [ ] Galeria apare și pe pagina principală (același fragment, nu cod duplicat)
- [ ] Tag `<picture>` cu surse pentru 3 dimensiuni de ecran
- [ ] Indexare A, B, C... vizibilă via CSS counter
- [ ] Tranziție hover: rotație 360° + scale(1.5) + border-radius
- [ ] Atribuire CC-BY vizibilă pentru minim 1 imagine
- [ ] Validare JSON (Bonus 5): forțează eroare (redenumește un fișier) → mesaj clar

### Galerie animată (Bonus 1)
- [ ] Număr aleator (9/12/15) la fiecare reload
- [ ] Animație pornește automat
- [ ] Pauză la hover
- [ ] Nu apare pe ecran mediu și mic
- [ ] Border-image vizibil

---

## 8. Dependințe `package.json`

```json
{
  "dependencies": {
    "express": "^4.x",
    "ejs": "^3.x",
    "sass": "^1.x",
    "sharp": "^0.33.x"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

```bash
npm install sass sharp
# sau, dacă sharp dă erori la instalare:
npm install sharp --ignore-scripts
```