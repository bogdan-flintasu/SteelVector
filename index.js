const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { compileazaScss, compileazaToateScss, urmaresteScss } = require("./lib/scss-compiler");

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
        const fisier = img && img.fisier;
        if (!fisier) {
            console.error(`Lipseste numele fisierului pentru imaginea #${index + 1}.`);
            return;
        }

        const caleFisier = path.join(folderGalerie, fisier);
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

function determinaTimpCurent() {
    const ora = new Date().getHours();
    if (ora >= 5 && ora < 12) {
        return "dimineata";
    }
    if (ora >= 12 && ora < 20) {
        return "zi";
    }
    return "noapte";
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
        if (!img || !img.fisier) {
            continue;
        }
        const caleOriginala = path.join(caleGalerieDisc, img.fisier);
        if (fs.existsSync(caleOriginala)) {
            await genereazaVersiuniImagine(caleOriginala);
        }
    }
}

function genereazaScssGalerieAnimata(n) {
    const nrRanduri = Math.ceil(n / 3);
    const durata = Math.max(n * 1.5, 12);
    const keyframes = [];

    for (let i = 0; i < n; i += 1) {
        const progres = (i / Math.max(n - 1, 1)) * 100;
        const rand = Math.floor(i / 3);
        const col = i % 3;
        const rot = i % 2 === 0 ? 0 : 360;
        keyframes.push(`${progres.toFixed(1)}% { transform: translate(-${col * 100}%, -${rand * 100}%) rotate(${rot}deg); }`);
    }

    const scssContent = `
.galerie-animata-wrapper {
  display: flex;
  justify-content: center;
}

.galerie-animata-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(${nrRanduri}, 1fr);
  width: calc(3 * 280px);
  height: 280px;
  overflow: hidden;
  border-width: 8px;
  border-style: solid;
  border-image: url('/resurse/imagini/galerie/SteelVector-prezentare.png') 30 round;
}

.galerie-animata-inner {
  display: contents;
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
    res.render("pagini/index", { galerie: obGlobal.obGalerie });
});

app.get("/galerie", async (req, res) => {
    const caleGalerie = path.join(__dirname, "resurse", "json", "galerie.json");
    if (!fs.existsSync(caleGalerie)) {
        return afisareEroare(res, 404);
    }

    const obGalerie = JSON.parse(fs.readFileSync(caleGalerie, "utf-8"));
    const timpCurent = determinaTimpCurent();
    const imaginiFiltrate = (obGalerie.imagini || []).filter((img) => img.timp === timpCurent);

    let imaginiFinale = imaginiFiltrate;
    if (imaginiFinale.length >= 6) {
        const multiplu = Math.floor(imaginiFinale.length / 3) * 3;
        imaginiFinale = imaginiFinale.slice(0, Math.max(multiplu, 6));
    }

    const caleGalerieDisc = path.join(__dirname, obGalerie.cale_galerie || "resurse/imagini/galerie");
    await pregatesteGalerie(imaginiFinale, caleGalerieDisc);

    const caleGalerieURL = "/" + String(obGalerie.cale_galerie || "")
        .replace(/^[/\\]+/, "")
        .replace(/\\/g, "/");

    return res.render("pagini/galerie", {
        imagini: imaginiFinale,
        caleGalerie: caleGalerieURL,
        timpCurent
    });
});

app.get("/galerie-animata", async (req, res) => {
    const caleGalerie = path.join(__dirname, "resurse", "json", "galerie.json");
    if (!fs.existsSync(caleGalerie)) {
        return afisareEroare(res, 404);
    }

    const obGalerie = JSON.parse(fs.readFileSync(caleGalerie, "utf-8"));
    const eligibile = (obGalerie.imagini || []).filter((img) => img["galerie-animata"] === true);

    const optiuni = [9, 12, 15];
    const n = optiuni[Math.floor(Math.random() * optiuni.length)];
    const imagini = eligibile.slice(0, Math.min(n, eligibile.length));

    genereazaScssGalerieAnimata(imagini.length);
    compileazaScss("galerie-animata.scss");

    const caleGalerieURL = "/" + String(obGalerie.cale_galerie || "")
        .replace(/^[/\\]+/, "")
        .replace(/\\/g, "/");

    return res.render("pagini/galerie-animata", {
        imagini,
        caleGalerie: caleGalerieURL,
        n: imagini.length
    });
});

// nr_task 13
// Pagina secundara (de exemplu descriere site).
app.get("/despre", (req, res) => {
    res.render("pagini/despre");
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