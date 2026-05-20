import os
import json
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv
# ✅ Supabase 라이브러리 임포트
from supabase import create_client, Client

# 환경변수 로드
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Render 및 로컬 환경변수 가져오기
GEMINI_KEY = os.environ.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Supabase 클라이언트 초기화 (환경변수가 있을 때만 인스턴스 생성)
supabase: Client = None
if SUPABASE_URL and SUPABASE_ANON_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Render 헬스체크용 루트 경로
@app.get("/")
async def root():
    return {"message": "Foodket Backend is Running!"}

# --- Pydantic 스키마 정의 ---
class RecipeRequest(BaseModel):
    ingredients: List[str]
    user_id: str

# ✅ 프론트엔드가 보낼 currentRecipe 데이터 구조에 맞춘 스키마 추가
class RecipeSaveRequest(BaseModel):
    user_id: str
    recipe: Dict[str, Any]


# --- API 엔드포인트 ---

# 1. AI 레시피 추천 라우터
@app.post("/api/ai/recommend")
async def recommend_recipe(request: RecipeRequest):
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="API Key Missing")

    genai.configure(api_key=GEMINI_KEY)
    # 기존 코드의 gemini-2.5-flash 모델 설정을 유지합니다.
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


# ✅ 2. AI 레시피 서버 저장 라우터 (프론트엔드 404 에러 해결 핵심)
@app.post("/api/recipe/save")
async def save_recipe(request: RecipeSaveRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase Credentials Missing")
    
    try:
        # 프론트에서 넘어온 데이터 디버깅 확인용 출력
        print(f"🚀 [레시피 저장 요청] User ID: {request.user_id}, 요리명: {request.recipe.get('name')}")
        
        # Supabase의 'ai_recipes' 테이블에 저장 요청을 보냅니다.
        # 데이터베이스 스키마 컬럼명에 맞게 key를 조절해 주세요.
        data, count = supabase.table("ai_recipes").insert({
            "user_id": request.user_id,
            "recipe_id": request.recipe.get("id"),
            "name": request.recipe.get("name"),
            "difficulty": request.recipe.get("difficulty"),
            "time": request.recipe.get("time"),
            "servings": request.recipe.get("servings"),
            # List(배열)나 객체 형태는 Postgres가 JSONB 타입일 때 안전하게 들어갑니다.
            "ingredients": request.recipe.get("ingredients"),
            "steps": request.recipe.get("steps"),
            "user_choices": request.recipe.get("userChoices"),
            "saved_at": request.recipe.get("savedAt")
        }).execute()
        
        return {"status": "success", "message": "Recipe successfully saved to server!"}
        
    except Exception as e:
        print("❌ Server Save Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
