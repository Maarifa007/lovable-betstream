
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Index from "./Index";

const ChatPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isDemo = searchParams.get('demo') === 'true';
  
  // You can use this demo flag to show a demo version of the chat interface
  // with example data instead of connecting to real markets
  
  return (
    <div className="min-h-screen bg-background">
      <Index />
    </div>
  );
};

export default ChatPage;
