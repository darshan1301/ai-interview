import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BASE_API_URL } from "../../config";

// Simple helper to check authentication from backend
async function checkAuth() {
  try {
    const res = await fetch(`${BASE_API_URL}/api/user/me`, {
      credentials: "include", // ✅ include cookies
    });
    return res.ok;
  } catch {
    return false;
  }
}

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    checkAuth().then((ok) => {
      setIsAuth(ok);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
