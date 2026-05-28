# SteelVector — Centralizator Cerințe Implementate (TW)

Acest document reprezintă indexul complet al cerințelor implementate pentru site-ul **SteelVector** în cadrul tuturor etapelor de dezvoltare. Tabelul corelează fiecare cerință a proiectului cu fișierele și liniile de cod unde poate fi găsită implementarea.

---

## 1. Etapa 1: Structura HTML și Conținut Semantic

Toate cerințele acestei etape sunt implementate în fișierul [index.html](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.html) (sau în template-ul principal corespunzător [index.ejs](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/index.ejs)).

| Task | Fișier și Linii | Descriere Implementare |
| :--- | :--- | :--- |
| **1.1** | `index.ejs`: 1, 2 | Declarație `DOCTYPE` și atributul `lang="ro"` pentru document. |
| **1.2** | `index.ejs`: 4-10 | Meta tag-uri obligatorii: `charset`, `author`, `description`, `keywords`, `viewport`. |
| **1.3** | `index.ejs`: În text | Integrarea cuvintelor cheie: *oțel, hale, profile, grinzi, IPE, HEB, construcții*. |
| **1.4** | `index.ejs`: 12-19 | Configurare Favicon: folder dedicat, manifest și `msapplication-TileColor` (în [head.ejs](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/fragmente/head.ejs)). |
| **1.5** | `index.ejs`: 17, 18, 486 | Structură semantică principală: `<header>`, `<main>`, `<footer>` (în fragmente). |
| **1.6** | `index.ejs`: 20, 98, 130 | Organizare conținut: `<section>` și `<article>` (secțiuni imbricate în Main). |
| **1.7** | `index.ejs`: 21-24 | Grupare titlu și subtitlu folosind tag-ul `<hgroup>`. |
| **1.8** | `header.ejs`: 1-42 | Sistem de navigare (`nav`) cu liste imbricate și titlu principal `h1` în antet. |
| **1.9** | `index.ejs`: 26, 30, 133 | Elemente de grupare: paragrafe (`p`), citat (`blockquote`), listă definiții (`dl`). |
| **1.10** | `index.ejs`: 304-344 | Secțiune evenimente: listă `ul`, date cu `<time>` și nume marcat cu `<b>`. |
| **1.11** | `index.ejs`: 51-59 | Imagine responsivă cu `<picture>`, variante (mobil/desktop), `figure` și `figcaption`. |
| **1.12.1**| `index.ejs`: 29-33 | Marcarea cuvintelor cheie în text folosind tag-ul `<b>`. |
| **1.12.2**| `index.ejs`: 102, 116 | Terminologie tehnică marcată cu tag-ul `<i>`. |
| **1.12.3**| `index.ejs`: 102, 418 | Evidențiere corecții: text șters (`<s>`) și text inserat (`ins`). |
| **1.12.4**| `index.ejs`: 104 | Abrevieri relevante cu tag-ul `<abbr>` și atributul `title`. |
| **1.12.5**| `index.ejs`: 134 | Definirea termenilor noi folosind tag-ul `<dfn>`. |
| **1.12.6**| `index.ejs`: 290 | Notificări urgente/importante marcate cu `<strong>`. |
| **1.13.1**| `index.ejs`: 408-412 | Link extern către Wikipedia cu deschidere în tab nou (`target="_blank"`). |
| **1.13.2**| `index.ejs`: 410 | Link extern lung formatat cu `<wbr>` pentru rupere rând controlată. |
| **1.13.3**| `footer.ejs`: 20-30 | Navigare rapidă: link "Mergi sus" în footer (`href="#"`). |
| **1.13.4**| `index.ejs`: 71-75 | Imagine-link: click pe imagine (`a > img`) pentru vizualizare la rezoluție mare. |
| **1.13.5**| `index.ejs`: 77-78 | Link de tip `download` cu redenumirea fișierului la descărcare. |
| **1.14** | `index.ejs`: 423-442 | Iframe YouTube interactiv cu link-uri de control (target către iframe). |
| **1.15** | `index.ejs`: 217-291 | Tabel complex: `thead`, `tbody`, `tfoot`, `rowspan`, `colspan` și `caption`. |
| **1.16** | `index.ejs`: 345-359 | Secțiune FAQ interactivă folosind `<details>` și `<summary>`. |
| **1.17** | `index.ejs`: 127, 144 | Monitorizare stocuri/satisfacție folosind tag-ul `<meter>`. |
| **1.18** | `footer.ejs`: 1-18 | Informații contact (`address`): tel, email, WhatsApp, locație Maps. |
| **1.19** | `footer.ejs`: 24-26 | Copyright: simbol special, tag-ul `<small>` și data marcată cu `<time>`. |

