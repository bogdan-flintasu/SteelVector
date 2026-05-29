-- =============================================================
--  SteelVector — Tabel produse (structuri metalice)
--  Rulati in pgAdmin (Alt+Shift+Q → F5)
-- =============================================================

-- Stergem tipurile daca exista (pentru re-rulare)
DROP TABLE IF EXISTS produse;
DROP TYPE IF EXISTS tip_profil;
DROP TYPE IF EXISTS aplicatie_profil;

-- Categoria mare: tipul de profil metalic (max 5 valori)
CREATE TYPE tip_profil AS ENUM('IPE', 'HEA', 'HEB', 'teava', 'bara');

-- Categoria secundara: aplicatia / utilizarea
CREATE TYPE aplicatie_profil AS ENUM('structurala', 'rezistenta', 'ornamentala', 'industriala', 'generala');

CREATE TABLE IF NOT EXISTS produse (
    id SERIAL PRIMARY KEY,
    nume VARCHAR(100) UNIQUE NOT NULL,
    descriere TEXT,
    imagine VARCHAR(300),
    tip tip_profil NOT NULL DEFAULT 'IPE',
    aplicatie aplicatie_profil NOT NULL DEFAULT 'generala',
    pret NUMERIC(10,2) NOT NULL CHECK (pret >= 0),
    lungime_mm INT NOT NULL CHECK (lungime_mm > 0),
    data_adaugare TIMESTAMP DEFAULT current_timestamp,
    finisaj VARCHAR(50) NOT NULL DEFAULT 'brut',
    certificari VARCHAR(500),
    livrare_rapida BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================================
--  Inserare 18 produse diversificate
-- =============================================================

INSERT INTO produse (nume, descriere, imagine, tip, aplicatie, pret, lungime_mm, data_adaugare, finisaj, certificari, livrare_rapida) VALUES

-- === IPE (5 produse) ===
('Profil IPE 100',
 'Profil laminat la cald IPE 100, ideal pentru grinzi secundare în hale mici și structuri ușoare. Oferă un raport excelent între greutate și rezistență la încovoiere.',
 'IPE300.png', 'IPE', 'structurala', 185.50, 6000,
 '2024-03-15 10:30:00', 'brut', 'EN 10025, CE', TRUE),

('Profil IPE 200',
 'Grindă IPE 200 pentru aplicații structurale medii. Secțiune transversală optimizată pentru rezistență maximă cu consum minim de material.',
 'IPE300.png', 'IPE', 'rezistenta', 320.00, 6000,
 '2024-06-20 14:00:00', 'zincat', 'EN 10025, ISO 9001, CE', TRUE),

('Profil IPE 300',
 'Profil IPE 300 de înaltă rezistență, folosit în construcții industriale majore. Certificat conform standardelor europene actuale pentru structuri portante.',
 'IPE300.png', 'IPE', 'rezistenta', 580.00, 12000,
 '2025-01-10 09:15:00', 'vopsit', 'EN 10025, ISO 9001, EN 1090, CE', FALSE),

('Profil IPE 450',
 'Grindă IPE 450 cu capacitate portantă excepțională. Recomandată pentru deschideri mari în hale industriale și structuri de mare tonaj.',
 'IPE300.png', 'IPE', 'industriala', 1250.00, 12000,
 '2025-09-05 11:45:00', 'galvanizat', 'EN 10025, EN 1090, CE', FALSE),

('Profil IPE 160 decorativ',
 'Profil IPE 160 cu finisaj special pentru utilizări arhitecturale și decorative. Suprafață tratată pentru aspect estetic premium.',
 'IPE300.png', 'IPE', 'ornamentala', 290.00, 3000,
 '2026-02-14 16:30:00', 'vopsit', 'CE', TRUE),

-- === HEA (3 produse) ===
('Profil HEA 200',
 'Profil HEA 200 cu aripi late, oferind stabilitate superioară. Potrivit pentru stâlpi și grinzi principale în construcții metalice.',
 'teava100x100.png', 'HEA', 'structurala', 450.00, 6000,
 '2024-08-12 08:00:00', 'brut', 'EN 10025, ISO 9001, CE', TRUE),

('Profil HEA 300',
 'Profil HEA 300 robust, destinat proiectelor de mare anvergură. Aripi late asigură distribuția uniformă a sarcinilor pe suprafețe mari.',
 'teava100x100.png', 'HEA', 'rezistenta', 890.00, 12000,
 '2025-04-22 13:20:00', 'zincat', 'EN 10025, EN 1090, ISO 9001, CE', FALSE),

('Profil HEA 160',
 'Profil HEA 160 versatil, cu masă redusă per metru liniar. Ideal pentru structuri secundare, contravantuiri și cadre ușoare.',
 'teava100x100.png', 'HEA', 'generala', 310.00, 6000,
 '2025-11-30 10:00:00', 'decapat', 'EN 10025, CE', TRUE),

-- === HEB (3 produse) ===
('Profil HEB 200',
 'Profil HEB 200 cu aripi groase, conceput pentru sarcini axiale și de compresiune ridicate. Stâlpi portanți de încredere.',
 'bara-rotunda.png', 'HEB', 'rezistenta', 620.00, 6000,
 '2024-11-08 09:30:00', 'brut', 'EN 10025, ISO 9001, CE', FALSE),

('Profil HEB 300',
 'Profil HEB 300 de clasa premium, utilizat în poduri, viaducte și structuri speciale. Rezistență la oboseală conform EN 1993.',
 'bara-rotunda.png', 'HEB', 'industriala', 1450.00, 12000,
 '2025-07-16 15:45:00', 'galvanizat', 'EN 10025, EN 1090, EN 1993, ISO 9001, CE', FALSE),

('Profil HEB 140 ornamental',
 'Profil HEB 140 cu tratament de suprafață special pentru aplicații vizibile. Potrivit pentru balustrade, garduri metalice și elemente decorative.',
 'bara-rotunda.png', 'HEB', 'ornamentala', 280.00, 3000,
 '2026-01-20 12:00:00', 'vopsit', 'CE', TRUE),

-- === Țevi (4 produse) ===
('Țeavă pătrată 100x100x4',
 'Țeavă structurală pătrată cu secțiune 100x100 mm și grosime perete de 4 mm. Folosită la cadre, suporturi și stâlpi intermediari.',
 'teava100x100.png', 'teava', 'structurala', 175.00, 6000,
 '2024-05-03 11:00:00', 'zincat', 'EN 10219, CE', TRUE),

('Țeavă rotundă Ø76x3',
 'Țeavă rotundă cu diametru exterior 76 mm și grosime perete 3 mm. Ideală pentru balustrade, garduri și structuri tubulare ușoare.',
 'teava100x100.png', 'teava', 'ornamentala', 95.00, 6000,
 '2025-02-28 14:30:00', 'galvanizat', 'EN 10219, ISO 9001, CE', TRUE),

('Țeavă rectangulară 120x60x5',
 'Țeavă dreptunghiulară robustă, potrivită pentru grinzi secundare, traverse și cadre de mașini industriale. Rezistență excelentă la torsiune.',
 'teava100x100.png', 'teava', 'industriala', 230.00, 6000,
 '2025-06-10 08:45:00', 'decapat', 'EN 10219, EN 1090, CE', FALSE),

('Țeavă pătrată 50x50x2 subțire',
 'Țeavă pătrată cu pereți subțiri, perfectă pentru structuri ușoare, mobilier metalic și aplicații decorative interioare.',
 'teava100x100.png', 'teava', 'generala', 52.00, 3000,
 '2026-04-01 16:00:00', 'brut', 'CE', TRUE),

-- === Bare (3 produse) ===
('Bară rotundă Ø30 S235',
 'Bară rotundă din oțel S235, diametru 30 mm. Utilizată ca tiranți, ancore sau elemente de legătură în structuri metalice.',
 'bara-rotunda.png', 'bara', 'structurala', 68.00, 6000,
 '2024-09-25 10:15:00', 'brut', 'EN 10025, CE', TRUE),

('Bară pătrată 40x40 S355',
 'Bară pătrată din oțel de înaltă rezistență S355. Ideală pentru piese mecanice, suporturi și elemente solicitate intens la compresiune.',
 'bara-rotunda.png', 'bara', 'rezistenta', 125.00, 6000,
 '2025-03-18 09:00:00', 'zincat', 'EN 10025, ISO 9001, CE', FALSE),

('Platbandă 60x8 decorativă',
 'Platbandă din oțel laminat, lățime 60 mm, grosime 8 mm. Folosită pentru elemente de legătură, plăci de bază și decorațiuni metalice.',
 'bara-rotunda.png', 'bara', 'ornamentala', 45.00, 3000,
 '2026-05-01 13:30:00', 'vopsit', 'EN 10025, CE', TRUE);
