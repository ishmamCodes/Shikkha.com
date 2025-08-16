import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginSignup = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    birthday: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:4000/api/auth";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username) errors.username = "Username is required";
    if (!formData.password) errors.password = "Password is required";
    if (isSignup && !formData.birthday) errors.birthday = "Birthday is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setLoading(true);

    try {
      const endpoint = isSignup ? "/signup" : "/login";
      const body = {
        username: formData.username,
        password: formData.password,
        role,
        ...(isSignup && { birthday: formData.birthday }),
      };

      const res = await fetch(API_BASE_URL + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Something went wrong");

      const { user, token } = data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      const route = {
        student: "/",
        educator: "/dashboard/educator",
        admin: "/dashboard/admin",
      }[user.role];

      navigate(route || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-700/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-700/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/4 right-1/4 w-56 h-56 bg-blue-600/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-8000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-violet-600/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-12000"></div>
      </div>

      {/* Floating particles */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 15 + 10}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        ></div>
      ))}

      <div className="w-full max-w-md relative z-10">
        <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          {/* Decorative header */}
          <div className="h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shine"></div>
          </div>
          
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <h1 className="text-3xl font-bold text-white mb-2 relative z-10">
                  {isSignup ? "Create Account" : "Welcome Back"}
                </h1>
                <div className="absolute -bottom-1 left-0 w-full h-2 bg-indigo-500/30 rounded-full z-0"></div>
              </div>
              <p className="text-white/80">
                {isSignup ? "Join us to get started" : "Sign in to continue your journey"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative group">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setIsSignup(e.target.value === "admin" ? false : isSignup);
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none text-white backdrop-blur-sm group-hover:bg-white/10"
                >
                  <option value="student" className="bg-gray-800 text-white">Student</option>
                  <option value="educator" className="bg-gray-800 text-white">Educator</option>
                  <option value="admin" className="bg-gray-800 text-white">Admin</option>
                </select>
                <div className="absolute right-4 top-4 text-white/70">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1 group">
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    placeholder="Email or Phone"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm group-hover:bg-white/10"
                  />
                  <div className="absolute left-4 top-3.5 text-white/50 group-focus-within:text-indigo-400 transition-colors">
                  </div>
                </div>
                {fieldErrors.username && (
                  <p className="text-red-400 text-sm mt-1 animate-fadeIn flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              <div className="space-y-1 group">
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm group-hover:bg-white/10 pl-12"
                  />
                  <div className="absolute left-4 top-3.5 text-white/50 group-focus-within:text-indigo-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-400 text-sm mt-1 animate-fadeIn flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {isSignup && (
                <div className="space-y-1 group">
                  <div className="relative">
                    <input
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm group-hover:bg-white/10 pl-12"
                    />
                    <div className="absolute left-4 top-3.5 text-white/50 group-focus-within:text-indigo-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {fieldErrors.birthday && (
                    <p className="text-red-400 text-sm mt-1 animate-fadeIn flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.birthday}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 text-red-300 p-3 rounded-lg flex items-center border border-red-700/50 animate-shake">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : isSignup ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </span>
              </button>
            </form>

            {role !== "admin" && (
              <p className="mt-6 text-center text-sm text-white/80">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignup((prev) => !prev)}
                  className="font-medium text-white hover:text-indigo-300 focus:outline-none focus:underline transition-all"
                >
                  {isSignup ? "Sign in" : "Sign up"}
                </button>
              </p>
            )}

            {!isSignup && (
              <div className="mt-4 text-center">
                <a
                  href="/forgot"
                  className="text-sm text-white/70 hover:text-indigo-300 font-medium focus:outline-none focus:underline transition-all"
                >
                  Forgot password?
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add these styles to your CSS */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }
        @keyframes shine {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-blob {
          animation: blob 12s infinite ease-in-out;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-8000 {
          animation-delay: 8s;
        }
        .animation-delay-12000 {
          animation-delay: 12s;
        }
        .animate-shine {
          animation: shine 3s linear infinite;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default LoginSignup;