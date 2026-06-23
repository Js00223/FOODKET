import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Home from "./components/Home";
import AIChat from "./components/AIChat";
import Community from "./components/Community";
import Trade from "./components/Trade";
import ChatList from "./components/ChatList";
import MyPage from "./components/MyPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import TradeDetail from "./components/TradeDetail";
import CommunityDetail from "./components/CommunityDetail";
import SavedRecipes from "./components/SavedRecipes";
import SavedRecipeDetail from "./components/SavedRecipeDetail";
import NotFound from "./components/NotFound";

// pages 폴더에서 가져오는 컴포넌트들
import MyRecipes from "../pages/my-posts/MyRecipes";
import MySales from "../pages/sales/MySales";
import Likes from "../pages/likes/likes";
import Account from "../pages/account";
import ChatRoom from "./components/ChatRoom";
import TradeWrite from "../pages/trade/TradeWrite";

// 💡 [추가] 프로필 사진 변경을 위한 전용 컴포넌트 임포트
// 파일 경로가 다르면 이 부분을 실제 경로에 맞춰주세요!
import ProfileEdit from "../pages/profile/edit";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "ai-chat", Component: AIChat },
      { path: "community", Component: Community },
      { path: "community/:id", Component: CommunityDetail },
      { path: "trade", Component: Trade },
      { path: "trades/:id", Component: TradeDetail },
      { path: "chats", Component: ChatList },
      { path: "chat/:id", Component: ChatRoom },
      { path: "trades/new", Component: TradeWrite },

      // 기존 저장된 레시피 경로
      { path: "saved-recipes", Component: SavedRecipes },
      { path: "saved-recipes/:id", Component: SavedRecipeDetail },

      // 마이페이지 메인
      { path: "mypage", Component: MyPage },

      // 마이페이지 상세 기능 경로
      { path: "my-posts", Component: MyRecipes },
      { path: "sales", Component: MySales },
      { path: "likes", Component: Likes },
      { path: "settings", Component: Account }, // 일반 계정 설정

      // 💡 [해결] 프로필 사진 변경 전용 경로 추가
      { path: "profile/edit", Component: ProfileEdit },

      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "*", Component: NotFound },
    ],
  },
]);
