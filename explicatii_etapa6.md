# SteelVector — Explicații Complete Etapa 6: format-entitati

Acest document explică implementarea pentru taskul de afișare a produselor din etapa 6: corectarea linkurilor din meniu, afișarea produselor, filtrarea, sortarea, calcularea, stilizarea Bootstrap a inputurilor și butoanelor, tema salvată în `localStorage` și pagina de produs unic. Structura este păstrată în stilul documentului de etapă precedentă: introducere, cuprins, secțiuni numerotate și fragmente de cod explicate punctual.

---

## Cuprins

1. [Meniul și linkurile către produse](#1-meniul-si-linkurile-catre-produse)
2. [Modelul de date pentru produse](#2-modelul-de-date-pentru-produse)
   - [2.1 Normalizare și pregătire](#21-normalizare-si-pregatire)
   - [2.2 Metadatele pentru filtre](#22-metadatele-pentru-filtre)
3. [Ruta /produse și endpointul /api/produse](#3-ruta-produse-si-endpointul-apiproduse)
   - [3.1 Randarea inițială](#31-randarea-initiala)
   - [3.2 Filtrare, sortare și paginare](#32-filtrare-sortare-si-paginare)
4. [Pagina de produse](#4-pagina-de-produse)
   - [4.1 Structura generală](#41-structura-generala)
   - [4.2 Filtrele Bootstrap](#42-filtrele-bootstrap)
   - [4.3 Cardul de produs](#43-cardul-de-produs)
   - [4.4 Modalul de produs](#44-modalul-de-produs)
   - [4.5 JavaScript-ul paginii](#45-javascript-ul-paginii)
5. [Pagina produsului unic](#5-pagina-produsului-unic)
6. [Tema și footerul global](#6-tema-si-footerul-global)
7. [Customizarea Bootstrap în SASS](#7-customizarea-bootstrap-in-sass)
8. [Stilizarea specifică paginii de produse](#8-stilizarea-specifica-paginii-de-produse)
9. [Verificări și corecturi](#9-verificari-si-corecturi)

---

## 1. Meniul și linkurile către produse

**Fișiere**: [index.js](index.js), [views/fragmente/header.ejs](views/fragmente/header.ejs)

Prima cerință din etapa 6 este corectarea și completarea linkurilor din meniu. În proiect, opțiunea „Produse” din meniu nu mai este scrisă manual pentru fiecare categorie, ci primește categoriile mari din `locals`, iar linkurile duc către aceeași pagină de produse, dar cu parametri diferiți.

#### Încărcarea categoriilor în `app.locals` - [index.js](index.js#L739)

```js
// Inițializăm categoriile implicit cu valori de fallback la pornirea serverului (prevenim blocaje)
app.locals.categoriiProduse = ["IPE", "HEA", "HEB", "teava", "bara"];

// Încercăm să încărcăm asincron categoriile reale din ENUM-ul bazei de date
async function incarcaCategoriiProduse() {
    try {
        const rezultat = await pool.query(
            "SELECT unnest(enum_range(NULL::tip_profil))::text AS val"
        );
        app.locals.categoriiProduse = rezultat.rows.map(r => r.val);
        console.log("Categorii de produse încărcate cu succes din DB:", app.locals.categoriiProduse);
    } catch (err) {
        console.warn("Eroare la conexiunea DB la startup (se folosesc categoriile predefinite):", err.message);
    }
}
```

**Ce face**: `app.locals.categoriiProduse` este lista folosită în meniul global pentru subopțiunile paginii de produse.

**De ce există fallback**: dacă baza de date nu răspunde la pornirea aplicației, meniul nu rămâne gol. Se folosesc categoriile implicite până când încărcarea reală reușește.

#### Randarea linkurilor în meniu - [views/fragmente/header.ejs](views/fragmente/header.ejs#L24)

```ejs
<li>
    <div class="optiune-principala" tabindex="0">
        <div class="imag-icon"><i class="fas fa-box-open"></i></div>
        <div class="text-icon">Produse</div>
    </div>
    <ul>
        <li><a href="/produse">Toate</a></li>
        <% if (typeof categoriiProduse !== 'undefined' && Array.isArray(categoriiProduse)) { %>
            <% for (const cat of categoriiProduse) { %>
                <li><a href="/produse?tip=<%= cat %>"><%= cat.charAt(0).toUpperCase() + cat.slice(1) %></a></li>
            <% } %>
        <% } %>
    </ul>
</li>
```

**Ce face**: construiește în mod dinamic submeniul „Produse”. În loc de linkuri scrise manual, fiecare categorie mare se transformă într-un link către aceeași rută `/produse`, dar cu filtrarea pe `tip`.

**De ce este corect pentru cerință**: toate subopțiunile folosesc același fișier EJS și același apel GET, dar cu parametri diferiți.

---

## 2. Modelul de date pentru produse

**Fișier**: [index.js](index.js)

Etapa 6 cere o pagină de produse bazată pe entități din baza de date. În acest proiect, entitățile sunt profile metalice SteelVector. Tabelul păstrează atât date simple, cât și date utile pentru filtrare și sortare.

### 2.1 Normalizare și pregătire

#### Normalizarea textului - [index.js](index.js#L335)

```js
function normalizeazaText(text) {
    return String(text ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
```

**Rol**: această funcție face comparațiile insensibile la diacritice și la diferențele dintre litere mari și mici.

**Unde se folosește**: la filtrarea după nume, descriere, lungime, finisaj, aplicație, tip și certificări.

#### Prepararea unui produs pentru UI - [index.js](index.js#L379)

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

**Ce face**: transformă un rând brut din PostgreSQL într-un obiect complet pentru interfață.

**Ce pregătește**:
- convertește valorile numerice din șir în număr real;
- sparge certificările multiple în vector;
- păstrează și o variantă text pentru afișare rapidă;
- determină imaginile alternative ale produsului;
- creează câmpuri normalizate pentru filtrare și sortare.

#### Imaginile multiple - [index.js](index.js#L344)

```js
function extrageImaginiProdus(imaginePrincipala) {
    const folderImagini = path.join(__dirname, "resurse", "imagini", "galerie");
    if (!imaginePrincipala) {
        return [];
    }

    const extensie = path.extname(imaginePrincipala);
    
    // Always start with the main image
    const imagini = [imaginePrincipala];

    // Let's add other distinct images from the gallery folder
    try {
        if (fs.existsSync(folderImagini)) {
            const files = fs.readdirSync(folderImagini).filter(f => {
                const ext = path.extname(f).toLowerCase();
                return (ext === '.png' || ext === '.jpg' || ext === '.jpeg') && !f.includes('_md') && !f.includes('_sm');
            });
            
            // Shuffle files to pick randomized ones
            files.sort(() => Math.random() - 0.5);
            
            let count = 0;
            for (const file of files) {
                if (file !== imaginePrincipala && !imagini.includes(file)) {
                    imagini.push(file);
                    count++;
                    if (count >= 3) break; // we want 4 images in total
                }
            }
        }
    } catch (err) {
        console.error("Eroare la citirea directorului de imagini:", err.message);
    }

    return imagini.map((fisier) => `/resurse/imagini/galerie/${fisier}`);
}
```

**Rol**: returnează imaginea principală a produsului ca primă variantă, urmată de alte imagini distincte din galerie, selectate și amestecate aleatoriu. Asta permite caruselului bootstrap/butoanelor de pe pagina produsului să funcționeze corect, alternând imagini diferite în loc de aceleași variante la rezoluții diferite.

**Legătura cu pagina de produs unic**: aceeași listă este folosită în caruselul din pagina de detaliu.

### 2.2 Metadatele pentru filtre

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
    const pretMin = parseFloat(pretMinMax.rows[0].pmin) || 0;
    const pretMax = parseFloat(pretMinMax.rows[0].pmax) || 10000;

    const lungimiRez = await pool.query("SELECT DISTINCT lungime_mm FROM produse ORDER BY lungime_mm");
    const lungimi = lungimiRez.rows.map((r) => r.lungime_mm);

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

**Ce face**: construiește toate valorile care trebuie afișate în filtre.

**De ce este important**: cerința spune explicit că opțiunile din meniu și filtre trebuie generate pe baza datelor din baza de date, nu scrise manual.

**Cum am extras opțiunile pentru filtrul multiplu**: la certificări nu există valori hardcodate. Iau toate câmpurile `certificari` din tabel, le sparg după virgulă, curăț spațiile cu `trim()` și le pun într-un `Set`, ca să elimin duplicatele. Abia apoi transform `Set`-ul în vector și îl trimit în EJS.

```js
const setCertificari = new Set();
certRez.rows.forEach((r) => {
    String(r.certificari || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c) => setCertificari.add(c));
});
```

**Cum citesc filtrul multiplu în pagină**: în JavaScript nu iau un singur `value`, ci toate opțiunile selectate din `selectedOptions`. Apoi le trimit la server ca un singur șir, separat prin virgulă.

```js
const certificariSelectate = Array.from(selectCertificari.selectedOptions).map((opt) => opt.value);
```

Pe server, acest șir se sparge din nou în cerințe individuale și verific dacă produsul le îndeplinește pe toate.

---

## 3. Ruta /produse și endpointul /api/produse

### 3.1 Randarea inițială

#### Ruta principală - [index.js](index.js#L851)

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
            elementePerPagina: metaProduse.elementePerPagina
        });
    } catch (err) {
        console.error("Eroare la ruta /produse:", err.message);
        return afisareEroare(res, 500);
    }
});
```

**Ce face**: trimite către EJS produsele pregătite și valorile inițiale ale filtrelor.

**Filtrarea la nivel de server**: dacă există `?tip=...`, pagina de produse afișează doar entitățile din categoria mare aleasă.

### 3.2 Filtrare, sortare și paginare

#### Endpointul JSON - [index.js](index.js#L874)

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

**Ce face**: primește parametrii din `fetch()` și răspunde cu JSON filtrat, sortat și paginat.

#### Funcția de procesare - [index.js](index.js#L403)

```js
function proceseazaListaProduse(produse, query = {}) {
    let rezultate = [...produse];

    const tip = normalizeazaText(query.tip);
    const nume = normalizeazaText(query.nume);
    const descriere = normalizeazaText(query.descriere);
    const lungime = normalizeazaText(query.lungime);
    const finisaj = normalizeazaText(query.finisaj);
    const aplicatie = normalizeazaText(query.aplicatie);
    const certificari = normalizeazaText(query.certificari);
    const sortDirectie = String(query.sortDirectie || "asc");
    const pagina = Math.max(parseInt(query.pagina, 10) || 1, 1);
    const elementePerPagina = Math.max(parseInt(query.elementePerPagina, 10) || 6, 1);
    ...
    return {
        produse: produsePaginare,
        total,
        totalPagini,
        paginaCurenta,
        elementePerPagina
    };
}
```

**Ce face**: aplică filtrarea, sortarea după două chei și paginarea.

**Filtre implementate**:
- nume și descriere prin text normalizat;
- lungime, finisaj, aplicație;
- certificări multiple;
- intervalul de preț;
- livrare rapidă.

**Sortarea cerută (două chei selectabile)**: utilizatorul poate alege două chei de sortare dintr-un set de minim 3 opțiuni (Nume, Preț, Lungime, Tip profil, Aplicație, Finisaj, Lungime descriere) și direcția dorită (Crescător sau Descrescător). Prima cheie decide ordinea principală, iar a doua decide ordinea pentru elementele egale.

**Detaliu de afișare**: produsele fixate sunt aduse în față, iar cele ascunse pe sesiune sau temporar sunt omise din rezultat.

**Cum funcționează filtrarea propriu-zisă**: aplic filtrele unul după altul, pe aceeași listă. Dacă utilizatorul completează mai multe câmpuri, produsul rămâne în rezultat doar dacă trece de toate condițiile.

```js
if (certificari) {
    const cerinte = certificari.split(",").map((elem) => elem.trim()).filter(Boolean);
    rezultate = rezultate.filter((produs) => cerinte.every((cerinta) => produs.certList.some((cert) => normalizeazaText(cert).includes(cerinta))));
}
```

**Cum am explicat sortarea la prezentare**: `sort()` primește un callback care rulează o comparare pe cele două chei selectate în ordine. Dacă valorile pentru prima cheie sunt egale, se trece la compararea pe a doua cheie. Direcția sortării este decisă de variabila `semn` (care are valoarea `1` pentru crescător și `-1` pentru descrescător), înmulțind rezultatul comparației pentru a schimba ordinea în mod simplu și elegant.

**Dacă la întrebare se insistă pe semn**: ideea de `semn` este doar o scurtătură. Pentru ascendent este `1`, pentru descendent este `-1`, iar rezultatul comparației se înmulțește cu el ca să inverseze ordinea fără să rescrii logica de comparație.

**Cum arată elementele de sortare în pagină**: există două elemente de tip `select` pentru a alege prima și a doua cheie de sortare dintr-un set de 7 valori, plus un al treilea select pentru alegerea direcției de sortare (crescător sau descrescător).

---

## 4. Pagina de produse

**Fișier**: [views/pagini/produse.ejs](views/pagini/produse.ejs)

### 4.1 Structura generală

#### Titlul - [views/pagini/produse.ejs](views/pagini/produse.ejs#L15)

```ejs
<main data-tip-selectat="<%= tipSelectat || '' %>">
    <h2 id="titlu-produse">
        <i class="bi bi-box-seam"></i>
        Catalog Produse
        <% if (tipSelectat) { %>
            — <%= String(tipSelectat).toUpperCase() %>
        <% } %>
    </h2>
```

**Ce face**: afișează titlul paginii de produse și adaugă dinamic categoria selectată dacă există filtrare din meniul principal.

### 4.2 Filtrele Bootstrap

#### Zona de filtre - [views/pagini/produse.ejs](views/pagini/produse.ejs#L33)

```ejs
<section id="sectiune-filtre" class="container-fluid">
    <h3><i class="bi bi-funnel"></i> Filtre, sortare și paginare</h3>
    <div class="row g-3 align-items-end">
        <div class="col-12 col-md-6 col-lg-4">
            <label for="filtru-nume" class="form-label"><i class="bi bi-search"></i> Nume produs</label>
            <input type="text" class="form-control" id="filtru-nume" placeholder="ex: Profil 300 sau teava">
        </div>
        <div class="col-6 col-md-3 col-lg-2">
            <label for="filtru-pret-min" class="form-label">Preț min: <span class="sv-range-val" id="val-pret-min"><%= Math.floor(pretMin) %></span> lei</label>
            <input type="range" class="form-range" id="filtru-pret-min" ...>
        </div>
        <div class="col-6 col-md-3 col-lg-2">
            <label for="filtru-pret-max" class="form-label">Preț max: <span class="sv-range-val" id="val-pret-max"><%= Math.ceil(pretMax) %></span> lei</label>
            <input type="range" class="form-range" id="filtru-pret-max" ...>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
            <label for="filtru-lungime" class="form-label"><i class="bi bi-rulers"></i> Lungime (mm)</label>
            <input type="text" class="form-control" id="filtru-lungime" placeholder="Tastați sau alegeți..." list="lista-lungimi">
            <datalist id="lista-lungimi">
                <% lungimi.forEach(l => { %>
                    <option value="<%= l %>"></option>
                <% }); %>
            </datalist>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
            <label for="filtru-finisaj" class="form-label"><i class="bi bi-palette"></i> Finisaj</label>
            <select class="form-select" id="filtru-finisaj">
                <option value="" selected>Oricare</option>
                <% finisaje.forEach(f => { %>
                    <option value="<%= f %>"><%= f.charAt(0).toUpperCase() + f.slice(1) %></option>
                <% }); %>
            </select>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
            <label for="filtru-certificari" class="form-label"><i class="bi bi-award"></i> Certificări</label>
            <select class="form-select" id="filtru-certificari" multiple size="4">
                <% certificari.forEach(c => { %>
                    <option value="<%= c %>"><%= c %></option>
                <% }); %>
            </select>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
            <div class="form-check form-switch mt-2">
                <input class="form-check-input" type="checkbox" id="filtru-livrare">
                <label class="form-check-label" for="filtru-livrare">
                    <i class="bi bi-truck"></i> Doar cu livrare rapidă (24h)
                </label>
            </div>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
            <label for="filtru-aplicatie" class="form-label"><i class="bi bi-gear"></i> Aplicație</label>
            <select class="form-select" id="filtru-aplicatie">
                <option value="" selected>Oricare</option>
                <% aplicatii.forEach(a => { %>
                    <option value="<%= a %>"><%= a.charAt(0).toUpperCase() + a.slice(1) %></option>
                <% }); %>
            </select>
        </div>
        <div class="col-12 col-md-8 col-lg-6">
            <div class="form-floating">
                <textarea class="form-control" id="filtru-descriere" placeholder="Căutați în descriere..." style="height: 80px"></textarea>
                <label for="filtru-descriere"><i class="bi bi-text-paragraph"></i> Căutare în descriere</label>
            </div>
        </div>
    </div>
```

**Ce face**: organizează toate inputurile cerute folosind grid Bootstrap `row` și `col`.

**Ce este important aici**:
- inputurile sunt dimensionate prin clase Bootstrap, nu prin CSS custom pentru fiecare control;
- textarea folosește `form-floating`;
- checkbox-ul este stilizat ca switch Bootstrap;
- `select`-urile și `range`-urile folosesc clasele oficiale Bootstrap.

**Cum verific textarea-ul**: înainte să trimit filtrarea, citesc valoarea cu `textareaDescriere.value.trim()`. Asta elimină spațiile goale de la început și de la sfârșit, deci un textarea complet gol sau plin doar cu spații nu produce o filtrare artificială. Dacă aș vrea să îl marchez explicit ca invalid, aș putea adăuga clasa `is-invalid` sau să folosesc `setCustomValidity()`, dar în implementarea curentă curățarea cu `trim()` este suficientă pentru filtrare.

**Despre butoanele radio**: un grup radio funcționează exclusiv pentru că toate butoanele au același atribut `name`. Browserul lasă activ un singur radio din grup și dezactivează vizual selecția veche când alegi altul. În proiect, când am avut nevoie de o alegere exclusivă, am folosit direct un `select` simplu; iar pentru alegere multiplă am folosit `select` multiplu.

**Selecturile de sortare (două chei + direcție)**: sortarea este configurată cu ajutorul a două selecturi de cheie și un select de direcție.

```ejs
<div class="row g-3 mt-2 align-items-end">
    <div class="col-12 col-md-4">
        <label for="sort-cheie-1" class="form-label"><i class="bi bi-arrow-down-up"></i> Cheia de sortare 1</label>
        <select class="form-select" id="sort-cheie-1">
            <option value="nume" selected>Nume</option>
            <option value="pret">Preț</option>
            <option value="lungime">Lungime</option>
            <option value="tip">Tip profil</option>
            <option value="aplicatie">Aplicație</option>
            <option value="finisaj">Finisaj</option>
            <option value="descriere">Lungime descriere</option>
        </select>
    </div>
    <div class="col-12 col-md-4">
        <label for="sort-cheie-2" class="form-label"><i class="bi bi-arrow-down-up"></i> Cheia de sortare 2</label>
        <select class="form-select" id="sort-cheie-2">
            <option value="pret" selected>Preț</option>
            <!-- ... opțiuni similare ... -->
        </select>
    </div>
    <div class="col-12 col-md-4">
        <label for="sort-directie" class="form-label"><i class="bi bi-sort-down"></i> Direcție</label>
        <select class="form-select" id="sort-directie">
            <option value="asc" selected>Crescător</option>
            <option value="desc">Descrescător</option>
        </select>
    </div>
</div>
```

**Cum se aplică în server**: funcția primește cele două chei, verifică dacă sunt valide în setul de chei recunoscute, și le sortează iterativ, spărgând egalitățile pe cheia secundară.

#### Butoanele de acțiune - [views/pagini/produse.ejs](views/pagini/produse.ejs#L169)

```ejs
<div class="row g-2 mt-3 mb-3">
    <div class="col-auto">
        <button type="button" class="btn btn-primary" id="btn-filtreaza">
            <i class="bi bi-funnel-fill"></i> Filtrează acum
        </button>
    </div>
    <div class="col-auto">
        <button type="button" class="btn btn-primary" id="btn-calculeaza">
            <i class="bi bi-calculator"></i> Media prețurilor
        </button>
    </div>
    <div class="col-auto">
        <button type="button" class="btn btn-outline-danger" id="btn-reseteaza">
            <i class="bi bi-arrow-counterclockwise"></i> Resetează
        </button>
    </div>
</div>
```

**Ce face**: creează butoanele cerute de enunț pentru filtrare, calculare și resetare.

**Cum sunt stilizate**: folosesc tema Bootstrap `primary` și `outline-danger`, iar iconurile sunt din Bootstrap Icons.

### 4.3 Cardul de produs

#### Template-ul unui articol - [views/pagini/produse.ejs](views/pagini/produse.ejs#L166)

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

**Ce face**: fiecare produs primește un `article` cu ID-ul cerut de formatul `art + id`.

**De ce sunt utile atributele `data-*`**: JavaScript-ul le folosește pentru filtrare, deschiderea modalului și calculul datelor fără a reface DOM-ul complet.

#### Conținutul cardului - [views/pagini/produse.ejs](views/pagini/produse.ejs#L176)

```ejs
<div class="produs-layout">
    <div class="produs-imagine">
        <img src="<%= imgPrincipala %>" alt="<%= p.nume %>" loading="lazy">
    </div>
    <div class="produs-info">
        <div class="produs-head">
            <div>
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
                <button type="button" class="btn-actiune" data-actie="fixeaza" title="Păstrează produsul pe ecran" aria-label="Păstrează produsul pe ecran">
                    <i class="bi bi-pin-angle"></i>
                </button>
                <button type="button" class="btn-actiune" data-actie="ascunde-temporar" title="Ascunde temporar produsul" aria-label="Ascunde temporar produsul">
                    <i class="bi bi-eye-slash"></i>
                </button>
                <button type="button" class="btn-actiune" data-actie="ascunde-sesiune" title="Ascunde produsul pentru acest tab" aria-label="Ascunde produsul pentru acest tab">
                    <i class="bi bi-x-circle"></i>
                </button>
            </div>
        </div>

        <p class="produs-descriere"><%= p.descriere %></p>
        <table class="table table-sm table-borderless produs-tabel">
            <tbody>
                <tr>
                    <td><i class="bi bi-tag"></i> Preț</td>
                    <td class="produs-pret"><strong><%= parseFloat(p.pret).toFixed(2) %> lei</strong></td>
                </tr>
                <tr>
                    <td><i class="bi bi-arrows-expand"></i> Lungime</td>
                    <td><%= p.lungime_mm %> mm</td>
                </tr>
                <tr>
                    <td><i class="bi bi-palette2"></i> Finisaj</td>
                    <td><%= p.finisaj.charAt(0).toUpperCase() + p.finisaj.slice(1) %></td>
                </tr>
                <tr>
                    <td><i class="bi bi-tags"></i> Certificări</td>
                    <td><%= p.certificatText || '—' %></td>
                </tr>
                <tr>
                    <td><i class="bi bi-calendar-event"></i> Adăugat</td>
                    <td><time datetime="<%= dataISO %>"><%= dataFormatata %></time></td>
                </tr>
                <tr>
                    <td><i class="bi bi-truck"></i> Livrare rapidă</td>
                    <td>
                        <% if (p.livrare_rapida) { %>
                            <span class="badge bg-success">Da</span>
                        <% } else { %>
                            <span class="badge bg-danger">Nu</span>
                        <% } %>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
```

**Ce conține cardul**: imaginea în stânga și tabelul cu caracteristicile relevante în dreapta.

**Ce respectă din cerință**:
- `article` cu heading de nivel corespunzător;
- categoria mare în subtitlu;
- descrierea sub categorie;
- tabel cu două coloane pentru caracteristicile importante;
- data în tagul `<time>` și în format românesc;
- imaginea este separată și mică, astfel încât să se așeze bine lângă tabel.

### 4.4 Modalul de produs

#### Structura modalului - [views/pagini/produse.ejs](views/pagini/produse.ejs#L290)

```ejs
<div id="modal-produs" class="modal-produs" aria-hidden="true" hidden>
    <div class="modal-produs-box" role="dialog" aria-modal="true" aria-labelledby="modal-produs-titlu">
        <button type="button" class="modal-produs-inchide" id="modal-produs-inchide" aria-label="Închide modalul">×</button>
        <div class="modal-produs-media">
            <img id="modal-produs-imagine" alt="Imagine produs">
            <div class="modal-produs-controls">
                <button type="button" class="btn btn-outline-light" id="modal-produs-prev"><i class="bi bi-chevron-left"></i></button>
                <button type="button" class="btn btn-outline-light" id="modal-produs-next"><i class="bi bi-chevron-right"></i></button>
            </div>
        </div>
        <div class="modal-produs-info">
            <h3 id="modal-produs-titlu"></h3>
            <div id="modal-produs-badges" class="modal-produs-badges"></div>
            <p id="modal-produs-descriere"></p>
            <ul id="modal-produs-detalii"></ul>
            <a id="modal-produs-link" class="btn btn-primary" href="#">Vezi pagina produsului</a>
        </div>
    </div>
</div>
```

**Rol**: permite afișarea rapidă a detaliilor produsului direct pe pagina de produse, fără navigare separată.

**Cum ajunge utilizatorul în pagina produsului unic**: produsul are trei puncte de acces clare către `/produs/:id`: imaginea, titlul și butonul de detalii. Asta e important pentru prezentare, fiindcă pagina individuală nu există doar în rută, ci este și accesibilă logic din listarea produselor.

### 4.5 JavaScript-ul paginii

#### Inițializare - [views/pagini/produse.ejs](views/pagini/produse.ejs#L320)

```js
const elementePerPagina = <%= elementePerPagina %> || 6;

const stare = {
    pagina: 1,
    totalPagini: 1,
    produseCurente: [],
    produsModal: null,
    indexImagineModal: 0
};
```

**Rol**: păstrează starea curentă a paginii, inclusiv pagina din paginare și produsul deschis în modal.

#### Încărcarea prin `fetch()` - [views/pagini/produse.ejs](views/pagini/produse.ejs#L414)

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

**Ce face**: transmite filtrele către server și reface pagina în funcție de rezultatele returnate.

**Cum curăț datele înainte de trimitere**: în `citesteFiltre()` folosesc `trim()` pentru text și textarea, citesc opțiunile din `selectedOptions` pentru filtrul multiplu și trimit checkbox-ul ca `true/false`. Asta înseamnă că serverul primește exact starea reală a inputurilor, nu texte cu spații sau valori parțiale.

```js
return {
    nume: inputNume.value.trim(),
    pretMin: inputPretMin.value,
    pretMax: inputPretMax.value,
    lungime: inputLungime.value.trim(),
    finisaj: selectFinisaj.value,
    certificari: certificariSelectate.join(','),
    livrare: checkLivrare.checked ? 'true' : 'false',
    aplicatie: selectAplicatie.value,
    descriere: textareaDescriere.value.trim(),
    sortDirectie: sortDirectieCurenta
};
```

**Ce se validează înainte de filtrare/sortare/calculare**: textul din nume și textarea-ul din descriere. Dacă apar caractere nepermise sau textul din descriere este prea scurt, opresc operația și marchez câmpul cu `is-invalid`.

**Cum funcționează resetarea**: la apăsarea butonului de reset, utilizatorul primește `confirm()`. Dacă apasă OK, toate filtrele revin la valorile implicite, sortarea revine pe crescător, se șterg stările de invalid și se reîncarcă toate produsele în ordinea inițială.

#### Paginarea - [views/pagini/produse.ejs](views/pagini/produse.ejs#L512)

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

**Rol**: creează butoanele de paginare într-un mod simplu și eficient.

**De ce paginarea vine după filtrare**: mai întâi reduc lista la produsele care respectă filtrele, apoi împart doar rezultatul rămas în pagini. Dacă aș pagina înainte și aș filtra apoi, aș ascunde rezultate corecte doar pentru că se aflau pe altă pagină.

#### Validarea și resetarea - [views/pagini/produse.ejs](views/pagini/produse.ejs#L682)

```js
const campuriAutoFiltrare = [inputNume, inputPretMin, inputPretMax, inputLungime, selectFinisaj, selectCertificari, checkLivrare, selectAplicatie, textareaDescriere];
campuriAutoFiltrare.forEach((camp) => {
    const tipEveniment = (camp.tagName === 'INPUT' && (camp.type === 'text' || camp.type === 'range')) || camp.tagName === 'TEXTAREA' ? 'input' : 'change';
    camp.addEventListener(tipEveniment, () => incarcaProduse(1, false));
});
```

**Ce face**: când utilizatorul modifică orice filtru, pagina se reîncarcă automat în prima pagină de rezultate.

**Despre textarea**: inputul de descriere este un `textarea` cu floating label; în CSS există și starea `.is-invalid`, astfel încât, dacă validarea este setată din JavaScript, elementul se poate marca vizual corect.

**Cum sunt gestionate elementele de sortare**: selectarea cheilor și a direcției declanșează re-filtrarea și re-sortarea imediată a produselor. Aceasta se aplică atât în mod client-side (reordonând și re-randând DOM-ul local), cât și server-side (trimițând parametrii prin API).

---

## 5. Pagina produsului unic

**Fișier**: [views/pagini/produs.ejs](views/pagini/produs.ejs)

Pagina produsului unic afișează toate detaliile care nu apar în lista compactă de produse.

#### Caruselul de imagini - [views/pagini/produs.ejs](views/pagini/produs.ejs#L25)

```ejs
<div class="produs-imagine-carousel" id="produs-imagine-carousel" data-imagini='<%- JSON.stringify(produs.imagine_varianta || ["/resurse/imagini/galerie/" + produs.imagine]) %>'>
    <img src="<%= (produs.imagine_varianta && produs.imagine_varianta.length > 0) ? produs.imagine_varianta[0] : '/resurse/imagini/galerie/' + produs.imagine %>"
        alt="<%= produs.nume %>" class="img-fluid" id="produs-imagine-curenta">
    <div class="produs-imagine-controls">
        <button type="button" class="btn btn-outline-primary" id="produs-imagine-prev" title="Imaginea precedentă">
            <i class="bi bi-chevron-left"></i>
        </button>
        <span id="produs-imagine-indicator"></span>
        <button type="button" class="btn btn-outline-primary" id="produs-imagine-next" title="Imaginea următoare">
            <i class="bi bi-chevron-right"></i>
        </button>
    </div>
</div>
```

**Ce face**: permite parcurgerea imaginilor alternative ale produsului.

#### Certificările pe pagina detaliată - [views/pagini/produs.ejs](views/pagini/produs.ejs#L87)

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

**Ce face**: acceptă atât forma de vector, cât și forma CSV pentru certificări și le afișează ca badge-uri.

**De ce este important**: evită eroarea de runtime și face template-ul mai robust.

---

## 6. Tema și footerul global

**Fișier**: [views/fragmente/footer.ejs](views/fragmente/footer.ejs)

#### Selectorul de temă - [views/fragmente/footer.ejs](views/fragmente/footer.ejs#L26)

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

**Ce face**: oferă schimbarea între trei teme, folosind un element Bootstrap în locul unui comutator simplu.

**De ce este acceptabil**: cerința permite înlocuirea switch-ului cu alt element Bootstrap atunci când există mai multe teme.

**Cum reține site-ul tema**: la schimbare, salvez valoarea aleasă în `localStorage` sub cheia `sv-tema`. `localStorage` este persistent, deci nu se pierde la refresh și nu se pierde când treci pe altă pagină. La încărcare citesc aceeași cheie și reaplic tema înainte să interacționeze utilizatorul cu pagina.

```js
const temaSalvata = temeValide.has(localStorage.getItem("sv-tema")) ? localStorage.getItem("sv-tema") : "dark";
aplicaTema(temaSalvata);
```

**De ce poate fi doar `dark`, `light` sau `copper`**: înainte să aplic tema, verific dacă valoarea din `localStorage` este una validă. Dacă nu este, revin la `dark`.

**Cum se schimbă efectiv tema pe site**: funcția `aplicaTema()` scoate clasele vechi de pe `body` și adaugă clasa noii teme, iar CSS-ul se ocupă de culori.

#### Scriptul de memorie al temei - [views/fragmente/footer.ejs](views/fragmente/footer.ejs#L55)

```js
function aplicaTema(tema) {
    document.body.classList.remove("tema-light", "tema-copper");
    if (tema === "light") {
        document.body.classList.add("tema-light");
    } else if (tema === "copper") {
        document.body.classList.add("tema-copper");
    }
}

const temaSalvata = temeValide.has(localStorage.getItem("sv-tema")) ? localStorage.getItem("sv-tema") : "dark";
aplicaTema(temaSalvata);
```

**Ce face**: citește tema din `localStorage`, o aplică pe `<body>` și o păstrează la următoarele încărcări.

**Explicație scurtă de prezentare**: `localStorage` este memoria persistentă a browserului. Îl folosesc pentru temă tocmai ca să nu pierd alegerea după refresh sau după navigarea pe altă pagină.

---

## 7. Customizarea Bootstrap în SASS

**Fișier**: [resurse/scss/custom.scss](resurse/scss/custom.scss)

Etapa 6 cere folosirea Bootstrap, dar cu personalizare în SASS pentru inputuri și butoane. În proiect, aceste ajustări sunt făcute înainte de importul Bootstrap, astfel încât frameworkul preia valorile noastre.

#### Culori, breakpoints și raze - [resurse/scss/custom.scss](resurse/scss/custom.scss#L9)

```scss
$sv-orange:   #f99b41;
$sv-dark:     #1c2b39;
$sv-deep:     #0f1c27;
$sv-mid:      #2c3e50;
$sv-light:    #e8edf2;

$grid-breakpoints: (
  xs:  0,
  sm:  540px,
  md:  860px,
  lg:  1220px,
  xl:  1500px,
  xxl: 1700px
);

$border-radius:        0.65rem;
$btn-border-width:     2px;
```

**Ce face**: definește schema cromatică și proprietățile vizuale ale Bootstrap pentru proiect.

**De ce este important**: rezolvă cerința cu butoane și inputuri stilizate prin variabile SASS, nu prin suprascrieri punctuale în HTML.

#### Range slider - [resurse/scss/custom.scss](resurse/scss/custom.scss#L116)

```scss
$form-range-thumb-width:            1.5rem;
$form-range-thumb-height:           1.5rem;
$form-range-thumb-bg:               $sv-orange;
$form-range-thumb-border:           0;
$form-range-track-bg:               color.adjust($sv-dark, $lightness: 12%);
$form-range-track-height:           0.4rem;
```

**Ce face**: mărește bulina sliderului, schimbă culoarea ei și schimbă culoarea sliderului.

**Legătura cu cerința**: bulina are dimensiunea cerută de aproximativ 50% peste fontul de bază, iar stilul este uniform cu restul temei.

**Cum am făcut asta în Bootstrap**: nu am scris CSS separat pentru slider, ci am setat variabilele Bootstrap dedicate. `form-range-thumb-width` și `form-range-thumb-height` controlează dimensiunea bulinei, `form-range-thumb-bg` îi schimbă culoarea, iar `form-range-track-bg` modifică șina sliderului. Asta înseamnă că toate range-urile din pagină primesc automat același stil.

**Ce este important la prezentare**: dacă te întreabă de ce bulina este mai mare, poți spune că am calculat-o pornind de la fontul de bază și am setat-o la aproximativ 1.5rem, adică 50% mai mare decât 1rem.

#### Inputuri și butoane - [resurse/scss/custom.scss](resurse/scss/custom.scss#L99)

```scss
$input-bg:            color.adjust($sv-dark, $lightness: 5%);
$input-color:         $sv-light;
$input-border-color:  $sv-orange;

$btn-padding-y:       0.55rem;
$btn-padding-x:       1.2rem;
$btn-font-weight:     600;
$btn-border-radius:   $border-radius;
```

**Ce face**: controlează forma, grosimea și culoarea butoanelor și a inputurilor Bootstrap.

**Efect practic**: inputurile și butoanele de pe pagina de produse arată coerent cu tema SteelVector și sunt dimensionate prin clase Bootstrap, nu prin stiluri inline.

---

## 8. Stilizarea specifică paginii de produse

**Fișier**: [resurse/css/produse.css](resurse/css/produse.css)



#### Zona de filtre - [resurse/css/produse.css](resurse/css/produse.css#L31)

```css
#sectiune-filtre {
  background-color: rgba(28, 43, 57, 0.85);
  border: 2px solid rgba(249, 155, 65, 0.35);
  border-radius: 0.65rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(6px);
}
```

**Ce face**: separă vizual zona de filtre de zona de afișare a produselor.

#### Produse și carduri - [resurse/css/produse.css](resurse/css/produse.css#L112)

```css
#zona-produse {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
}

.produs-card {
  flex: 1 1 100%;
  max-width: 100%;
  background-color: #1c2b39;
  border: 2px solid rgba(249, 155, 65, 0.3);
  border-radius: 0.65rem;
  overflow: hidden;
}
```

**Ce face**: afișează produsele fie pe grid flexibil, fie pe o singură coloană pe ecrane mici.

#### Stilizarea validării și a componentei modal - [resurse/css/produse.css](resurse/css/produse.css#L43)

```css
#sectiune-filtre .form-control.is-invalid,
#sectiune-filtre .form-select.is-invalid {
  border-color: #e74c3c;
  box-shadow: 0 0 0 0.2rem rgba(231, 76, 60, 0.25);
}

.modal-produs { ... }
.modal-produs-box { ... }

#paginare-produse.paginare-produse {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  margin-bottom: 2rem;
}
```

**Ce face**: pregătește vizual starea de eroare pentru inputuri, stilizează modalul produsului și folosește un container de tip `<div>` (în loc de `<nav>`) pentru a anula stilul global `nav` fixed al barei de navigare principale, plasând paginarea corect în fluxul normal al paginii, la sfârșitul listei de produse, fără a mai fi nevoie de reguli `!important`.

---

## 9. Verificări și corecturi

În timpul implementării au fost validate separat template-urile și ruta de produse. Codul a fost verificat pentru sintaxă și pentru randarea corectă a paginii, iar meniul de produse a fost conectat la categoriile încărcate din baza de date.

**Fișierele principale implicate**:
- [index.js](index.js)
- [views/fragmente/header.ejs](views/fragmente/header.ejs)
- [views/pagini/produse.ejs](views/pagini/produse.ejs)
- [views/pagini/produs.ejs](views/pagini/produs.ejs)
- [views/fragmente/footer.ejs](views/fragmente/footer.ejs)
- [resurse/scss/custom.scss](resurse/scss/custom.scss)
- [resurse/css/produse.css](resurse/css/produse.css)
- [resurse/css/general.css](resurse/css/general.css)

**Concluzie tehnică**: etapa 6 este concentrată pe afișarea produselor, pe filtrarea și sortarea controlată din JavaScript, pe navigarea din meniu, pe tema memorată și pe prezentarea detaliilor complete ale unui produs într-o pagină separată.