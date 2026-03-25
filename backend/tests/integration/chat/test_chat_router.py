def test_get_all_messages_empty(client):
    response = client.get("/chat/1/all")
    assert response.status_code == 200
    assert response.json()["messages"] == []

def test_get_all_messages_not_found(client):
    response = client.get("/chat/999/all")
    assert response.status_code == 404

def test_send_message(client):
    response = client.post("/chat/1", json={
        "username": "mario",
        "content": "Ciao",
        "audioFile": "None",
        })
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"]["content"] is not None
    assert data["message"]["sender"] == "ChatBot"
