import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';
import { analyzeIssueImage } from '../services/geminiService';
import { Camera, Upload, MapPin, Zap, CheckCircle2, ChevronRight, ChevronLeft, Loader2, AlertCircle, X, Mic, MicOff } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

export function ReportIssuePage() {
  const { addIssue, setActiveTab, addToast, issues, navigateToIssue } = useApp();
  const [step, setStep] = useState(1);
  
  // Media State
  const [mediaData, setMediaData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [department, setDepartment] = useState('');
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiDescription, setAiDescription] = useState('');
  
  // Location State
  const [location, setLocation] = useState({ lat: 24.2742, lng: 86.6393, address: '' });
  const [isLocating, setIsLocating] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Duplicate Check State
  const [duplicateIssue, setDuplicateIssue] = useState<any>(null);

  useEffect(() => {
    if (step === 4) {
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R * c;
      };

      const found = issues.find(i => 
        i.category === category && 
        i.status !== 'Resolved' &&
        getDistance(location.lat, location.lng, i.location.lat, i.location.lng) < 200
      );
      setDuplicateIssue(found || null);
    }
  }, [step, category, location, issues]);

  // --- Step 1: Media Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaData(reader.result as string);
        setMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaData(reader.result as string);
        setMimeType(file.type);
      };
      reader.readAsDataURL(file);
    } else {
      addToast('Invalid File', 'Please drop an image or video file.', 'error');
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      addToast('Camera Error', 'Could not access camera. Please use file upload.', 'error');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setMediaData(dataUrl);
      setMimeType('image/jpeg');
      closeCamera();
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => closeCamera();
  }, []);

  // --- Step 2: AI Analysis ---
  const runAIAnalysis = async () => {
    if (!mediaData) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeIssueImage(mediaData, mimeType);
      
      setTitle(result.title);
      setDescription(result.description);
      if (CATEGORIES.includes(result.category)) setCategory(result.category);
      setSeverity(result.severity);
      setDepartment(result.department);
      setAiConfidence(result.confidence);
      setAiDescription(result.description);
    } catch (err) {
      addToast('AI Analysis Failed', 'Could not analyze image. Please enter details manually.', 'warning');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (step === 2 && mediaData) {
      runAIAnalysis();
    }
  }, [step]);

  // --- Step 3: Location ---
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: { 'User-Agent': 'Community-Hero-App' }
      });
      const data = await res.json();
      return data.display_name || 'Location mapped';
    } catch (e) {
      return 'Location mapped (address unavailable)';
    }
  };

  const getLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = await reverseGeocode(latitude, longitude);
        setLocation({ lat: latitude, lng: longitude, address });
        setIsLocating(false);
      },
      (error) => {
        let msg = 'Could not get location. Using default map center.';
        if (error.code === 1) msg = 'Location permission denied.';
        else if (error.code === 2) msg = 'Location unavailable.';
        else if (error.code === 3) msg = 'Location request timed out.';
        addToast('Location Error', msg, 'error');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setLocation(prev => ({ ...prev, lat, lng, address: 'Fetching address...' }));
    const address = await reverseGeocode(lat, lng);
    setLocation({ lat, lng, address });
  }, []);

  // --- Voice Handlers ---
  const toggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Error', 'Voice recognition is not supported in this browser.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
         setDescription(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // --- Submit ---
  const handleSubmit = () => {
    if (!title || !description || !location.address) {
      addToast('Missing Info', 'Please ensure title, description, and location are filled.', 'error');
      return;
    }
    addIssue({
      title,
      description,
      category,
      severity,
      department,
      location,
      imageUrl: mediaData || '', 
      aiConfidence,
      aiDescription
    });
    // Nav handled in AppContext (addIssue auto-redirects or shows toast, let's redirect manually)
    setActiveTab('dashboard');
  };

  // --- Render Helpers ---
  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Report an Issue</h1>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {['Media', 'Analysis', 'Details', 'Review'].map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isPast = step > num;
            return (
              <div key={label} className="flex flex-col items-center gap-2 bg-slate-900 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                  isActive ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 
                  isPast ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  {isPast ? <CheckCircle2 size={20} /> : num}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-indigo-300' : isPast ? 'text-slate-300' : 'text-slate-500'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl min-h-[500px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: MEDIA UPLOAD */}
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Camera className="text-indigo-400" /> Capture the Issue
              </h2>
              
              {!isCameraOpen ? (
                <div 
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${mediaData ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {mediaData ? (
                     <div className="relative inline-block">
                        {mimeType.startsWith('video/') ? (
                           <video src={mediaData} className="max-h-64 rounded-xl" controls />
                        ) : (
                           <img src={mediaData} alt="Preview" className="max-h-64 rounded-xl object-contain" />
                        )}
                        <button onClick={() => { setMediaData(null); setMimeType(''); }} className="absolute -top-3 -right-3 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-400">
                          <X size={16} />
                        </button>
                     </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Drag & drop your photo or video</h3>
                      <p className="text-sm text-slate-400 mb-6">Supports JPEG, PNG, MP4, WebM up to 50MB</p>
                      
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <label className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2">
                          <Upload size={18} /> Browse Files
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                        </label>
                        <button onClick={openCamera} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                          <Camera size={18} /> Take Photo
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-h-[60vh] object-cover" />
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                    <button onClick={closeCamera} className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-white">
                      <X size={24} />
                    </button>
                    <button onClick={capturePhoto} className="w-14 h-14 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center text-slate-900">
                      <div className="w-10 h-10 bg-white rounded-full border border-slate-200"></div>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: AI ANALYSIS */}
          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="text-purple-400" /> AI Analysis
              </h2>
              
              {isAnalyzing ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-purple-500 border-r-purple-500 rounded-full animate-spin"></div>
                    <Zap className="absolute inset-0 m-auto text-purple-400 w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Image...</h3>
                  <p className="text-slate-400">Gemini is identifying the issue category and severity.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <img src={mediaData || ''} alt="Issue" className="w-full h-48 object-cover rounded-lg mb-4" />
                    <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 p-2 rounded-lg border border-emerald-400/20">
                      <CheckCircle2 size={16} /> Analysis Complete ({(aiConfidence * 100).toFixed(0)}% confidence)
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Suggested Category</label>
                      <select 
                        value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Assessed Severity</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['Low', 'Medium', 'High', 'Critical'].map(sev => (
                          <button
                            key={sev}
                            onClick={() => setSeverity(sev as any)}
                            className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                              severity === sev 
                                ? sev === 'Critical' ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                                  : sev === 'High' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                  : sev === 'Medium' ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                  : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                            }`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                       <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Suggested Title</label>
                       <input 
                         type="text" value={title} onChange={e => setTitle(e.target.value)}
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                       />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: DETAILS */}
          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="text-blue-400" /> Location & Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Issue Location</label>
                    <div className="flex gap-2 mb-2">
                      <input 
                         type="text" value={location.address} onChange={e => setLocation({...location, address: e.target.value})}
                         placeholder="Enter address manually or use GPS..."
                         className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                      />
                      <button 
                        onClick={getLocation} disabled={isLocating}
                        className="px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                        title="Use my current location"
                      >
                        {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                      </button>
                    </div>
                    <div className="h-[250px] rounded-xl overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/5">
                      <LeafletMap 
                        issues={[]} 
                        height="100%" zoom={15} centerLat={location.lat} centerLng={location.lng}
                        pickMode={true}
                        onMapClick={handleMapClick}
                        pickedLat={location.lat}
                        pickedLng={location.lng}
                      />
                    </div>
                    {location.lat !== 24.2742 && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 bg-emerald-400/10 p-2 rounded-lg border border-emerald-400/20">
                        <CheckCircle2 size={14} />
                        <span>📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                     <div className="flex items-center justify-between mb-1.5">
                       <label className="block text-sm font-medium text-slate-300">Detailed Description</label>
                       <button
                         onClick={toggleVoice}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                           isListening ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                         }`}
                         title={isListening ? "Stop listening" : "Start voice dictation"}
                       >
                         {isListening ? <><MicOff size={14} /> Listening... speak now</> : <><Mic size={14} /> Dictate</>}
                       </button>
                     </div>
                     <textarea 
                       value={description} onChange={e => setDescription(e.target.value)}
                       rows={6}
                       className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                       placeholder="Describe the issue in detail..."
                     ></textarea>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3">
                    <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-200">Please do not include personal identifying information of individuals not related to the issue in your photo or description.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" /> Review & Submit
              </h2>
              
              {duplicateIssue && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-4 items-start shadow-inner">
                  <AlertCircle className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-amber-400 font-bold mb-1">Similar Issue Found Nearby</h3>
                    <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                      AI detected a '{duplicateIssue.category}' issue ("{duplicateIssue.title}") reported just a few meters away. Is this the same problem?
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => navigateToIssue(duplicateIssue.id)}
                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium rounded-lg text-sm transition-colors border border-amber-500/30"
                      >
                        Yes, view & upvote existing
                      </button>
                      <button 
                        onClick={() => setDuplicateIssue(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-colors"
                      >
                        No, submit as new
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="h-48 w-full relative">
                  <img src={mediaData || ''} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex gap-2 mb-2">
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">{category}</span>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded border ${
                        severity === 'Critical' ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                        : severity === 'High' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : severity === 'Medium' ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      }`}>{severity}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                  </div>
                </div>
                
                <div className="p-6 grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</h4>
                    <p className="text-slate-300 text-sm">{location.address}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">AI Confidence</h4>
                    <p className="text-indigo-300 text-sm font-medium">{(aiConfidence * 100).toFixed(0)}% (Auto-analyzed)</p>
                  </div>
                  <div className="sm:col-span-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-0 flex items-center gap-2"
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !mediaData) || (step === 2 && isAnalyzing)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              Submit Report <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

