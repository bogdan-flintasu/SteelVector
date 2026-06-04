const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Pool } = require("pg");
const { compileazaScss, compileazaToateScss, urmaresteScss } = require("./lib/scss-compiler");

// PostgreSQL connection pool
const pool = new Pool({
    user: "sv_user",
    host: "localhost",
    database: "steelvector_db",
    password: "sv_pass",
    port: 5432,
    connectionTimeoutMillis: 2000 // Așteaptă maxim 2 secunde pentru a evita blocarea în caz de offline
});

const app = express();

global.appRoot = __dirname;
global.folderScss = path.join(__dirname, "resurse", "scss");
global.folderCss = path.join(__dirname, "resurse", "css");

// nr_task 11
// Obiect global in care tinem erorile incarcate din JSON.
const obGlobal = {
    obErori: null,
    obGalerie: null
};

// nr_task 2
// Portul serverului (8080 implicit, sau cel setat in environment).
const PORT = process.env.PORT || 8080;

// nr_task 4
// Configuram EJS si folderul de views.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// nr_task 3
// Afisam informatii despre caile relevante pentru proiect.
console.log("Folder index.js (__dirname):", __dirname);
console.log("Cale fisier (__filename):", __filename);
console.log("Folder curent (process.cwd()):", process.cwd());

// nr_task 20
// Cream automat folderele necesare daca lipsesc.
const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (const numeFolder of vect_foldere) {
    const caleFolder = path.join(__dirname, numeFolder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder, { recursive: true });
    }
}

[global.folderScss, global.folderCss].forEach((caleFolder) => {
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder, { recursive: true });
    }
});

// nr_task 17
// Facem IP-ul disponibil in template-uri prin locals.
app.use((req, res, next) => {
    app.locals.ipUtilizator = req.ip;
    res.locals.ipUtilizator = req.ip;
    next();
});

// nr_task 11
// Returneaza eroarea din JSON dupa identificator sau eroarea default.
function obtineEroare(identificator) {
    if (!obGlobal.obErori || !Array.isArray(obGlobal.obErori.info_erori)) {
        return null;
    }
    const eroareGasita = obGlobal.obErori.info_erori.find(
        (elem) => elem.identificator === identificator
    );
    return eroareGasita || obGlobal.obErori.eroare_default;
}

