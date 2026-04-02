from openai import AsyncOpenAI
import io

client = AsyncOpenAI()  # legge OPENAI_API_KEY dall'ambiente

class RecordingRepository():
    """
    @brief Implementazione della porta di trascrizione tramite OpenAI Whisper.
    """

    async def trascrivi(self, audio_bytes: bytes, filename: str) -> str:
        """
        @brief Invia l'audio a Whisper e restituisce il testo trascritto.
        @param audio_bytes Contenuto binario del file audio.
        @param filename    Nome del file con estensione.
        @return Testo trascritto da Whisper.
        @raise Exception   Se la chiamata a Whisper fallisce.
        """
        file_like = io.BytesIO(audio_bytes)
        file_like.name = filename

        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=file_like,
            language="it",
        )
        return response.text