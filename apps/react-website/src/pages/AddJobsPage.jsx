import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddJobForm from "../components/AddJobForm";

const AddJobPage = ({ user }) => {
  const navigate = useNavigate();

  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user === null) {
      navigate("/login");
    }
  }, [user, navigate]);

  const API_URL = "https://smart-escrow-base-testing.onrender.com/api/jobs";

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handlePhotoChange = async (e) => {
    try {
      setPhotoError("");
      const files = Array.from(e.target.files || []);

      if (files.length === 0) {
        setNewPhotos([]);
        return;
      }

      if (files.length > 5) {
        setPhotoError("You can upload up to 5 photos only.");
        return;
      }

      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) {
          setPhotoError("Each photo must be under 2MB.");
          return;
        }
      }

      const base64Photos = await Promise.all(files.map(fileToBase64));
      setNewPhotos(base64Photos);
    } catch (error) {
      console.error("Photo conversion failed:", error);
      setPhotoError("Failed to process photos.");
    }
  };

  const submitJob = async (e) => {
    e.preventDefault();

    if (!user) return alert("You must be logged in to post a job");

    setIsCreating(true);

    const jobData = {
      client_id: user.id,
      title: newTitle,
      description: newDescription,
      location: newLocation,
      budget: newAmount,
      photos: newPhotos
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jobData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save job to database");
      }

      alert("Job saved successfully!");

      setNewTitle("");
      setNewAmount("");
      setNewLocation("");
      setNewDescription("");
      setNewPhotos([]);
      setPhotoError("");

      navigate("/jobs");
    } catch (error) {
      console.error(error);
      alert("Creation failed: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return null;

  return (
    <section className="bg-indigo-50 min-h-screen py-10">
      <div className="container m-auto max-w-2xl py-24">
        <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
          <h2 className="text-3xl text-center font-semibold mb-6">
            Post a New Job
          </h2>

          <AddJobForm
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newAmount={newAmount}
            setNewAmount={setNewAmount}
            newLocation={newLocation}
            setNewLocation={setNewLocation}
            newDescription={newDescription}
            setNewDescription={setNewDescription}
            newPhotos={newPhotos}
            handlePhotoChange={handlePhotoChange}
            photoError={photoError}
            submitJob={submitJob}
            isCreating={isCreating}
          />
        </div>
      </div>
    </section>
  );
};

export default AddJobPage;
