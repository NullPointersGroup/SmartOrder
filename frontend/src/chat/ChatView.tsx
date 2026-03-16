import { useState } from "react"
import type { MeasureMemoryMode } from "vm"
import type { MessageType } from "../types/Chat"

export function Chat() {
    return <div>
        <Messaggi />
        <InputBar />
    </div>
}

interface MessaggiProp {
    readonly messaggi: MessageType[]
}

function Messaggi({ messaggi }: MessaggiProp) {
    return <div>
        {messaggi.map((m) => {
            return <Messaggio key={m.id_message} text={m.text} />
        })}
    </div>
}

interface MessaggioProps {
    readonly text: string
}

function Messaggio({ text }: MessaggioProps) {
    return <div>
        {text}
    </div>
}

interface InputBarProps {
    readonly onSend: (txt: string) => void
}

function InputBar({ onSend }: InputBarProps) {
    const [text, setText] = useState("")
    return <div>
        <form action="post" onSubmit={() => onSend(text)}>
            <textarea
                onChange={(e) => setText(e.target.value)}
                name="messaggio">{text}</textarea>
            <button type="submit">Invia</button>
        </form>
    </div >
}