---

## 2. Etapa 2: Stilizare CSS și Layout Responsive

Toate regulile acestei etape sunt compilate din SASS direct în fișierele CSS corespunzătoare.

| Task | Fișier și Linii | Descriere Implementare |
| :--- | :--- | :--- |
| **Schema Cromatică** | `custom.scss`: 9-31 | Definirea a 5 culori prin variabile SASS în `body` și utilizarea lor (`var()`). Justificare: Albastru Marin/Oțel (industrial) combinat cu Portocaliu (dinamic). |
| **Design Integrat** | `general.css` | Izolare elemente cu efecte (`border`, `background`, `border-radius`), spațiere uniformă (`gap`), imagini responsive. |
| **Layout Responsive** | `general.css` | Sistem CSS Grid (`grid-template-areas`) asimetric. Media queries pentru 2 coloane (sub `1220px`) și o singură coloană pe mobil (sub `860px`). |
| **Iconuri & Font Extern** | `head.ejs`: 4-10 | Import Google Fonts (Merriweather, Saira) și font-awesome CDN. Utilizare iconiță animată (`fa-shake`) în meniu. |
| **Stilizare Tabel** | `general.css` | Capțiune jos (`caption-side`), borduri alternate (`nth-child`), delimitatoare groase și hover animat cu umbră internă. |
| **Stilizare Taburi** | `general.css` | Layout elemente iframe cu Flexbox. Efect de subliniere animată la hover folosind pseudo-elementul `::after`. |
| **Link Top** | `general.css` | Buton `fixed`, semi-transparent, săgeată centrată `&#129081;`, rotație -15deg, scalare și tooltip afișat din CSS (`::after`). |

---

## 3. Etapa 5: SCSS Automat · Bootstrap Custom · Efecte CSS · Galerie Statică & Animată

Această secțiune detaliază cerințele Etapa 5 realizate în SASS, Node.js și EJS.

### A. Compilare Automată SCSS
- **FolderScss și FolderCss globale**: Definite în obiectul global în [index.js](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/index.js) (Liniile 10-11) utilizând `__dirname`.
- **Folderul backup**: Adăugat la folderele create automat în `index.js` (Linia 37: `vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"]`).
- **Funcția de compilare**: `compileazaScss(caleScss, caleCss)` implementată în [scss-compiler.js](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/lib/scss-compiler.js) (Linia 45). Rezolvă căile relative față de `folderScss` / `folderCss` și compilează cu pachetul `sass`. Dacă calea CSS lipsește, se salvează în `folderCss` cu extensia `.css` (Liniile 12-23).
- **Copiere în backup**: Înainte de compilare, fișierul CSS vechi este copiat în `backup/resurse/css` recursiv în `scss-compiler.js` (Liniile 25-43). Fișierul backup are formatul `${numeCss}_${Date.now()}.css` (Linia 37).
- **Excluderea fișierelor cu prefix `_`**: Fișierele SCSS care încep cu `_` (partiale SCSS, de exemplu `_variabile.scss`) sunt excluse din compilarea automată, deoarece sunt importate de alte fișiere SCSS. Implementat atât în `colecteazaScss()` (Linia 85) cât și în callback-ul `proceseaza()` din watcher (Linia 103).
- **Compilare inițială**: La pornirea serverului, se apelează `compileazaToateScss()` în `index.js` (Linia 492).
- **Compilare pe parcurs**: Monitorizare recursivă a modificărilor folosind `fs.watch()` în `scss-compiler.js` (Liniile 98-154) apelată în `index.js` (Linia 493).
- **Generare SCSS galerie animată**: Funcția `genereazaScssGalerieAnimata(n)` din `index.js` (Liniile 353-459) generează dinamic fișierul SCSS cu keyframes-urile animației, iar apoi `compileazaScss("galerie-animata.scss")` este apelată în ruta `/despre` (Linia 579) pentru a compila fișierul generat.

