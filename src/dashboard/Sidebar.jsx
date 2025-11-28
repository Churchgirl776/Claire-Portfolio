import React, { useState, useEffect, useRef } from "react";
import {
  FaProjectDiagram,
  FaTools,
  FaAward,
  FaBriefcase,
  FaShareAlt,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaEllipsisH,
  FaTimes,
  FaMailBulk,
  FaPhotoVideo,
  FaSortUp,
  FaSolarPanel,
} from "react-icons/fa";

const sections = [
  { id: "overview", label: "Overview", icon: <FaSolarPanel /> },
  { id: "projects", label: "Projects", icon: <FaProjectDiagram /> },
  { id: "skills", label: "Skills", icon: <FaTools /> },
  { id: "awards", label: "Awards", icon: <FaAward /> },
  { id: "experience", label: "Experience", icon: <FaBriefcase /> },
  { id: "social", label: "Social", icon: <FaShareAlt /> },
  { id: "gallery", label: "Gallery", icon: <FaPhotoVideo /> },
];

const Sidebar = ({ activeSection, setActiveSection, theme, toggleTheme, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toolbarRef = useRef();

  useEffect(() => {
    const checkOverflow = () => {
      if (!toolbarRef.current) return;
      let totalWidth = 0;
      toolbarRef.current.childNodes.forEach((child) => {
        totalWidth += child.offsetWidth;
      });
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col justify-between h-screen w-64 fixed left-0 top-0 border-r transition-all duration-300 z-40 ${
          theme === "dark"
            ? "bg-zinc-900 text-gray-100 border-zinc-800"
            : "bg-white text-gray-800 border-gray-200"
        }`}
      >
        <div>
          {/* Logo / Title */}
          <div
            className={`text-2xl font-bold text-center py-6 border-b ${
              theme === "dark" ? "border-zinc-700" : "border-gray-200"
            }`}
          >
            Admin Panel
          </div>

          {/* Navigation */}
          <nav className="flex flex-col px-4 py-6 space-y-2 overflow-y-auto">
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeSection === section.id
                    ? theme === "dark"
                      ? "bg-green-600 text-white"
                      : "bg-green-500 text-white"
                    : theme === "dark"
                    ? "hover:bg-zinc-800"
                    : "hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{section.icon}</span>
                <span className="font-medium">{section.label}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* Theme & Logout (Desktop Sidebar) */}
        <div
          className={`px-4 py-6 border-t flex flex-col gap-2 ${
            theme === "dark" ? "border-zinc-700" : "border-gray-200"
          }`}
        >
          {/* Theme Toggle */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
              theme === "dark"
                ? "hover:bg-zinc-800"
                : "hover:bg-gray-100 text-gray-800"
            }`}
            onClick={toggleTheme}
          >
            <span className="font-medium">Theme</span>
            {theme === "light" ? (
              <FaSun className="text-yellow-400" />
            ) : (
              <FaMoon className="text-blue-400" />
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full p-3 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-zinc-800"
          >
            <span>Logout</span>
            <FaSignOutAlt />
          </button>
        </div>
      </aside>

      {/* TOP TOOLBAR (for mobile/tablet only) */}
      <div
        className={`fixed top-0 left-0 w-full z-50 flex items-center gap-2 px-3 py-2 border-b transition-all duration-300 lg:hidden ${
          theme === "dark"
            ? "bg-zinc-900 border-zinc-800 text-gray-100"
            : "bg-white border-gray-200 text-gray-800"
        }`}
        ref={toolbarRef}
      >
        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center justify-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800"
        >
          {isOpen ? <FaTimes /> : <FaEllipsisH />}
        </button>

        {/* Title */}
        <h1 className="text-lg font-semibold">Admin Panel</h1>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800"
        >
          {theme === "light" ? (
            <FaSun className="text-yellow-400" />
          ) : (
            <FaMoon className="text-blue-400" />
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-zinc-800 text-red-600"
        >
          <FaSignOutAlt />
        </button>
      </div>

      {/* MOBILE SLIDE-IN SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 transform transition-transform duration-300 z-40 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          theme === "dark"
            ? "bg-zinc-900 text-gray-100 border-r border-zinc-800"
            : "bg-white text-gray-800 border-r border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-4 border-b">
          <span className="text-xl font-bold">Menu</span>
          <button onClick={() => setIsOpen(false)}>
            <FaTimes />
          </button>
        </div>

        {/* Navigation + Settings */}
        <nav className="flex flex-col px-4 py-6 space-y-2 h-full overflow-y-auto">
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeSection === section.id
                  ? "bg-green-500 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </div>
          ))}

          {/* Theme & Logout for Mobile */}
          <div className="mt-auto px-4 py-6 space-y-2 border-t border-gray-200 dark:border-zinc-700">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800"
            >
              <span>Theme</span>
              {theme === "light" ? (
                <FaSun className="text-yellow-400" />
              ) : (
                <FaMoon className="text-blue-400" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-between w-full p-3 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-zinc-800"
            >
              <span>Logout</span>
              <FaSignOutAlt />
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
