
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// This component is just a redirect to the dashboard
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
};

export default Index;