---

### B. Customizare Bootstrap
Toate variabilele Bootstrap sunt personalizate în [custom.scss](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/custom.scss) înainte de importul bibliotecii:
- **Culori fundal (minim 2 teme)**:
  1. Tema 1: **Steel Dark** (implicită) -> Fundal prim `$body-bg: $sv-deep` (Linia 35) și text `$body-color: $sv-light` (Linia 36).
  2. Tema 2: **Steel Light** (deschisă) -> Aplicată prin clasa `.tema-light` (Liniile 140-172) cu fundal `#dfe6ed` și text `#1c2b39`.
- **Culori font (litere)**: Butoane primare (text alb pe portocaliu) -> `$btn-color: #fff` (Linia 41); Badge warning text inchis -> `$badge-color: $sv-deep` (Linia 43).
- **Dimensiuni ecran personalizate**: Medii (`md: 860px`) și Mari (`lg: 1220px`) în `$grid-breakpoints` (Liniile 58-65) și `$container-max-widths` (Liniile 68-74).
- **Dimensiunea razelor de border**: `$border-radius: 0.65rem` (Linia 77), `$border-radius-lg: 0.9rem` (Linia 79).
- **Dimensiunea heading-urilor**: `$h1-font-size: 2.8rem` (Linia 84) până la `$h6-font-size: 0.95rem` (Linia 89).
- **Familia de font implicită**: `$font-family-sans-serif: "Saira", ...` (Linia 51), `$headings-font-family: "Merriweather", ...` (Linia 52).
- **Variabile suplimentare alese**: `$card-bg: $sv-dark` (Linia 102), `$input-bg` (Linia 97), `$modal-content-bg` (Linia 107), `$navbar-dark-color` (Linia 114).
- **Corectare Bootstrap**: Fișierul [overrides.scss](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/overrides.scss) este importat la finalul `custom.scss` (Linia 128) pentru a anula interferențele Bootstrap pe navigație, tabele și liste.
- **Elemente demonstrative**: Butoane cu temă custom, Alert și Cards integrate în [despre.ejs](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs) (Liniile 125-171) și `index.ejs` (Liniile 61-70).

---

## 4. Centralizator Efecte CSS Alese (0.55p realizat din 0.25p minim)

Toate efectele sunt implementate în fișierul [effects.scss](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/effects.scss).

