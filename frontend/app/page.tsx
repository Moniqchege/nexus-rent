"use client";

import { useState } from "react";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Hero from "./pages/Hero";

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