// bonus
// Verifica structura si consistenta erori.json la pornirea serverului.
function verificaEroriJSON() {
    const caleErori = path.join(__dirname, "resurse", "json", "erori.json");

    // (0.025) Fisierul lipseste -> mesaj clar + inchidere aplicatie.
    if (!fs.existsSync(caleErori)) {
        console.error(
            `Lipseste fisierul ${caleErori}. ` +
            "Creeaza fisierul erori.json in resurse/json si reporneste serverul."
        );
        process.exit(1);
    }

    const textJson = fs.readFileSync(caleErori, "utf-8");
    let obEroriParsed;

    try {
        obEroriParsed = JSON.parse(textJson);
    } catch (err) {
        console.error(
            `erori.json nu este JSON valid. ` +
            `Detaliu parser: ${err.message}`
        );
        process.exit(1);
    }

    // (0.025) Lipsesc proprietati principale.
    const proprietatiPrincipale = ["info_erori", "cale_baza", "eroare_default"];
    for (const prop of proprietatiPrincipale) {
        if (!(prop in obEroriParsed)) {
            console.error(
                `Lipseste proprietatea principala "${prop}" in erori.json.`
            );
        }
    }

    // (0.025) Lipsesc campuri in eroare_default.
    if (obEroriParsed.eroare_default && typeof obEroriParsed.eroare_default === "object") {
        const campuriDefault = ["titlu", "text", "imagine"];
        for (const camp of campuriDefault) {
            if (!(camp in obEroriParsed.eroare_default)) {
                console.error(
                    `In eroare_default lipseste campul "${camp}".`
                );
            }
        }
    } else {
        console.error(
            "Proprietatea eroare_default lipseste sau nu este obiect."
        );
    }

    const caleBazaRelativa = String(obEroriParsed.cale_baza || "").replace(/^[/\\]+/, "");
    const folderBaza = path.join(__dirname, caleBazaRelativa);

    // (0.025) Folder cale_baza nu exista pe disc.
    if (!obEroriParsed.cale_baza || !fs.existsSync(folderBaza) || !fs.statSync(folderBaza).isDirectory()) {
        console.error(
            `Folderul din "cale_baza" nu exista pe disc: ${folderBaza}`
        );
    }

    // (0.05) Lipsesc fisiere imagine asociate erorilor.
    const verificaImagineExistenta = (numeImagine, context) => {
        if (!numeImagine) {
            console.error(`Lipseste numele imaginii pentru ${context}.`);
            return;
        }
        const caleImagine = path.join(folderBaza, numeImagine);
        if (!fs.existsSync(caleImagine) || !fs.statSync(caleImagine).isFile()) {
            console.error(
                `Fisierul imagine pentru ${context} nu exista: ${caleImagine}`
            );
        }
    };

    if (obEroriParsed.eroare_default) {
        verificaImagineExistenta(obEroriParsed.eroare_default.imagine, "eroarea default");
    }

    if (Array.isArray(obEroriParsed.info_erori)) {
        for (const eroare of obEroriParsed.info_erori) {
            verificaImagineExistenta(
                eroare.imagine,
                `eroarea cu identificator ${eroare.identificator}`
            );
        }
    } else {
        console.error("Proprietatea info_erori trebuie sa fie vector.");
    }

    // (0.2) Proprietate duplicata in acelasi obiect - verificare pe text brut.
    const obiecteDinText = textJson.match(/\{[\s\S]*?\}/g) || [];
    obiecteDinText.forEach((bloc, indexBloc) => {
        const cheiGasite = [...bloc.matchAll(/"([^"]+)"\s*:/g)].map((m) => m[1]);
        const cheiVazute = new Set();

        for (const cheie of cheiGasite) {
            if (cheiVazute.has(cheie)) {
                console.error(
                    `Proprietatea "${cheie}" este definita de mai multe ori ` +
                    `in acelasi obiect (bloc #${indexBloc + 1}).`
                );
            }
            cheiVazute.add(cheie);
        }
    });

    // (0.15) Identificatori duplicati in info_erori, cu listarea proprietatilor relevante.
    if (Array.isArray(obEroriParsed.info_erori)) {
        const eroriPeId = {};

        for (const eroare of obEroriParsed.info_erori) {
            const id = eroare.identificator;
            if (id === undefined || id === null) {
                continue;
            }
            if (!eroriPeId[id]) {
                eroriPeId[id] = [];
            }
            eroriPeId[id].push(eroare);
        }

        for (const [id, lista] of Object.entries(eroriPeId)) {
            if (lista.length > 1) {
                console.error(
                    `Exista ${lista.length} erori cu acelasi identificator (${id}). ` +
                    "Detalii (fara identificator):"
                );
                lista.forEach((eroare, idx) => {
                    const { identificator, ...rest } = eroare;
                    console.error(`  - Varianta ${idx + 1}: ${JSON.stringify(rest)}`);
                });
            }
        }
    }
}

// nr_task 11
// Incarca erorile in memorie si normalizeaza calea imaginii.
function initErori() {
    const caleErori = path.join(__dirname, "resurse", "json", "erori.json");
    obGlobal.obErori = JSON.parse(fs.readFileSync(caleErori, "utf-8"));

    const caleBazaURL = "/" + String(obGlobal.obErori.cale_baza || "")
        .replace(/^[/\\]+/, "")
        .replace(/\\/g, "/");

    obGlobal.obErori.cale_baza = caleBazaURL;

    obGlobal.obErori.info_erori = (obGlobal.obErori.info_erori || []).map((eroare) => ({
        ...eroare,
        imagine: path.join(caleBazaURL, eroare.imagine).replace(/\\/g, "/")
    }));

    obGlobal.obErori.eroare_default = {
        ...obGlobal.obErori.eroare_default,
        imagine: path
            .join(caleBazaURL, obGlobal.obErori.eroare_default.imagine)
            .replace(/\\/g, "/")
    };
}

