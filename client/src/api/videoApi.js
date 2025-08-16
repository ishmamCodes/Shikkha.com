import axios from "axios";

const API_URL = "http://localhost:4000/api/videos";

export const getVideos = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const uploadVideo = async (videoData, token) => {
  const res = await axios.post(API_URL, videoData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
