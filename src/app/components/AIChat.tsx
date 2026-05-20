import { useState } from "react";
import { ArrowLeft, Send, Sparkles, ChefHat } from "lucide-react";
import { useNavigate } from "react-router";
import { getAiRecipe } from "../../api/foodketapi";

type ChatStep =
  | "purpose"
  | "style"
  | "ingredients"
  | "cooking"
  | "time"
  | "result";

interface ChatMessage {
  type: "bot" | "user";
  content: string;
}

interface UserChoices {
  purpose?: string;
  style?: string;
  ingredients?: string;
  cooking?: string;
  time?: string;
}

interface SavedRecipe {
  id: string;
  name: string;
  difficulty: string;
  time: string;
  servings: string;
  ingredients: string[];
  steps: string[];
  additionalInfo?: string;
  userChoices: UserChoices;
  savedAt: string;
}

export default function AIChat() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ChatStep>("purpose");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: "bot",
      content: "안녕하세요! 🍳 오늘 어떤 음식을 만들고 싶으신가요?",
    },
    { type: "bot", content: "먼저 목적을 선택해주세요!" },
  ]);
  const [userChoices, setUserChoices] = useState<UserChoices>({});
  const [inputValue, setInputValue] = useState("");
  const [currentRecipe, setCurrentRecipe] = useState<SavedRecipe | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const recommendedIngredients: Record<string, string[]> = {
    한식: ["밥", "김치", "계란", "대파", "간장", "참기름", "고추장", "된장", "두부", "당근"],
    양식: ["파스타면", "토마토소스", "치즈", "올리브유", "마늘", "양파", "버터", "크림", "베이컨"],
    중식: ["밥", "계란", "대파", "간장", "굴소스", "청경채", "두부", "당근", "양파", "식용유"],
    일식: ["밥", "계란", "간장", "김", "미림", "두부", "대파", "참치캔", "깨", "와사비"],
    분식: ["라면", "떡", "계란", "대파", "김치", "어묵", "고추장", "치즈", "햄", "양파"],
    기타: ["밥", "계란", "대파", "간장", "식용유", "마늘", "양파", "소금", "후추"],
  };

  const questions = {
    purpose: {
      question: "어떤 목적의 요리인가요?",
      options: ["야식", "아침", "점심", "저녁", "간식", "후식"],
    },
    style: {
      question: "어떤 스타일의 음식을 원하시나요?",
      options: ["한식", "양식", "중식", "일식", "분식", "기타"],
    },
    ingredients: {
      question: "현재 가지고 있는 식재료를 입력해주세요",
      freeInput: true,
    },
    cooking: {
      question: "원하는 조리 방식은?",
      options: ["볶음", "끓임", "구이", "찜", "무침", "튀김", "상관없음"],
    },
    time: {
      question: "조리 시간은 얼마나 되나요?",
      options: ["10분 이내", "10-20분", "20-30분", "30분 이상", "상관없음"],
    },
  };

  const handleChoice = (choice: string) => {
    const newMessages = [...messages, { type: "user" as const, content: choice }];
    setMessages(newMessages);

    const nextStep = getNextStep(step);
    const updatedChoices = { ...userChoices, [step]: choice };
    setUserChoices(updatedChoices);

    setTimeout(() => {
      if (nextStep === "result") {
        generateRecipe(updatedChoices);
      } else {
        const question = questions[nextStep as keyof typeof questions];
        if (nextStep === "ingredients") {
          setMessages([
            ...newMessages,
            { type: "bot", content: question.question },
            {
              type: "bot",
              content: `💡 ${choice} 스타일에 자주 쓰이는 식재료예요. 가지고 있는 재료를 선택해보세요!`,
            },
          ]);
        } else {
          setMessages([...newMessages, { type: "bot", content: question.question }]);
        }
        setStep(nextStep);
      }
    }, 500);
  };

  const handleIngredientToggle = (ingredient: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient) ? prev.filter((item) => item !== ingredient) : [...prev, ingredient]
    );
  };

  const handleFreeInput = () => {
    if (step === "ingredients") {
      const allIngredients = [
        ...selectedIngredients,
        ...inputValue.split(/[,，\s]+/).map((i) => i.trim()).filter((i) => i.length > 0),
      ];
      const ingredientsText = [...new Set(allIngredients)].join(", ");
      if (!ingredientsText.trim()) return;

      const newMessages = [...messages, { type: "user" as const, content: ingredientsText }];
      setMessages(newMessages);
      const nextStep = getNextStep(step);
      const updatedChoices = { ...userChoices, ingredients: ingredientsText };
      setUserChoices(updatedChoices);
      setInputValue("");
      setSelectedIngredients([]);
      setTimeout(() => {
        if (nextStep === "result") generateRecipe(updatedChoices);
        else {
          setMessages([...newMessages, { type: "bot", content: questions[nextStep as keyof typeof questions].question }]);
          setStep(nextStep);
        }
      }, 500);
    } else {
      if (!inputValue.trim()) return;
      const newMessages = [...messages, { type: "user" as const, content: inputValue }];
      setMessages(newMessages);
      const nextStep = getNextStep(step);
      const updatedChoices = { ...userChoices, [step]: inputValue };
      setUserChoices(updatedChoices);
      setInputValue("");
      setTimeout(() => {
        if (nextStep === "result") generateRecipe(updatedChoices);
        else {
          setMessages([...newMessages, { type: "bot", content: questions[nextStep as keyof typeof questions].question }]);
          setStep(nextStep);
        }
      }, 500);
    }
  };

  const getNextStep = (currentStep: ChatStep): ChatStep => {
    const steps: ChatStep[] = ["purpose", "style", "ingredients", "cooking", "time", "result"];
    const currentIndex = steps.indexOf(currentStep);
    return steps[currentIndex + 1];
  };

  const generateRecipe = async (choices: UserChoices) => {
    setMessages((prev) => [
      ...prev,
      {
        type: "bot",
        content: "잠시만 기다려주세요... AI가 당신만을 위한 레시피를 생성하고 있습니다 🔍",
      },
    ]);

    try {
      const ingredientsArray = choices.ingredients?.split(",").map((i) => i.trim()) || [];
      
      // ✅ 1. 'data' 변수로 응답을 받습니다.
      const data = await getAiRecipe(ingredientsArray, "user_123");

      console.log("레시피 생성 성공:", data);

      // ✅ 2. 'response.data' 대신 'data'를 사용합니다.
      const rawContent = data.recipe;
      
      // JSON 파싱 (문자열일 경우 대비)
      const jsonContent = typeof rawContent === "string"
          ? JSON.parse(rawContent.replace(/```json|```/g, ""))
          : rawContent;

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          type: "bot",
          content: `완벽한 레시피를 완성했습니다! 🎉\n\n📌 요리명: ${jsonContent.title}\n난이도: 보통\n조리시간: ${choices.time || "20분"}`,
        },
        {
          type: "bot",
          content: `🥘 필요한 재료:\n${jsonContent.ingredients.map((ing: string) => `• ${ing}`).join("\n")}`,
        },
        {
          type: "bot",
          content: `👨‍🍳 조리 방법:\n${jsonContent.instructions.map((step: string, i: number) => `${i + 1}. ${step}`).join("\n\n")}`,
        },
      ]);

      setStep("result");
      setCurrentRecipe({
        id: Date.now().toString(),
        name: jsonContent.title,
        difficulty: "보통",
        time: choices.time || "20분",
        servings: "1인분",
        ingredients: jsonContent.ingredients,
        steps: jsonContent.instructions,
        userChoices: choices,
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Recipe Generation Error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          type: "bot",
          content: "죄송합니다. 레시피 생성 중 오류가 발생했습니다. 서버 상태를 확인해주세요. 😢",
        },
      ]);
    }
  };

  const currentQuestion = step !== "result" ? questions[step as keyof typeof questions] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-500" />
            <h1 className="text-lg font-bold">AI 요리 추천</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.type === "user" ? "bg-orange-500 text-white" : "bg-white text-gray-800 shadow-sm border border-gray-100"}`}>
              {msg.type === "bot" && <Sparkles className="w-4 h-4 text-orange-500 inline-block mr-2" />}
              <span className="whitespace-pre-line">{msg.content}</span>
            </div>
          </div>
        ))}
      </div>

      {step !== "result" && (
        <div className="bg-white border-t border-gray-200 sticky bottom-0 max-w-md mx-auto w-full pb-6">
          <div className="p-4 space-y-3">
            {currentQuestion && !("freeInput" in currentQuestion) ? (
              <div className="grid grid-cols-2 gap-2">
                {currentQuestion.options?.map((option) => (
                  <button key={option} onClick={() => handleChoice(option)} className="bg-orange-50 text-orange-600 font-medium py-3 px-4 rounded-xl hover:bg-orange-100 transition-colors border border-orange-200">
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {step === "ingredients" && userChoices.style && (
                  <div className="flex flex-wrap gap-2">
                    {recommendedIngredients[userChoices.style]?.map((ing) => (
                      <button
                        key={ing}
                        onClick={() => handleIngredientToggle(ing)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedIngredients.includes(ing) ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}
                      >
                        {ing} {selectedIngredients.includes(ing) ? "✓" : "+"}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleFreeInput()}
                    placeholder="재료를 입력하거나 선택하세요"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
                  />
                  <button onClick={handleFreeInput} className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="bg-white border-t border-gray-200 sticky bottom-0 max-w-md mx-auto w-full p-4 pb-8 flex gap-2">
          <button
            onClick={() => {
              if (currentRecipe) {
                const saved = JSON.parse(localStorage.getItem("savedRecipes") || "[]");
                localStorage.setItem("savedRecipes", JSON.stringify([...saved, currentRecipe]));
                alert("레시피 저장 완료!");
              }
              navigate("/");
            }}
            className="flex-1 bg-orange-500 text-white font-medium py-3 rounded-xl"
          >
            저장하기
          </button>
          <button onClick={() => window.location.reload()} className="flex-1 bg-gray-100 text-gray-800 font-medium py-3 rounded-xl">
            새로 시작
          </button>
        </div>
      )}
    </div>
  );
}
