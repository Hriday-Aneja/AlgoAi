import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import Sheets from "./pages/Sheets";
import SheetDetail from "./pages/SheetDetail";
import Notes from "./pages/Notes";
import Analytics from "./pages/Analytics";
import Chatbot from "./pages/Chatbot";
import DailyChallenge from "./pages/DailyChallenge";
import MockInterview from "./pages/MockInterview";
import Revision from "./pages/Revision";
import Playlists from "./pages/Playlists";
import ELI5 from "./pages/ELI5";
import Roadmap from "./pages/Roadmap";
import CSQuiz from "./pages/CSQuiz";
import WebDevPlayground from "./pages/WebDevPlayground";
// New Feature Pages
import CodeVisualizer from "./pages/CodeVisualizer";
import MistakePatterns from "./pages/MistakePatterns";
import BossBattle from "./pages/BossBattle";
import ReverseMode from "./pages/ReverseMode";
import InterviewPersonality from "./pages/InterviewPersonality";
import CompetitionHeatmap from "./pages/CompetitionHeatmap";
import CodeDNA from "./pages/CodeDNA";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    // Pathless layout route: children below keep their existing top-level
    // URLs (e.g. "/dashboard", "/problems") while still being wrapped in
    // ProtectedRoute + the app Layout (sidebar/shell).
    Component: () => (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "problems", Component: Problems },
      { path: "problems/:id", Component: ProblemDetail },
      { path: "sheets", Component: Sheets },
      { path: "sheets/:id", Component: SheetDetail },
      { path: "notes", Component: Notes },
      { path: "analytics", Component: Analytics },
      { path: "chatbot", Component: Chatbot },
      { path: "daily", Component: DailyChallenge },
      { path: "mock-interview", Component: MockInterview },
      { path: "revision", Component: Revision },
      { path: "playlists", Component: Playlists },
      { path: "eli5", Component: ELI5 },
      { path: "roadmap", Component: Roadmap },
      { path: "quiz", Component: CSQuiz },
      { path: "playground", Component: WebDevPlayground },
      // New AI Feature Routes
      { path: "visualizer", Component: CodeVisualizer },
      { path: "mistakes", Component: MistakePatterns },
      { path: "boss-battle", Component: BossBattle },
      { path: "reverse", Component: ReverseMode },
      { path: "personality", Component: InterviewPersonality },
      { path: "heatmap", Component: CompetitionHeatmap },
      { path: "dna", Component: CodeDNA },
    ],
  },
]);