function verificaGalerieJSON() {
    const caleGalerie = path.join(__dirname, "resurse", "json", "galerie.json");

    if (!fs.existsSync(caleGalerie)) {
        console.error(
            `Lipseste fisierul ${caleGalerie}. ` +
            "Creeaza fisierul galerie.json in resurse/json si reporneste serverul."
        );
        return;
    }

    let obGalerieParsed;
    try {
        obGalerieParsed = JSON.parse(fs.readFileSync(caleGalerie, "utf-8"));
    } catch (err) {
        console.error(
            `galerie.json nu este JSON valid. ` +
            `Detaliu parser: ${err.message}`
        );
        return;
    }

    const caleRelativa = String(obGalerieParsed.cale_galerie || "").replace(/^[/\\]+/, "");
    const folderGalerie = path.join(__dirname, caleRelativa);

    if (!obGalerieParsed.cale_galerie || !fs.existsSync(folderGalerie) || !fs.statSync(folderGalerie).isDirectory()) {
        console.error(
            `Folderul din "cale_galerie" nu exista pe disc: ${folderGalerie}`
        );
    }

    if (!Array.isArray(obGalerieParsed.imagini)) {
        console.error("Proprietatea imagini trebuie sa fie vector in galerie.json.");
        return;
    }

    obGalerieParsed.imagini.forEach((img, index) => {
        const caleRel = img && (img.cale_relativa || img.fisier);
        if (!caleRel) {
            console.error(`Lipseste numele fisierului pentru imaginea #${index + 1}.`);
            return;
        }

        const caleFisier = path.join(folderGalerie, caleRel);
        if (!fs.existsSync(caleFisier) || !fs.statSync(caleFisier).isFile()) {
            console.error(`Fisierul imagine nu exista: ${caleFisier}`);
        }
    });
}

function initGalerie() {
    const caleGalerie = path.join(__dirname, "resurse", "json", "galerie.json");
    if (!fs.existsSync(caleGalerie)) {
        return;
    }

    const obGalerie = JSON.parse(fs.readFileSync(caleGalerie, "utf-8"));
    const caleGalerieURL = "/" + String(obGalerie.cale_galerie || "")
        .replace(/^[/\\]+/, "")
        .replace(/\\/g, "/");

    obGlobal.obGalerie = {
        cale_galerie: caleGalerieURL,
        imagini: obGalerie.imagini || []
    };

    const caleGalerieDisc = path.join(__dirname, obGalerie.cale_galerie || "resurse/imagini/galerie");
    pregatesteGalerie(obGlobal.obGalerie.imagini, caleGalerieDisc);
}

function determinaTimpCurent(req) {
    let ora;
    if (req && req.query && req.query.ora !== undefined) {
        ora = parseInt(req.query.ora, 10);
    } else {
        ora = new Date().getHours();
    }
    
    if (ora >= 5 && ora < 12) {
        return "dimineata";
    }
    if (ora >= 12 && ora < 20) {
        return "zi";
    }
    return "noapte";
}

