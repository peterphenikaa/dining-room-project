import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RoomsPage } from "./pages/RoomsPage";
import { TablesPage } from "./pages/TablesPage";
import { CabinetsPage } from "./pages/CabinetsPage";
import { ChairsPage } from "./pages/ChairsPage";
import { AccessoriesPage } from "./pages/AccessoriesPage";
import "./App.css";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <main className="login-wrap">
                                <LoginPage />
                            </main>
                        }
                    />
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppShell />}>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/rooms" element={<RoomsPage />} />
                            <Route path="/tables" element={<TablesPage />} />
                            <Route path="/cabinets" element={<CabinetsPage />} />
                            <Route path="/chairs" element={<ChairsPage />} />
                            <Route path="/accessories" element={<AccessoriesPage />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
