const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// nr_task 11
// Obiect global in care tinem erorile incarcate din JSON.
const obGlobal = {
    obErori: null
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
    res.render("pagini/index");
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