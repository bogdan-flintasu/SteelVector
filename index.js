const express= require("express");
const path= require("path");

const app= express();
app.set("view engine", "ejs")
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));
app.get("/", function(req, res) {
    res.render("pagini/index");
});

app.get("/", function(req, res) {
    res.render("pagini/despre");
});

app.get("/cale", function(req, res) {
    res.send("Calea <b style='color:red'>nu</b> a fost gasita!");
    console.log("Cerere GET pe calea /cale");
});

app.get("/cale/:a/:b", function(req, res) {
    res.send(parseInt(req.params.a) + parseInt(req.params.b));
});

app.get("/cale2", function(req, res) {
    res.write("ceva\n");
    res.write("altceva");
    res.end();
});

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);



app.listen(3000);
console.log("Serverul a pornit!");