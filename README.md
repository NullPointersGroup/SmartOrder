<h1 align="center">SmartOrder</h1>

[![CI](https://github.com/NullPointersGroup/SmartOrder/actions/workflows/CI.yml/badge.svg)](https://github.com/NullPointersGroup/SmartOrder/actions/workflows/CI.yml)

Progetto didattico svolto dal gruppo "NullPointers Group" per il corso di Ingegneria del Software a.a. 2025-26 - Università di Padova, c.d.l. triennale in Informatica.

Azienda proponente: [Ergon s.r.l.](https://www.ergon.it/)

Capitolato: C8 - [SmartOrder](https://www.math.unipd.it/~tullio/IS-1/2025/Progetto/C8.pdf)

---

## Installazione

Segui i passaggi nell'ordine indicato per evitare errori durante la configurazione.

### 1. Clona la repository

**Con Git:**
```bash
git clone https://github.com/NullPointersGroup/SmartOrder.git
```

**Oppure** scarica lo ZIP dalla [pagina del progetto](https://github.com/NullPointersGroup/SmartOrder) e decomprimilo.

---

### 2. Crea una API Key OpenAI

1. Vai su [platform.openai.com](https://platform.openai.com) e accedi o registrati
2. Vai nella sezione **API Keys**
3. Clicca su **Create new secret key**
4. Copia la chiave generata — ti servirà nel passaggio 4

---

### 3. Genera una SECRET_KEY

Assicurati di avere [Python](https://www.python.org/downloads/) installato, poi esegui:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copia la stringa di 64 caratteri generata — ti servirà nel passaggio successivo.

---

### 4. Configura l'ambiente

Nella root del progetto (dove si trova `README.md`), crea un file `.env` con il seguente contenuto:

```env
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=mydb
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://user:password@db:5432/mydb
OPENAI_API_KEY=LA_TUA_API_KEY
SECRET_KEY=LA_TUA_CHIAVE_SEGRETA_GENERATA
VITE_API_BASE_URL=http://backend:8000
```

Sostituisci `LA_TUA_API_KEY` con la chiave del passaggio 2 e `LA_TUA_CHIAVE_SEGRETA_GENERATA` con la stringa del passaggio 3.

---

### 5. Avvia l'applicazione

Assicurati di avere [Docker](https://docs.docker.com/engine/install/) installato, poi esegui:

```bash
cd /percorso/SmartOrder
docker compose up --build
```

---

### 6. Accedi al sistema

### 6. Accedi al sistema

Una volta avviati i container (`postgres_test`, `postgres_db`, `react_frontend`, `fastapi_backend`), apri il browser e vai su:
http://localhost:5173

---

### Riavvio e reset

Per riavviare completamente il sistema e rimuovere tutti i dati salvati:

```bash
docker compose down -v
```

---

# Componenti
| Nome       | Cognome     | Numero Matricola |
|------------|-------------|------------------|
| Matteo     | Mazzaretto  | 2111005          |
| Marco      | Brunello    | 2110997          |
| Tommaso    | Ceron       | 2101045          |
| Luca       | Marcuzzo    | 2113198          |
| Laura      | Pieripolli  | 2048057          |
| Lisa       | Casagrande  | 2116440          |
