import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Apple, BarChart2, Camera, Clock, X, Upload, Loader2 } from 'lucide-react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 sm:p-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-red-100 text-center max-w-md w-full">
          <Apple className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Something Went Wrong</h3>
          <p className="text-sm sm:text-base text-gray-600">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  return children;
};

const Nutrition = ({ userId, isAuthenticated }) => {
  const [foodItem, setFoodItem] = useState('');
  const [calories, setCalories] = useState('');
  const [nutrients, setNutrients] = useState({ protein: '', carbs: '', fat: '' });
  const [foodLogs, setFoodLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visibleLogs, setVisibleLogs] = useState(10);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [manualInput, setManualInput] = useState({ food: '', quantity: '', unit: 'grams' });
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const units = ['grams', 'kilograms', 'tablespoons', 'teaspoons', 'cups'];

  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'nutrition'),
      (snapshot) => {
        const logs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setFoodLogs(logs);
      },
      (err) => {
        console.error('Nutrition Logs Snapshot Error:', err);
        setError('Failed to load food history: ' + err.message);
      }
    );

    return () => unsubscribe();
  }, [userId, isAuthenticated]);

  useEffect(() => {
    if (showScanner && videoRef.current && !cameraStream) {
      startCamera();
    }
    return () => {
      if (showScanner) stopCamera();
    };
  }, [showScanner]);

  const isImageCaptureSupported = () => 'ImageCapture' in window;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const getVideoConstraints = useCallback(() => {
    if (isMobile) {
      return {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'
        }
      };
    }
    return {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    };
  }, [isMobile]);

  const startCamera = useCallback(async () => {
    try {
      setScannerLoading(true);
      setError('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported in this browser');
      }

      if (!videoRef.current) {
        throw new Error('Video element not available.');
      }

      const constraints = getVideoConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video metadata load timeout')), 10000);
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };
        video.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Video element error: ' + e.message));
        };
      });

      await video.play();

      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 40;
        const interval = setInterval(() => {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error('Video render timeout'));
            return;
          }
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            clearInterval(interval);
            resolve();
          }
          attempts++;
        }, 100);
      });

      setCameraReady(true);
    } catch (err) {
      console.error('Camera Error:', err);
      let errorMsg = 'Failed to access camera: ' + err.message;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow access in browser settings and reload.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found. Use file upload or manual input instead.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera in use by another app. Close it and try again.';
      } else if (err.message.includes('timeout')) {
        errorMsg = 'Camera initialization timed out. Retry or check device.';
      }
      setError(errorMsg);
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setCameraReady(false);
    } finally {
      setScannerLoading(false);
    }
  }, [getVideoConstraints, cameraStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setCameraReady(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraStream]);

  const closeScanner = useCallback(() => {
    setShowScanner(false);
    stopCamera();
    setScannerLoading(false);
    setError('');
  }, [stopCamera]);

  const closeManualModal = useCallback(() => {
    setShowManualModal(false);
    setManualInput({ food: '', quantity: '', unit: 'grams' });
    setScannerLoading(false);
    setError('');
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraStream || !cameraReady || !videoRef.current || videoRef.current.videoWidth === 0) {
      setError('Camera not ready. Wait or retry.');
      return;
    }

    setScannerLoading(true);
    setError('');

    try {
      const video = videoRef.current;
      let photoBlob;

      try {
        const videoTrack = cameraStream.getVideoTracks()[0];
        if (videoTrack && isImageCaptureSupported()) {
          const imageCapture = new ImageCapture(videoTrack);
          const bitmap = await imageCapture.grabFrame();
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bitmap, 0, 0);
          photoBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        } else {
          throw new Error('ImageCapture not supported');
        }
      } catch (imageCaptureError) {
        console.warn('ImageCapture failed, using canvas:', imageCaptureError);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        photoBlob = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Blob creation failed')), 'image/jpeg', 0.8);
        });
      }

      if (!photoBlob || photoBlob.size === 0) {
        throw new Error('Failed to capture image - empty blob');
      }

      const base64Data = await blobToBase64(photoBlob);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a nutrition expert. Analyze this food image and identify the food item with nutritional information. Respond ONLY with a valid JSON object in this format:
{
  "foodItem": "specific food name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}`,
                  },
                  {
                    inline_data: {
                      mime_type: photoBlob.type,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 150,
              topP: 0.8,
              topK: 10,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysisText) {
        throw new Error('No analysis from API');
      }

      let cleanText = analysisText.trim().replace(/```(json)?/g, '').replace(/`/g, '');
      try {
        const parsed = JSON.parse(cleanText);
        if (typeof parsed === 'object' && parsed.foodItem) {
          var foodData = parsed;
        } else {
          throw new Error('Invalid structure');
        }
      } catch {
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}') + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleanText = cleanText.substring(jsonStart, jsonEnd);
          foodData = JSON.parse(cleanText);
        } else {
          throw new Error('No valid JSON in response');
        }
      }

      const sanitizedData = {
        foodItem: typeof foodData.foodItem === 'string' ? foodData.foodItem.trim() : 'Unknown Food',
        calories: Math.max(Number(foodData.calories) || 0, 1),
        protein: Number(foodData.protein) || 0,
        carbs: Number(foodData.carbs) || 0,
        fat: Number(foodData.fat) || 0,
      };

      if (sanitizedData.foodItem === 'Unknown Food') {
        throw new Error('Could not identify food');
      }

      await addDoc(collection(db, 'users', userId, 'nutrition'), {
        foodItem: sanitizedData.foodItem,
        calories: sanitizedData.calories,
        nutrients: {
          protein: sanitizedData.protein,
          carbs: sanitizedData.carbs,
          fat: sanitizedData.fat,
        },
        timestamp: new Date().toISOString(),
      });

      closeScanner();
    } catch (err) {
      console.error('Capture/Analysis Error:', err);
      let errorMsg = 'Failed to capture/analyze: ' + err.message;
      if (err.message.includes('API failed')) errorMsg = 'API request failed. Check key or network.';
      else if (err.message.includes('JSON') || err.message.includes('structure')) errorMsg = 'Failed to parse analysis. Try clearer image.';
      else if (err.message.includes('identify')) errorMsg = 'Could not identify food. Try clearer image or manual.';
      else if (err.message.includes('empty')) errorMsg = 'Capture failed - no image data.';
      setError(errorMsg);
    } finally {
      setScannerLoading(false);
    }
  }, [apiKey, cameraStream, cameraReady, closeScanner, userId]);

  const analyzeImage = useCallback(async (file) => {
    if (!apiKey) {
      setError('API config error. Contact support.');
      return;
    }

    setScannerLoading(true);
    setError('');

    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a nutrition expert. Analyze this food image and identify the food item with nutritional information. Respond ONLY with a valid JSON object in this format:
{
  "foodItem": "specific food name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}`,
                  },
                  {
                    inline_data: {
                      mime_type: file.type,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 150,
              topP: 0.8,
              topK: 10,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysisText) {
        throw new Error('No analysis from API');
      }

      let cleanText = analysisText.trim().replace(/```(json)?/g, '').replace(/`/g, '');
      try {
        const parsed = JSON.parse(cleanText);
        if (typeof parsed === 'object' && parsed.foodItem) {
          var foodData = parsed;
        } else {
          throw new Error('Invalid structure');
        }
      } catch {
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}') + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleanText = cleanText.substring(jsonStart, jsonEnd);
          foodData = JSON.parse(cleanText);
        } else {
          throw new Error('No valid JSON in response');
        }
      }

      const sanitizedData = {
        foodItem: typeof foodData.foodItem === 'string' ? foodData.foodItem.trim() : 'Unknown Food',
        calories: Math.max(Number(foodData.calories) || 0, 1),
        protein: Number(foodData.protein) || 0,
        carbs: Number(foodData.carbs) || 0,
        fat: Number(data.fat) || 0,
      };

      if (sanitizedData.foodItem === 'Unknown Food') {
        throw new Error('Could not identify food');
      }

      await addDoc(collection(db, 'users', userId, 'nutrition'), {
        foodItem: sanitizedData.foodItem,
        calories: sanitizedData.calories,
        nutrients: {
          protein: sanitizedData.protein,
          carbs: sanitizedData.carbs,
          fat: sanitizedData.fat,
        },
        timestamp: new Date().toISOString(),
      });

      closeScanner();
    } catch (err) {
      console.error('Analysis Error:', err);
      let errorMsg = 'Failed to analyze: ' + err.message;
      if (err.message.includes('API failed')) errorMsg = 'API request failed. Check key.';
      else if (err.message.includes('JSON') || err.message.includes('structure')) errorMsg = 'Parse failed. Try clearer image.';
      else if (err.message.includes('identify')) errorMsg = 'Could not identify. Try manual.';
      setError(errorMsg);
    } finally {
      setScannerLoading(false);
    }
  }, [apiKey, closeScanner, userId]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Select an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large (<10MB).');
      return;
    }

    analyzeImage(file);
  }, [analyzeImage]);

  const analyzeManualInput = useCallback(async () => {
    if (!apiKey) {
      setError('API config error. Contact support.');
      return;
    }
    const { food, quantity, unit } = manualInput;
    if (!food.trim() || !quantity || Number(quantity) <= 0) {
      setError('Enter valid food and positive quantity.');
      return;
    }
    if (!isAuthenticated) {
      setError('Auth required.');
      return;
    }

    setScannerLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a nutrition expert. Analyze the following food item and quantity to provide nutritional information. Food: ${food.trim()}, Quantity: ${quantity} ${unit}. Respond ONLY with a valid JSON object in this format:
{
  "foodItem": "specific food name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 150,
              topP: 0.8,
              topK: 10,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysisText) {
        throw new Error('No analysis from API');
      }

      let cleanText = analysisText.trim().replace(/```(json)?/g, '').replace(/`/g, '');
      try {
        const parsed = JSON.parse(cleanText);
        if (typeof parsed === 'object' && parsed.foodItem) {
          var foodData = parsed;
        } else {
          throw new Error('Invalid structure');
        }
      } catch {
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}') + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleanText = cleanText.substring(jsonStart, jsonEnd);
          foodData = JSON.parse(cleanText);
        } else {
          throw new Error('No valid JSON in response');
        }
      }

      const sanitizedData = {
        foodItem: typeof foodData.foodItem === 'string' ? foodData.foodItem.trim() : 'Unknown Food',
        calories: Math.max(Number(foodData.calories) || 0, 1),
        protein: Number(foodData.protein) || 0,
        carbs: Number(foodData.carbs) || 0,
        fat: Number(foodData.fat) || 0,
      };

      if (sanitizedData.foodItem === 'Unknown Food') {
        throw new Error('Could not identify food');
      }

      await addDoc(collection(db, 'users', userId, 'nutrition'), {
        foodItem: sanitizedData.foodItem,
        calories: sanitizedData.calories,
        nutrients: {
          protein: sanitizedData.protein,
          carbs: sanitizedData.carbs,
          fat: sanitizedData.fat,
        },
        timestamp: new Date().toISOString(),
      });

      closeManualModal();
    } catch (err) {
      console.error('Manual Analysis Error:', err);
      let errorMsg = 'Failed to analyze: ' + err.message;
      if (err.message.includes('API failed')) errorMsg = 'API request failed. Check key.';
      else if (err.message.includes('JSON') || err.message.includes('structure')) errorMsg = 'Parse failed. Enter valid details.';
      else if (err.message.includes('identify')) errorMsg = 'Could not identify. Use specific name.';
      setError(errorMsg);
    } finally {
      setScannerLoading(false);
    }
  }, [apiKey, manualInput, closeManualModal, userId, isAuthenticated]);

  const logFood = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Auth required.');
      return;
    }
    if (!foodItem.trim() || !calories || Number(calories) <= 0) {
      setError('Enter valid food and positive calories.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'users', userId, 'nutrition'), {
        foodItem: foodItem.trim(),
        calories: Number(calories),
        nutrients: {
          protein: Number(nutrients.protein) || 0,
          carbs: Number(nutrients.carbs) || 0,
          fat: Number(nutrients.fat) || 0,
        },
        timestamp: new Date().toISOString(),
      });

      setFoodItem('');
      setCalories('');
      setNutrients({ protein: '', carbs: '', fat: '' });
    } catch (err) {
      console.error('Food Log Error:', err);
      setError('Failed to log: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [foodItem, calories, nutrients, userId, isAuthenticated]);

  const totalCalories = useMemo(() => foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0), [foodLogs]);
  const memoizedLogs = useMemo(() => foodLogs.slice(0, visibleLogs), [foodLogs, visibleLogs]);

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4 sm:p-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-red-100 text-center max-w-md w-full">
          <Apple className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Authentication Required</h3>
          <p className="text-sm sm:text-base text-gray-600">Please sign in to track your nutrition.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 rounded-2xl shadow-lg border border-indigo-100 bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-500 hover:shadow-xl">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 p-2 rounded-lg shadow-sm">
            <Apple className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 ml-2 sm:ml-3">Nutrition Tracker</h2>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-2 sm:ml-3">
              <p className="text-red-700 font-medium text-sm sm:text-base">Error</p>
              <p className="text-red-600 text-xs sm:text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
              <Apple className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" /> Log Food
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                value={foodItem}
                onChange={(e) => setFoodItem(e.target.value)}
                placeholder="Food item (e.g., Apple)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition-all"
                aria-label="Food item"
              />
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Calories (kcal)"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition-all"
                aria-label="Calories"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <input
                  type="number"
                  value={nutrients.protein}
                  onChange={(e) => setNutrients({ ...nutrients, protein: e.target.value })}
                  placeholder="Protein (g)"
                  min="0"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition-all"
                  aria-label="Protein"
                />
                <input
                  type="number"
                  value={nutrients.carbs}
                  onChange={(e) => setNutrients({ ...nutrients, carbs: e.target.value })}
                  placeholder="Carbs (g)"
                  min="0"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition-all"
                  aria-label="Carbohydrates"
                />
                <input
                  type="number"
                  value={nutrients.fat}
                  onChange={(e) => setNutrients({ ...nutrients, fat: e.target.value })}
                  placeholder="Fat (g)"
                  min="0"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition-all"
                  aria-label="Fat"
                />
              </div>
              <button
                onClick={logFood}
                disabled={loading}
                className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 text-sm sm:text-base transition-all duration-300 disabled:bg-green-400 disabled:cursor-not-allowed"
                aria-label="Log food"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                    Logging...
                  </>
                ) : (
                  'Log Food'
                )}
              </button>
              <button
                onClick={() => setShowScanner(true)}
                disabled={scannerLoading || !apiKey}
                className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 text-sm sm:text-base transition-all duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed"
                aria-label="Scan food"
              >
                {scannerLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Scan Food
                  </>
                )}
              </button>
              <button
                onClick={() => setShowManualModal(true)}
                disabled={scannerLoading}
                className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 text-sm sm:text-base transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                aria-label="Enter food manually"
              >
                Enter Food Manually
              </button>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
              <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" /> Daily Summary
            </h3>
            <div className="space-y-2 text-sm sm:text-base">
              <p className="text-gray-700">
                Total Calories: <span className="font-semibold">{totalCalories} kcal</span>
              </p>
              <p className="text-gray-700">
                Protein: <span className="font-semibold">{foodLogs.reduce((sum, log) => sum + (Number(log.nutrients?.protein) || 0), 0)} g</span>
              </p>
              <p className="text-gray-700">
                Carbs: <span className="font-semibold">{foodLogs.reduce((sum, log) => sum + (Number(log.nutrients?.carbs) || 0), 0)} g</span>
              </p>
              <p className="text-gray-700">
                Fat: <span className="font-semibold">{foodLogs.reduce((sum, log) => sum + (Number(log.nutrients?.fat) || 0), 0)} g</span>
              </p>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" /> Food History
            </h3>
            {memoizedLogs.length === 0 ? (
              <p className="text-gray-600 text-center text-sm sm:text-base">No food logs yet. Start logging above!</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] sm:max-h-[70vh] overflow-auto">
                {memoizedLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-md border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all hover:bg-gray-100"
                  >
                    <div className="flex items-center flex-wrap">
                      <Apple className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{log.foodItem}</span>
                      <span className="ml-2 text-gray-600 text-sm sm:text-base">{log.calories} kcal</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <p className="mt-1">
                        P: {log.nutrients?.protein || 0}g, C: {log.nutrients?.carbs || 0}g, F: {log.nutrients?.fat || 0}g
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {visibleLogs < foodLogs.length && (
              <button
                onClick={() => setVisibleLogs((prev) => prev + 10)}
                className="mt-3 sm:mt-4 w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 text-sm sm:text-base transition-all duration-300"
                aria-label="Load more food logs"
              >
                Load More
              </button>
            )}
          </div>
        </div>

        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-[90vw] sm:max-w-lg max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Food Scanner</h3>
                <button
                  onClick={closeScanner}
                  className="p-1 hover:bg-gray-100 rounded-full transition-all"
                  aria-label="Close scanner"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="relative aspect-[4/3] sm:aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-lg border-2 border-red-500"
                    aria-label="Camera feed"
                  />
                  {scannerLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={captureAndAnalyze}
                    disabled={scannerLoading || !cameraReady}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base transition-all"
                    aria-label="Capture and analyze"
                  >
                    {scannerLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      'Capture & Analyze'
                    )}
                  </button>
                  <label className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer flex items-center justify-center text-sm sm:text-base transition-all">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Upload Image
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      aria-label="Upload food image"
                    />
                  </label>
                </div>
                {!cameraReady && !scannerLoading && (
                  <button
                    onClick={startCamera}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base transition-all"
                    aria-label="Retry camera"
                  >
                    Retry Camera
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showManualModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Enter Food Manually</h3>
                <button
                  onClick={closeManualModal}
                  className="p-1 hover:bg-gray-100 rounded-full transition-all"
                  aria-label="Close manual input modal"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <input
                  type="text"
                  value={manualInput.food}
                  onChange={(e) => setManualInput({ ...manualInput, food: e.target.value })}
                  placeholder="Food item (e.g., Apple)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition-all"
                  aria-label="Manual food item"
                />
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="number"
                    value={manualInput.quantity}
                    onChange={(e) => setManualInput({ ...manualInput, quantity: e.target.value })}
                    placeholder="Quantity"
                    min="0.1"
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition-all"
                    aria-label="Food quantity"
                  />
                  <select
                    value={manualInput.unit}
                    onChange={(e) => setManualInput({ ...manualInput, unit: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition-all"
                    aria-label="Unit of measurement"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={analyzeManualInput}
                    disabled={scannerLoading}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base transition-all"
                    aria-label="Analyze and log manual input"
                  >
                    {scannerLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze & Log Food'
                    )}
                  </button>
                  <button
                    onClick={closeManualModal}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base transition-all"
                    aria-label="Cancel manual input"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Nutrition;