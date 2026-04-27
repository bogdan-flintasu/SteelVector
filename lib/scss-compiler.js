const fs = require("fs");
const path = require("path");
const sass = require("sass");

function resolvePath(inputPath, baseDir) {
    if (!inputPath) {
        return "";
    }
    return path.isAbsolute(inputPath) ? inputPath : path.join(baseDir, inputPath);
}

function resolveCssPath(scssAbsPath, cssPath) {
    if (cssPath) {
        return resolvePath(cssPath, global.folderCss);
    }

    const scssRel = path.relative(global.folderScss, scssAbsPath);
    const scssRelDir = path.dirname(scssRel);
    const scssBaseName = path.parse(scssAbsPath).name;
    const cssRel = path.join(scssRelDir, `${scssBaseName}.css`);

    return path.join(global.folderCss, cssRel);
}

function copiazaBackup(caleCssAbs) {
    if (!fs.existsSync(caleCssAbs)) {
        return;
    }

    const cssRel = path.relative(global.folderCss, caleCssAbs);
    const backupDir = path.join(global.appRoot, "backup", "resurse", "css", path.dirname(cssRel));

    try {
        fs.mkdirSync(backupDir, { recursive: true });
        const numeCss = path.parse(caleCssAbs).name;
        const extensie = path.extname(caleCssAbs);
        const backupName = `${numeCss}_${Date.now()}${extensie}`;
        const backupPath = path.join(backupDir, backupName);
        fs.copyFileSync(caleCssAbs, backupPath);
    } catch (err) {
        console.error(`Eroare la copierea backup-ului CSS: ${err.message}`);
    }
}

function compileazaScss(caleScss, caleCss) {
    const scssAbs = resolvePath(caleScss, global.folderScss);

    if (!scssAbs || !fs.existsSync(scssAbs)) {
        console.error(`SCSS inexistent: ${scssAbs}`);
        return;
    }

    const cssAbs = resolveCssPath(scssAbs, caleCss);

    copiazaBackup(cssAbs);

    try {
        const rezultat = sass.compile(scssAbs, {
            style: "expanded",
            loadPaths: [global.folderScss, path.join(global.appRoot, "node_modules")],
            quietDeps: true,
            silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"]
        });

        fs.mkdirSync(path.dirname(cssAbs), { recursive: true });
        fs.writeFileSync(cssAbs, rezultat.css);

        console.log(`SCSS compilat: ${path.relative(global.appRoot, scssAbs)} -> ${path.relative(global.appRoot, cssAbs)}`);
    } catch (err) {
        console.error(`Eroare la compilarea ${scssAbs}: ${err.message}`);
    }
}

function colecteazaScss(dirPath, rezultate = []) {
    if (!fs.existsSync(dirPath)) {
        return rezultate;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const cale = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            colecteazaScss(cale, rezultate);
        } else if (entry.isFile() && path.extname(entry.name) === ".scss") {
            rezultate.push(cale);
        }
    }

    return rezultate;
}

function compileazaToateScss() {
    const fisiere = colecteazaScss(global.folderScss);
    fisiere.forEach((cale) => compileazaScss(cale));
}

function urmaresteScss() {
    const debounceMs = 200;
    const pending = new Map();

    const proceseaza = (caleFisier) => {
        if (!caleFisier || path.extname(caleFisier) !== ".scss") {
            return;
        }
        if (pending.has(caleFisier)) {
            clearTimeout(pending.get(caleFisier));
        }
        const id = setTimeout(() => {
            pending.delete(caleFisier);
            compileazaScss(caleFisier);
        }, debounceMs);
        pending.set(caleFisier, id);
    };

    const watchDir = (dirPath) => {
        if (!fs.existsSync(dirPath)) {
            return;
        }

        try {
            fs.watch(dirPath, (eventType, filename) => {
                if (!filename) {
                    return;
                }
                const cale = path.join(dirPath, filename);
                if (fs.existsSync(cale) && fs.statSync(cale).isDirectory()) {
                    watchDir(cale);
                    return;
                }
                proceseaza(cale);
            });
        } catch (err) {
            console.error(`Eroare fs.watch pe ${dirPath}: ${err.message}`);
        }
    };

    const toateFolderele = new Set();
    const colecteazaFoldere = (dirPath) => {
        if (!fs.existsSync(dirPath)) {
            return;
        }
        toateFolderele.add(dirPath);
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                colecteazaFoldere(path.join(dirPath, entry.name));
            }
        }
    };

    colecteazaFoldere(global.folderScss);
    toateFolderele.forEach((dirPath) => watchDir(dirPath));
}

module.exports = {
    compileazaScss,
    compileazaToateScss,
    urmaresteScss
};
