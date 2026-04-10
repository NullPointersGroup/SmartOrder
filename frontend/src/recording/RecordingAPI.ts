export async function trascriviAudio(blob: Blob, filename = 'audio.webm'): Promise<string> {
    /**
   * @brief Invia un file audio al backend per la trascrizione in testo
   * @param blob File o blob audio da trascrivere
   * @param filename Nome del file (default 'audio.webm')
   * @return Promise con il testo trascritto
   * @throws Error se la richiesta fallisce o la trascrizione non riesce
   */
  const formData = new FormData()
  formData.append('file', blob, filename)

  const res = await fetch('/api/recording/trascrivi', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text() // usa text() invece di json() per vedere tutto
    console.error('Backend error:', res.status, text)
    throw new Error(text || 'Errore nella trascrizione audio')
  }

  const data = await res.json()
  return data.testo
}