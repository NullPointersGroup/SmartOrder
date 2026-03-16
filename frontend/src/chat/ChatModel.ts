import type { MessageType } from "../types/Chat";

class ChatModel {
    private readonly API_BASE = "http://localhost:8000"

    async get_all_messages(id_conversation: number): Promise<MessageType[]> {
        const response = await fetch(`${this.API_BASE}/chat/getAllMessages?id_conv=${id_conversation}`)
        if (!response.ok)
            return []
        const data = await response.json() as { messages: MessageType[] }
        return data.messages
    }
}