import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

import { Toaster, toast } from "react-hot-toast";

import {
  FaTrophy,
  FaMedal,
  FaAward,
  FaStar,
  FaCrown,
  FaRibbon,
} from "react-icons/fa";

// 🔹 Map icon names to components
const awardIcons = {
  trophy: <FaTrophy />,
  medal: <FaMedal />,
  award: <FaAward />,
  star: <FaStar />,
  crown: <FaCrown />,
  ribbon: <FaRibbon />,
};

const Awards = ({ theme = "light" }) => {
  const [awards, setAwards] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAward, setEditingAward] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "trophy",
    year: new Date().getFullYear().toString(),
  });

  // Fetch awards from Firestore
  useEffect(() => {
    const q = query(collection(db, "awards"), orderBy("title", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAwards(data);
    });
    return () => unsubscribe();
  }, []);

  const openForm = (award = null) => {
    if (award) {
      setEditingAward(award);
      setFormData({
        title: award.title,
        description: award.description,
        icon: award.icon,
        year: award.year,
      });
    } else {
      setEditingAward(null);
      setFormData({
        title: "",
        description: "",
        icon: "trophy",
        year: new Date().getFullYear().toString(),
      });
    }

    setShowForm(true);
  };

  const saveAward = async () => {
    const { title, description, icon, year } = formData;

    if (!title || !description || !year) {
      return toast.error("Please fill in all fields.");
    }

    try {
      const loading = toast.loading(
        editingAward ? "Updating award..." : "Saving award..."
      );

      if (editingAward) {
        await updateDoc(doc(db, "awards", editingAward.id), {
          title,
          description,
          icon,
          year,
        });
        toast.success("Award updated!", { id: loading });
      } else {
        await addDoc(collection(db, "awards"), {
          title,
          description,
          icon,
          year,
        });
        toast.success("Award added!", { id: loading });
      }

      setShowForm(false);
      setEditingAward(null);
      setFormData({
        title: "",
        description: "",
        icon: "trophy",
        year: new Date().getFullYear().toString(),
      });

    } catch (error) {
      toast.error("Failed to save award.", { id: loading });
      console.error(error);
    }
  };

  const deleteAward = async (id) => {
    const confirm = window.confirm("Delete this award?");
    if (!confirm) return;

    const loading = toast.loading("Deleting...");

    try {
      await deleteDoc(doc(db, "awards", id));
      toast.success("Award deleted.", { id: loading });
    } catch (error) {
      toast.error("Delete failed.", { id: loading });
    }
  };

  const bgMain = theme === "dark" ? "bg-zinc-900 text-gray-100" : "bg-gray-50 text-gray-900";
  const cardBg = theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200";
  const inputBg = theme === "dark"
    ? "bg-zinc-700 text-gray-100 border-zinc-600 placeholder-gray-400"
    : "bg-gray-100 text-black border-gray-300 placeholder-gray-500";

  return (
    <section className={`py-16 px-6 md:px-12 ${bgMain}`}>
      <Toaster position="top-right" />

      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">
        Your <span className="text-emerald-600">Awards</span>
      </h2>

      {/* Awards List */}
      <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-8">
        {awards.map((award) => (
          <div
            key={award.id}
            className={`p-6 rounded-2xl border ${cardBg} shadow-sm hover:shadow-lg transition`}
          >
            <div className="text-4xl text-emerald-500 mb-4">
              {awardIcons[award.icon] || <FaTrophy />}
            </div>

            {/* 🔹 YEAR BADGE */}
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mb-3">
              {award.year}
            </div>

            <h3 className="text-xl font-semibold mb-2">{award.title}</h3>
            <p className="text-sm opacity-80">{award.description}</p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => openForm(award)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => deleteAward(award.id)}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <button
          onClick={() => openForm()}
          className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
        >
          Add Award
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className={`p-8 rounded-xl w-full max-w-lg bg-white text-black`}>
            <h3 className="text-2xl font-semibold text-emerald-600 mb-4">
              {editingAward ? "Edit Award" : "Add New Award"}
            </h3>

            <div className="space-y-4">

              <input
                type="text"
                placeholder="Award Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full p-3 rounded-lg border ${inputBg}`}
              />

              <textarea
                placeholder="Award Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full p-3 rounded-lg border ${inputBg}`}
              />

              {/* 🔹 YEAR INPUT */}
              <input
                type="number"
                placeholder="Year (e.g., 2024)"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className={`w-full p-3 rounded-lg border ${inputBg}`}
              />

              {/* 🔹 ICON DROPDOWN */}
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className={`w-full p-3 rounded-lg border ${inputBg}`}
              >
                {Object.keys(awardIcons).map((icon) => (
                  <option key={icon} value={icon}>
                    {icon.charAt(0).toUpperCase() + icon.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {/* CANCEL BUTTON */}
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={saveAward}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
              >
                {editingAward ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Awards;