// Bonus 1, 7, 8 si 10a/10b
// Normalizam textul pentru comparatii fara diacritice si cu majuscule/minuscule echivalente.
function normalizeazaText(text) {
    return String(text ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// Bonus 9
// Determinam variantele de imagine disponibile pentru un produs.
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

// Bonus 1 si 9
// Adaugam pe fiecare rand din DB date derivate utile in UI.
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

// Bonus 4, 5, 7, 8 si 10a/10b
// Aplicam filtrarea, sortarea si paginarea pe server.
function proceseazaListaProduse(produse, query = {}) {
    let rezultate = [...produse];

    const tip = normalizeazaText(query.tip);
    const nume = normalizeazaText(query.nume);
    const descriere = normalizeazaText(query.descriere);
    const lungime = normalizeazaText(query.lungime);
    const finisaj = normalizeazaText(query.finisaj);
    const aplicatie = normalizeazaText(query.aplicatie);
    const certificari = normalizeazaText(query.certificari);
    const sortCheie1 = String(query.sortCheie1 || "nume");
    const sortCheie2 = String(query.sortCheie2 || "pret");
    const sortDirectie = String(query.sortDirectie || "asc");
    const pagina = Math.max(parseInt(query.pagina, 10) || 1, 1);
    const elementePerPagina = Math.max(parseInt(query.elementePerPagina, 10) || 6, 1);
    const fixeIds = new Set(String(query.fixe || "").split(",").map((elem) => elem.trim()).filter(Boolean));
    const ascunseIds = new Set(String(query.ascunseSesiune || "").split(",").map((elem) => elem.trim()).filter(Boolean));

    const pretMin = query.pretMin !== undefined && query.pretMin !== "" ? parseFloat(query.pretMin) : null;
    const pretMax = query.pretMax !== undefined && query.pretMax !== "" ? parseFloat(query.pretMax) : null;
    const doarLivrare = String(query.livrare || "").toLowerCase() === "true";

    if (tip) {
        rezultate = rezultate.filter((produs) => normalizeazaText(produs.tip) === tip);
    }

    if (nume) {
        rezultate = rezultate.filter((produs) => produs.nume_normalizat.includes(nume));
    }

    if (descriere) {
        rezultate = rezultate.filter((produs) => produs.descriere_normalizata.includes(descriere));
    }

    if (lungime) {
        rezultate = rezultate.filter((produs) => normalizeazaText(produs.lungime_mm) === lungime);
    }

    if (finisaj) {
        rezultate = rezultate.filter((produs) => produs.finisaj_normalizat === finisaj);
    }

    if (aplicatie) {
        rezultate = rezultate.filter((produs) => produs.aplicatie_normalizata === aplicatie);
    }

    if (certificari) {
        const cerinte = certificari.split(",").map((elem) => elem.trim()).filter(Boolean);
        rezultate = rezultate.filter((produs) => cerinte.every((cerinta) => produs.certList.some((cert) => normalizeazaText(cert).includes(cerinta))));
    }

    if (pretMin !== null && !Number.isNaN(pretMin)) {
        rezultate = rezultate.filter((produs) => produs.pret >= pretMin);
    }

    if (pretMax !== null && !Number.isNaN(pretMax)) {
        rezultate = rezultate.filter((produs) => produs.pret <= pretMax);
    }

    if (doarLivrare) {
        rezultate = rezultate.filter((produs) => Boolean(produs.livrare_rapida));
    }

    if (ascunseIds.size) {
        rezultate = rezultate.filter((produs) => !ascunseIds.has(String(produs.id)));
    }

    const produseFixate = produse.filter((produs) => fixeIds.has(String(produs.id)) && !ascunseIds.has(String(produs.id)));
    const iduriRezultate = new Set(rezultate.map((produs) => String(produs.id)));
    produseFixate.forEach((produs) => {
        if (!iduriRezultate.has(String(produs.id)) && !ascunseIds.has(String(produs.id))) {
            rezultate.push(produs);
        }
    });

    rezultate = rezultate.map((produs) => ({
        ...produs,
        esteFixat: fixeIds.has(String(produs.id))
    }));

    const cheiSortare = {
        nume: (produs) => produs.nume_normalizat,
        pret: (produs) => Number(produs.pret),
        lungime: (produs) => Number(produs.lungime_mm),
        tip: (produs) => produs.tip_normalizat,
        aplicatie: (produs) => produs.aplicatie_normalizata,
        finisaj: (produs) => produs.finisaj_normalizat,
        descriere: (produs) => String(produs.descriere || "").length
    };

    const cheiSelectate = [sortCheie1, sortCheie2].map((cheie) => cheiSortare[cheie] ? cheie : "nume");

    rezultate.sort((a, b) => {
        if (a.esteFixat !== b.esteFixat) {
            return a.esteFixat ? -1 : 1;
        }

        const semn = sortDirectie === "desc" ? -1 : 1;

        for (const cheie of cheiSelectate) {
            const valoareA = cheiSortare[cheie](a);
            const valoareB = cheiSortare[cheie](b);
            const comparatie = valoareA < valoareB ? -1 : valoareA > valoareB ? 1 : 0;
            if (comparatie !== 0) {
                return semn * comparatie;
            }
        }

        return 0;
    });

    const total = rezultate.length;
    const totalPagini = Math.max(Math.ceil(total / elementePerPagina), 1);
    const paginaCurenta = Math.min(pagina, totalPagini);
    const start = (paginaCurenta - 1) * elementePerPagina;
    const produsePaginare = rezultate.slice(start, start + elementePerPagina);

    return {
        produse: produsePaginare,
        total,
        totalPagini,
        paginaCurenta,
        elementePerPagina
    };
}

// Bonus 1
// Construim valorile derivate pentru filtre direct din datele din DB.
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

async function genereazaVersiuniImagine(caleOriginala) {
    const parsed = path.parse(caleOriginala);
    const caleSm = path.join(parsed.dir, `${parsed.name}_sm${parsed.ext}`);
    const caleMd = path.join(parsed.dir, `${parsed.name}_md${parsed.ext}`);

    try {
        if (!fs.existsSync(caleSm)) {
            await sharp(caleOriginala).resize({ width: 150 }).toFile(caleSm);
        }
        if (!fs.existsSync(caleMd)) {
            await sharp(caleOriginala).resize({ width: 250 }).toFile(caleMd);
        }
    } catch (err) {
        console.error(`Eroare la generarea versiunilor pentru ${caleOriginala}: ${err.message}`);
    }
}

async function pregatesteGalerie(imagini, caleGalerieDisc) {
    for (const img of imagini) {
        if (!img) continue;
        const caleRel = img.cale_relativa || img.fisier;
        if (!caleRel) {
            continue;
        }
        const caleOriginala = path.join(caleGalerieDisc, caleRel);
        if (fs.existsSync(caleOriginala)) {
            await genereazaVersiuniImagine(caleOriginala);
        }
    }
}

function genereazaScssGalerieAnimata(n) {
    const nrRanduri = Math.ceil(n / 3);
    const durata = Math.max(n * 3, 20); // Smooth premium pacing
    const keyframes = [];

    const maparePozitii = [
        { col: 0, rand: 0 }, // 1
        { col: 0, rand: 1 }, // 2
        { col: 2, rand: 1 }, // 3
        { col: 1, rand: 1 }, // 4
        { col: 1, rand: 0 }, // 5
        { col: 2, rand: 0 }, // 6
        { col: 2, rand: 2 }, // 7
        { col: 0, rand: 2 }, // 8
        { col: 1, rand: 2 }, // 9
        { col: 0, rand: 3 }, // 10
        { col: 2, rand: 3 }, // 11
        { col: 1, rand: 3 }, // 12
        { col: 0, rand: 4 }, // 13
        { col: 2, rand: 4 }, // 14
        { col: 1, rand: 4 }  // 15
    ];

    for (let i = 0; i < n; i += 1) {
        const stepSize = 100 / n;
        const startPct = i * stepSize;
        const coordCur = maparePozitii[i] || { col: 0, rand: 0 };
        const rotCur = i * 360;

        // 1. Începutul pasului i (menținere imagine curentă statică)
        keyframes.push(`${startPct.toFixed(1)}% { transform-origin: calc(${coordCur.col} * 280px + 140px) calc(${coordCur.rand} * 280px + 140px); transform: translate(-${coordCur.col * 280}px, -${coordCur.rand * 280}px) rotate(${rotCur}deg); }`);

        if (i < n - 1) {
            const holdPct = startPct + 0.5 * stepSize;
            const slideEndPct = startPct + 0.75 * stepSize;
            const rotEndPct = startPct + 0.95 * stepSize;

            const coordNext = maparePozitii[i + 1] || { col: 0, rand: 0 };
            const rotNext = (i + 1) * 360;

            // 2. Sfârșitul fazei de hold (încă la poziția curentă și rotația curentă)
            keyframes.push(`${holdPct.toFixed(1)}% { transform-origin: calc(${coordCur.col} * 280px + 140px) calc(${coordCur.rand} * 280px + 140px); transform: translate(-${coordCur.col * 280}px, -${coordCur.rand * 280}px) rotate(${rotCur}deg); }`);

            // 3. Sfârșitul fazei de glisare (am ajuns la noua poziție, dar rotația rămâne cea veche!)
            keyframes.push(`${slideEndPct.toFixed(1)}% { transform-origin: calc(${coordNext.col} * 280px + 140px) calc(${coordNext.rand} * 280px + 140px); transform: translate(-${coordNext.col * 280}px, -${coordNext.rand * 280}px) rotate(${rotCur}deg); }`);

            // 4. Sfârșitul fazei de rotație (la noua poziție și s-a aplicat și noua rotație de 360deg!)
            keyframes.push(`${rotEndPct.toFixed(1)}% { transform-origin: calc(${coordNext.col} * 280px + 140px) calc(${coordNext.rand} * 280px + 140px); transform: translate(-${coordNext.col * 280}px, -${coordNext.rand * 280}px) rotate(${rotNext}deg); }`);
        } else {
            // Ultimul cadru (hold până la finalul animației)
            keyframes.push(`100.0% { transform-origin: calc(${coordCur.col} * 280px + 140px) calc(${coordCur.rand} * 280px + 140px); transform: translate(-${coordCur.col * 280}px, -${coordCur.rand * 280}px) rotate(${rotCur}deg); }`);
        }
    }

    const scssContent = `
.galerie-animata-wrapper {
  display: flex;
  justify-content: center;
}

.galerie-animata-grid {
  display: block;
  position: relative;
  width: 280px;
  height: 280px;
  overflow: hidden;
  border-width: 8px;
  border-style: solid;
  border-image: url('/resurse/imagini/galerie/SteelVector-prezentare.png') 30 round;
}

.galerie-animata-inner {
  display: grid;
  grid-template-columns: repeat(3, 280px);
  grid-template-rows: repeat(${nrRanduri}, 280px);
  width: 840px;
  height: calc(${nrRanduri} * 280px);
  position: absolute;
  top: 0;
  left: 0;
  animation: slideGalerie ${durata}s linear infinite alternate;
}

.galerie-animata-grid:hover .galerie-animata-inner {
  animation-play-state: paused;
}

.galerie-animata-item img {
  width: 280px;
  height: 280px;
  object-fit: cover;
}

@keyframes slideGalerie {
  ${keyframes.join("\n  ")}
}

@media (max-width: 1099px) {
  .galerie-animata-wrapper {
    display: none;
  }
}
`;

    const caleScss = path.join(global.folderScss, "galerie-animata.scss");
    fs.writeFileSync(caleScss, scssContent, "utf-8");
}

// nr_task 12
// Afisam o eroare folosind date din JSON, dar argumentele au prioritate.
function afisareEroare(res, identificator, titlu, text, imagine) {
    const areId = identificator !== undefined && identificator !== null;
    const eroareGasita = areId && obGlobal.obErori && Array.isArray(obGlobal.obErori.info_erori)
        ? obGlobal.obErori.info_erori.find((elem) => elem.identificator === identificator)
        : null;
    const baza = eroareGasita || obGlobal.obErori.eroare_default;

    const eroareFinala = {
        titlu: titlu ?? baza.titlu,
        text: text ?? baza.text,
        imagine: imagine ?? baza.imagine
    };

    // Daca exista eroarea in JSON si status=false raspundem 200, altfel folosim codul relevant.
    const statusCode = eroareGasita
        ? (eroareGasita.status ? identificator : 200)
        : (areId ? identificator : 500);

    return res.status(statusCode).render("pagini/eroare", {
        pagina: res.req.path,
        ...eroareFinala
    });
}

// Verificam JSON-ul bonus si apoi initializam erorile in memorie.
verificaEroriJSON();
initErori();
verificaGalerieJSON();
initGalerie();
compileazaToateScss();
urmaresteScss();

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
incarcaCategoriiProduse();

// nr_task 19
// Blocam cereri directe catre fisiere .ejs.
app.use((req, res, next) => {
    if (/\.ejs$/i.test(req.path)) {
        return afisareEroare(res, 400);
    }
    next();
});

// nr_task 18
// Interzicem listarea folderelor din /resurse (fara fisier specificat).
app.use(/^\/resurse(?:\/.*)?$/, (req, res, next) => {
    const caleCeruta = decodeURIComponent(req.originalUrl.split("?")[0]);
    const caleRelativa = caleCeruta.replace(/^\/resurse\/?/, "");
    const calePeDisc = path.join(__dirname, "resurse", caleRelativa);

    if (fs.existsSync(calePeDisc) && fs.statSync(calePeDisc).isDirectory()) {
        return afisareEroare(res, 403);
    }

    next();
});

// nr_task 6
// Definim folderul de resurse ca static.
app.use("/resurse", express.static(path.join(__dirname, "resurse")));

// nr_task 16
// Ruta explicita pentru favicon cerut uneori de browser.
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse", "imagini", "favicon", "favicon.ico"));
});

