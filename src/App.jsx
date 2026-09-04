import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";

import RoleSelect from "./pages/RoleSelect";
import AuthOtp from "./pages/AuthOtp";
import FarmerKYC from "./pages/FarmerKYC";
import FarmerHome from "./pages/FarmerHome";
import FarmerListProduct from "./pages/FarmerListProduct";
import FarmerOrders from "./pages/FarmerOrders";
import BuyerSignupDetails from "./pages/BuyerSignupDetails";
import BuyerHome from "./pages/BuyerHome";
import BuyerSearch from "./pages/BuyerSearch";
import BuyerOrders from "./pages/BuyerOrders";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Dispute from "./pages/Dispute";
import FarmerProfilePublic from "./pages/FarmerProfilePublic";
import AdminLogin from "./pages/AdminLogin";
import AdminQueue from "./pages/AdminQueue";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleSelect />} />

            {/* Auth (email OTP) */}
            <Route path="/farmer/signup" element={<AuthOtp role="farmer" />} />
            <Route path="/buyer/signup" element={<AuthOtp role="buyer" />} />

            {/* Farmer onboarding + app */}
            <Route path="/farmer/kyc" element={<ProtectedRoute><FarmerKYC /></ProtectedRoute>} />
            <Route path="/farmer/home" element={<ProtectedRoute role="farmer"><FarmerHome /></ProtectedRoute>} />
            <Route path="/farmer/list" element={<ProtectedRoute role="farmer"><FarmerListProduct /></ProtectedRoute>} />
            <Route path="/farmer/orders" element={<ProtectedRoute role="farmer"><FarmerOrders /></ProtectedRoute>} />
            <Route path="/farmer/profile" element={<ProtectedRoute role="farmer"><Profile /></ProtectedRoute>} />

            {/* Buyer onboarding + app */}
            <Route path="/buyer/signup-details" element={<ProtectedRoute><BuyerSignupDetails /></ProtectedRoute>} />
            <Route path="/buyer/home" element={<ProtectedRoute role="buyer"><BuyerHome /></ProtectedRoute>} />
            <Route path="/buyer/search" element={<ProtectedRoute role="buyer"><BuyerSearch /></ProtectedRoute>} />
            <Route path="/buyer/orders" element={<ProtectedRoute role="buyer"><BuyerOrders /></ProtectedRoute>} />
            <Route path="/buyer/profile" element={<ProtectedRoute role="buyer"><Profile /></ProtectedRoute>} />
            <Route path="/buyer/cart" element={<ProtectedRoute role="buyer"><Cart /></ProtectedRoute>} />
            <Route path="/buyer/checkout" element={<ProtectedRoute role="buyer"><Checkout /></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/farmer-profile/:id" element={<ProtectedRoute><FarmerProfilePublic /></ProtectedRoute>} />
            <Route path="/order/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
            <Route path="/chat/:key" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/dispute" element={<ProtectedRoute><Dispute /></ProtectedRoute>} />

            {/* Admin (not linked from the main UI — direct URL access only) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/queue" element={<ProtectedRoute role="admin"><AdminQueue /></ProtectedRoute>} />

            <Route path="*" element={<RoleSelect />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