1. **(0.025p) ::selection Customizat**: Schimbă culoarea de selecție în portocaliu brand cu umbră eliminată (`effects.scss`: Liniile 7-12).
2. **(0.025p) column-count**: Text pe două coloane cu linie despărțitoare portocalie pe ecrane mari, și o singură coloană pe ecrane mici/medii (`effects.scss`: Liniile 30-41 pe secțiunea `#anunturi ul`).
3. **(0.05p) Text marquee animat**: Animație keyframes recurentă pe elementul `.marquee` care nu generează scrollbar orizontal (`effects.scss`: Liniile 44-67).
4. **(0.05p) Background fix la scroll**: Imagine de fundal fixă (`background-attachment: fixed`) pe secțiunea `#prezentare` care se schimbă ciclic printr-o animație keyframes (`effects.scss`: Liniile 68-82).
5. **(0.05p) Tabel responsiv**: Reconstituie celulele tabelului `#tab-orar` sub formă de blocuri verticale pe ecran mobil folosind pseudo-elementul `::before` și atributul `data-label` (`effects.scss`: Liniile 84-140).
6. **(0.1p) [INDIVIDUAL] Stilizare `<hr>`**: Elementul `<hr class="metal">` este stilizat sub formă de bară metalică cu gradient liniar repetitiv orizontal (to bottom) și colțuri rotunjite conform imaginii model (`effects.scss`: Liniile 14-27).
7. **(0.05p) Background Video**: Videoclip integrat pe fundalul secțiunii `#video-bg-section` conform practicilor CSS-Tricks, cu overlay de gradient și text centrat (`effects.scss`: Liniile 240-300).
8. **(0.05p) [INDIVIDUAL] Efect Duotone**: Efect duotone realizat prin `mix-blend-mode` luminos pe pseudo-elementele `.duotone-wrapper`. La hover trece treptat într-o schemă cromatică diferită (`effects.scss`: Liniile 142-174).
9. **(0.15p) [INDIVIDUAL] Reflexie Text (efect-css-reflexie-text)**: Reflexie pe text (heading) rotit oblic la un unghi de -45 de grade, realizată portabil pe toate browserele prin pseudo-elemente, transformări 3D, blur (filter: blur) și alungire controlată (scaleY) pe starea de `:hover` (`effects.scss`: Liniile 175-210).

---

## 5. Galerie Statică & Galerie Dinamică (Animată)

Proiectul conține ambele tipuri de galerii, care se bazează pe același set de imagini, dar cu comportamente și pagini diferite.

### A. Galerie Statică
- **Fragment EJS Reutilizabil**: Implementată ca fragment unic în [galerie.ejs (fragment)](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/fragmente/galerie.ejs), inclus atât în homepage ([index.ejs](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/index.ejs): Linia 401) cât și pe pagina principală consolidată [despre.ejs](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs) (Linia 46).
- **Date din JSON**: Citește din `galerie.json` proprietățile `"cale_galerie"`, `"cale_relativa"`, `"nume"`, `"descriere"`, `"timp"`.
- **Filtrare pe interval orar**: Serverul transmite doar imaginile adecvate orei curente (sau parametrului de override). Logică filtrare în `index.js`: Liniile 528-540 (Homepage) și 545-586 (Ruta Despre).
- **Număr multiplu de 3 (din cod)**: Numărul de imagini afișate este întotdeauna trunchiat la un multiplu de 3 prin cod pe server (`index.js`: Liniile 534-535 pe Homepage și Liniile 561-562 pe Despre), indiferent de câte imagini sunt disponibile.
- **Counter CSS**: Indexare automată cu litere mari (A, B, C...) la începutul descrierii folosind CSS counter `galerie-index` în [galerie.scss](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/resurse/scss/galerie.scss) (Liniile 4, 10, 42-46).
- **Sistem Responsiv & Grid**:
  - **Ecran mediu (860–1219px) — Layout Checkerboard**: Doar pe ecranele medii se aplică layoutul de tip tablă de șah / asimetric conform schemei grafice cerute, realizat prin CSS Grid pe 4 coloane cu `nth-child` offset (`galerie.scss`: Liniile 56-73):
    - Row 1: Left square (Cols 1-2), Right square (Cols 3-4).
    - Row 2: Center square (Cols 2-3). Columns 1 and 4 are empty.
    - Row 3: Left square (Cols 1-2), Right square (Cols 3-4). Ș.a.m.d.
  - **Ecran mare (≥1220px) — Grid 3 Coloane**: Layout uniform cu 3 coloane egale (`galerie.scss`: Liniile 75-82).
  - **Ecran mic** (sub `860px`): O singură coloană (`galerie.scss`: Liniile 84-89).
