from .IRecordingRepoPort import IRecordingRepoPort
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

    def __init__(self, repo: IRecordingRepoPort):
        """
        @brief Inizializza il service con la porta di trascrizione.
        @param repo Implementazione di IRecordingRepoPort.
        """
        self._repo = repo

    async def trascrivi_audio(self, audio_bytes: bytes, filename: str) -> str:
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
                raise ValueError("Formato audio non supportato.")

            durata = float(audio.info.length)

            print(f"Durata rilevata: {durata}s")
            
            if durata > MAX_DURATION_SEC:
                raise ValueError(f"Il file audio non può superare i {MAX_DURATION_SEC} secondi.")
        finally:
            os.unlink(tmp_path)

        testo = await self._repo.trascrivi(audio_bytes, filename)
        return testo