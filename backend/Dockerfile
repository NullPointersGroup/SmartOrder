FROM python:3.12-slim

WORKDIR /src

# 1. Installa PyTorch CPU-only (compatibile con Python 3.13)
# Usiamo l'URL specifico per evitare pacchetti NVIDIA/CUDA
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 2. Installa Sentence Transformers
RUN pip install --no-cache-dir sentence-transformers

# (Opzionale) Pre-carica il modello per evitare download al runtime
# Sostituisci 'all-MiniLM-L6-v2' con il modello che preferisci
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
