# SteelVector — Explicații Complete Etapa 5

Acest document explică **în detaliu** tot codul implementat pentru Etapa 5: Compilare automată SCSS, Customizare Bootstrap, Efecte CSS, Galerie Statică și Galerie Animată (Dinamică). Fiecare funcție este descrisă cu logica sa, iar referințele sunt exacte (fișier + linia).

---

## Cuprins

1. [Compilare Automată SCSS](#1-compilare-automata-scss)
   - [1.1 Pregătire Cadru de Lucru (Globale)](#11-pregatire-cadru-de-lucru-globale)
   - [1.2 Funcții din scss-compiler.js](#12-functii-din-scss-compilerjs)
   - [1.3 Fluxul Complet de Compilare](#13-fluxul-complet-de-compilare)
   - [1.4 Generare SCSS Galerie Animată](#14-generare-scss-galerie-animata)
2. [Customizare Bootstrap](#2-customizare-bootstrap)
   - [2.1 Schema Cromatică](#21-schema-cromatica)
   - [2.2 Teme (Dark + Light)](#22-teme-dark--light)
   - [2.3 Variabile Modificate](#23-variabile-modificate)
   - [2.4 Elemente Demonstrative](#24-elemente-demonstrative)
3. [Efecte CSS (0.55p realizat)](#3-efecte-css-055p-realizat)
4. [Galerie Statică](#4-galerie-statica)
5. [Galerie Dinamică (Animată)](#5-galerie-dinamica-animata)
6. [Bonusuri Implementate](#6-bonusuri-implementate)

---

## 1. Compilare Automată SCSS

### 1.1 Pregătire Cadru de Lucru (Globale)

**Fișier**: [index.js](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js)

#### Proprietăți globale `folderScss` și `folderCss` — Liniile 9-11

```js
global.appRoot = __dirname;                                    // Linia 9
global.folderScss = path.join(__dirname, "resurse", "scss");   // Linia 10
global.folderCss = path.join(__dirname, "resurse", "css");     // Linia 11
```

**Ce fac**: Setează pe obiectul global (`global`) trei proprietăți:
- `appRoot` — calea absolută a proiectului (folosită de backup)
- `folderScss` — calea absolută către folderul cu fișiere `.scss` sursă
- `folderCss` — calea absolută către folderul unde se scriu fișierele `.css` compilate

**De ce `global`**: Proprietățile globale sunt accesibile din orice modul Node.js fără `require`. Așa le putem folosi și în `scss-compiler.js`.

#### Folderul `backup` creat automat — Liniile 37-43

```js
const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];  // Linia 37
for (const numeFolder of vect_foldere) {                                // Linia 38
    const caleFolder = path.join(__dirname, numeFolder);                // Linia 39
    if (!fs.existsSync(caleFolder)) {                                   // Linia 40
        fs.mkdirSync(caleFolder, { recursive: true });                  // Linia 41
    }
}
```

**Ce face**: La pornirea serverului, creează automat folderele `temp/`, `logs/`, `backup/`, `fisiere_uploadate/` dacă nu există deja. Opțiunea `{ recursive: true }` creează și subfolderele necesare.

#### Asigurare existență foldere SCSS/CSS — Liniile 45-49

```js
[global.folderScss, global.folderCss].forEach((caleFolder) => {
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder, { recursive: true });
    }
});
```

**Ce face**: Verifică că `resurse/scss/` și `resurse/css/` există pe disc. Dacă nu, le creează.

#### Import modulul scss-compiler — Linia 5

```js
const { compileazaScss, compileazaToateScss, urmaresteScss } = require("./lib/scss-compiler");
```

**Ce face**: Importă cele 3 funcții principale exportate de modulul nostru de compilare.

#### Apeluri la pornirea serverului — Liniile 492-493

```js
compileazaToateScss();   // Linia 492 — compilează TOATE fișierele .scss din folderScss
urmaresteScss();         // Linia 493 — pornește watcher-ul fs.watch pe folderScss
```

**Ordine importantă**: Se apelează DUPĂ `initErori()` și `initGalerie()`, deoarece galeria animată generează un fișier SCSS care trebuie compilat.

---

### 1.2 Funcții din scss-compiler.js

**Fișier**: [scss-compiler.js](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/lib/scss-compiler.js) (161 linii)

---

#### `resolvePath(inputPath, baseDir)` — Liniile 5-10

```js
function resolvePath(inputPath, baseDir) {
    if (!inputPath) { return ""; }
    return path.isAbsolute(inputPath) ? inputPath : path.join(baseDir, inputPath);
}
```

**Ce face**: Primește o cale (poate fi relativă sau absolută) și un folder de bază.
- Dacă `inputPath` este gol/null → returnează `""`.
- Dacă `inputPath` este cale absolută (de ex. `/home/bogdan/.../fisier.scss`) → o returnează așa cum este.
- Dacă `inputPath` este cale relativă (de ex. `galerie.scss`) → o concatenează cu `baseDir` folosind `path.join`.

**Unde e folosită**: În `compileazaScss` (linia 46) pentru a rezolva calea SCSS, și în `resolveCssPath` (linia 14) pentru a rezolva calea CSS.

---

#### `resolveCssPath(scssAbsPath, cssPath)` — Liniile 12-23

```js
function resolveCssPath(scssAbsPath, cssPath) {
    if (cssPath) {
        return resolvePath(cssPath, global.folderCss);   // calea CSS e dată explicit
    }
    // cssPath lipsește → derivăm numele CSS din cel SCSS
    const scssRel = path.relative(global.folderScss, scssAbsPath);  // cale relativă în folderScss
    const scssRelDir = path.dirname(scssRel);                        // subfolder (dacă e cazul)
    const scssBaseName = path.parse(scssAbsPath).name;               // "galerie" din "galerie.scss"
    const cssRel = path.join(scssRelDir, `${scssBaseName}.css`);     // "galerie.css"
    return path.join(global.folderCss, cssRel);                      // cale absolută finală
}
```

**Ce face**: Determină calea absolută a fișierului CSS rezultat.
- **Dacă `cssPath` este dat** → îl rezolvă relativ la `folderCss` (prin `resolvePath`).
- **Dacă `cssPath` lipsește** (al doilea parametru al `compileazaScss` nu e dat) → ia numele fișierului SCSS, îi schimbă extensia în `.css`, și îl pune în `folderCss`. Exemplu: `resurse/scss/galerie.scss` → `resurse/css/galerie.css`.

**Detaliu important**: Folosește `path.parse(scssAbsPath).name` (linia 19) în loc de `path.basename(...).split('.')[0]`. Asta e important pentru fișiere cu puncte în nume (de ex. `stil.frumos.scss` → `stil.frumos` corect, nu doar `stil`). Aceasta este **Bonus 4**.

---

#### `copiazaBackup(caleCssAbs)` — Liniile 25-43

```js
function copiazaBackup(caleCssAbs) {
    if (!fs.existsSync(caleCssAbs)) { return; }                          // Linia 26 — dacă CSS-ul nu există, nu e nimic de salvat

    const cssRel = path.relative(global.folderCss, caleCssAbs);          // Linia 30 — calea relativă
    const backupDir = path.join(global.appRoot, "backup", "resurse", "css", path.dirname(cssRel)); // Linia 31

    try {
        fs.mkdirSync(backupDir, { recursive: true });                    // Linia 34 — creează structura de foldere
        const numeCss = path.parse(caleCssAbs).name;                     // Linia 35 — ex: "galerie"
        const extensie = path.extname(caleCssAbs);                       // Linia 36 — ex: ".css"
        const backupName = `${numeCss}_${Date.now()}${extensie}`;        // Linia 37 — ex: "galerie_1779691414581.css"
        const backupPath = path.join(backupDir, backupName);             // Linia 38
        fs.copyFileSync(caleCssAbs, backupPath);                         // Linia 39 — copiază fizic
    } catch (err) {
        console.error(`Eroare la copierea backup-ului CSS: ${err.message}`);
    }
}
```

**Ce face**: ÎNAINTE de a suprascrie un fișier CSS vechi, copiază fișierul existent în `backup/resurse/css/`. Numele backup-ului conține timestamp-ul (milisecunde de la epoch), deci nu se pierde nicio versiune.

**Exemplu concret**:
- Se compilează `galerie.scss` → va genera `resurse/css/galerie.css`
- Dar `galerie.css` există deja pe disc (versiunea veche)
- Funcția copiază `galerie.css` → `backup/resurse/css/galerie_1779691414581.css`
- Abia apoi `compileazaScss` suprascrie `galerie.css` cu versiunea nouă

---

#### `compileazaScss(caleScss, caleCss)` — Liniile 45-72

Aceasta este **funcția principală de compilare**. Primește doi parametri:
1. `caleScss` — calea SCSS de compilat (obligatoriu). Poate fi relativă (`"galerie.scss"`) sau absolută.
2. `caleCss` — calea CSS output (opțional). Dacă lipsește, se derivă din numele SCSS-ului.

```js
function compileazaScss(caleScss, caleCss) {
    const scssAbs = resolvePath(caleScss, global.folderScss);            // Linia 46

    if (!scssAbs || !fs.existsSync(scssAbs)) {                          // Linia 48
        console.error(`SCSS inexistent: ${scssAbs}`);
        return;
    }

    const cssAbs = resolveCssPath(scssAbs, caleCss);                    // Linia 53
    copiazaBackup(cssAbs);                                               // Linia 55 — salvează versiunea veche

    try {
        const rezultat = sass.compile(scssAbs, {                        // Linia 58
            style: "expanded",                                           // CSS uman-readabil (nu minificat)
            loadPaths: [global.folderScss, path.join(global.appRoot, "node_modules")],  // Linia 60
            quietDeps: true,                                             // Linia 61
            silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"]  // Linia 62
        });

        fs.mkdirSync(path.dirname(cssAbs), { recursive: true });        // Linia 65
        fs.writeFileSync(cssAbs, rezultat.css);                          // Linia 66 — scrie CSS-ul pe disc

        console.log(`SCSS compilat: ${path.relative(global.appRoot, scssAbs)} -> ${path.relative(global.appRoot, cssAbs)}`);
    } catch (err) {
        console.error(`Eroare la compilarea ${scssAbs}: ${err.message}`);
    }
}
```

**Pașii detaliați**:
1. **Rezolvă calea SCSS** — dacă e relativă, o face absolută adăugând `folderScss` în față (linia 46)
2. **Verifică existența** — dacă fișierul SCSS nu există pe disc, afișează eroare și se oprește (linia 48)
3. **Determină calea CSS** — fie din al 2-lea parametru, fie derivată automat din numele SCSS-ului (linia 53)
4. **Backup** — salvează CSS-ul vechi înainte de suprascriere (linia 55)
5. **Compilează** — folosește `sass.compile()` din pachetul npm `sass` (linia 58)
   - `style: "expanded"` → CSS-ul output este formatat frumos, cu indentare
   - `loadPaths` → unde să caute fișierele `@import`/`@use` — atât în folderul SCSS cât și în `node_modules` (pentru Bootstrap)
   - `quietDeps` și `silenceDeprecations` → suprimă warningurile din dependențe (Bootstrap folosește funcții deprecated)
6. **Scrie pe disc** — creează folderul dacă nu există și scrie CSS-ul (liniile 65-66)
7. **Logare** — afișează în consolă mesajul de confirmare (linia 68)

---

#### `colecteazaScss(dirPath, rezultate)` — Liniile 74-91

```js
function colecteazaScss(dirPath, rezultate = []) {
    // ... parcurge recursiv dirPath ...
    // Adaugă la vector doar fișierele .scss care NU încep cu "_"
    } else if (entry.isFile() && path.extname(entry.name) === ".scss" && !entry.name.startsWith("_")) {  // Linia 85
        rezultate.push(cale);
    }
}
```

**Ce face**: Parcurge recursiv folderul `folderScss` și colectează toate fișierele `.scss` care **nu încep cu `_`** (partiale SCSS).

**De ce excludem `_`**: Fișierele cu prefix `_` (de ex. `_variabile.scss`) sunt partiale SCSS — sunt `@import`-ate de alte fișiere SCSS și NU trebuie compilate independent. Dacă le-am compila, ar genera CSS incomplet sau erori.

---

#### `compileazaToateScss()` — Liniile 93-96

```js
function compileazaToateScss() {
    const fisiere = colecteazaScss(global.folderScss);
    fisiere.forEach((cale) => compileazaScss(cale));
}
```

**Ce face**: Colectează toate fișierele SCSS (fără cele cu `_`) și le compilează una câte una. Se apelează o singură dată, la pornirea serverului ([index.js:492](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js#L492)).

---

#### `urmaresteScss()` — Liniile 98-154

Funcția de **monitorizare în timp real** a modificărilor din folderul SCSS.

```js
function urmaresteScss() {
    const debounceMs = 200;                    // Linia 99 — interval anti-spam
    const pending = new Map();                 // Linia 100 — Map de timeout-uri active

    const proceseaza = (caleFisier) => {       // Linia 102
        // Ignoră non-SCSS și fișiere cu prefix _
        if (!caleFisier || path.extname(caleFisier) !== ".scss" || path.basename(caleFisier).startsWith("_")) {
            return;                            // Linia 103-105
        }
        // Debounce: anulează timeout-ul vechi dacă e în curs
        if (pending.has(caleFisier)) {
            clearTimeout(pending.get(caleFisier));   // Linia 107
        }
        // Programează recompilarea cu 200ms delay
        const id = setTimeout(() => {
            pending.delete(caleFisier);
            compileazaScss(caleFisier);         // Linia 111
        }, debounceMs);
        pending.set(caleFisier, id);
    };

    const watchDir = (dirPath) => {            // Linia 116
        // Pune un fs.watch() pe fiecare folder din arborele SCSS
        fs.watch(dirPath, (eventType, filename) => {
            const cale = path.join(dirPath, filename);
            if (fs.existsSync(cale) && fs.statSync(cale).isDirectory()) {
                watchDir(cale);    // Linia 128 — dacă e un folder nou, îl adaugă la watch
                return;
            }
            proceseaza(cale);      // Linia 131 — procesează fișierul modificat
        });
    };

    // Colectează recursiv toate folderele din arborele SCSS
    const toateFolderele = new Set();
    const colecteazaFoldere = (dirPath) => { ... };   // Liniile 139-150
    colecteazaFoldere(global.folderScss);
    toateFolderele.forEach((dirPath) => watchDir(dirPath));   // Linia 153
}
```

**Cum funcționează debounce-ul**: Când un fișier se modifică, editorul poate genera mai multe evenimente `fs.watch` în succesiune rapidă. Fără debounce, SCSS-ul s-ar compila de 5-10 ori la o singură salvare. Cu debounce de 200ms, doar ultima modificare declanșează compilarea.

**Tratare foldere noi**: Dacă se creează un subfolder nou în `resurse/scss/`, funcția `watchDir` este apelată recursiv pentru noul folder (linia 128), astfel încât și fișierele din el sunt monitorizate.

---

### 1.3 Fluxul Complet de Compilare

```
Server pornire
    ├── global.folderScss = resurse/scss/       (index.js:10)
    ├── global.folderCss  = resurse/css/        (index.js:11)
    ├── creează foldere backup/, temp/, etc.     (index.js:37-43)
    ├── inițializează galerie (generează galerie-animata.scss)  (index.js:491)
    ├── compileazaToateScss()                    (index.js:492)
    │   ├── colecteazaScss() → lista fișiere .scss (fără cele cu _)
    │   └── pentru fiecare: compileazaScss(cale)
    │       ├── rezolvă cale absolută
    │       ├── determină cale CSS output
    │       ├── copiazaBackup() → salvează CSS-ul vechi
    │       └── sass.compile() → scrie CSS-ul nou
    └── urmaresteScss()                          (index.js:493)
        └── fs.watch() pe toate folderele din arborele SCSS
            └── la modificare → debounce 200ms → compileazaScss()
```

---

### 1.4 Generare SCSS Galerie Animată

**Fișier**: [index.js](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js), funcția `genereazaScssGalerieAnimata(n)` — **Liniile 353-459**

Această funcție generează **dinamic** conținutul SCSS al animației galeriei. NU este un fișier SCSS static — el se regenerează la fiecare request pe ruta `/despre`.

#### Parametri:
- `n` — numărul de imagini din galeria animată (9, 12 sau 15)

#### Ce generează (Liniile 407-455):

1. **`.galerie-animata-wrapper`** (linia 408) — container flex pentru centrare
2. **`.galerie-animata-grid`** (linia 413) — viewport-ul de 280×280px cu `overflow: hidden` și `border-image`
3. **`.galerie-animata-inner`** (linia 424) — grid-ul ascuns de `3×N` celule cu animația `slideGalerie`
4. **Hover pause** (linia 436) — `animation-play-state: paused` la `:hover`
5. **`@keyframes slideGalerie`** (linia 446) — toate keyframe-urile generate dinamic
6. **Media query** (linia 450) — ascunde galeria pe ecrane sub `1100px`

#### Cum funcționează animația (Liniile 376-404):

Fiecare imagine are o **poziție în grid** definită de `maparePozitii` (liniile 358-374):
```
Poz 1: col=0, rand=0    Poz 5: col=1, rand=0    Poz 6: col=2, rand=0
Poz 2: col=0, rand=1    Poz 4: col=1, rand=1    Poz 3: col=2, rand=1
Poz 8: col=0, rand=2    Poz 9: col=1, rand=2    Poz 7: col=2, rand=2
...
```

Pentru fiecare imagine `i`, un pas de animație are **4 sub-faze**:
1. **Hold** (0-50% din pas) — imaginea stă pe loc, statică
2. **Slide** (50-75% din pas) — grid-ul glisează spre noua poziție (translateX/Y), fără rotație
3. **Rotate** (75-95% din pas) — imaginea se rotește 360° la noua poziție
4. **Settle** (95-100% din pas) — pauză scurtă înainte de pasul următor

Glisarea se face prin `translate(-col*280px, -rand*280px)` care mută grid-ul ascuns astfel încât celula dorită apare în viewport-ul de 280×280.

#### Apelarea în ruta `/despre` — Liniile 572-573:

```js
genereazaScssGalerieAnimata(imaginiDinamice.length);   // Linia 572 — generează SCSS-ul
compileazaScss("galerie-animata.scss");                 // Linia 573 — compilează imediat în CSS
```

---

## 2. Customizare Bootstrap

**Fișier**: [custom.scss](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/custom.scss) (219 linii)

**Principiu**: Variabilele SCSS Bootstrap se definesc ÎNAINTE de `@import "bootstrap/scss/bootstrap"` (linia 125). Astfel, Bootstrap folosește culorile noastre în loc de cele default.

### 2.1 Schema Cromatică

**Liniile 9-18**: Variabilele de culoare SteelVector

| Variabilă | Valoare | Rol |
|:---|:---|:---|
| `$sv-orange` | `#f99b41` | Portocaliu brand — culoare primară |
| `$sv-dark` | `#1c2b39` | Albastru-închis brand |
| `$sv-deep` | `#0f1c27` | Fundal principal (cel mai închis) |
| `$sv-mid` | `#2c3e50` | Albastru mediu |
| `$sv-light` | `#e8edf2` | Text deschis |
| `$sv-accent` | `#3498db` | Albastru accent |

**Liniile 22-31**: `$theme-colors` — remapare completă a culorilor Bootstrap:
```scss
$theme-colors: (
  "primary":   $sv-orange,    // butoanele „primary" sunt portocalii
  "secondary": $sv-dark,
  "success":   $sv-success,
  ...
);
```

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
