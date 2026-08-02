import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProgressProvider } from "./contexts/UserProgressContext";

export default function App() {
  return (
    <AuthProvider>
      <UserProgressProvider>
        <RouterProvider router={router} />
      </UserProgressProvider>
    </AuthProvider>
  );
}