- **Rezoluții & Sharp**: Imaginile folosesc tag-ul `<picture>` cu `srcset` pentru mobil (`_sm`) și tabletă (`_md`). Versiunile reduse sunt generate automat pe server la pornire folosind pachetul `sharp` (`index.js`: Liniile 316-351).
- **Tranziție Hover**: La hover, imaginea se rotește rapid la 360deg, se mărește cu 50% (scale 1.5) și își rotunjește colțurile în 0.6 secunde (`galerie.scss`: Liniile 27-34).
- **Atribuire CC-BY**: Imaginea `Depozit-produse-metalurgice.jpg` conține date de atribuire de autor complet salvate în JSON și afișate în figcaption sub formă de link (`galerie.ejs`: Liniile 18-20).

### B. Galerie Dinamică (Animată) — [Bonus 1]
- **Pagina de consolidare**: Ambele galerii (statică și dinamică/animată) sunt integrate pe pagina [/despre#galerie](file:///home/bogdan/VScode_projects/facultate/proiect-tw/SteelVector/views/pagini/despre.ejs) (Liniile 56-70). Rutele vechi `/galerie` și `/galerie-animata` / `/galerie-dinamica` au fost complet eliminate și returnează eroare `404 Not Found`.
- **Număr aleator de poze distincte**: La fiecare încărcare, se alege aleator dintre `9, 12 sau 15` imagini care au în JSON proprietatea `"galerie-animata": true` setată la `true` (`index.js`: Liniile 573-577). Am extins `galerie.json` la 15 imagini distincte pentru a suporta perfect această cerință.
- **Viewport strict 280x280**: Containerul `.galerie-animata-grid` are exact dimensiunea unei singure celule, ascunzând restul gridului (`width: 280px; height: 280px; overflow: hidden;`).
- **Animație Secvențială (Glisare apoi Rotație)**:
  - Glisarea se face în 4 direcții pe un grid 3xN ascuns.
  - Generarea de keyframes în `index.js` (Liniile 353-404) calculează pozițiile pe baza ordinii cerute:
    `Row 1: 1, 5, 6; Row 2: 2, 4, 3; Row 3: 8, 9, 7` ș.a.m.d.
  - **Logică Secvențială**: Fiecare pas de animație este divizat în sub-faze. Glisarea de la imaginea veche la cea nouă se face complet pe durata a 25% din pas fără nicio rotație. Doar după ce imaginea a glisat complet și s-a așezat în viewport, are loc rotația rapidă de 360deg la noul `transform-origin` (centrat exact pe imaginea curentă)!
- **Pauză la Hover**: Trecerea cursorului peste galerie pune animația pe pauză (în stylingul generat dinamic).
- **Ascundere ecran mediu și mic**: Blocată pe rezoluții sub `1100px` folosind `@media` (în stylingul generat dinamic).

---

## 6. Lista Bonusurilor Implementate (Total 0.70p)

1. **(0.50p) Bonus 1 — Galerie Animată**: Integrată pe pagina `/despre#galerie`, set de imagini aleator distincte (9, 12, 15), border-image, container de viewport 280x280, animație complexă cu glisare 4 direcții urmată de rotație centrată și pauză la hover. Rutele vechi au fost complet eliminate.
2. **(0.05p) Bonus 3 — Backup cu Timestamp**: Salvează fișierele CSS vechi în backup cu formatul `${numeCss}_${Date.now()}.css` pentru a preveni suprascrierea și a păstra istoricul versiunilor (`scss-compiler.js`: Linia 37).
3. **(0.025p) Bonus 4 — Fișiere SCSS cu Puncte în Nume**: Permite compilarea fișierelor de tipul `stil.frumos.scss` fără a le trunchia numele greșit. Rezolvat prin utilizarea proprietății `.name` a modulului `path` (`scss-compiler.js`: Linia 19).
4. **(0.05p) Bonus 5 — Validare JSON Galerie**: Funcția `verificaGalerieJSON()` rulează la pornirea serverului și verifică existența folderului `cale_galerie` și existența fizică a fiecărui fișier din vectorul de imagini pe disc (`index.js`: Linia 235).
5. **(Bonus Extra) Verificare Timp**: Am implementat un parametru de query override `?ora=X` pe rutele `/` și `/despre`, permițând oricui să testeze funcționarea timpului orar instant.
