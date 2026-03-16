# SteelVector
## Etapa 1: Structura HTML și Conținut Semantic

Acesta reprezintă prima etapă a site-ului **SteelVector**, o platformă dedicată distribuției de structuri metalice și europrofile pentru hale industriale. 

### Indexul Task-urilor

Tabelul de mai jos corelează cerințele proiectului cu liniile de cod corespunzătoare din fișierul `index.html` pentru a facilita prezentarea.

| Task | Linii Cod | Descriere Implementare |
| :--- | :--- | :--- |
| **1.1** | 1, 2 | Declarație `DOCTYPE` și atributul `lang="ro"` pentru document. |
| **1.2** | 4-10 | Meta tag-uri obligatorii: `charset`, `author`, `description`, `keywords`, `viewport`. |
| **1.3** | În text | Integrarea cuvintelor cheie: *oțel, hale, profile, grinzi, IPE, HEB, construcții*. |
| **1.4** | 12-19 | Configurare Favicon: folder dedicat, manifest și `msapplication-TileColor`. |
| **1.5** | 29, 49, 429 | Structură semantică principală: `<header>`, `<main>`, `<footer>`. |
| **1.6** | 52, 118, 331 | Organizare conținut: `<section>` și `<article>` (secțiuni imbricate în Main). |
| **1.7** | 53-56 | Grupare titlu și subtitlu folosind tag-ul `<hgroup>`. |
| **1.8** | 30-47 | Sistem de navigare (`nav`) cu liste imbricate și titlu principal `h1`. |
| **1.9** | 62, 153, 154 | Elemente de grupare: paragrafe (`p`), citat (`blockquote`), listă definiții (`dl`). |
| **1.10** | 134-148 | Secțiune evenimente: listă `ul`, date cu `<time>` și nume marcat cu `<b>`. |
| **1.11** | 78-87 | Imagine responsivă cu `<picture>`, variante (mobil/desktop), `figure` și `figcaption`. |
| **1.12.1**| 60, 120, 137 | Marcarea cuvintelor cheie în text folosind tag-ul `<b>`. |
| **1.12.2**| 126, 142 | Terminologie tehnică marcată cu tag-ul `<i>`. |
| **1.12.3**| 124 | Evidențiere corecții: text șters (`<s>`) și text inserat (`ins`). |
| **1.12.4**| 128 | Abrevieri relevante cu tag-ul `<abbr>` și atributul `title`. |
| **1.12.5**| 155 | Definirea termenilor noi folosind tag-ul `<dfn>`. |
| **1.12.6**| 266 | Notificări urgente/importante marcate cu `<strong>`. |
| **1.13.1**| 371 | Link extern către Wikipedia cu deschidere în tab nou (`target="_blank"`). |
| **1.13.2**| 371 | Link extern lung formatat cu `<wbr>` pentru rupere rând controlată. |
| **1.13.3**| 457 | Navigare rapidă: link "Mergi sus" în footer (`href="#"`). |
| **1.13.4**| 90-93 | Imagine-link: click pe imagine (`a > img`) pentru vizualizare la rezoluție mare. |
| **1.13.5**| 95 | Link de tip `download` cu redenumirea fișierului la descărcare. |
| **1.14** | 380-398 | Iframe YouTube interactiv cu link-uri de control (target către iframe). |
| **1.15** | 211-265 | Tabel complex: `thead`, `tbody`, `tfoot`, `rowspan`, `colspan` și `caption`. |
| **1.16** | 316-327 | Secțiune FAQ interactivă folosind `<details>` și `<summary>`. |
| **1.17** | 149, 166 | Monitorizare stocuri/satisfacție folosind tag-ul `<meter>`. |
| **1.18** | 430-455 | Informații contact (`address`): tel, email, WhatsApp, locație Maps. |
| **1.19** | 460-463 | Copyright: simbol special, tag-ul `<small>` și data marcată cu `<time>`. |

### Bonusuri Implementate

* **MathML (Liniile 400-417):** Formulă matematică complexă pentru calculul greutății specifice a țevilor.
* **Afișare PDF (Liniile 421-424):** Catalogul tehnic integrat direct în pagină prin tag-ul `<embed>`.
* **Harta de Imagini (Liniile 335-351):** Navigare vizuală folosind `<map>` și `<area>` (forme: `rect`, `circle`, `poly`).
* **Google Maps Iframe (Liniile 446-454):** Integrare hartă interactivă pentru sediul facultății.

## Etapa 2: Stilizare CSS și Layout Responsive

În această etapă s-a realizat designul vizual, poziționarea elementelor și adaptabilitatea site-ului pe diferite dimensiuni de ecran. 

**Justificarea Schemei Cromatice:** S-a ales o combinație de Albastru Marin/Oțel (siguranță, industrial) și Portocaliu (atenție, șantier, dinamic) pentru a obține un contrast puternic și a ghida utilizatorul vizual (F-pattern pentru zona de prezentare).

### Indexul Task-urilor

| Task | Fișier și Linii | Descriere Implementare |
| :--- | :--- | :--- |
| **Schema Cromatică** | `general.css`: 59-67 | Definirea a 5 culori prin variabile CSS în `body` și utilizarea lor (`var()`). |
| **Design Rudimentar** | `general.css`: 80-85, 104-118 | Izolare cu 3 efecte (`border`, `background`, `border-radius`), spațiere cu `gap`, imagini cu `width` și `min-width`. |
| **Layout Responsive** | `general.css`: 93-102, 310-360 | Sistem CSS Grid (`grid-template-areas`) asimetric. Media queries pt. 2 coloane (1200px) și o coloană mobil (700px). Font tranzitat. |
| **Iconuri & Font Extern** | `index.html`: 24, 64 | Import Google Fonts și FontAwesome CDN. Iconiță statică și una animată (`fa-shake`) în meniu. |
| **Stilizare Tabel** | `general.css`: 180-230 | Capțiune jos (`caption-side`), borduri alternate (`nth-child`), delimitatoare groase și hover animat cu umbră internă. |
| **Stilizare Taburi** | `general.css`: 140-178 | Layout elemente iframe cu Flexbox. Efect de subliniere animată la hover folosind pseudo-elementul `::after`. |
| **Link Top** | `index.html`: 462<br>`general.css`: 232-280 | Buton `fixed`, semi-transparent, săgeată centrată `&#129081;`, rotație -15deg, scalare și tooltip afișat din CSS (`::after`). |

### Bonusuri Implementate (Etapa 2)

* **Reset CSS și Unități Relative (`general.css`: 1-57):** CSS Reset. Redefinirea elementelor de bază (`h1-h6`, liste) folosind strict unități relative (`rem`).
* **Stilizare MathML (`general.css`: 282-308):** Stilizare avansată a formulei. Culori, grosimi și opacități diferite pentru variabile (`mi`), operatori (`mo`) și exponenți (`mn`).
---
*Proiect realizat de: **Flintasu Bogdan Ionut***
