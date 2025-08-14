import React, { useState } from "react";
import { uploadVideo } from "../api/videoApi";

export default function VideoUpload({ token }) {
  const [form, setForm] = useState({ title: "", youtubeUrl: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await uploadVideo(form, token);
      setMessage("Video uploaded successfully!");
      setForm({ title: "", youtubeUrl: "" });
    } catch (err) {
      setMessage("Failed to upload video.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Share Your Video
            </h1>
            <p className="text-gray-600">Upload video for the students</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Video Title</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-gray-800 placeholder-gray-500 transition-all duration-200"
                type="text"
                placeholder="Enter video title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">YouTube URL</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-800 placeholder-gray-500 transition-all duration-200"
                type="text"
                placeholder="Paste YouTube URL here"
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center ${
                isSubmitting
                  ? "bg-purple-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 hover:shadow-lg"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                "Upload Video"
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
              message.includes("success") 
                ? "bg-green-100 text-green-800 border border-green-200" 
                : "bg-red-100 text-red-800 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          <div className="mt-8 text-center text-gray-700 text-sm">
            <p>Need help? Make sure your URL is in the format:</p>
            <p className="font-mono bg-gray-100 p-2 rounded mt-1 text-gray-800">
              https://www.youtube.com/watch?v=VIDEO_ID
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}