// nr_task 8
// Homepage accesibil pe /, /index si /home.
app.get(["/", "/index", "/home"], (req, res) => {
    const timpCurent = determinaTimpCurent(req);
    const imaginiFiltrate = (obGlobal.obGalerie.imagini || []).filter((img) => img.timp === timpCurent);

    const multipluHome = Math.floor(imaginiFiltrate.length / 3) * 3;
    const imaginiFinale = imaginiFiltrate.slice(0, multipluHome);

    res.render("pagini/index", {
        galerie: {
            cale_galerie: obGlobal.obGalerie.cale_galerie,
            imagini: imaginiFinale
        }
    });
});

app.get("/despre", async (req, res) => {
    const caleGalerie = path.join(__dirname, "resurse", "json", "galerie.json");
    if (!fs.existsSync(caleGalerie)) {
        return res.render("pagini/despre", { staticGalerie: null, dynamicGalerie: null });
    }

    const obGalerie = JSON.parse(fs.readFileSync(caleGalerie, "utf-8"));
    const caleGalerieURL = "/" + String(obGalerie.cale_galerie || "")
        .replace(/^[/\\]+/, "")
        .replace(/\\/g, "/");

    // 1. Pregătire Galerie Statică (filtrată după timp)
    const timpCurent = determinaTimpCurent(req);
    const imaginiFiltrate = (obGalerie.imagini || []).filter((img) => img.timp === timpCurent);

    const multipluDespre = Math.floor(imaginiFiltrate.length / 3) * 3;
    const imaginiStatic = imaginiFiltrate.slice(0, multipluDespre);

    const caleGalerieDisc = path.join(__dirname, obGalerie.cale_galerie || "resurse/imagini/galerie");
    await pregatesteGalerie(imaginiStatic, caleGalerieDisc);

    // 2. Pregătire Galerie Dinamică (selecție aleatoare de 9/12/15 distincte)
    const eligibile = (obGalerie.imagini || []).filter((img) => img["galerie-animata"] === true);
    const optiuni = [9, 12, 15];
    const n = optiuni[Math.floor(Math.random() * optiuni.length)];
    const imaginiDinamice = eligibile.slice(0, Math.min(n, eligibile.length));

    genereazaScssGalerieAnimata(imaginiDinamice.length);
    compileazaScss("galerie-animata.scss");

    return res.render("pagini/despre", {
        staticGalerie: {
            imagini: imaginiStatic,
            caleGalerie: caleGalerieURL,
            timpCurent
        },
        dynamicGalerie: {
            imagini: imaginiDinamice,
            caleGalerie: caleGalerieURL,
            n: imaginiDinamice.length
        }
    });
});

