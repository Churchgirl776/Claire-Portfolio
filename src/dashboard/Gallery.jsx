import React, { useEffect, useState } from "react";
import { db, storage } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  orderBy,
  query,
  getDocs,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { FiTrash2, FiUpload, FiUserCheck } from "react-icons/fi";
import { motion } from "framer-motion";

function Gallery() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load gallery
  useEffect(() => {
    const q = query(collection(db, "aboutGallery"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setImages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Upload image
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const path = `aboutGallery/uploads/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(prog);
      },
      (error) => {
        console.error(error);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);

        await addDoc(collection(db, "aboutGallery"), {
          url,
          storagePath: path,
          createdAt: serverTimestamp(),
          isProfile: false, // default
        });

        setUploading(false);
        setProgress(0);
      }
    );
  };

  // Delete image
  const handleDelete = async (item) => {
    if (!window.confirm("Delete this image?")) return;

    try {
      const storageRef = ref(storage, item.storagePath);
      await deleteObject(storageRef);
      await deleteDoc(doc(db, "aboutGallery", item.id));
    } catch (err) {
      console.error(err);
    }
  };

  // ⭐ Set profile photo
  const setAsProfile = async (item) => {
    try {
      // Step 1: Unset all others
      const allDocs = await getDocs(collection(db, "aboutGallery"));
      allDocs.forEach(async (d) => {
        if (d.data().isProfile === true) {
          await updateDoc(doc(db, "aboutGallery", d.id), { isProfile: false });
        }
      });

      // Step 2: Set selected one
      await updateDoc(doc(db, "aboutGallery", item.id), {
        isProfile: true,
      });

      alert("Profile photo updated!");
    } catch (error) {
      console.error("Error setting profile:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Gallery Manager</h2>

      {/* Upload Box */}
      <label className="border-2 border-dashed rounded-xl p-6 cursor-pointer flex flex-col items-center justify-center hover:bg-gray-50 transition">
        <FiUpload size={30} className="mb-2" />
        <p className="text-gray-600">Click to upload image</p>
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </label>

      {uploading && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-600 h-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        {images.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group border rounded-lg overflow-hidden shadow"
          >
            <img
              src={item.url}
              alt="gallery"
              className="w-full h-40 object-cover"
            />

            {/* Delete button */}
            <button
              onClick={() => handleDelete(item)}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              <FiTrash2 />
            </button>

            {/* ⭐ Set profile button */}
            <button
              onClick={() => setAsProfile(item)}
              className={`absolute bottom-2 left-2 p-2 rounded-lg text-white text-sm flex items-center gap-1 transition
              ${item.isProfile ? "bg-green-700" : "bg-blue-600 opacity-0 group-hover:opacity-100"}`}
            >
              <FiUserCheck />
              {item.isProfile ? "Profile" : "Set Profile"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Gallery;
