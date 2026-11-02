from fastapi import FastAPI

app = FastAPI(title="NAKSAN.NAV API")


@app.get("/health")
def health():
    return {"status": "ok"}
