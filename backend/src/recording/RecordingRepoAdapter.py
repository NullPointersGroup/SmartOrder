from .IRecordingRepoPort import IRecordingRepoPort
from .RecordingRepository import RecordingRepository

class RecordingRepoAdapter(IRecordingRepoPort):
    """
    @brief Adapter che delega la trascrizione al RecordingRepository.
    """

    def __init__(self, repo: RecordingRepository) -> None:
        self._repo = repo

    async def trascrivi(self, audio_bytes: bytes, filename: str) -> str:
        """
        @brief Delega la trascrizione al repository.
        @param audio_bytes Contenuto binario del file audio.
        @param filename    Nome del file con estensione.
        @return Testo trascritto.
        """
        return await self._repo.trascrivi(audio_bytes, filename)