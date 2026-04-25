import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Shield, Edit2, Check, X, Camera, Save, Image as ImageIcon, Video, RefreshCw, Loader2, Trash2, Building, Fingerprint, ScanFace } from 'lucide-react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { API_BASE_URL, BASE_URL, GOOGLE_MAPS_API_KEY } from '../../config/apiConfig';
import { useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['places'];

const ProfileSection = ({ user, refreshUser }) => {
  const handleRemovePhoto = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('attendease_token');
      await axios.delete(`${API_BASE_URL}/student/profile-image/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUser();
      setShowPhotoOptions(false);
    } catch (error) {
      console.error("Error removing profile image:", error);
    } finally {
      setLoading(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Face Registration States
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMessage, setFaceMessage] = useState('');
  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({ ...user });
    }
    loadModels();
  }, [user, isEditing]);

  const loadModels = async () => {
    const MODEL_URL = '/models';
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (e) { console.error("Face models load failed", e); }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dotted border-slate-200 dark:border-white/10 transition-colors">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
        <p className="text-slate-500 dark:text-slate-200 font-bold uppercase tracking-widest text-[10px] transition-colors">Loading Profile Card...</p>
      </div>
    );
  }

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setFormData({ ...user });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/student/send-otp`, {
        mobile_number: formData.mobile_number
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('attendease_token')}` }
      });
      setIsVerifying(true);
      setOtp('');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to send OTP. Please check your mobile number.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/student/send-otp`, {
        mobile_number: formData.mobile_number
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('attendease_token')}` }
      });
      setOtp('');
      alert("OTP resent successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const confirmVerification = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/student/profile/${user.id}`, { ...formData, otp }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('attendease_token')}` }
      });
      alert(response.data.message);
      setIsVerifying(false);
      setIsEditing(false);
      refreshUser();
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera");
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "captured-photo.jpg", { type: "image/jpeg" });
      uploadProfileImage(file);
    }, 'image/jpeg');

    closeCamera();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadProfileImage(file);
    }
    setShowPhotoOptions(false);
  };

  const uploadProfileImage = async (file) => {
    const data = new FormData();
    data.append('profile_image', file);

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/student/profile-image/${user.id}`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('attendease_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(response.data.message);
      refreshUser();
    } catch (error) {
      console.error(error);
      alert("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFace = async () => {
    setIsCapturingFace(true);
    setFaceMessage("Initializing AI Scanner...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      alert("Could not access camera for Face ID registration.");
      setIsCapturingFace(false);
    }
  };

  const handleFaceDetectOnPlay = async () => {
    const interval = setInterval(async () => {
      if (!faceVideoRef.current || !isCapturingFace || !faceCanvasRef.current) return clearInterval(interval);

      const detection = await faceapi.detectSingleFace(faceVideoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      const displaySize = { width: faceVideoRef.current.videoWidth, height: faceVideoRef.current.videoHeight };
      faceapi.matchDimensions(faceCanvasRef.current, displaySize);

      if (faceCanvasRef.current) {
        const ctx = faceCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);
        
        if (detection) {
          const resizedDetections = faceapi.resizeResults(detection, displaySize);
          // Drawing custom box for premium feel
          const { box } = resizedDetections.detection;
          const drawBox = new faceapi.draw.DrawBox(box, { 
            label: 'Face Detected', 
            boxColor: '#3b82f6', // brand-500
            lineWidth: 2 
          });
          drawBox.draw(faceCanvasRef.current);
        }
      }

      if (detection) {
        clearInterval(interval);
        setFaceMessage("Face captured! Syncing biometric data... 🧬");

        try {
          await axios.put(`${API_BASE_URL}/auth/profile/face`, {
            faceDescriptor: Array.from(detection.descriptor)
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('attendease_token')}` }
          });

          alert("Biometric ID Updated Successfully!");
          stopFaceCapture();
          refreshUser();
        } catch (error) {
          console.error(error);
          alert("Biometric sync failed. Please try again.");
          stopFaceCapture();
        }
      } else {
        setFaceMessage("Analyzing... Keep steady 🎯");
      }
    }, 600); // Consistent 600ms interval
  };

  const stopFaceCapture = () => {
    if (faceVideoRef.current && faceVideoRef.current.srcObject) {
      faceVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCapturingFace(false);
  };

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      setFaceMessage("Fetching your coordinates...");
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (!isLoaded || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
          // Fallback to manual entry alert if Google Maps is not ready
          alert(`Coordinates fetched: ${latitude}, ${longitude}. Please enter address manually or add Google Maps API Key.`);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const geocoder = new window.google.maps.Geocoder();
          const latlng = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
          
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK") {
              if (results[0]) {
                setFormData(prev => ({ ...prev, local_address: results[0].formatted_address }));
              } else {
                alert("No address found for these coordinates.");
              }
            } else {
              alert("Google Geocoding failed: " + status);
            }
            setLoading(false);
          });
        } catch (error) {
          console.error("Geocoding failed", error);
          alert("Could not convert coordinates to address.");
          setLoading(false);
        }
      }, (err) => {
        alert("Location access denied.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const infoGroups = [
    {
      title: 'Personal Information',
      icon: User,
      fields: [
        { label: 'Full Name', key: 'name', editable: true },
        { label: 'PRN Number', key: 'prn_number', editable: true },
        { label: 'Roll Number', key: 'roll_number', editable: true },
        { label: 'Date of Birth', key: 'dob', editable: true, type: 'date' },
        { label: 'Blood Group', key: 'blood_group', editable: true },
        { label: 'Gender', key: 'gender', editable: true },
      ]
    },
    {
      title: 'Academic Details',
      icon: RefreshCw,
      fields: [
        { label: 'Department', key: 'department', editable: true },
        { label: 'Current Year', key: 'current_year', editable: true },
        {
          label: 'Current Semester', key: 'current_semester', editable: true, type: 'select',
          options: [
            { label: 'I', value: 1 }, { label: 'II', value: 2 }, { label: 'III', value: 3 }, { label: 'IV', value: 4 },
            { label: 'V', value: 5 }, { label: 'VI', value: 6 }, { label: 'VII', value: 7 }, { label: 'VIII', value: 8 }
          ]
        },
        { label: 'Division', key: 'division', editable: true },
      ]
    },
    {
      title: 'Contact Information',
      icon: Phone,
      fields: [
        { label: 'Email ID', key: 'email', editable: true },
        { label: 'Mobile Number', key: 'mobile_number', editable: true },
      ]
    },
    {
      title: 'Address Information',
      icon: MapPin,
      fields: [
        { label: 'Local Address', key: 'local_address', editable: true, textarea: true },
        { label: 'Permanent Address', key: 'permanent_address', editable: true, textarea: true },
      ]
    },
    {
      title: 'Emergency Contact',
      icon: Shield,
      fields: [
        { label: 'Guardian Name', key: 'guardian_name', editable: true },
        { label: 'Guardian Mobile', key: 'guardian_mobile', editable: true },
        { label: 'Guardian Relation', key: 'guardian_relation', editable: true },
        { label: 'Emergency Name', key: 'emergency_contact_name', editable: true },
        { label: 'Emergency Mobile', key: 'emergency_contact_mobile', editable: true },
        { label: 'Medical Conditions', key: 'medical_conditions', editable: true, textarea: true },
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 dark:bg-brand-500/10 rounded-full -mr-16 -mt-16 pointer-events-none transition-colors"></div>

        <div className="relative group cursor-pointer" onClick={() => setShowPhotoOptions(true)}>
          <div className="w-32 h-32 rounded-3xl bg-slate-100 dark:bg-slate-600 overflow-hidden border-4 border-white dark:border-white/10 shadow-xl relative transition-colors">
            {formData.profile_image ? (
              <img src={`${BASE_URL}${formData.profile_image}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-500 text-white text-4xl font-bold">
                {formData.name?.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white w-8 h-8" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-700 rounded-xl shadow-lg border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-200 group-hover:text-brand-500 transition-colors">
            <Camera className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">{formData.name}</h2>
          <p className="text-slate-500 dark:text-slate-200 font-medium transition-colors">{formData.department} • {formData.current_year} Section {formData.division}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-600 rounded-full text-xs font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider transition-colors">PRN: {formData.prn_number || 'N/A'}</div>
            <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider transition-colors">Roll No: {formData.roll_number}</div>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-600 dark:text-white rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {infoGroups.map((group, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 transition-colors">
              <group.icon className="w-5 h-5 text-brand-500" /> {group.title}
            </h3>
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider transition-colors">{field.label}</span>
                  {isEditing && field.editable ? (
                    field.textarea ? (
                      <div className="space-y-2">
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none min-h-[80px] transition-colors"
                        />
                        {field.key === 'local_address' && (
                          <button 
                            onClick={handleUseGPS}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all"
                          >
                            <MapPin className="w-3 h-3" /> Fetch Current Address
                          </button>
                        )}
                      </div>
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-colors"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-colors"
                      />
                    )
                  ) : (
                    <span className="text-slate-800 dark:text-white font-medium transition-colors">
                      {field.key === 'dob'
                        ? (formData[field.key] ? new Date(formData[field.key]).toLocaleDateString() : 'N/A')
                        : field.type === 'select'
                          ? (field.options.find(o => o.value == formData[field.key])?.label || 'Not specified')
                          : (formData[field.key] || 'Not specified')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div key="biometrics" className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 transition-colors">
              <Fingerprint className="w-5 h-5 text-brand-500" /> Face ID
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-600 rounded-2xl border border-slate-100 dark:border-white/10 mb-6 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.hasFaceRegistered ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <ScanFace className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider transition-colors">Face Recognition</p>
                  <p className={`text-sm font-bold transition-colors ${user.hasFaceRegistered ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {user.hasFaceRegistered ? 'Authenticated & Active' : 'Not Configured'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-300 leading-relaxed italic transition-colors">
                Biometric data is used for secure attendance marking via Face ID. Ensure your data is up-to-date for accurate verification.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpdateFace}
            className="w-full py-4 bg-slate-800 dark:bg-brand-500 hover:bg-slate-900 dark:hover:bg-brand-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
          >
            <RefreshCw className="w-4 h-4" /> {user.hasFaceRegistered ? 'Update Face Data' : 'Register Face Data'}
          </button>
        </div>
      </div>

      {/* Face Capture Interface */}
      {isCapturingFace && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 transition-colors">
                <ScanFace className="w-5 h-5 text-brand-500" /> AI Face Enrollment
              </h3>
              <button onClick={stopFaceCapture} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={faceVideoRef}
                autoPlay
                onPlay={handleFaceDetectOnPlay}
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <canvas 
                ref={faceCanvasRef}
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
              />
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-4 border-brand-500/50 rounded-2xl border-dashed"></div>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-white dark:border-white/10 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-widest transition-colors">{faceMessage}</span>
                </div>
              </div>
            </div>

            <div className="p-8 text-center bg-slate-50 dark:bg-slate-700 transition-colors">
              <p className="text-sm text-slate-500 dark:text-slate-300 font-medium leading-relaxed transition-colors">
                Look directly into the camera and ensure good lighting. The system will automatically capture your biometric data once detected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-xs w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-4 transition-colors">Change Profile Picture</h3>
            <button
              onClick={openCamera}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-600 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-400/20 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Video className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 dark:text-white transition-colors">Take Live Photo</span>
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-600 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-400/20 transition-colors group"
            >
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 dark:text-white transition-colors">Choose from Gallery</span>
            </button>
            <button
              onClick={handleRemovePhoto}
              className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group"
            >
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-red-700 dark:text-red-400 transition-colors">Remove Profile Picture</span>
            </button>
            <button
              onClick={() => setShowPhotoOptions(false)}
              className="w-full py-3 text-slate-500 dark:text-slate-300 font-bold hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      )}

      {/* Camera Capture Interface */}
      {showCamera && (
        <div className="fixed inset-0 bg-slate-900 z-[110] flex flex-col items-center justify-center p-4">
          <div className="relative max-w-lg w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/20 rounded-full"></div>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-8">
            <button
              onClick={closeCamera}
              className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline outline-offset-4 outline-white/20"
            >
              <div className="w-16 h-16 border-4 border-slate-900 rounded-full"></div>
            </button>
            <button className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/40 mt-6 text-sm font-medium uppercase tracking-widest">Center your face in the circle</p>
        </div>
      )}

      {/* Mock Verification Modal */}
      {isVerifying && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300 transition-colors">
             <div className="w-16 h-16 bg-brand-100 dark:bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2 transition-colors">Verify Changes</h3>
            <p className="text-slate-500 dark:text-slate-200 text-center text-sm mb-6 transition-colors">Enter the 6-digit OTP sent to your registered mobile/email to confirm the changes.</p>

            <div className="flex justify-between gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input
                  key={i}
                  type="text"
                  maxLength="1"
                  className="w-10 h-12 bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl text-center font-bold text-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                  value={otp[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      const newOtp = otp.split('');
                      newOtp[i] = val.slice(-1);
                      setOtp(newOtp.join(''));
                      if (val && i < 5) {
                        const next = e.target.nextElementSibling;
                        if (next) next.focus();
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) {
                      const prev = e.target.previousElementSibling;
                      if (prev) prev.focus();
                    }
                  }}
                />
              ))}
            </div>

            <div className="text-center mb-6">
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="text-xs font-bold text-brand-500 hover:text-brand-600 uppercase tracking-widest disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsVerifying(false)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-600 dark:text-white rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmVerification}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Confirm'}
              </button>
            </div>
            <p className="mt-6 text-center text-[10px] text-slate-400 dark:text-slate-300 uppercase font-bold tracking-widest italic transition-colors">Check backend console for OTP (Simulated SMS)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
