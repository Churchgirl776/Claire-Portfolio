import React, { useState, useEffect } from "react";
import { FiSun, FiMoon, FiMenu, FiX } from "react-icons/fi";
import { Link } from "react-scroll";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { name: "Home", to: "home" },
    { name: "About", to: "about" },
    { name: "Skills", to: "skills" },
    { name: "Experience", to: "experience" },
    { name: "Projects", to: "projects" },
    { name: "Awards", to: "awards" },
    { name: "Contact", to: "contact" },
  ];

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 backdrop-blur-md
        ${
          darkMode
            ? scrolled
              ? "bg-[#0a0a0f]/90 shadow-lg"
              : "bg-[#0a0a0f]/70"
            : scrolled
            ? "bg-white/95 shadow-lg"
            : "bg-white/90"
        }`}
    >
      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        {/* Logo */}
        <h1 className={`text-xl font-bold transition-colors duration-300 ${
  darkMode ? "text-white" : "text-gray-900"
}`}>
  My Portfolio
</h1>


        {/* Desktop Nav Links */}
        <ul className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                smooth={true}
                duration={500}
                spy={true}
                offset={-70}
                activeClass="text-green-400 border-b-2 border-green-400"
                className={`cursor-pointer transition-colors duration-300 ${
                  darkMode
                    ? "text-gray-200 hover:text-green-400"
                    : "text-gray-900 hover:text-green-500"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Icons */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors duration-300 ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {darkMode ? (
              <FiSun className="text-yellow-400 text-xl" />
            ) : (
              <FiMoon className="text-gray-800 text-xl" />
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden p-2 rounded transition-colors duration-300 ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-40 transform transition-transform duration-300
          ${menuOpen ? "translate-x-0" : "-translate-x-full"}
          ${darkMode ? "bg-[#0a0a0f]" : "bg-white"} md:hidden shadow-lg`}
      >
        <ul className="flex flex-col mt-20 space-y-6 px-6">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                smooth={true}
                duration={500}
                spy={true}
                offset={-70}
                activeClass="text-green-400 font-bold"
                className={`block cursor-pointer transition-colors duration-300 ${
                  darkMode
                    ? "text-gray-200 hover:text-green-400"
                    : "text-gray-900 hover:text-green-500"
                }`}
                onClick={() => setMenuOpen(false)} // close menu on click
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
