import { useState } from "react";
import AddJobForm from "../components/AddJobForm";

const AddJobPage = () => {

    const [newTitle, setNewTitle] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newLocation, setNewLocation] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const API_URL = "https://smart-escrow-base-testing.onrender.com/api/jobs"; 

    const submitJob = async (e) => {
        e.preventDefault(); 
        setIsCreating(true);

        const jobData = {
            client_id: 1, 
            title: newTitle,
            description: newDescription,
            location: newLocation,
            budget: newAmount 
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jobData),
            });

            if (!response.ok) {
                throw new Error("Failed to save job to database");
            }

            alert("Job saved successfully!");
            
         
            setNewTitle("");
            setNewAmount("");
            setNewLocation("");
            setNewDescription("");
        } catch (error) {
            console.error(error);
            alert("Creation failed: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <section className="bg-indigo-50 min-h-screen py-10">
          <div className="container m-auto max-w-2xl py-24">
            <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
              <h2 className="text-3xl text-center font-semibold mb-6">Post a New Job</h2>

              <AddJobForm 
                newTitle={newTitle} setNewTitle={setNewTitle}
                newAmount={newAmount} setNewAmount={setNewAmount}
                newLocation={newLocation} setNewLocation={setNewLocation}
                newDescription={newDescription} setNewDescription={setNewDescription}
                submitJob={submitJob}
                isCreating={isCreating}
              />
            </div>
          </div>
        </section>
    );
};

export default AddJobPage;