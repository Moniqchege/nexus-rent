"use client";

import { useState } from "react";
import Hero from "./pages/Hero";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `http://localhost:4000/auth/${provider}`;
  };

  return (
    <>
      <Navbar />
      <Hero />
      <Footer />
    </>
  );
}