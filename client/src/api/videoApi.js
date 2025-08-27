import axios from "axios";

const API = axios.create({
  baseURL: "https://shikkha-com.onrender.com",
});

// Attach token automatically if it exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ✅ Upload video
export const uploadVideo = (videoData) => API.post("/api/videos", videoData);

// ✅ Fetch all videos
export const getVideos = async () => {
  const { data } = await API.get("/api/videos");
  return data;
};
