import os
import json
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, Response
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

# FastAPI의 미들웨어 버그를 완벽하게 우회하는 커스텀 CORS 헤더 강제 인젝션 로직
@app.middleware("http")
async def add_custom_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin", "*")
    if request.method == "OPTIONS":
        response = Response()
        response.status_code = 200
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


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

class RecipeSaveRequest(BaseModel):
    user_id: str
    recipe: Dict[str, Any]


# --- API 엔드포인트 ---

# AI 레시피 추천 라우터
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
            "반드시 JSON 형식으로만 응답해야 해. Markdown 기호(```json) 쓰지 말고 순수 텍스트로만 줘.\n"
            "형식: {\"title\": \"요리명\", \"ingredients\": [\"재료\"], \"instructions\": [\"조리순서 배열\"]}"
        )
        
        response = model.generate_content(prompt)
        if response and response.text:
            raw_text = response.text.strip()
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
            
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            recipe_data = json.loads(json_match.group(0)) if json_match else json.loads(raw_text)
            
            # 🌟 [초핵심 방어선] 프론트엔드가 'map' 에러를 내지 않도록 모든 후보 Key(`instructions`, `steps`)를 이중 매핑하여 전달
            final_title = recipe_data.get("title") or recipe_data.get("name") or "추천 요리"
            final_ingredients = recipe_data.get("ingredients") or []
            final_instructions = recipe_data.get("instructions") or recipe_data.get("steps") or []

            return {
                "status": "success", 
                "recipe": {
                    "id": final_title,
                    "name": final_title,
                    "title": final_title, # 프론트 엔드 매핑 방어
                    "difficulty": recipe_data.get("difficulty", "중"),
                    "time": recipe_data.get("time", "20분"),
                    "servings": recipe_data.get("servings", "1인분"),
                    "ingredients": final_ingredients,
                    "instructions": final_instructions, # 👈 프론트엔드가 .map() 돌릴 대상 안전하게 주입
                    "steps": final_instructions        # 이중 방어
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# AI 레시피 서버 저장 라우터
@app.post("/api/recipe/save")
async def save_recipe(request: RecipeSaveRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase Credentials Missing")
    
    try:
        print(f"🚀 [레시피 저장 요청] User ID: {request.user_id}, 요리명: {request.recipe.get('name')}")
        
        data, count = supabase.table("ai_recipes").insert({
            "user_id": request.user_id,
            "recipe_id": request.recipe.get("id"),
            "name": request.recipe.get("name"),
            "difficulty": request.recipe.get("difficulty"),
            "time": request.recipe.get("time"),
            "servings": request.recipe.get("servings"),
            "ingredients": request.recipe.get("ingredients"),
            "steps": request.recipe.get("steps") or request.recipe.get("instructions"),
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