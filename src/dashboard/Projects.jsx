import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

// Firebase Storage + uuid (Modular SDK v9+)
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

function Projects({ theme = "light", onUpdate }) {
  const safeOnUpdate = typeof onUpdate === "function" ? onUpdate : () => {};

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [uploading, setUploading] = useState({}); // track uploading boolean per gallery index
  const [uploadProgress, setUploadProgress] = useState({}); // percent per gallery index
  const [uploadingMain, setUploadingMain] = useState(false); // track main image upload boolean
  const [mainProgress, setMainProgress] = useState(0); // percent for main image
  const [moving, setMoving] = useState(false); // moving unsaved files

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    technologies: "",
    liveUrl: "",
    githubUrl: "",
    imageUrl: "",
    role: "",
    duration: "",
    tools: "",
    results: "",
    gallery: [""],
    stages: [""],
  });

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProjects(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () =>
    setFormData({
      name: "",
      description: "",
      date: "",
      technologies: "",
      liveUrl: "",
      githubUrl: "",
      imageUrl: "",
      role: "",
      duration: "",
      tools: "",
      results: "",
      gallery: [""],
      stages: [""],
    });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      safeOnUpdate();
    } catch (err) {
      console.error(err);
      alert("Delete failed. See console.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const copy = [...formData[field]];
    copy[index] = value;
    setFormData((p) => ({ ...p, [field]: copy }));
  };

  const addArrayItem = (field) =>
    setFormData((p) => ({ ...p, [field]: [...p[field], ""] }));

  const removeArrayItem = (field, idx) => {
    const copy = [...formData[field]];
    copy.splice(idx, 1);
    setFormData((p) => ({ ...p, [field]: copy }));
  };

  // Upload helper with progress; returns download URL
  const uploadFileWithProgress = (file, { projectId = null, type = "gallery", index = null } = {}) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }
      const storage = getStorage();
      const baseFolder = projectId ? `projects/${projectId}/${type}` : `projects/unsaved/${type}`;
      const filename = uuidv4();
      const path = `${baseFolder}/${filename}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // set initial uploading state
      if (type === "main") {
        setUploadingMain(true);
        setMainProgress(0);
      } else if (index !== null) {
        setUploading((u) => ({ ...u, [index]: true }));
        setUploadProgress((p) => ({ ...p, [index]: 0 }));
      }

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (type === "main") setMainProgress(percent);
          else if (index !== null) setUploadProgress((p) => ({ ...p, [index]: percent }));
        },
        (error) => {
          // error
          if (type === "main") {
            setUploadingMain(false);
            setMainProgress(0);
          } else if (index !== null) {
            setUploading((u) => ({ ...u, [index]: false }));
            setUploadProgress((p) => ({ ...p, [index]: 0 }));
          }
          reject(error);
        },
        async () => {
          // success
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            if (type === "main") {
              setUploadingMain(false);
              setMainProgress(100);
            } else if (index !== null) {
              setUploading((u) => ({ ...u, [index]: false }));
              setUploadProgress((p) => ({ ...p, [index]: 100 }));
            }
            resolve({ url, fullPath: uploadTask.snapshot.ref.fullPath });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  // Called when user selects a file for a specific gallery index (uploads with progress)
  const handleFileSelect = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFileWithProgress(file, { projectId: editId, type: "gallery", index });
      setFormData((p) => {
        const copy = [...p.gallery];
        copy[index] = url;
        return { ...p, gallery: copy };
      });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Image upload failed. Check console.");
    } finally {
      e.target.value = "";
    }
  };

  // Called when user selects main image file (uploads with progress)
  const handleMainImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFileWithProgress(file, { projectId: editId, type: "main" });
      setFormData((p) => ({ ...p, imageUrl: url }));
    } catch (err) {
      console.error("Main image upload failed", err);
      alert("Image upload failed. Check console.");
    } finally {
      // small delay to keep 100% visible momentarily (optional)
      setTimeout(() => setMainProgress(0), 400);
      e.target.value = "";
    }
  };

  // move a single unsaved URL to project folder; returns newUrl
  const moveSingleUnsavedUrl = async (oldUrl, projectId, type) => {
    const storage = getStorage();
    const unsavedFolder = `projects/unsaved/${type}`;
    // list all unsaved items in this type folder
    const unsavedRef = ref(storage, unsavedFolder);
    const listed = await listAll(unsavedRef);
    // find matching item by comparing download URLs
    for (const itemRef of listed.items) {
      try {
        const itemUrl = await getDownloadURL(itemRef);
        if (itemUrl === oldUrl) {
          // fetch blob from oldUrl (downloadURL)
          const res = await fetch(oldUrl);
          const blob = await res.blob();
          // upload to new path
          const newFilename = uuidv4();
          const newPath = `projects/${projectId}/${type}/${newFilename}`;
          const newRef = ref(storage, newPath);
          // use uploadBytesResumable so we could show progress if desired
          await uploadBytesResumable(newRef, blob);
          const newUrl = await getDownloadURL(newRef);
          // delete old object
          try {
            await deleteObject(itemRef);
          } catch (delErr) {
            // log but continue
            console.warn("Failed to delete old unsaved object:", delErr);
          }
          return newUrl;
        }
      } catch (err) {
        // ignore individual item errors and continue
        console.warn("check item failed", err);
      }
    }
    // not found - as fallback, return original URL
    return oldUrl;
  };

  // Move all unsaved files referenced in formatted (imageUrl + gallery) to projectId folder and return updated formatted
  const moveUnsavedFilesForProject = async (projectId, formatted) => {
    setMoving(true);
    const updated = { ...formatted };
    try {
      // main image
      if (updated.imageUrl && typeof updated.imageUrl === "string" && updated.imageUrl.includes("/projects/unsaved/")) {
        const newMain = await moveSingleUnsavedUrl(updated.imageUrl, projectId, "main");
        updated.imageUrl = newMain;
      }
      // gallery - iterate and move each unsaved url
      if (Array.isArray(updated.gallery)) {
        for (let i = 0; i < updated.gallery.length; i++) {
          const url = updated.gallery[i];
          if (url && typeof url === "string" && url.includes("/projects/unsaved/")) {
            const newUrl = await moveSingleUnsavedUrl(url, projectId, "gallery");
            updated.gallery[i] = newUrl;
          }
        }
      }
    } catch (err) {
      console.error("moveUnsavedFilesForProject error", err);
      // continue — best effort
    } finally {
      setMoving(false);
    }
    return updated;
  };

  const handleSaveProject = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Please fill Name and Description.");
      return;
    }
    setSaving(true);

    // prepare formatted but do not assume unsaved files moved yet
    const formatted = {
      ...formData,
      technologies: formData.technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      gallery: formData.gallery.filter((g) => typeof g === "string" && g.trim() !== ""),
      stages: formData.stages.filter((s) => s.trim() !== ""),
    };

    try {
      if (editId) {
        // existing project: update directly (uploads already used editId)
        await updateDoc(doc(db, "projects", editId), {
          ...formatted,
          updatedAt: serverTimestamp(),
        });
      } else {
        // new project: add doc first with current URLs (some may point to unsaved)
        const docRef = await addDoc(collection(db, "projects"), {
          ...formatted,
          createdAt: serverTimestamp(),
        });

        // Move unsaved files into project folder and update doc with new URLs
        const moved = await moveUnsavedFilesForProject(docRef.id, formatted);

        // update doc with moved urls (only fields that changed)
        await updateDoc(doc(db, "projects", docRef.id), {
          ...moved,
          updatedAt: serverTimestamp(),
        });
      }

      setShowModal(false);
      setEditId(null);
      resetForm();
      safeOnUpdate();
    } catch (err) {
      console.error(err);
      alert("Save failed. See console.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project) => {
    setFormData({
      name: project.name || "",
      description: project.description || "",
      date: project.date || "",
      technologies: Array.isArray(project.technologies)
        ? project.technologies.join(", ")
        : project.technologies || "",
      liveUrl: project.liveUrl || "",
      githubUrl: project.githubUrl || "",
      imageUrl: project.imageUrl || "",
      role: project.role || "",
      duration: project.duration || "",
      tools: project.tools || "",
      results: project.results || "",
      gallery: project.gallery?.length ? project.gallery : [""],
      stages: project.stages?.length ? project.stages : [""],
    });
    setEditId(project.id);
    setShowModal(true);
  };

  const toggleExpand = (id) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const styles =
    theme === "dark"
      ? {
          container: "bg-zinc-900 border-zinc-700 text-gray-100",
          header: "bg-zinc-800 text-gray-100",
          rowHover: "hover:bg-zinc-800",
          input:
            "text-gray-100 placeholder-gray-400",
          modal: "bg-zinc-900 text-gray-100",
          btnCancel: "bg-gray-600 hover:bg-gray-700 text-white",
          btnSave: "bg-green-600 hover:bg-green-700 text-white",
        }
      : {
          container: "bg-white border-gray-200 text-gray-900",
          header: "bg-gray-50 text-gray-700",
          rowHover: "hover:bg-gray-50",
          input:
            "text-gray-900 placeholder-gray-500",
          modal: "bg-white text-gray-900",
          btnCancel: "bg-gray-200 hover:bg-gray-300 text-gray-900",
          btnSave: "bg-green-600 hover:bg-green-700 text-white",
        };

  return (
    <div className="w-full p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-sm text-gray-500">Manage your portfolio projects</p>
        </div>
        <button
          onClick={() => {
            setEditId(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition w-full sm:w-auto"
        >
          + Add Project
        </button>
      </div>

      {/* Desktop Table */}
      <div
        className={`hidden lg:block rounded-xl shadow-sm border overflow-hidden ${styles.container}`}
      >
        <div className="overflow-x-auto">
          <div
            className={`min-w-[700px] grid grid-cols-12 gap-4 px-6 py-4 font-semibold text-sm ${styles.header}`}
          >
            <div className="col-span-6">Name</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-zinc-700">
            {loading ? (
              <div className="p-6 text-center">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="p-6 text-center text-gray-400">No projects found.</div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className={`min-w-[700px] grid grid-cols-12 gap-4 px-6 py-4 transition ${styles.rowHover}`}
                >
                  <div className="col-span-6">
                    <div className="font-medium truncate">{project.name}</div>
                    <div className="text-sm opacity-75 truncate">{project.description}</div>
                  </div>
                  <div className="col-span-2 text-sm opacity-75">{project.duration}</div>
                  <div className="col-span-2 text-sm opacity-75">{project.date}</div>
                  <div className="col-span-2 flex justify-end items-center gap-3">
                    <button onClick={() => handleEdit(project)} className="text-blue-500 hover:text-blue-700">
                      <FiEdit size={18} />
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="text-red-500 hover:text-red-700">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Cards */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <div className={`p-4 rounded-xl shadow ${styles.container}`}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className={`p-4 text-center rounded-xl ${styles.container}`}>No projects found.</div>
        ) : (
          projects.map((project) => {
            const isOpen = !!expanded[project.id];
            return (
              <div
                key={project.id}
                className={`rounded-xl shadow-md border ${styles.container} overflow-hidden transition-transform duration-200 hover:scale-[1.01]`}
              >
                {/* Card Header */}
                <button
                  onClick={() => toggleExpand(project.id)}
                  className="w-full flex items-center justify-between px-4 py-3 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="text-left">
                    <div className="font-semibold text-base break-words">{project.name}</div>
                    <div className="text-sm text-gray-400 line-clamp-2">{project.description}</div>
                  </div>
                  <div className="ml-3 flex flex-col items-end">
                    <span className="text-sm text-gray-500">{project.duration}</span>
                    <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
                      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </div>
                </button>

                {/* Expanded Card */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-2 text-sm space-y-2 border-t border-gray-200 dark:border-zinc-700">
                    {project.duration && (
                      <div>
                        <span className="font-medium">Duration:</span> {project.duration}
                      </div>
                    )}
                    {project.date && (
                      <div>
                        <span className="font-medium">Date:</span> {project.date}
                      </div>
                    )}
                    {project.technologies && (
                      <div>
                        <span className="font-medium">Tech:</span>{" "}
                        {Array.isArray(project.technologies) ? project.technologies.join(", ") : project.technologies}
                      </div>
                    )}
                    {project.imageUrl && (
                      <div className="mt-2">
                        <img src={project.imageUrl} alt={project.name} className="rounded-lg w-full h-40 object-cover" />
                      </div>
                    )}
                    <div className="flex gap-2 pt-3">
                      <button onClick={() => handleEdit(project)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(project.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className={`rounded-xl shadow-lg p-5 w-full max-w-3xl ${styles.modal}`}>
            <h3 className="text-xl font-semibold mb-4">{editId ? "Edit Project" : "Add New Project"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2">
              {/* LEFT COLUMN */}
              <div className="space-y-3">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name (required)"
                  className={`w-full p-2 rounded border ${styles.input}`}
                />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the project clearly (required)"
                  rows={4}
                  className={`w-full p-2 rounded border ${styles.input}`}
                />
                <input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full p-2 rounded border ${styles.input}`}
                />
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-3">
                <input
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="Your role or responsibility in this project"
                  className={`w-full p-2 rounded border ${styles.input}`}
                />
                <input
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="Project duration (e.g., 3 months, Jan–Mar 2024)"
                  className={`w-full p-2 rounded border ${styles.input}`}
                />
                <input
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleChange}
                  placeholder="Technologies used (separate with commas)"
                  className={`w-full p-2 rounded border ${styles.input}`}
                />
                {/* MAIN IMAGE - supports URL paste or upload, shows preview + progress */}
                <div className="flex items-center gap-3">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="main-preview"
                      className="w-auto h-20 rounded-md object-cover"
                      style={{ minWidth: 80, maxHeight: 80 }}
                    />
                  ) : (
                    <div style={{ width: 80, height: 80 }} className="rounded-md bg-gray-100 dark:bg-zinc-800" />
                  )}

                  <input
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="Main image URL (optional) or upload file"
                    className={`flex-1 p-2 rounded border ${styles.input}`}
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleMainImageFileSelect} className="hidden" />
                    <span className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-100">
                      Upload
                    </span>
                  </label>
                </div>
                {/* main progress bar */}
                {uploadingMain && (
                  <div className="w-full bg-gray-200 rounded overflow-hidden mt-2">
                    <div
                      className="h-2 bg-green-500"
                      style={{ width: `${mainProgress}%` }}
                    />
                    <div className="text-xs text-gray-500 mt-1">{mainProgress}%</div>
                  </div>
                )}
              </div>

              {/* GALLERY */}
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">Gallery Images</h4>
                <div className="space-y-2">
                  {formData.gallery.map((g, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      {/* Thumbnail preview (80px height, rounded) */}
                      {g ? (
                        <img
                          src={g}
                          alt={`preview-${i}`}
                          className="w-auto h-20 rounded-md object-cover"
                          style={{ minWidth: 80, maxHeight: 80 }}
                        />
                      ) : (
                        <div style={{ width: 80, height: 80 }} className="rounded-md bg-gray-100 dark:bg-zinc-800" />
                      )}

                      <input
                        value={g}
                        onChange={(e) => handleArrayChange("gallery", i, e.target.value)}
                        className={`flex-1 p-2 rounded border ${styles.input}`}
                        placeholder="Paste image URL OR upload a file"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, i)} className="hidden" />
                        <span className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-100">
                          Upload
                        </span>
                      </label>
                      <button onClick={() => removeArrayItem("gallery", i)} className="text-red-500 hover:text-red-700 mt-1">
                        <FiMinus />
                      </button>

                      {/* per-gallery progress bar */}
                      {uploading[i] && (
                        <div className="w-24 ml-2">
                          <div className="w-full bg-gray-200 rounded overflow-hidden">
                            <div className="h-2 bg-green-500" style={{ width: `${uploadProgress[i] || 0}%` }} />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{uploadProgress[i] || 0}%</div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addArrayItem("gallery")} className="flex items-center text-sm text-green-500 hover:text-green-400">
                    <FiPlus className="mr-1" /> Add Another Image
                  </button>
                </div>
              </div>

              {/* STAGES */}
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">Project Stages</h4>
                <div className="space-y-2">
                  {formData.stages.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={s}
                        onChange={(e) => handleArrayChange("stages", i, e.target.value)}
                        className={`flex-1 p-2 rounded border ${styles.input}`}
                        placeholder="Describe a project stage (e.g., Planning, Design, Development)"
                      />
                      <button onClick={() => removeArrayItem("stages", i)} className="text-red-500 hover:text-red-700 mt-1">
                        <FiMinus />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addArrayItem("stages")} className="flex items-center text-sm text-green-500 hover:text-green-400">
                    <FiPlus className="mr-1" /> Add Another Stage
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <div className="flex items-center gap-3">
                {moving && <div className="text-sm text-gray-500">Finalizing uploads...</div>}
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditId(null);
                }}
                className={`px-4 py-2 rounded ${styles.btnCancel}`}
              >
                Cancel
              </button>
              <button onClick={handleSaveProject} disabled={saving} className={`px-4 py-2 rounded ${styles.btnSave} disabled:opacity-50`}>
                {saving ? (editId ? "Updating..." : "Saving...") : editId ? "Update Project" : "Save Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
