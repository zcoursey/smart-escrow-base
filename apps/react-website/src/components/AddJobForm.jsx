const AddJobForm = ({
  newTitle,
  setNewTitle,
  newAmount,
  setNewAmount,
  newLocation,
  setNewLocation,
  newDescription,
  setNewDescription,
  newPhotos,
  handlePhotoChange,
  photoError,
  submitJob,
  isCreating
}) => {
  return (
    <form onSubmit={submitJob}>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Job Title</label>
        <input
          type="text"
          placeholder="e.g. Kitchen Remodel"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="border rounded w-full py-2 px-3 focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Budget (ETH)</label>
        <input
          type="number"
          step="any"
          placeholder="e.g. 1.5"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          className="border rounded w-full py-2 px-3 focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Work Location</label>
        <input
          type="text"
          placeholder="e.g. 123 Main St, New York"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          className="border rounded w-full py-2 px-3 focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-2">Job Description</label>
        <textarea
          placeholder="Describe the work required..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="border rounded w-full py-2 px-3 h-32 resize-none focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-2">
          Job Photos (up to 5)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
          className="border rounded w-full py-2 px-3 focus:outline-none focus:border-indigo-500 bg-white"
        />

        {photoError && (
          <p className="text-red-600 text-sm mt-2">{photoError}</p>
        )}

        {newPhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {newPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isCreating}
        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-full w-full focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors"
      >
        {isCreating ? "Saving to Database..." : "Post Job"}
      </button>
    </form>
  );
};

export default AddJobForm;
