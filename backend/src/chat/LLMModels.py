from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str
    content: str


class UserPreference(BaseModel):
    prod_id: str
    prod_name: str
    frequency: int
    is_habitual: bool = False


class MetaData(BaseModel):
    model: str = ""
    total_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0


class LLMRequest(BaseModel):
    conversation_id: int
    message_id: int
    username: str = ""
    user_preferences: list[UserPreference] = Field(default_factory=list)
    chat_history: list[Message] = Field(default_factory=list)


class LLMResponse(BaseModel):
    content: str
    tool_calls: list[str] = Field(default_factory=list)
    metadata: list[MetaData] = Field(default_factory=list)
