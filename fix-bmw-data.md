# Fix BMW Company Data

Acest document explică procesul prin care scraperul repară datele joburilor BMW
TechWorks Romania aduse în Solr prin alte scrapere (ANOFM, jobviewtrack etc.),
asigurându-se că toate au denumirea corectă a firmei și CIF-ul complet.

## Procesul

Modulul `fix-bmw-data.js` rulează la finalul scraperului și face următoarele:

### 1. Identificare joburi BMW

Se caută în Solr toate documentele al căror câmp `company` conține "BMW TECHWORKS".

### 2. Verificare URL (404 detection)

Pentru fiecare job găsit, se face un request `HEAD` către URL-ul său:

- **Dacă răspunsul NU este 2xx** → jobul este **șters din Solr**
- **Dacă răspunsul este 2xx** → se trece la pasul 3

### 3. Verificare corectitudine date

Un job are nevoie de reparație dacă:

- `company` ≠ `"BMW TECHWORKS ROMANIA SRL"` (denumire incompletă)
- `cif` ≠ `"49775344"` (lipsește CIF-ul)

### 4. Reparare (delete + re-insert)

Se șterge documentul existent din Solr și se reinserează cu `company` și `cif` corectate,
păstrând toate celelalte câmpuri originale.

**De ce delete + re-insert și nu atomic update?**
Operațiile de atomic update (`{set: ...}`) în Solr s-au dovedit instabile pe acest core —
creează documente duplicate sau pierd câmpuri.
