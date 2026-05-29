## Identificator: format-entitati
Aplicatie de sortare, filtrare si calculare

## Descriere cerință. Pagină produse.

Va exista o pagina de produse in care trebuie listate datele pentru anumite produse/entitati specifice site-ului (le vom numi de acum inainte "entitatile aplicatiei"). Entitatile aplicatiei vor fi, de exemplu,carti pentru o librarie sau un site de lectii online, tipuri de prajituri si fursecuri pentru o cofetarie, flori si buchete pentru o florarie etc. - dacă nu aveți idei de produse, îmi dați mesaj și ne gândim împreună. Tipul de entitate trebuie sa fie strict legat de tema site-ului. În pagina de produse nu se vor afișa toate detaliile produselor ci doar cele relevante pentru filtrare/sortare (ideal cele mai importante detalii, precum specificații des căutate de către utilizatori).

Descriere cerință. Pagină produs unic.. Se va genera automat prin program câte o pagină pentru fiecare produs (conform exemplului dat la curs si/sau laborator). Pagina respectivă va afisa toate detaliile produsului (inclusiv cele care nu apar in pagina de produse). Pentru asta, se trimit prin intermediul obiectului locals(ejs) datele produsului.

Baza de date. Tabelul de produse

Se va crea o bază de date pentru proiect. Se va crea un tabel de produse. Se va crea un utilizator (al bazei de date), folosit în program, pentru care se aloca drepturi pe baza de date și tabel. Datele cuprinzand proprietățile produselor (pentru afișarea în pagină) se vor prelua din tabel. Produsele trebuie sa contina minim urmatoarele proprietati (pentru a avea cu ce să lucrăm în aplicația de sortare/filtrare):

id (identificatorul unic, din json; id-ul trebuie sa fie numeric)
nume
descriere
o imagine (in tabel se va salva doar calea catre imagine)
categorie mare (o clasificare a entitatilor din date, de exemplu, daca e vorba de pisici, sa fie clasificate dupa rasa sau talie, daca e vorba de carti, dupa tematica, daca e vorba de calculatoare: de birou, de gaming etc). Categoria se va face cu ajutorul unei enumerații, nu va fi de tip string. Enumerația ar trebui să aibă maxim 5 valori.
Un mod de categorizare mai puțin important (de exemplu, pentru pisici: după culoare sau după lungimea blanei, pentru cărți: o subtematică sau tipul de hârtie folosit (carte cartonată, hârtie simplă, hârtie lucioasă, carte cu învelitoare), sau tipul de expediere posibilă (curier, de la centrul de distribuție, poștă), vârsta pentru care e indicat produsul respectiv (copii, adolescenți, adulți), pentru flori, de exemplu, pot fi modurile de prezentare( floare singură, buchet, ghiveci, floare presată etc).
pret (sau alta caracteristica cu valoare numerica)
o a doua caracteristică numerică (de exemplu - pentru diverse produse- poate fi: dimensiune, volum, o specificație tehnică precum putere sau tensiune, numărul de pagini pentru o carte, numărul de caractere/randuri/imagini/alte elemente care apar pe o felicitare, numărul de culori, timpul de garanție, gramaj, număr de calorii pentru un produs alimentar etc)
caracteristica cu valoare de tip Date (data calendaristica) - de exemplu poate fi data de când există produsul în oferta magazinului.
caracteristica care poate sa aiba doar o singura valoare pentru o entitate (dint-un set de valori - de exemplu, culoarea)
caracteristica care poate sa aiba mai multe valori pentru o entitate (poate fi folosit intr-un select de tip multiplu; in tabel valorile vor fi puse intr-un singur camp si vor fi separate cu virgula, de exemplu pentru un produs alimentar, campul ar putea fi ingrediente cu valoarea "sare, faina, lapte, branza").
caracteristica booleana (de exemplu, are sau nu are o anumită caracteristică, poate sau nu să fie expediat prin poștă, admite sau nu voucher; exemple pentru diverse proprietăți: pentru cărți: include sau nu semn de carte; pentru prăjituri: bun sau nu pentru bolnavii de diabet, pentru fast-food, include sau nu un anumit alergen, pentru imagini/felicitări e color sau nu, etc.)
Dacă nu aveți idei pentru o anumită caracteristică potrivită pentru produsele site-ului vostru, îmi dați mesaj și discutăm ce s-ar potrivi mai bine.

Se vor introduce în tabel 15-20 entitati cu caracteristici suficient de diversificate (pentru a putea verifica toate tipurile de filtre si sortari)

## Meniu. Împărțirea pe categorii mari

În meniu se va adăuga o opțiune nouă numită "Produse". Opțiunea va avea următoare subopțiuni: toate (în sensul că se afișează toate produsele), categ_1, categ_2, ...,categ_n (acestea sunt numele valorilor categoriei mari). Valorile categoriei mari, care apar în meniu trebuie generate pe baza enumerației din baza de date (nu se scriu manual ci se generează prin program și se transmit în meniu prin locals). La click pe o astfel de subopțiune, se vor afișa în pagină doar produsele corespunzătoare acelei categorii. Atenție, filtrarea se va face aici la nivel de server, în sensul că vectorul de produse trimis de server spre afișare conține doar produsele din categoria cerută din meniu. Toate subopțiunile vor face același ape get, dar cu parametri diferiți (cu alte cuvinte folosiți același ejs pentru afișarea tuturor produselor cât și afișarea pe categorii).
Format afișare produse (pentru pagina de produse).

Produsele se vor afisa prin ejs, cu ajutorul unui for care populeaza un template cu informatiile fiecarui element din fisierul de date. La inceput se vor afisa toate produsele, dar prin completarea unor inputuri de filtrare se vor pastra doar o parte din produse in pagina (cele care nu corespund filtrului setat doar vor fi ascunse, nu sterse din DOM, pentru a le putea folosi si in filtrari ulterioare).

Formatul template-ului e cel precizat mai jos:

Va exista un element de tip article care va avea un heading de nivel corespunzator, cu numele entitatii.

Sub titlu este precizata si categoria entitatii. De asemenea articolul cuprinzand entitatea va trebui sa aiba printre eventuale alte clase (atributul class) si numele categoriei (deci categoria trebuie sa nu cuprinda spatii)

Sub categorie va fi afisata descrierea

Mai jos, vor fi afisate sub forma unui tabel cu doua coloane urmatoarele caracteristici:

caracteristica numerica
caracteristica cu o singura valoare string
caracteristica cu mai multe valori string
caracteristica data
caracteristica booleana
Fiecare caracteristica e pe un rand separat in tabel

Data calendaristica se va scrie cu ajutorul tagului <time>. Continutul tagului va fi data in limba romana in formatul: 'zi/nume_luna/an (zi_saptamana)', de exemplu, 15/Septembrie/2018 (Sambata)

Fiecare rand va avea in prima celula numele caracteristicii si in a doua, valoarea caracteristicii.

In stanga tabelului va fi afisata imaginea. Pentru estetica, imaginile ar trebui sa fie de aceeasi dimensiune si relativ mici ca sa incapa langa tabel

Id-ul fiecarui articol este de forma 'art'+id, unde id e id-ul efectiv din fisierul de date (deci id-uri posibile ar fi: art2, art7, ...)

Puteți adăuga alte elemente de stilizare dar fără a modifica cerința. Dacă aveți nevoie de date în plus pentru filtrare/sortare le puteți include în format, însă e important să nu apară toate detaliile produsului, acestea fiind rezervate pentru pagina proprie produsului.
Filtre. Inputuri

Va exista si o sectiune (care sa nu fie form chiar daca contine inputuri) deasupra zonei de afisare a produselor, care va contine urmatoarele tipuri de input, fiecare corespunzând unui camp dintre caracteristicile entitatilor/produselor). Toate inputurile vor avea și o etichetă asociată (label). Pentru anumite inputuri din lista de mai jos veți primi cerințe specifice la subpunctul următor (deci le vețiintegra în acele cerințe, nu folosiți același tip de input de 2 ori); restul de inputuri vor avea rol decis de voi în filtrare.

