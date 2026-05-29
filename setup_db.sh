#!/bin/bash
# ==============================================================================
#  SteelVector — Script instalare și configurare bază de date PostgreSQL
#  Sistem de operare suportat: Ubuntu / Debian
# ==============================================================================
set -e

echo "======================================================================="
echo " 🏗️  SteelVector — Configurare automată PostgreSQL"
echo "======================================================================="
echo "Acest script va instala PostgreSQL, va crea baza de date și utilizatorul,"
echo "și va popula tabela cu cele 18 produse din produse.sql."
echo "Este posibil să vi se ceară parola sudo pentru instalarea pachetelor."
echo "-----------------------------------------------------------------------"
echo ""

# 1. Actualizare pachete și instalare PostgreSQL
echo "Step 1: Instalăm PostgreSQL..."
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# 2. Pornire și activare serviciu
echo "Step 2: Pornim serviciul PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "Așteptăm 3 secunde ca serviciul să fie complet activ..."
sleep 3

# 3. Configurare PostgreSQL (creare DB și utilizator)
echo "Step 3: Configurăm baza de date și utilizatorul..."
# Creăm baza de date (dacă nu există deja)
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'steelvector_db'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE steelvector_db ENCODING 'UTF-8';"

# Creăm utilizatorul (dacă nu există deja)
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname = 'sv_user'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER sv_user WITH ENCRYPTED PASSWORD 'sv_pass';"

# Acordăm drepturi de bază
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE steelvector_db TO sv_user;"

# Permisiuni pe schema public
sudo -u postgres psql -d steelvector_db -c "GRANT ALL ON SCHEMA public TO sv_user;"
sudo -u postgres psql -d steelvector_db -c "ALTER SCHEMA public OWNER TO sv_user;"

# 4. Popularea bazei de date folosind produse.sql
echo "Step 4: Populăm tabela de produse folosind produse.sql..."
# Modificăm local pg_hba.conf sau folosim psql direct ca utilizatorul postgres pentru a rula fișierul
sudo -u postgres psql -d steelvector_db -f produse.sql

# 5. Acordăm drepturi pe tabelele create
echo "Step 5: Acordăm privilegii utilizatorului sv_user pe tabele..."
sudo -u postgres psql -d steelvector_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sv_user;"
sudo -u postgres psql -d steelvector_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sv_user;"

echo ""
echo "======================================================================="
echo " 🎉 Configurare finalizată cu succes!"
echo " Baza de date 'steelvector_db' este pregătită și populată cu 18 produse."
echo " Utilizatorul 'sv_user' are toate permisiunile necesare."
echo "-----------------------------------------------------------------------"
echo " Porniți aplicația cu: npm run dev"
echo "======================================================================="
