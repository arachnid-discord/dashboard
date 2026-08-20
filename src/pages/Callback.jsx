import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parseTokenFromHash, setToken, getToken } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/ui";

// Discord redirects here (the app root) with the access token in the URL
// fragment after login. Also doubles as the plain "/" route for a normal
// visit, since a fragment-only difference can't be routed separately.
export default function Callback() {
  const navigate = useNavigate();
  const { reload } = useAuth();

  useEffect(() => {
    const token = parseTokenFromHash(window.location.hash);
    if (token) {
      setToken(token);
      window.history.replaceState(null, "", window.location.pathname);
      reload().then(() => navigate("/guilds", { replace: true }));
      return;
    }
    navigate(getToken() ? "/guilds" : "/login", { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <LoadingScreen label="Signing you in…" />;
}
