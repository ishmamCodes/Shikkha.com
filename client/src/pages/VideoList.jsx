import React, { useEffect, useState } from "react";
import { getVideos } from "../api/videoApi";

export default function VideoList() {
  const [videos, setVideos] = useState([]);
  const [hoveredVideo, setHoveredVideo] = useState(null);

  useEffect(() => {
    getVideos().then(setVideos);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-800 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white text-center py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg">
          Video Library
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div 
              key={video._id} 
              className={`bg-gray-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${hoveredVideo === video._id ? 'transform scale-105 shadow-outline' : 'hover:shadow-xl'}`}
              onMouseEnter={() => setHoveredVideo(video._id)}
              onMouseLeave={() => setHoveredVideo(null)}
            >
              <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={video.youtubeUrl.replace("watch?v=", "embed/")}
                  title={video.title}
                  allowFullScreen
                  frameBorder="0"
                />
              </div>
              
              <div className="p-4 bg-gradient-to-b from-gray-800 to-gray-900">
                <h2 className="text-lg font-semibold text-white mb-2 truncate">
                  {video.title}
                </h2>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                  <p className="text-sm text-purple-300">
                    Uploaded by {video.uploadedBy?.name || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-white bg-opacity-10 rounded-full mb-4">
              <svg className="w-12 h-12 text-pink-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p className="text-xl text-white opacity-80">Loading awesome videos...</p>
          </div>
        )}
      </div>
    </div>
  );
}