import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PriceCalculator from "@/pages/PriceCalculator";

// This component is just a redirect to the dashboard
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
};

export default Index;