// Bonus 1, 4, 5, 7, 8 si 10a/10b
// Ruta principala pentru pagina de produse: randare initiala + date derivate pentru UI.
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

// Bonus 10a si 10b
// Endpoint folosit de fetch() pentru filtrare, sortare si paginare server-side.
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

// ── Ruta GET /produs/:id — pagina individuala produs ──
app.get("/produs/:id", async (req, res) => {
    try {
        const produsId = parseInt(req.params.id, 10);
        if (isNaN(produsId)) {
            return afisareEroare(res, 400);
        }

        const rezultat = await pool.query("SELECT * FROM produse WHERE id = $1", [produsId]);
        if (rezultat.rows.length === 0) {
            return afisareEroare(res, 404);
        }

        const produs = pregatesteProdus(rezultat.rows[0]);
        res.render("pagini/produs", { produs });
    } catch (err) {
        console.error("Eroare la ruta /produs/:id:", err.message);
        return afisareEroare(res, 500);
    }
});

// nr_task 9 + nr_task 10
// Ruta generala (ULTIMA ruta GET): trateaza cereri de forma /pagina.
app.get("/:pagina", (req, res) => {
    const pagina = req.params.pagina;

    res.render(`pagini/${pagina}`, (eroare, rezultatRandare) => {
        if (eroare) {
            if (eroare.message && eroare.message.startsWith("Failed to lookup view")) {
                return afisareEroare(res, 404);
            }
            return afisareEroare(res, 500);
        }

        return res.send(rezultatRandare);
    });
});

app.listen(PORT, () => {
    console.log(`Serverul a pornit pe http://localhost:${PORT}`);
});