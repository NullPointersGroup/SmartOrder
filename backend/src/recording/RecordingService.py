from .IRecordingRepoPort import IRecordingRepoPort
from mutagen import File #type: ignore
import tempfile
import os
import aiofiles
from pydub import AudioSegment

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
            if audio is not None and hasattr(audio, 'info') and hasattr(audio.info, 'length'):
                durata = audio.info.length

            # fallback se mutagen restituisce 0 o None
            if not durata:
                segment = AudioSegment.from_file(tmp_path)
                durata = len(segment) / 1000.0  # ms → secondi

            print(f"Durata rilevata: {durata}s")
            if durata > MAX_DURATION_SEC:
                raise ValueError(f"Il file audio non può superare i {MAX_DURATION_SEC} secondi.")
        finally:
            os.unlink(tmp_path)

        testo = await self._repo.trascrivi(audio_bytes, filename)
        return testo