import type { MessageType } from "../types/Chat";

export class ChatViewModel {

    private readonly messages: MessageType[] = []

    getMessages(): MessageType[] {
        return this.messages
    }

    private addMessage(text: string) {

        // da cambiare
        this.messages.push({ id_message: 0, text: text })
    }

    sendMessage(text: string) {

    }

    fetchMessages(): MessageType[] {
        return []
    }

}