import os
import json
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import generativeai
from dotenv import load_dotenv

# 환경변수 로드
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class RecipeRequest(BaseModel):
    ingredients: list[str]
    user_id: str

@app.post("/api/ai/recommend")
async def recommend_recipe(request: RecipeRequest):
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="API 키가 없습니다.")

    # 호출할 모델 후보군 (환경마다 인식하는 이름이 다를 수 있음)
    model_candidates = ["gemini-2.5-flash"]
    last_error = ""

    client = genai.Client(api_key=GEMINI_KEY)
    
    for model_name in model_candidates:
        try:
            print(f"🔄 시도 중인 모델명: {model_name}")
            
            ingredients_str = ", ".join(request.ingredients)
            prompt = (
                f"재료: {ingredients_str}. 이 재료로 만드는 요리 1개를 추천해줘.\n"
                "반드시 아래 JSON 형식으로만 응답해:\n"
                "{\"title\": \"요리명\", \"ingredients\": [\"재료\"], \"instructions\": [\"순서\"]}"
            )
            
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )

            # 성공 시 데이터 처리
            if response and response.text:
                raw_text = response.text.strip()
                json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                recipe_data = json.loads(json_match.group(0)) if json_match else json.loads(raw_text)
                
                print(f"✅ {model_name} 호출 성공!")
                return {"status": "success", "recipe": recipe_data}

        except Exception as e:
            last_error = str(e)
            print(f"❌ {model_name} 실패: {last_error}")
            continue # 다음 모델명으로 시도

    # 모든 시도가 실패한 경우
    raise HTTPException(status_code=500, detail=f"모든 모델 호출 실패. 최종 에러: {last_error}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)