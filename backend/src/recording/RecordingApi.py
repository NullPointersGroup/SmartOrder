from typing import Annotated, Dict
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from .RecordingService import RecordingService
from .RecordingRepoAdapter import RecordingRepoAdapter
from .RecordingRepository import RecordingRepository
import os
from openai import AsyncOpenAI

router = APIRouter(prefix="/recording", tags=["recording"])

def get_service() -> RecordingService:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    repo = RecordingRepository(client)
    adapter = RecordingRepoAdapter(repo)
    return RecordingService(adapter)

ServiceDep = Annotated[RecordingService, Depends(get_service)]

@router.post(
    "/trascrivi",
    responses={
        400: {"description": "Il file audio è vuoto."},
        500: {"description": "Errore durante la trascrizione con Whisper."},
    },
)
async def trascrivi_audio(
    file: Annotated[UploadFile, File(description="File audio da trascrivere (webm, mp3, wav, m4a)")],
    service: ServiceDep,
) -> Dict[str, str]:
    """
    @brief Riceve un file audio e restituisce la trascrizione testuale.
    @param file    File audio caricato dal client (webm, mp3, wav, m4a).
    @return JSON con il campo 'testo' contenente la trascrizione.
    @raise HTTPException 400 se il file è vuoto.
    @raise HTTPException 500 se la trascrizione fallisce.
    """
    audio_bytes = await file.read()
    try:
        testo = await service.trascrivi_audio(audio_bytes, file.filename or "audio.webm")
        return {"testo": testo}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nella trascrizione: {str(e)}")