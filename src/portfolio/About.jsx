import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { db } from "../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { FiUsers, FiUser, FiCpu } from "react-icons/fi"; 

const About = () => {
  const { darkMode } = useTheme();
  const [profileImage, setProfileImage] = useState(null);

  // ✅ Load ADMIN-selected profile photo
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "gallery"), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const active = all.find((img) => img.isProfile === true);
      if (active) setProfileImage(active.url);
    });

    return () => unsub();
  }, []);

  return (
    <section
      id="about"
      className={`relative py-16 px-6 md:px-16 flex flex-col md:flex-row items-center justify-center gap-10 transition-all duration-500 ${
        darkMode ? "bg-[#0a0a0f] text-gray-200" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* LEFT SIDE - IMAGE */}
      <motion.div
        className="relative flex-shrink-0"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8 }}
      >
        {/* Decorative Boxes */}
        <div
          className={`absolute -top-6 -left-6 w-32 h-32 rounded-lg opacity-70 ${
            darkMode ? "bg-teal-950" : "bg-teal-100"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 right-0 w-32 h-32 rounded-lg opacity-70 ${
            darkMode ? "bg-indigo-950" : "bg-indigo-100"
          }`}
        ></div>

        {/* MAIN PROFILE IMAGE */}
        {profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className={`relative z-10 w-72 h-72 md:w-96 md:h-96 object-cover rounded-lg shadow-lg border ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
          />
        ) : (
          // Fallback if admin hasn't set a profile image
          <div
            className={`relative z-10 w-72 h-72 md:w-96 md:h-96 rounded-lg shadow-lg border flex items-center justify-center text-gray-400 ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
          >
            <FiUser className="text-6xl opacity-60" />
          </div>
        )}

        {/* Floating Stats */}
        <div
          className={`absolute -bottom-4 -right-4 px-6 py-4 rounded-lg shadow-md border flex flex-col items-center justify-center z-20 ${
            darkMode ? "bg-black/80 border-gray-600" : "bg-white border-gray-300"
          }`}
        >
          <span
            className={`text-2xl font-bold ${
              darkMode ? "text-green-500" : "text-teal-600"
            }`}
          >
            50+
          </span>
          <span
            className={`block text-sm font-light ${
              darkMode ? "text-gray-200" : "text-gray-600"
            }`}
          >
            Projects Completed
          </span>
        </div>
      </motion.div>

      {/* RIGHT SIDE - TEXT */}
      <motion.div
        className="flex-1 max-w-xl space-y-6"
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.9 }}
      >
        <h2
          className={`text-3xl md:text-4xl font-bold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Crafting Digital Experiences That{" "}
          <span className={`${darkMode ? "text-green-400" : "text-teal-600"}`}>
            Transform Businesses
          </span>
        </h2>

        <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          With over 5 years of experience in product design and growth strategy,
          I believe great design is not just about aesthetics — it's about solving
          problems and driving meaningful business outcomes.
        </p>

        <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          I bridge user needs and business goals using creativity and data-driven insight.
        </p>

        {/* Feature Cards */}
<div className="space-y-4">
  {[
    {
      title: "Design Philosophy",
      desc: "Every pixel should serve a purpose.",
      icon: <FiCpu className="text-2xl" />,
      lightBg: "bg-yellow-100",
      darkBg: "bg-yellow-900",
      lightIcon: "text-yellow-700",
      darkIcon: "text-yellow-300"
    },
    {
      title: "Growth Mindset",
      desc: "Optimize for user value and outcomes.",
      icon: <FiUser className="text-2xl" />,
      lightBg: "bg-blue-100",
      darkBg: "bg-blue-900",
      lightIcon: "text-blue-700",
      darkIcon: "text-blue-300"
    },
    {
      title: "Collaboration",
      desc: "Great products come from great teams.",
      icon: <FiUsers className="text-2xl" />,
      lightBg: "bg-purple-100",
      darkBg: "bg-purple-900",
      lightIcon: "text-purple-700",
      darkIcon: "text-purple-300"
    }
  ].map((card, idx) => (
    <motion.div
      key={idx}
      className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-300 ${
        darkMode ? "bg-black border-gray-700" : "bg-gray-100 border-gray-200"
      }`}
      whileHover={{ scale: 1.05 }}
    >
      {/* Icon Container */}
      <div
        className={`p-4 rounded-lg flex items-center justify-center transition-all duration-300 ${
          darkMode ? card.darkBg : card.lightBg
        }`}
      >
        <span className={`${darkMode ? card.darkIcon : card.lightIcon}`}>
          {card.icon}
        </span>
      </div>

      {/* Text */}
      <div>
        <h4
          className={`font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {card.title}
        </h4>
        <p
          className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          {card.desc}
        </p>
      </div>
    </motion.div>
  ))}
</div>

      </motion.div>
    </section>
  );
};

export default About;
