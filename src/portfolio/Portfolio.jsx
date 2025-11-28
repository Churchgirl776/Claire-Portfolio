import React from "react";
import Navbar from "../Components/Navbar";
import Hero from "./Hero";
import About from "./About";
import PortfolioSkill from "./PortfolioSkill";
import Experience from "./Experience";
import Projects from "./Projects";
import Awards from "./Awards";
import Contact from "./Contact";
import { Toaster } from "react-hot-toast";
import { Element } from "react-scroll";
import { PortfolioThemeProvider, useTheme } from "../context/ThemeContext"; // provider + hook


function PortfolioContent() {
  const { darkMode } = useTheme(); // get current theme

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        darkMode
          ? "bg-[#0a0a0f] text-gray-200"
          : "bg-white text-gray-900"
      }`}
    >
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Navbar />

      <Element name="home" id="home"><Hero /></Element>
      <Element name="about" id="about"><About /></Element>
      <Element name="skills" id="skills"><PortfolioSkill /></Element>
      <Element name="experience" id="experience"><Experience /></Element>
      <Element name="projects" id="projects">
        <Projects theme={darkMode ? "dark" : "light"} />
      </Element>
      <Element name="awards" id="awards"><Awards /></Element>
      <Element name="contact" id="contact"><Contact /></Element>
    </div>
  );
}

function Portfolio() {
  return (
    <PortfolioThemeProvider>
      <PortfolioContent />
    </PortfolioThemeProvider>
  );
}

export default Portfolio;
