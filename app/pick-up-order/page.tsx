"use client";
import { useState, useRef } from "react";

function PickUpOrderForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    orderNumber: "",
    creditCard: "",
    validId: "",
    paymentMethod: "",
    carParkBay: "",
    confirmed: false,
  });

  const [scans, setScans] = useState({
    idScan: null as File | null,
    creditCardScan: null as File | null,
  });

  const [previews, setPreviews] = useState({
    idScan: "",
    creditCardScan: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState<"id" | "card" | null>(null);

  const idFileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileSelect = (type: "id" | "card") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        [type === "id" ? "idScan" : "creditCardScan"]: "Please upload an image file"
      }));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [type === "id" ? "idScan" : "creditCardScan"]: "File size must be less than 5MB"
      }));
      return;
    }

    const scanKey = type === "id" ? "idScan" : "creditCardScan";
    setScans((prev) => ({ ...prev, [scanKey]: file }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews((prev) => ({ ...prev, [scanKey]: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Clear error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[scanKey];
      return newErrors;
    });
  };

  const startCamera = async (type: "id" | "card") => {
    setShowCamera(type);
    
    // Wait for next tick to ensure video element is rendered
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please check permissions or upload a photo instead.");
        setShowCamera(null);
      }
    }, 100);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !showCamera) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `${showCamera}_scan.jpg`, { type: "image/jpeg" });
      const scanKey = showCamera === "id" ? "idScan" : "creditCardScan";
      
      setScans((prev) => ({ ...prev, [scanKey]: file }));
      setPreviews((prev) => ({ ...prev, [scanKey]: canvas.toDataURL() }));

      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.orderNumber.trim()) newErrors.orderNumber = "Order number is required";
    if (!formData.creditCard.trim()) newErrors.creditCard = "Last 4 digits are required";
    if (!formData.validId) newErrors.validId = "Please select a valid ID";
    if (!formData.paymentMethod) newErrors.paymentMethod = "Please select a payment method";
    if (!formData.carParkBay.trim()) newErrors.carParkBay = "Car park bay is required";
    if (!formData.confirmed) newErrors.confirmed = "You must confirm the data";
    if (!scans.idScan) newErrors.idScan = "ID scan is required";
    if (!scans.creditCardScan) newErrors.creditCardScan = "Credit card scan is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("orderNumber", formData.orderNumber);
      formDataToSend.append("creditCard", formData.creditCard);
      formDataToSend.append("validId", formData.validId);
      formDataToSend.append("paymentMethod", formData.paymentMethod);
      formDataToSend.append("carParkBay", formData.carParkBay);
      formDataToSend.append("confirmed", formData.confirmed.toString());
      
      if (scans.idScan) formDataToSend.append("idScan", scans.idScan);
      if (scans.creditCardScan) formDataToSend.append("creditCardScan", scans.creditCardScan);

      const response = await fetch("/api/pickup-order", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          alert(result.error || "Submission failed");
        }
        setIsSubmitting(false);
        return;
      }

      alert(`Order submitted successfully! Order ID: ${result.orderId}`);

      // Reset form
      setFormData({
        fullName: "",
        phone: "",
        orderNumber: "",
        creditCard: "",
        validId: "",
        paymentMethod: "",
        carParkBay: "",
        confirmed: false,
      });
      setScans({ idScan: null, creditCardScan: null });
      setPreviews({ idScan: "", creditCardScan: "" });
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-6 md:px-10 py-6 md:py-8 border-2 rounded-2xl text-2xl md:text-3xl text-black placeholder-gray-400 focus:outline-none focus:ring-4 transition-all";

  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-6 md:p-16">
      <div className="bg-white w-full max-w-4xl lg:max-w-6xl pt-10 md:pt-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 md:mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-black">PICK UP ORDER</h1>
          <a href="/" className="p-3 md:p-4 bg-gray-100 rounded-xl md:rounded-2xl hover:bg-gray-200 transition-colors">
            <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="black" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </a>
        </div>

        <h2 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 text-black">Fill in the form</h2>

        {/* Form Fields */}
        <div className="mb-6 md:mb-8">
          <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange}
            className={`${inputClass} ${errors.fullName ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`} />
          {errors.fullName && <p className="text-red-600 text-xl mt-2 ml-2">{errors.fullName}</p>}
        </div>

        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <button type="button" className="px-6 md:px-8 py-6 md:py-8 border-2 border-gray-300 rounded-2xl flex items-center gap-4 hover:bg-gray-50 w-full sm:w-auto">
              <span className="text-3xl md:text-5xl text-black">🇦🇺</span>
              <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400" fill="none" stroke="black" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange}
              className={`${inputClass} flex-1 ${errors.phone ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`} />
          </div>
          {errors.phone && <p className="text-red-600 text-xl mt-2 ml-2">{errors.phone}</p>}
        </div>

        <div className="mb-6 md:mb-8">
          <input type="text" name="orderNumber" placeholder="Order Number" value={formData.orderNumber} onChange={handleChange}
            className={`${inputClass} ${errors.orderNumber ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`} />
          {errors.orderNumber && <p className="text-red-600 text-xl mt-2 ml-2">{errors.orderNumber}</p>}
        </div>

        <div className="mb-6 md:mb-8">
          <input type="text" name="creditCard" placeholder="Last 4 Digits of Credit Card" maxLength={4} value={formData.creditCard} onChange={handleChange}
            className={`${inputClass} ${errors.creditCard ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`} />
          {errors.creditCard && <p className="text-red-600 text-xl mt-2 ml-2">{errors.creditCard}</p>}
        </div>

        <div className="mb-6 md:mb-8">
          <div className="relative">
            <select name="validId" value={formData.validId} onChange={handleChange}
              className={`${inputClass} appearance-none ${errors.validId ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}>
              <option value="">Select Valid ID</option>
              <option value="drivers-license">Driver's License</option>
              <option value="passport">Passport</option>
              <option value="national-id">National ID</option>
            </select>
            <svg className="absolute right-8 md:right-10 top-1/2 -translate-y-1/2 w-6 md:w-8 h-6 md:h-8 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {errors.validId && <p className="text-red-600 text-xl mt-2 ml-2">{errors.validId}</p>}
        </div>

        <div className="mb-6 md:mb-8">
          <div className="relative">
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}
              className={`${inputClass} appearance-none ${errors.paymentMethod ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}>
              <option value="">Payment Method</option>
              <option value="credit-card">Credit Card</option>
              <option value="debit-card">Debit Card</option>
              <option value="cash">Cash</option>
            </select>
            <svg className="absolute right-8 md:right-10 top-1/2 -translate-y-1/2 w-6 md:w-8 h-6 md:h-8 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {errors.paymentMethod && <p className="text-red-600 text-xl mt-2 ml-2">{errors.paymentMethod}</p>}
        </div>

        <div className="mb-10 md:mb-16">
          <input type="text" name="carParkBay" placeholder="Car Park Bay Number" value={formData.carParkBay} onChange={handleChange}
            className={`${inputClass} ${errors.carParkBay ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`} />
          {errors.carParkBay && <p className="text-red-600 text-xl mt-2 ml-2">{errors.carParkBay}</p>}
        </div>

        {/* ID Scan Section */}
        <div className="mb-10 md:mb-12">
          <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-black">Scan Valid ID</h3>
          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={() => startCamera("id")} className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition">
              📷 Take Photo
            </button>
            <button type="button" onClick={() => idFileInputRef.current?.click()} className="px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition">
              📁 Upload Photo
            </button>
            <input ref={idFileInputRef} type="file" accept="image/*" onChange={handleFileSelect("id")} className="hidden" />
          </div>
          {previews.idScan && (
            <div className="mt-4">
              <img src={previews.idScan} alt="ID Preview" className="max-w-md rounded-xl border-2 border-gray-300" />
            </div>
          )}
          {errors.idScan && <p className="text-red-600 text-xl mt-2">{errors.idScan}</p>}
        </div>

        {/* Credit Card Scan Section */}
        <div className="mb-10 md:mb-12">
          <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-black">Scan Credit Card</h3>
          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={() => startCamera("card")} className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition">
              📷 Take Photo
            </button>
            <button type="button" onClick={() => cardFileInputRef.current?.click()} className="px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition">
              📁 Upload Photo
            </button>
            <input ref={cardFileInputRef} type="file" accept="image/*" onChange={handleFileSelect("card")} className="hidden" />
          </div>
          {previews.creditCardScan && (
            <div className="mt-4">
              <img src={previews.creditCardScan} alt="Card Preview" className="max-w-md rounded-xl border-2 border-gray-300" />
            </div>
          )}
          {errors.creditCardScan && <p className="text-red-600 text-xl mt-2">{errors.creditCardScan}</p>}
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">
                  {showCamera === "id" ? "Scan ID" : "Scan Credit Card"}
                </h3>
                <button onClick={stopCamera} className="text-3xl hover:text-red-600">✕</button>
              </div>
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl mb-4" />
              <canvas ref={canvasRef} className="hidden" />
              <button onClick={capturePhoto} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-2xl py-4 rounded-xl transition">
                📸 Capture Photo
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Checkbox */}
        <div className="mb-10 md:mb-12">
          <label className="flex items-start gap-4 md:gap-6 cursor-pointer">
            <div className={`w-8 h-8 md:w-10 md:h-10 mt-1 border-2 rounded-lg flex items-center justify-center relative ${errors.confirmed ? 'border-red-500' : 'border-gray-300'}`}>
              <input type="checkbox" name="confirmed" checked={formData.confirmed} onChange={handleChange} className="opacity-0 absolute inset-0" />
              {formData.confirmed && (
                <svg className="w-5 h-5 md:w-7 md:h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-2xl md:text-3xl leading-relaxed text-black">
              I confirm that all provided data is accurate and valid.
            </span>
          </label>
          {errors.confirmed && <p className="text-red-600 text-xl mt-2 ml-14">{errors.confirmed}</p>}
        </div>

        {/* Submit Button */}
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold text-3xl md:text-4xl py-8 md:py-10 rounded-2xl transition-colors shadow-lg active:scale-95">
          {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
        </button>
      </div>
    </div>
  );
}

export default PickUpOrderForm;