import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api",
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
export const uploadVideo = (videoData) => API.post("/videos", videoData);

// ✅ Fetch all videos
export const getVideos = async () => {
  const { data } = await API.get("/videos");
  return data;
};
