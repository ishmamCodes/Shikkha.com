import Video from "../models/Video.js";

// Upload video (Educator only)
export const uploadVideo = async (req, res) => {
  try {
    const { title, youtubeUrl } = req.body;

    if (!title || !youtubeUrl) {
      return res.status(400).json({ error: "Title and YouTube URL are required" });
    }

    const video = new Video({
      title,
      youtubeUrl,
      uploadedBy: req.user._id
    });

    await video.save();
    res.status(201).json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all videos (Public)
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 }).populate("uploadedBy", "name");
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
