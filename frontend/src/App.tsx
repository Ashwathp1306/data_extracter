import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Upload } from './pages/Upload';
import { Preview } from './pages/Preview';
import { Processing } from './pages/Processing';
import { Results } from './pages/Results';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { History } from './pages/History';
import { WeeklyAnalysis } from './pages/WeeklyAnalysis';
import { Account } from './pages/Account';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="upload" element={<Upload />} />
            <Route path="preview" element={<Preview />} />
            <Route path="processing/:jobId" element={<Processing />} />
            <Route path="processing" element={<Processing />} />
            <Route path="results/:jobId" element={<Results />} />
            <Route path="results" element={<Results />} />
            <Route path="history" element={<History />} />
            <Route path="weekly-analysis" element={<WeeklyAnalysis />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
