import React, { useState, useRef, useEffect } from 'react';
import { Camera, QrCode, Hash, MapPin, Loader2, CheckCircle2, XCircle, ShieldCheck, Calendar, RefreshCw, BookOpen, DoorClosed } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { Html5Qrcode } from "html5-qrcode";
import axios from 'axios';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../../config/apiConfig';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['places'];
const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '150px',
  borderRadius: '16px'
};

const AttendanceMarker = ({ subjects, timetable, fetchDashboardData }) => {
  const [method, setMethod] = useState(null); // 'face', 'qr', 'code'
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // 'success', 'error'
  const [location, setLocation] = useState(null);
  const [liveAddress, setLiveAddress] = useState('Fetching address...');
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [dist, setDist] = useState(null);
  
  const videoRef = useRef();
  const canvasRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [classroomNumber, setClassroomNumber] = useState('');
  const [qrFacingMode, setQrFacingMode] = useState('environment'); // 'user' or 'environment'

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    loadModels();
    const watchId = startWatchingLocation();
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchActiveSession();
    }
  }, [selectedSubject]);

  const fetchActiveSession = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance/active-session/${selectedSubject}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('attendease_token')}` }
      });
      if (response.data.classroom_number) {
        setClassroomNumber(response.data.classroom_number);
      }
    } catch (error) {
      console.log("No active session found for subject");
    }
  };

  const startWatchingLocation = () => {
    if (navigator.geolocation) {
      return navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(newLoc);
          fetchAddress(newLoc.lat, newLoc.lng);
        },
        (err) => setMessage("⚠️ Please enable location services to mark attendance."),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const fetchAddress = async (lat, lng) => {
    if (!isLoaded || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setLiveAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)} (GPS Tracked)`);
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
      
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK") {
          if (results[0]) {
            setLiveAddress(results[0].formatted_address);
          } else {
            setLiveAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)} (No address found)`);
          }
        } else {
          setLiveAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)} (Google Error: ${status})`);
        }
      });
    } catch (error) {
      setLiveAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

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

  const handleFaceMark = async () => {
    if (!selectedSubject) return alert("Select a subject");
    if (!classroomNumber) return alert("Enter classroom number");
    if (!location) return alert("Location is required");
    
    setMethod('face');
    setMessage("Initializing AI camera...");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) { setMessage("Camera access denied."); }
  };

  const handleVideoOnPlay = async () => {
    const detectionInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return clearInterval(detectionInterval);
      
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
                                      .withFaceLandmarks()
                                      .withFaceDescriptor();

      if (!videoRef.current) return clearInterval(detectionInterval);
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);
        
        if (detection) {
          const resizedDetections = faceapi.resizeResults(detection, displaySize);
          const { box } = resizedDetections.detection;
          new faceapi.draw.DrawBox(box, { 
            label: 'Face Verified', 
            boxColor: '#10b981', // emerald-500
            lineWidth: 2 
          }).draw(canvasRef.current);
        }
      }
      if (detection) {
        clearInterval(detectionInterval);
        setMessage("Face detected. Verifying identity...");
        submitAttendance('face', { faceDescriptor: Array.from(detection.descriptor) });
        stopCamera();
      } else {
        setMessage("Position your face clearly... 📷");
      }
    }, 600); // Throttled to 600ms to eliminate lag on mobile/older PCs
  };

  useEffect(() => {
    let html5QrCode;
    let isMounted = true;

    if (method === 'qr') {
      const startScanner = async () => {
        try {
          // Small delay to ensure previous instance (if any) has stopped its async DOM cleanup
          await new Promise(r => setTimeout(r, 100));
          if (!isMounted) return;

          const container = document.getElementById("reader");
          if (!container) return;

          html5QrCode = new Html5Qrcode("reader");
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          
          await html5QrCode.start(
            { facingMode: qrFacingMode }, 
            config, 
            (decodedText) => {
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                  if (isMounted) submitAttendance('qr', { qr_token: decodedText });
                }).catch(() => {});
              }
            }
          );
        } catch (err) {
          if (isMounted) {
            console.error("QR Start Error", err);
            setMessage("Unable to start camera for QR scanning.");
          }
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => {
          // Suppress the NotFoundError/removeChild error as it's a common race condition 
          // between React's DOM management and the scanner's own cleanup.
          if (!err.toString().includes("removeChild") && !err.toString().includes("NotFound")) {
            console.error("QR Stop Error", err);
          }
        });
      }
    };
  }, [method, qrFacingMode]);

  const startQRScanner = () => {
    if (!selectedSubject) return alert("Select a subject");
    if (!classroomNumber) return alert("Enter classroom number");
    setMethod('qr');
    setMessage("Starting QR Scanner...");
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!selectedSubject) return alert("Select a subject");
    if (!classroomNumber) return alert("Enter classroom number");
    submitAttendance('code', { unique_code: uniqueCode });
  };

  const submitAttendance = async (m, extraData) => {
    setLoading(true);
    setStatus(null);
    const token = localStorage.getItem('attendease_token');
    if (!token) {
      setStatus('error');
      setMessage("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/attendance/mark` , {
        subject_id: selectedSubject,
        method: m,
        student_lat: location.lat,
        student_long: location.lng,
        classroom_number: classroomNumber,
        ...extraData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatus('success');
      setMessage(response.data.message);
      setDist(response.data.distance);
      fetchDashboardData();
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || "Attendance Failed");
      setDist(error.response?.data?.distance);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="text-center">
         <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 transition-colors">Mark Your Presence</h2>
         <p className="text-slate-500 dark:text-slate-200 text-sm transition-colors">Choose a secure method to mark your attendance today.</p>
      </div>

      <div className="bg-white dark:bg-slate-500 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm max-w-md mx-auto w-full transition-colors">
         <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-brand-500" />
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest block transition-colors">Choose Subject</label>
         </div>
         <select 
           value={selectedSubject}
           onChange={(e) => setSelectedSubject(e.target.value)}
           className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-700 dark:text-white transition-colors"
         >
            <option value="">-- Select Today's Class --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>)}
         </select>
      </div>

      <div className="bg-white dark:bg-slate-500 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm max-w-md mx-auto w-full transition-colors">
         <div className="flex items-center gap-2 mb-2">
            <DoorClosed className="w-4 h-4 text-brand-500" />
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest block transition-colors">Classroom Number</label>
         </div>
         <input 
           type="text"
           placeholder="e.g. 101, Lab A, etc."
           value={classroomNumber}
           onChange={(e) => setClassroomNumber(e.target.value)}
           className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-400 transition-colors"
         />
      </div>

      {!method ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <button 
             onClick={handleFaceMark}
             className="bg-white dark:bg-slate-500 p-8 rounded-3xl border-2 border-slate-100 dark:border-white/10 hover:border-brand-500 hover:shadow-xl transition-all group group flex flex-col items-center gap-4 transition-colors"
           >
              <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
                 <Camera className="w-8 h-8" />
              </div>
              <span className="font-bold text-slate-700 dark:text-white transition-colors">Face ID</span>
           </button>
           <button 
             onClick={startQRScanner}
             className="bg-white dark:bg-slate-500 p-8 rounded-3xl border-2 border-slate-100 dark:border-white/10 hover:border-violet-500 hover:shadow-xl transition-all group group flex flex-col items-center gap-4 transition-colors"
           >
              <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 text-violet-500 rounded-2xl flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-all">
                 <QrCode className="w-8 h-8" />
              </div>
              <span className="font-bold text-slate-700 dark:text-white transition-colors">Scan QR</span>
           </button>
           <button 
             onClick={() => setMethod('code')}
             className="bg-white dark:bg-slate-500 p-8 rounded-3xl border-2 border-slate-100 dark:border-white/10 hover:border-emerald-500 hover:shadow-xl transition-all group group flex flex-col items-center gap-4 transition-colors"
           >
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                 <Hash className="w-8 h-8" />
              </div>
              <span className="font-bold text-slate-700 dark:text-white transition-colors">6-Digit Code</span>
           </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-500 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl animate-in zoom-in-95 duration-300 transition-colors">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-100 dark:bg-slate-600 rounded-xl flex items-center justify-center transition-colors">
                    {method === 'face' ? <Camera className="w-5 h-5" /> : method === 'qr' ? <QrCode className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                 </div>
                 <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider transition-colors">{method} Verification</h3>
              </div>
              <div className="flex items-center gap-4">
                {method === 'qr' && !status && !loading && (
                  <button 
                    onClick={() => setQrFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                    className="flex items-center gap-1 text-xs font-bold text-violet-500 hover:text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Switch Camera
                  </button>
                )}
                <button onClick={() => { setMethod(null); setStatus(null); stopCamera(); }} className="text-xs font-bold text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors">Change Method</button>
              </div>
           </div>

           <div className="space-y-6">

              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
                 {method === 'face' && (
                   <>
                    <video 
                      ref={videoRef} 
                      onPlay={handleVideoOnPlay} 
                      className="w-full h-full object-cover transform scale-x-[-1]" 
                      muted 
                    />
                    <canvas 
                      ref={canvasRef} 
                      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
                    />
                   </>
                 )}
                 {method === 'qr' && (
                   <div id="reader" className="w-full h-full"></div>
                 )}
                 {method === 'code' && (
                   <form onSubmit={handleCodeSubmit} className="w-full px-12 text-center">
                      <input 
                        type="text" 
                        maxLength="6"
                        placeholder="ENTER 6-DIGIT CODE"
                        className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-center text-white text-3xl font-black tracking-[1em] outline-none focus:border-brand-500 transition-all placeholder:text-white/20 placeholder:tracking-normal placeholder:text-sm"
                        value={uniqueCode}
                        onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                      />
                      <button 
                        disabled={loading}
                        className="mt-6 w-full py-4 bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {loading ? 'Submitting...' : 'Submit Code'}
                      </button>
                   </form>
                 )}
                 
                 {loading && (
                   <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-brand-500 mb-4" />
                      <p className="font-bold italic">"{message}"</p>
                   </div>
                 )}

                 {status && (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 ${status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                       {status === 'success' ? <CheckCircle2 className="w-20 h-20 text-white mb-4" /> : <XCircle className="w-20 h-20 text-white mb-4" />}
                       <h4 className="text-2xl font-black text-white mb-2">{status === 'success' ? 'Presence Secure!' : 'Attendance Failed'}</h4>
                       <p className="text-white/80 font-medium mb-6">{message}</p>
                       {dist !== undefined && (
                         <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl text-white text-xs font-bold mb-8">
                            <MapPin className="w-4 h-4" /> Distance: {dist} meters
                         </div>
                       )}
                       <button 
                         onClick={() => { setMethod(null); setStatus(null); setClassroomNumber(''); }}
                         className="px-8 py-3 bg-white rounded-xl font-black text-slate-800 shadow-xl"
                       >
                          Close Dashboard
                       </button>
                    </div>
                 )}
              </div>

              <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-600 rounded-2xl border border-slate-100 dark:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${location ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest block transition-colors">Location Status</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-white transition-colors uppercase">
                      {isManualLocation ? 'Manual Entry Mode' : (location ? 'Live tracking...' : 'Waiting for GPS...')}
                    </span>
                    {loadError && <p className="text-[9px] text-red-500 font-bold mt-1">⚠️ Google Maps failed to load. Check API Key & Permissions.</p>}
                    {location && !isManualLocation && !loadError && (
                       <p className="text-[9px] text-slate-400 dark:text-slate-300 mt-1 line-clamp-1 italic">{liveAddress}</p>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsManualLocation(!isManualLocation)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                  >
                    {isManualLocation ? 'Use Live GPS' : 'Manual Edit'}
                  </button>
                  {location && !isManualLocation && (
                    <button 
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                    >
                      {showMap ? 'Hide Map' : 'Show Map'}
                    </button>
                  )}
                </div>

                {showMap && location && isLoaded && (
                  <div className="animate-in zoom-in-95 duration-300">
                    <GoogleMap
                      mapContainerStyle={MAP_CONTAINER_STYLE}
                      center={location}
                      zoom={18}
                      mapTypeId="satellite"
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        gestureHandling: 'cooperative'
                      }}
                    >
                      <Marker position={location} />
                    </GoogleMap>
                  </div>
                )}

                {isManualLocation && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest px-1">Latitude</label>
                      <input 
                        type="number" 
                        step="0.000001"
                        value={location?.lat || ''} 
                        onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[11px] font-mono font-bold text-slate-700 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                        placeholder="e.g. 18.52"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest px-1">Longitude</label>
                      <input 
                        type="number" 
                        step="0.000001"
                        value={location?.lng || ''} 
                        onChange={(e) => setLocation({ ...location, lng: parseFloat(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[11px] font-mono font-bold text-slate-700 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                        placeholder="e.g. 73.85"
                      />
                    </div>
                  </div>
                )}

                {!isManualLocation && location && (
                  <div className="pt-3 border-t border-slate-200/50 dark:border-white/5 flex justify-between items-center group">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest font-mono">Precision Coords</span>
                    <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-bold tracking-tighter">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarker;
