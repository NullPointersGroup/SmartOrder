from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def hw() -> dict[str, str]:
    return {"Hello": "World!"}
