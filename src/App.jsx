import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Login from "./pages/Login";
import POS from "./pages/POS";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";
import AdminLayout from "./layouts/AdminLayout";
import { PrivateRoute } from "./routes/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Terminal UI (Worker, Admin, Super Admin) */}
        <Route path="/pos" element={
            <PrivateRoute allowedRoles={['Worker', 'Admin', 'Super Admin']}>
               <POS />
            </PrivateRoute>
        } />

        {/* Protected Admin Routes with Layout (Worker, Admin, Super Admin) */}
        <Route path="/admin" element={
            <PrivateRoute allowedRoles={['Worker', 'Admin', 'Super Admin']}>
              <AdminLayout />
            </PrivateRoute>
        }>
          <Route path="dashboard" element={
            <PrivateRoute allowedRoles={['Admin', 'Super Admin']}>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="products" element={<Products />} />
          <Route path="transactions" element={<Transactions />} />
          
          {/* Strict Admin-only sub-routes */}
          <Route path="users" element={
            <PrivateRoute allowedRoles={['Admin', 'Super Admin']}>
              <Users />
            </PrivateRoute>
          } />
          <Route path="settings" element={
            <PrivateRoute allowedRoles={['Admin', 'Super Admin']}>
              <Settings />
            </PrivateRoute>
          } />
          
          <Route index element={<Navigate to="transactions" replace />} />
        </Route>

        {/* Default Redirect to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
