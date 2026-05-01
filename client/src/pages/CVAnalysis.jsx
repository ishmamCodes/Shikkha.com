import React, { useState } from 'react';
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const CVAnalysis = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return setError('Please select a CV file');
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('cv', file);

      const response = await fetch(`${API_BASE_URL}/cv/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ScoreCircle = ({ score }) => {
    const color = score >= 7 ? 'text-green-500' : score >= 5 ? 'text-yellow-500' : 'text-red-500';
    return (
      <div className={`flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 ${score >= 7 ? 'border-green-500' : score >= 5 ? 'border-yellow-500' : 'border-red-500'}`}>
        <span className={`text-4xl font-bold ${color}`}>{score}</span>
        <span className="text-gray-500 text-sm">/ 10</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CV Analyzer</h1>
          <p className="text-purple-200">Upload your CV and get instant AI-powered feedback</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-6">
          <div className="flex flex-col items-center">
            <label className="w-full cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-green-400 bg-green-400/10' : 'border-white/30 hover:border-white/60'}`}>
                <FiUpload className="mx-auto text-4xl text-white mb-3" />
                {file ? (
                  <div>
                    <p className="text-green-400 font-medium">{file.name}</p>
                    <p className="text-white/60 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white font-medium">Click to upload your CV</p>
                    <p className="text-white/60 text-sm mt-1">PDF files only</p>
                  </div>
                )}
              </div>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {error && (
              <div className="flex items-center gap-2 text-red-400 mt-4">
                <FiAlertCircle />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FiFileText />
                  Analyze CV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score + Summary */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ScoreCircle score={result.score} />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">Overall Assessment</h2>
                  <p className="text-purple-200">{result.summary}</p>
                  <div className="mt-3 inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-500/30 text-purple-200">
                    {result.experienceLevel}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Skills */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Top Skills</h2>
              <div className="flex flex-wrap gap-2">
                {result.topSkills?.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-green-400 mb-4">✅ Strengths</h2>
                <ul className="space-y-2">
                  {result.strengths?.map((s, i) => (
                    <li key={i} className="text-purple-200 flex items-start gap-2">
                      <FiCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Weaknesses</h2>
                <ul className="space-y-2">
                  {result.weaknesses?.map((w, i) => (
                    <li key={i} className="text-purple-200 flex items-start gap-2">
                      <FiAlertCircle className="text-red-400 mt-1 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">📌 Missing Skills</h2>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills?.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </div>

            {/* Improvements */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-blue-400 mb-4">🚀 Improvements</h2>
              <ul className="space-y-2">
                {result.improvements?.map((imp, i) => (
                  <li key={i} className="text-purple-200">• {imp}</li>
                ))}
              </ul>
            </div>

            {/* Recommended Roles */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">💼 Recommended Roles</h2>
              <div className="flex flex-wrap gap-2">
                {result.recommendedRoles?.map((role, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm">{role}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVAnalysis;