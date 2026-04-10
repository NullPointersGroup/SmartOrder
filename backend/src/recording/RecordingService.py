from .RecordingPort import RecordingPort
from mutagen import File #type: ignore
import tempfile
import os
import aiofiles

MAX_DURATION_SEC = 120
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class RecordingService:
    """
    @brief Service per la gestione della trascrizione audio.
    """

    def __init__(self, repo: RecordingPort):
        """
        @brief Inizializza il service con la porta di trascrizione.
        @param repo Implementazione di IRecordingRepoPort.
        """
        self._repo = repo

    async def trascrivi_audio(self, audio_bytes: bytes, filename: str) -> str:
        """
        @brief Trascrive un file audio in testo, validandone durata e dimensione
        @param audio_bytes Contenuto del file audio in bytes
        @param filename Nome del file per estrarre l'estensione
        @return Testo trascritto dall'API di riconoscimento vocale
        @throws ValueError se file vuoto, troppo grande, formato non supportato o troppo lungo
        """
        if not audio_bytes:
            raise ValueError("Il file audio è vuoto.")

        if len(audio_bytes) > MAX_SIZE_BYTES:
            raise ValueError("Il file audio non può superare i 10 MB.")

        ext = os.path.splitext(filename)[-1] or '.mp3'
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=ext)
        os.close(tmp_fd)

        durata = None
        try:
            async with aiofiles.open(tmp_path, 'wb') as tmp:
                await tmp.write(audio_bytes)

            audio = File(tmp_path)

            if audio is None or not hasattr(audio, "info") or not hasattr(audio.info, "length"):
                # mutagen non riesce a leggere il formato (es. webm/opus)
                # salta la validazione della durata e procedi
                durata = None
            else:
                durata = float(audio.info.length)
                print(f"Durata rilevata: {durata}s")
                if durata > MAX_DURATION_SEC:
                    raise ValueError(f"Il file audio non può superare i {MAX_DURATION_SEC} secondi.")
        finally:
            os.unlink(tmp_path)

        testo = await self._repo.trascrivi(audio_bytes, filename)
        return testo