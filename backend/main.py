import os
import json
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# 환경변수 로드
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Render 환경변수 우선 사용
GEMINI_KEY = os.environ.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

app = FastAPI()

# [수정 1] CORS 설정을 다른 어떤 라우트보다도 위에 배치하세요.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# [수정 2] Render의 헬스체크를 위해 루트 경로 추가 (로그에 404 안 뜨게 함)
@app.get("/")
async def root():
    return {"message": "Foodket Backend is Running!"}

class RecipeRequest(BaseModel):
    ingredients: list[str]
    user_id: str

@app.post("/api/ai/recommend")
async def recommend_recipe(request: RecipeRequest):
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="API Key Missing")

    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    try:
        ingredients_str = ", ".join(request.ingredients)
        prompt = (
            f"재료: {ingredients_str}. 요리 1개를 추천해줘.\n"
            "반드시 JSON 형식으로만 응답: {\"title\": \"요리명\", \"ingredients\": [\"재료\"], \"instructions\": [\"순서\"]}"
        )
        
        response = model.generate_content(prompt)
        if response and response.text:
            raw_text = response.text.strip()
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            recipe_data = json.loads(json_match.group(0)) if json_match else json.loads(raw_text)
            return {"status": "success", "recipe": recipe_data}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Render는 포트 번호를 환경변수로 넘겨주기도 하므로 아래처럼 설정하는 것이 안전합니다.
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