input de tip text
input de tip range. Pentru inputul de tip range trebuie sa apara valoarea minima in stanga lui si valoarea maxima in dreapta lui, și de asemenea să se afișeze valoarea selectată (de exemplu în paranteză, după valoarea maximă).
datalist
grup de inputuri de tip radio (va avea si o optiune generala care sa nu aplice niciun filtru)
input de tip checkbox sau grup de inputuri de tip checkbox (în funcție de tipul de filtru)
textarea
select simplu (prima optiune va fi si cea default (initial selectata), cu textul "nimic" sau "oricare" sau ceva asemănător care să se refere la situația în care acel filtru nu ne interesează.
select multiplu
Valorile inițiale ale inputurilor vor fi de așa natură încât să se potrivească cu toate produsele. De exemplu dacă sunt mai multe tipuri de culoare pentru produs și folosim un grup de radiobuttons pentru ele, să existe și un radiobutton pentru opțiunea "orice culoare" care va fi implicit selectat.

## Cerințe specifice filtre.

Produsele se vor afișa fie cu ajutorul unui grid, fie folosind flexbox.

În inputul de tip text se va introduce numele produsului. Se poate introduce și un șir de forma "[început]*[sfarșit]" unde [început] e începutul numelui, * e un caracter special care indică faptul că pot avea orice carcatere și oricâte, iar [sfârșit] reprezintă sfârșitul numelui. De exemplu, dacă scriem în input "r*ie" se vor potrivi și "roșie" și "ridiche"
Vor fi două inputuri de tip range, unul pentru valoarea minimă și unul pentru valoarea maximă a prețului
selectul simplu va fi pentru caracteristica care poate sa aiba doar câte o singura valoare pentru o entitate
Pentru filtrele/inputurile pentru care nu s-a precizat cum anume să fie implementate în pagină, alegeți voi pentru ce caracteristici să se aplice și în ce manieră. Nu e voie să aveți două filtre pentru aceeași proprietate a produsului.

## Butoane. Operațiile efective de filtrare/sortare/calculare

Alături de filtre vor exista și următoarele butoane:

Un buton cu textul "filtreaza" care va filtra entitatile dupa toate inputurile activate.
Doua butoane de sortare (unul penru ascendent si unul pentru descendent). Sortarea se va face dupa doua chei, de exemplu daca se sorteaza după cheile c1 și c2, intai se va sorta după c1, si pentru valori egale pentru c1, se va sorta după c2. Cele două chei după care trebuie să sortați sunt, în ordine: numele și lungimea descrierii
Un buton de calculare (de exemplu, calculeaza suma/media/minimul/maximul tuturor preturilor sau doar al prețurilor elementelor selectate). Calculul va aparea într-un div cu poziție fixă, care va fi creat dinamic (createElement), va sta pe ecran 2 secunde și apoi va dispărea (va fi șters).
Un buton de resetare a filtrelor.
(Specificatii pentru anul 2 CTI) La click pe butonul de resetare, printr-un mesaj de tip "confirm" utilizatorul va fi intrebat daca vrea cu adevarat sa reseteze filtrele. Daca raspunde "ok", toate filtrele vor reveni la valorile implicite care corespund afișării tuturor produselor. Se reafișează toate produsele (fără nicun filtru aplicat) și în ordinea inițială (resetarea anulează și sortarea).
[Edit: era inainte paragraf, l-am facut item de lista pentru claritate; enuntul e acelasi pentru anii 2,3,4] La click pe oricare dintre butoanele de filtrare/sortare/calculare se va verifica intai ca inputurile afectate de ele au valori valide (în special inputul de tip text și textarea-ul), si numai daca sunt valide se va realiza operatia. Daca valorile nu sunt valide, se afiseaza un mesaj de atentionare relevant. In cazul in care nu e specificat clar in cerintele de mai jos cum sa fie acest mesaj, studentul poate alege sa il afiseze cum doreste, astfel incat sa fie bine integrat in aplicatie (de exemplu un alert sau marcarea cu rosu a inputului cu probleme). Studentul va alege care sunt cazurile de input invalid (de exemplu in inputul de tip text a fost introdusa o cifra, si nu are sens pentru aplicatie, sau nu a fost selectat niciun radiobutton, sau inputul de tip textarea e vid etc).


## (0.3p - fiecare e 0.05) Stilizare inputuri 
. Inputurile de pe pagina de produse se vor stiliza cu ajutorul Bootstrap, folosind customizari facute de voi in sass (vezi etapa 5). Puteti sa mai adaugati variabile in fisierul de customizare, care sa ajute la stilizarea butoanelor si inputurilor.
Butoanele (de filtrare, sortare, resetare) trebuie stilizate cu ajutorul temei bootstrap pentru care ati schimbat culoarea (de exemplu primary sau secondary). Raza si grosimea borderului trebuie date de voi in fisierul sass de customizare prin variabile (daca nu ati facut asta deja). Butoanele si inputurile vor fi dimensionate cu ajutorul claselor bootstrap. Butoanele trebuie sa aiba iconuri (glyphicons) relevante din bootstrap: https://icons.getbootstrap.com/. Pe ecran mic se vor afisa doar iconurile fara text (realizati acest task in mod cat mai eficient - scris cat mai putin)
Inputul de tip textarea va avea un floating label (bootstrap). In cazul validarii esuate a valorii din textarea (vezi cerinta cu validarea din etapa 5), floating label-ul va fi de tip is-invalid (se va seta prin javascript) si se va corecta automat daca valoarea din textarea devine valida.
Fie inputurile de tip checkbox fie cele radio vor fi stilizate ca toogle buttons(din bootstrap). Butoanele deslectate trebuie sa fie desenate in stil outline (adica sa apara doar granita, fara background si textul sa fie colorat), iar la selectare sa apara cu background colorat - vezi clasele btn-outline). Atentie trebuie folosit bootstrap nu css!
Asezarea inputurilor in mod ordonat si aliniat pe coloane in cadrul paginii de produse se va face printr-un grid bootstrap (vezi clasele row si col, impreuna cu clasele asociate query-urilor media).
Butonul pentru schimbarea temei sa fie un switch din bootstrap (imagineasau iconul cu luna/soarele, ramane in pagina, cu acelasi comportament) Observatie pt cei care au bonusul cu mai multe teme: puteti inlocui cu alt element de bootstrap.
Pentru inputul de tip range,schimbati cu ajutorul customizarii bootstrap (prin variabile scss) dimensiunea bulinei care gliseaza (sa fie cu 50% mai mare fata de dimensiunea font-size-ului html-ului), schimbati de asemenea culoarea bulinei si culoarea sliderului. Variabilele necesare se gasesc in reference: https://getbootstrap.com/docs/5.0/forms/range/


## (0.2p) light/dark theme cu variabile CSS (optional in SASS).
 Pentru moment va exista un buton în pagină care va face schimbarea. Butonul va fi reprezentat printr-o imagine cu soare (pt light) vs lună (pt dark) - poate fi un icon din fontawesome. Tema aleasă se va memora in localStorage si se va pastra tema la urmatoarea intrare pe pagina si pe restul paginilor site-ului.

