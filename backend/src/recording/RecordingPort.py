from abc import ABC, abstractmethod

class RecordingPort(ABC):
    """
    @brief Porta per la trascrizione di audio tramite servizio esterno.
    """

    @abstractmethod
    async def trascrivi(self, audio_bytes: bytes, filename: str) -> str:
        """
        @brief Trascrive un file audio in testo.
        @param audio_bytes Contenuto binario del file audio.
        @param filename    Nome del file con estensione (es. audio.webm).
        @return Testo trascritto.
        @raise Exception   Se la trascrizione fallisce.
        """