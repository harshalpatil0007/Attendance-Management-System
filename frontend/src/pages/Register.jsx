import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, User, Hash, Briefcase, Camera } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import * as faceapi from 'face-api.js';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch("password", "");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Face API states
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [captureMessage, setCaptureMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');

  const videoRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face models", error);
      }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    setCaptureMessage('Please look directly at the camera...');
    navigator.mediaDevices.getUserMedia({ video: { width: 300 } })
      .then(stream => {
        let video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      })
      .catch(err => {
        console.error("error:", err);
        setCaptureMessage("Failed to access webcam.");
      });
  };

  const handleVideoOnPlay = async () => {
    try {
      const displaySize = { width: 300, height: 225 };
      faceapi.matchDimensions(videoRef.current, displaySize);

      // Attempt to detect face continuously until a good one is found
      const detectionInterval = setInterval(async () => {
        if (!videoRef.current || !captureVideo) {
          clearInterval(detectionInterval);
          return;
        }

        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          clearInterval(detectionInterval);
          setFaceDescriptor(Array.from(detection.descriptor));
          setCaptureMessage('Face captured successfully!');
          closeWebcam();
        }
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const closeWebcam = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCaptureVideo(false);
  };

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const onSubmit = async (data) => {
    const payload = { ...data, role: selectedRole, otp };

    if (selectedRole === 'student') {
      if (!faceDescriptor) {
        setAuthError('Please capture your face before registering.');
        return;
      }
      payload.faceDescriptor = faceDescriptor;
    }

    if (!isOtpSent) {
      setIsLoading(true);
      setAuthError('');
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/send-registration-otp`, {
          email: data.email,
          mobile_number: data.mobile_number
        });
        setIsOtpSent(true);
      } catch (error) {
        setAuthError(error.response?.data?.message || 'Failed to send OTP.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!otp || otp.length !== 6) {
      setAuthError('Please enter the 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
      localStorage.setItem('attendease_token', response.data.token);
      localStorage.setItem('attendease_user', JSON.stringify(response.data));
      if (response.data.role === 'admin' || selectedRole === 'admin') navigate('/dashboard/admin');
      else if (response.data.role === 'teacher' || selectedRole === 'teacher') navigate('/dashboard/teacher');
      else navigate('/dashboard/student');
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-300/20 blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/20 blur-3xl"></div>

      <div className="max-w-2xl w-full space-y-8 glassmorphism p-10 rounded-3xl relative z-10 transition-colors">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Ja7gfCpnjkyFXUCu_v5gSyxxIGNVuFmSqw&s" alt="SSBT" className="h-12 w-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Create your account</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Register as a student for facial recognition attendance
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-100">
            {authError}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Role Selection - Placed at top full-width for clarity */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Registration Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 shadow-sm appearance-none font-medium text-slate-800 dark:text-white transition-colors"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher (Faculty)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Left Column */}
             <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">Full Name</label>
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">Email</label>
                <input
                  {...register("email", { required: "Email is required", pattern: /^\S+@\S+$/i })}
                  type="email"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">Mobile Number</label>
                <input
                  {...register("mobile_number", {
                    required: "Mobile number is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Please enter a valid 10-digit mobile number"
                    }
                  })}
                  type="tel"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all"
                  placeholder="10-digit mobile number"
                />
                {errors.mobile_number && <p className="mt-1 text-sm text-red-500">{errors.mobile_number.message}</p>}
              </div>

              {selectedRole === 'student' && (
                <div>
                  <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">Year / Semester</label>
                  <select
                    {...register("year_semester", { required: "Required" })}
                    className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm appearance-none transition-all"
                  >
                    <option value="">Select Year</option>
                    <option value="FE">First Year (FE)</option>
                    <option value="SE">Second Year (SE)</option>
                    <option value="TE">Third Year (TE)</option>
                    <option value="BE">Fourth Year (BE)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">Password</label>
                <input
                  {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })}
                  type="password"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all"
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">
                  {selectedRole === 'student' ? 'PRN Number' : 'ID Number'}
                </label>
                <input
                  {...register("roll_number", { required: "This field is required" })}
                  type="text"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all"
                />
              </div>

              {selectedRole !== 'admin' && (
                 <div>
                  <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">Department</label>
                    <select
                      {...register("department", { required: selectedRole !== 'admin' ? "Department is required" : false })}
                      className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm appearance-none font-medium transition-all"
                    >
                      <option value="">Select Department</option>
                      <option value="First Year Engineering">First Year Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Electronics & Telecommunications Engg.">Electronics & Telecommunications Engg.</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                    </select>
                </div>
              )}

              {selectedRole === 'student' && (
                <div>
                  <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">Division</label>
                  <input
                    {...register("division", { required: "Division is required" })}
                    type="text"
                    className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[#334155] dark:text-slate-300 mb-2 transition-colors">Confirm Password</label>
                <input
                  {...register("confirmPassword", {
                    required: "Confirm Password is required",
                    validate: value => value === password || "Passwords do not match"
                  })}
                  type="password"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>

          {/* Face Registration Section - Only for Students */}
          {selectedRole === 'student' && (
            <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-6 transition-colors">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center transition-colors">
                <Camera className="w-5 h-5 mr-2 text-brand-500" />
                Face Registration
              </h3>

              {!modelsLoaded ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-700 dark:text-blue-400 text-sm flex items-center justify-center transition-colors">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Loading AI Face Models...
                </div>
              ) : faceDescriptor ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center transition-colors">
                  <span>✓ Face successfully registered and encrypted.</span>
                  <button type="button" onClick={() => setFaceDescriptor(null)} className="text-emerald-800 dark:text-emerald-300 underline text-xs">Retake</button>
                </div>
              ) : captureVideo ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-[300px] h-[225px] bg-slate-900 rounded-xl overflow-hidden shadow-lg border-2 border-brand-500 transition-colors">
                    <video ref={videoRef} onPlay={handleVideoOnPlay} className="absolute inset-0 w-full h-full object-cover" muted />
                    <div className="absolute top-0 left-0 w-full h-full border-[2px] border-dashed border-white/50 m-4 w-[calc(100%-32px)] h-[calc(100%-32px)] rounded-full animate-pulse pointer-events-none"></div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors">{captureMessage}</p>
                  <button type="button" onClick={closeWebcam} className="mt-3 text-xs text-red-500 hover:text-red-700 transition-colors">Cancel</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startVideo}
                  className="w-full flex justify-center py-4 px-4 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-brand-400 hover:text-brand-600 transition-all"
                >
                  Click to open webcam and capture face
                </button>
              )}
            </div>
          )}

          {isOtpSent && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Enter 6-digit Verification OTP</label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="block w-full px-4 py-3 border-2 border-brand-200 dark:border-brand-500/30 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm text-center text-2xl tracking-[1em] font-bold transition-all"
              />
              <p className="mt-2 text-xs text-slate-500 text-center">OTP sent to {watch('mobile_number')}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (selectedRole === 'student' && !modelsLoaded)}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (isOtpSent ? "Verify & Register" : "Send Verification OTP")}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400 transition-colors">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
