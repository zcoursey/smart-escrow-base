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

  const resizeImageToBase64 = (file, maxWidth = 1200, quality = 0.7) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL("image/jpeg", quality);
          resolve(base64);
        };

        img.onerror = reject;
        img.src = event.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
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

      const convertedPhotos = await Promise.all(
        files.map((file) => resizeImageToBase64(file))
      );

      console.log("Converted photos count:", convertedPhotos.length);
      setNewPhotos(convertedPhotos);
    } catch (error) {
      console.error("Photo conversion failed:", error);
      setPhotoError("Failed to process photos.");
    }
  };

  const submitJob = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to post a job");
      return;
    }

    setIsCreating(true);

    const jobData = {
      client_id: user.id,
      title: newTitle,
      description: newDescription,
      location: newLocation,
      budget: newAmount,
      photos: newPhotos,
    };

    console.log("Submitting jobData:", {
      title: jobData.title,
      photosCount: jobData.photos.length,
      firstPhoto: jobData.photos[0] ? jobData.photos[0].slice(0, 40) : "none",
    });

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
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

      navigate(`/jobs/${data.job.id}`);
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
