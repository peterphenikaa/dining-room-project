import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RoomsPage } from "./pages/RoomsPage";
import { TablesPage } from "./pages/TablesPage";
import { CabinetsPage } from "./pages/CabinetsPage";
import { ChairsPage } from "./pages/ChairsPage";
import { AccessoriesPage } from "./pages/AccessoriesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UsersPage } from "./pages/UsersPage";
import { CartPage } from "./pages/CartPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import "./App.css";

export default function App() {
    return (
        <AuthProvider>
            <SocketProvider>
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
                        <Route
                            path="/register"
                            element={
                                <main className="login-wrap">
                                    <RegisterPage />
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
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/orders" element={<OrdersPage />} />
                                <Route path="/orders/:id" element={<OrderDetailPage />} />
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/users" element={<UsersPage />} />
                            </Route>
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </SocketProvider>
        </AuthProvider>
    );
}
