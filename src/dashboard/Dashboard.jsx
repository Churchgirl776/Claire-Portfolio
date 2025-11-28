// components/Dashboard.jsx
import React, { useState, useEffect, useCallback, createContext } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ProjectsManager from "./Projects";
import SkillsManager from "./Skills";
import AwardsManager from "./Awards";
import ExperienceManager from "./Experience";
import SocialMediaManager from "./SocialMedia";
import GalleryManager from "./Gallery";   // ✅ FIXED IMPORT
import { collection, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// Theme context
export const ThemeContext = createContext();

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const [styles, setStyles] = useState({
    bgColor: theme === "light" ? "#f3f4f6" : "#0a0a0f",
    textColor: theme === "light" ? "#111111" : "#f0f0f0",
    buttonColor: "#22c55e",
    fontFamily: "sans-serif",
  });

  // ✅ FIXED — lowercase gallery key
  const [stats, setStats] = useState({
    projects: 0,
    skills: 0,
    awards: 0,
    experience: 0,
    social: 0,
    gallery: 0,
  });

  const [loading, setLoading] = useState(true);

  // Protect route
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/");
    });
    return unsubscribe;
  }, [navigate]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);

    setStyles((prev) => ({
      ...prev,
      bgColor: theme === "light" ? "#f3f4f6" : "#0a0a0f",
      textColor: theme === "light" ? "#111111" : "#f0f0f0",
    }));
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // Firestore stats
  useEffect(() => {
    setLoading(true);
    const unsubscribers = [
      onSnapshot(collection(db, "projects"), (snap) =>
        setStats((prev) => ({ ...prev, projects: snap.size }))
      ),
      onSnapshot(collection(db, "skills"), (snap) =>
        setStats((prev) => ({ ...prev, skills: snap.size }))
      ),
      onSnapshot(collection(db, "awards"), (snap) =>
        setStats((prev) => ({ ...prev, awards: snap.size }))
      ),
      onSnapshot(collection(db, "experience"), (snap) =>
        setStats((prev) => ({ ...prev, experience: snap.size }))
      ),
      onSnapshot(collection(db, "socialMedia"), (snap) =>
        setStats((prev) => ({ ...prev, social: snap.size }))
      ),  

      // ✅ FIXED — match your AdminGalleryManager collection
      onSnapshot(collection(db, "aboutGallery"), (snap) =>
        setStats((prev) => ({ ...prev, gallery: snap.size }))
      ),
    ];
    setLoading(false);

    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [navigate]);

  // Render active section
  const renderContent = () => {
    const commonProps = { theme, toggleTheme, styles, setStyles };
    switch (activeSection) {
      case "projects":
        return <ProjectsManager {...commonProps} />;
      case "skills":
        return <SkillsManager {...commonProps} />;
      case "awards":
        return <AwardsManager {...commonProps} />;
      case "experience":
        return <ExperienceManager {...commonProps} />;
      case "social":
        return <SocialMediaManager {...commonProps} />;
      case "gallery":
        return <GalleryManager {...commonProps} />;

      default:
        return null;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        className="min-h-screen flex transition-all duration-500"
        style={{
          backgroundColor: styles.bgColor,
          color: styles.textColor,
          fontFamily: styles.fontFamily,
        }}
      >
        {/* Sidebar */}
        <div className="fixed top-0 left-0 z-50 h-full lg:w-64">
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            theme={theme}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
            styles={styles}
            setStyles={setStyles}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 ml-0 lg:ml-64 p-4 sm:p-6 md:p-8 transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-green-400">
              Admin Dashboard
            </h1>
          </div>

          {/* Overview Cards */}
          {activeSection === "overview" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {loading ? (
                <p className="text-center col-span-full">Loading stats...</p>
              ) : (
                <>
                  {[
                    { title: "Projects", key: "projects" },
                    { title: "Skills", key: "skills" },
                    { title: "Awards", key: "awards" },
                    { title: "Experience", key: "experience" },
                    { title: "Socials", key: "social" },

                    // ✅ FIXED: Correct spelling
                    { title: "Gallery", key: "gallery" },
                  ].map(({ title, key }) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-6 rounded-xl border shadow-sm hover:shadow-md transition"
                      style={{
                        backgroundColor:
                          theme === "dark" ? "#111111" : "#ffffff",
                        borderColor:
                          theme === "dark" ? "#333333" : "#e5e7eb",
                      }}
                    >
                      <h3 className="font-semibold text-lg mb-2">{title}</h3>
                      <p className="text-2xl font-bold">{stats[key]}</p>
                      <p className="text-sm opacity-75">
                        {title === "Projects"
                          ? "Total projects"
                          : title === "Skills"
                          ? "Technical skills"
                          : title === "Awards"
                          ? "Achievements"
                          : title === "Experience"
                          ? "Work experience"
                          : title === "Gallery"
                          ? "Portfolio images"
                          : "Social media handles"}
                      </p>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Active Section */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ThemeContext.Provider>
  );
};

export default Dashboard;
