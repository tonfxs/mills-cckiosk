"use client";
import { useState, useRef } from 'react';
import { ChevronRight, Package, CreditCard, FileText, Car, Camera } from 'lucide-react';
import NumberPad from "@/app/components/KioskNumberPad";


interface FormData {
  fullName: string;
  phone: string;
  orderNumber: string;
  creditCard: string;
  validId: string;
  paymentMethod: string;
  carParkBay: string;
  confirmed: boolean;
}

interface Scans {
  idScan: File | null;
  creditCardScan: File | null;
}

interface Previews {
  idScan: string;
  creditCardScan: string;
}

interface Errors {
  [key: string]: string;
}

export default function PickupKiosk() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    orderNumber: "",
    creditCard: "",
    validId: "",
    paymentMethod: "",
    carParkBay: "",
    confirmed: false,
  });

  const [scans, setScans] = useState<Scans>({
    idScan: null,
    creditCardScan: null,
  });

  const [previews, setPreviews] = useState<Previews>({
    idScan: "",
    creditCardScan: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState<"id" | "card" | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const fieldName = name as keyof FormData;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: type === "checkbox" ? checked : value,
    }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const startCamera = async (type: "id" | "card") => {
    setShowCamera(type);

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
        alert("Could not access camera. Please check permissions.");
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

  const canProceed = () => {
    switch (step) {
      case 1: return formData.orderNumber && formData.creditCard;
      case 2: return formData.fullName && formData.phone;
      case 3: return formData.validId && formData.paymentMethod && scans.idScan && scans.creditCardScan;
      case 4: return formData.confirmed && formData.carParkBay;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    const newErrors: Errors = {};
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
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        const fieldKey = key as keyof FormData;
        formDataToSend.append(key, formData[fieldKey].toString());
      });

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

      // Show success screen
      setShowSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = "/choose-service";
      }, 3000);

    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Success Screen */}
      {showSuccess && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center px-8 max-w-2xl">
            <div className="mb-8 animate-bounce">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-6xl font-bold text-gray-800 mb-4">Success!</h1>
            <p className="text-3xl text-gray-600 mb-8">Your order pickup request has been submitted</p>
            <div className="bg-blue-50 rounded-3xl p-8 border-4 border-blue-200">
              <p className="text-2xl text-gray-700 mb-2">Order Number</p>
              <p className="text-5xl font-bold text-blue-600">{formData.orderNumber}</p>
            </div>
            <p className="text-2xl text-gray-500 mt-8">Redirecting to main menu...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 text-white p-8 shadow-lg px-10 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-7xl font-bold mb-2">Pick Up Your Order</h1>
          <p className="text-4xl text-blue-100">Fast & Easy Self-Service</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {[
            { num: 1, label: 'Verify Order', icon: Package },
            { num: 2, label: 'Contact Info', icon: CreditCard },
            { num: 3, label: 'Scan Documents', icon: FileText },
            { num: 4, label: 'Confirm', icon: Car }
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex flex-col items-center flex-1">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 transition-all ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {step > num ? '✓' : <Icon size={32} />}
              </div>
              <span className={`text-sm font-medium ${step >= num ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">

          {/* Step 1: Verify Order */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-5xl font-bold mb-8 text-gray-800">Enter Your Order Details</h2>

                <div className="space-y-10">
                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">Order Number</label>
                    <input
                      type="text"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleChange}
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                      placeholder="e.g., ORD-12345"
                    />
                    {errors.orderNumber && <p className="text-red-600 text-xl mt-2">{errors.orderNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-2xl font-semibold mb-4 text-gray-700">Last 4 Digits of Credit Card</label>
                    <NumberPad
                      value={formData.creditCard}
                      onChange={(value: string) =>
                        setFormData(prev => ({ ...prev, creditCard: value }))
                      }
                      maxLength={4}
                    />

                    {errors.creditCard && <p className="text-red-600 text-xl mt-2">{errors.creditCard}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-4xl font-bold mb-8 text-gray-800">Your Contact Information</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-2xl font-semibold mb-4 text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                      placeholder="John Smith"
                    />
                    {errors.fullName && <p className="text-red-600 text-xl mt-2">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-2xl font-semibold mb-4 text-gray-700">Phone Number</label>
                    <div className="flex gap-4">
                      <div className="text-3xl p-6 border-4 border-gray-300 rounded-2xl bg-gray-50 text-gray-400">
                        AU
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="flex-1 text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                        placeholder="412 345 678"
                      />
                    </div>
                    {errors.phone && <p className="text-red-600 text-xl mt-2">{errors.phone}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Scan Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-4xl font-bold mb-8 text-gray-800">Identification & Payment</h2>

                <div className="space-y-8">
                  <div>
                    <label className="block text-2xl font-semibold mb-4 text-gray-700">Select Valid ID</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'drivers-license', label: "Driver's License" },
                        { value: 'passport', label: 'Passport' },
                        { value: 'medicare-card', label: 'Medicare Card' },
                        { value: 'immicard', label: 'ImmiCard' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, validId: value }))}
                          className={`text-2xl p-8 rounded-2xl border-4 font-semibold transition-all ${formData.validId === value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {errors.validId && <p className="text-red-600 text-xl mt-2">{errors.validId}</p>}
                  </div>

                  <div>
                    <label className="block text-2xl font-semibold mb-4 text-gray-700">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'credit-card', label: 'Credit Card' },
                        { value: 'debit-card', label: 'Debit Card' },
                        { value: 'cash', label: 'Cash' },
                        { value: 'others', label: 'Others' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                          className={`text-2xl p-8 rounded-2xl border-4 font-semibold transition-all ${formData.paymentMethod === value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {errors.paymentMethod && <p className="text-red-600 text-xl mt-2">{errors.paymentMethod}</p>}
                  </div>

                  {/* ID Scan */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-700">Scan Valid ID</h3>
                    <button
                      type="button"
                      onClick={() => startCamera("id")}
                      className="flex items-center gap-4 px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-2xl transition shadow-lg"
                    >
                      <Camera size={32} />
                      Take Photo of ID
                    </button>
                    {previews.idScan && (
                      <div className="mt-4">
                        <img src={previews.idScan} alt="ID Preview" className="max-w-md rounded-2xl border-4 border-green-500 shadow-lg" />
                        <p className="text-green-600 text-xl font-semibold mt-2">✓ ID Captured</p>
                      </div>
                    )}
                    {errors.idScan && <p className="text-red-600 text-xl mt-2">{errors.idScan}</p>}
                  </div>

                  {/* Credit Card Scan */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-700">Scan Credit Card</h3>
                    <button
                      type="button"
                      onClick={() => startCamera("card")}
                      className="flex items-center gap-4 px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-2xl transition shadow-lg"
                    >
                      <Camera size={32} />
                      Take Photo of Card
                    </button>
                    {previews.creditCardScan && (
                      <div className="mt-4">
                        <img src={previews.creditCardScan} alt="Card Preview" className="max-w-md rounded-2xl border-4 border-green-500 shadow-lg" />
                        <p className="text-green-600 text-xl font-semibold mt-2">✓ Card Captured</p>
                      </div>
                    )}
                    {errors.creditCardScan && <p className="text-red-600 text-xl mt-2">{errors.creditCardScan}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-4xl font-bold mb-8 text-gray-800">Review & Confirm</h2>

                <div className="space-y-4 mb-8 bg-gray-50 p-8 rounded-2xl">
                  <div className="flex justify-between text-2xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Order Number:</span>
                    <span className="font-bold text-black">{formData.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-2xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Name:</span>
                    <span className="font-bold text-black">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between text-2xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Phone:</span>
                    <span className="font-bold text-black">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between text-2xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">ID Type:</span>
                    <span className="font-bold capitalize text-black">{formData.validId.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-2xl">
                    <span className="font-semibold text-gray-600">Payment:</span>
                    <span className="font-bold capitalize text-black">{formData.paymentMethod.replace('-', ' ')}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-2xl font-semibold mb-4 text-gray-700">Car Park Bay Number</label>
                  <input
                    type="number"
                    name="carParkBay"
                    value={formData.carParkBay}
                    onChange={handleChange}
                    className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                    placeholder="e.g., Bay 15"
                  />
                  {errors.carParkBay && <p className="text-red-600 text-xl mt-2">{errors.carParkBay}</p>}
                </div>

                <label className="flex items-start gap-6 p-6 bg-blue-50 border-4 border-blue-300 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    name="confirmed"
                    checked={formData.confirmed}
                    onChange={handleChange}
                    className="w-12 h-12 mt-1"
                  />
                  <span className="text-3xl font-semibold text-gray-800">
                    I confirm that all provided information is accurate and valid
                  </span>
                </label>
                {errors.confirmed && <p className="text-red-600 text-xl mt-2">{errors.confirmed}</p>}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-gray-800">
                {showCamera === "id" ? "Scan Your ID" : "Scan Your Credit Card"}
              </h3>
              <button onClick={stopCamera} className="text-4xl hover:text-red-600 text-gray-800 font-bold">
                ✕
              </button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl mb-6 bg-black" />
            <canvas ref={canvasRef} className="hidden" />
            <button
              onClick={capturePhoto}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-3xl py-6 rounded-2xl transition shadow-lg flex items-center justify-center gap-4"
            >
              <Camera size={40} />
              Capture Photo
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bg-white border-t-4 border-gray-200 p-8 shadow-lg px-10 py-20">
        <div className="max-w-4xl mx-auto flex gap-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 text-4xl font-bold py-8 px-10 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all"
            >
              ← Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`flex-1 text-4xl font-bold py-8 px-10 rounded-2xl transition-all flex items-center justify-center gap-4 ${canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              Continue
              <ChevronRight size={36} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className={`flex-1 text-4xl font-bold py-8 px-10 rounded-2xl transition-all ${canProceed() && !isSubmitting
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT ORDER"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}