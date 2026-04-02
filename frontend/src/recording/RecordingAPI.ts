export async function trascriviAudio(blob: Blob, filename = 'audio.webm'): Promise<string> {
  console.log("Chiamato")
  const formData = new FormData()
  formData.append('file', blob, filename)

  const res = await fetch('/recording/trascrivi', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    console.log(data)
    throw new Error(data.detail ?? 'Errore nella trascrizione audio')
  }

  const data = await res.json()
  return data.testo
}