import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import educatorApi from '../services/educatorApi.js';

const CreateCoursePage = () => {
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    category: 'Mathematics',
    difficultyLevel: 'Beginner',
    privacy: 'public',
    price: 0,
    duration: '',
    tags: [],
    scheduleDays: [],
    scheduleSlot: '',
    startingDate: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const categories = [
    "Mathematics", "Science", "Language", "History", 
    "Computer Science", "Arts", "Music", "Physical Education", "Other"
  ];

  const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];

  // Weekday options
  const weekdayOptions = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Generate 1h20m slots between 06:00 and 22:00 starting every 30 minutes
  const generateSlots = () => {
    const slots = [];
    const toLabel = (mins) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };
    const dayStart = 6 * 60; // 06:00
    const dayEnd = 22 * 60; // 22:00 latest end
    for (let start = dayStart; start + 80 <= dayEnd; start += 30) {
      const end = start + 80; // 1h20m
      slots.push(`${toLabel(start)}-${toLabel(end)}`);
    }
    return slots;
  };
  const timeSlots = generateSlots();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Checkbox dropdown state for days
  const [daysOpen, setDaysOpen] = useState(false);
  const toggleDay = (day) => {
    setForm((f) => {
      const exists = f.scheduleDays.includes(day);
      const scheduleDays = exists
        ? f.scheduleDays.filter(d => d !== day)
        : [...f.scheduleDays, day];
      return { ...f, scheduleDays };
    });
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const upload = await educatorApi.uploadFile(formData);
      setThumbnailUrl(upload.url);
      setThumbnailFile(file);
      toast.success('Thumbnail uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload thumbnail');
      console.error('Thumbnail upload error:', error);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setForm(f => ({ ...f, tags }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Course title is required');
      return;
    }

    setCreating(true);
    try {
      const courseData = {
        ...form,
        thumbnailUrl: thumbnailUrl || '',
        tags: form.tags.filter(tag => tag.length > 0)
      };
      
      const course = await educatorApi.createCourse(courseData);
      toast.success(`Course "${course.title}" created successfully!`);
      // Notify other components that the course list has been updated
      localStorage.setItem('coursesUpdated', `true_${Date.now()}`);
      setForm({ 
        title: '', 
        description: '', 
        category: 'Mathematics',
        difficultyLevel: 'Beginner',
        privacy: 'public',
        price: 0,
        duration: '',
        tags: [],
        scheduleDays: [],
        scheduleSlot: '',
        startingDate: ''
      });
      setThumbnailFile(null);
      setThumbnailUrl('');
    } catch (error) {
      toast.error('Failed to create course');
      console.error('Course creation error:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-indigo-700 mb-4">Create New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl p-6 border-2 border-indigo-200">
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Course Title *</label>
          <input 
            required 
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            placeholder="Enter course title"
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Description</label>
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            rows={4}
            placeholder="Describe what students will learn in this course..."
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Category *</label>
            <select 
              name="category" 
              value={form.category} 
              onChange={handleChange}
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Difficulty Level *</label>
            <select 
              name="difficultyLevel" 
              value={form.difficultyLevel} 
              onChange={handleChange}
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {difficultyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Price (BDT)</label>
            <input 
              type="number" 
              name="price" 
              value={form.price} 
              onChange={handleChange}
              min="0"
              step="1"
              placeholder="0"
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Duration</label>
            <input 
              name="duration" 
              value={form.duration} 
              onChange={handleChange}
              placeholder="e.g., 8 weeks, Self-paced"
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Starting Date</label>
            <input 
              type="date" 
              name="startingDate" 
              value={form.startingDate} 
              onChange={handleChange}
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-purple-800 mb-1">Class Days</label>
            <button
              type="button"
              onClick={() => setDaysOpen((v) => !v)}
              className="w-full border rounded-md p-3 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <span>{form.scheduleDays.length ? `${form.scheduleDays.length} day(s) selected` : 'Select days'}</span>
              <span className="ml-2">▾</span>
            </button>
            {daysOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg p-3 grid grid-cols-1 gap-2">
                {weekdayOptions.map((day) => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-purple-600"
                      checked={form.scheduleDays.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
                <div className="pt-2 flex justify-end">
                  <button type="button" onClick={() => setDaysOpen(false)} className="px-3 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-800">
                    Done
                  </button>
                </div>
              </div>
            )}
            {form.scheduleDays.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.scheduleDays.map((d) => (
                  <span key={d} className="px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Class Time (1h 20m)</label>
            <select
              name="scheduleSlot"
              value={form.scheduleSlot}
              onChange={handleChange}
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a time slot</option>
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Tags</label>
          <input 
            name="tags" 
            value={form.tags.join(', ')} 
            onChange={handleTagsChange}
            placeholder="Enter tags separated by commas (e.g., math, algebra, beginner)"
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
          />
          <p className="text-sm text-gray-500 mt-1">Tags help students find your course</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Course Thumbnail</label>
          <div className="flex items-center gap-4">
            {thumbnailUrl && (
              <div className="w-20 h-20 rounded-lg overflow-hidden border">
                <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <label className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 cursor-pointer transition-colors">
                {uploadingThumbnail ? 'Uploading...' : 'Upload Thumbnail'}
                <input 
                  type="file" 
                  accept="image/*,.png,.jpg,.jpeg,.webp,.gif" 
                  className="hidden" 
                  onChange={handleThumbnailUpload}
                  disabled={uploadingThumbnail}
                />
              </label>
              {thumbnailUrl && (
                <button 
                  type="button" 
                  onClick={() => {
                    setThumbnailUrl('');
                    setThumbnailFile(null);
                  }} 
                  className="ml-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Upload an image to represent your course (max 5MB)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Privacy</label>
          <select 
            name="privacy" 
            value={form.privacy} 
            onChange={handleChange} 
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="public">Public - Anyone can find and enroll</option>
            <option value="private">Private - Only invited students can enroll</option>
          </select>
        </div>

        <button 
          disabled={creating} 
          className="w-full px-6 py-3 rounded-md text-white font-medium disabled:opacity-60 transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xl"
        >
          {creating ? 'Creating Course...' : 'Create Course'}
        </button>
      </form>
    </div>
  );
};

export default CreateCoursePage;


