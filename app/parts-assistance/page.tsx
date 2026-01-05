"use client";
import { useState } from 'react';
import { ChevronRight, Package, UserRoundPen, PackageCheck } from 'lucide-react';
import SuccessScreen from '@/app/components/SuccessScreen';
import Link from "next/link";
import CarParkBayPopup from '../components/CarParkPopUp';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  orderNumber: string;
  carParkBay: string;
  confirmed: boolean;
}

interface Errors {
  [key: string]: string;
}

export default function PartsAssistance() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    orderNumber: "",
    carParkBay: "",
    confirmed: false,
  });

  const handleCloseFloating = () => {
    setShowSuccess(false);
    localStorage.removeItem("doxy-minimized");
    window.location.href = "/";
  };

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepValidationErrors, setStepValidationErrors] = useState<string[]>([]);
  const [showBayPopup, setShowBayPopup] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const fieldName = name as keyof FormData;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: type === "checkbox" ? checked : value,
    }));

    // Clear errors when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Clear step validation errors
    if (stepValidationErrors.length > 0) {
      setStepValidationErrors([]);
    }
  };

  const validateStep = (stepNumber: number): string[] => {
    const stepErrors: string[] = [];

    switch (stepNumber) {
      case 1:
        if (!formData.orderNumber.trim()) {
          stepErrors.push("Order number is required");
        }
        break;
      case 2:
        if (!formData.firstName.trim()) {
          stepErrors.push("First name is required");
        } else if (!/^[A-Za-z\s'-]+$/.test(formData.firstName)) {
          stepErrors.push("Full name may contain only letters, spaces, hyphens (-) and apostrophes (').");
        }

        if (!formData.lastName.trim()) {
          stepErrors.push("Last name is required");
        } else if (!/^[A-Za-z\s'-]+$/.test(formData.lastName)) {
          stepErrors.push("Last name may contain only letters, spaces, hyphens (-) and apostrophes (').");
        }

        
        if (!formData.phone.trim()) {
          stepErrors.push("Phone number is required");
        } else if (formData.phone.replace(/\s/g, '').length < 10) {
          stepErrors.push("Phone number must be at least 10 digits");
        }
        break;
      case 3:
        if (!formData.carParkBay.trim()) {
          stepErrors.push("Car park bay number is required");
        }
        if (!formData.confirmed) {
          stepErrors.push("You must confirm that all information is accurate");
        }
        break;
    }

    return stepErrors;
  };

  const canProceed = () => {
    if (step === 3) {
      const hasCarBay = formData.carParkBay.trim().length > 0;
      const hasConfirmed = formData.confirmed === true;
      return hasCarBay && hasConfirmed;
    }

    const stepErrors = validateStep(step);
    return stepErrors.length === 0;
  };

  const handleContinue = () => {
    const stepErrors = validateStep(step);

    if (stepErrors.length > 0) {
      setStepValidationErrors(stepErrors);
      return;
    }

    setStepValidationErrors([]);
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    const allErrors: string[] = [];

    if (!formData.firstName.trim()) {
      allErrors.push("Full name is required");
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.firstName)) {
      allErrors.push("Full name may only contain letters, spaces, hyphens (-), and apostrophes (').");
    }

    if (!formData.lastName.trim()) {
      allErrors.push("Last name is required");
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.lastName)) {
      allErrors.push("Last name may only contain letters, spaces, hyphens (-), and apostrophes (').");
    }

    if (!formData.phone.trim()) {
      allErrors.push("Phone number is required");
    } else if (formData.phone.replace(/\s/g, "").length < 10) {
      allErrors.push("Phone number must be at least 10 digits");
    }

    if (!formData.orderNumber.trim()) {
      allErrors.push("Order number is required");
    }

    if (!formData.carParkBay.trim()) allErrors.push("Car park bay is required");
    if (!formData.confirmed) allErrors.push("You must confirm the data");

    if (allErrors.length > 0) {
      setStepValidationErrors(allErrors);
      // alert("Please correct the following errors:\n\n• " + allErrors.join("\n• "));
      setIsSubmitting(false);
      return;
    }

    setStepValidationErrors([]);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        const k = key as keyof FormData;
        formDataToSend.append(k, formData[k].toString());
      });

      const response = await fetch("/api/parts-assistance", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
          const msgs = Object.values(result.errors).join("\n• ");
          alert("Submission failed:\n\n• " + msgs);
        } else {
          alert(result.error || "Submission failed");
        }
        setIsSubmitting(false);
        return;
      }

      // Success with dynamic message
      const orderCount = formData.orderNumber.split(',').filter(o => o.trim()).length;
      const message = orderCount > 1
        ? `Your ${orderCount} parts assistance requests have been submitted. Thank you.`
        : "Your parts assistance request has been submitted. Thank you.";

      setSuccessMessage(message);
      setShowSuccess(true);

      setTimeout(() => {
        window.location.href = "/";
      }, 3000);

    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {showSuccess && (
        <SuccessScreen
          title="Success!"
          message={successMessage || "Your request has been submitted. Thank you."}
          identifierLabel="Order Number(s)"
          identifierValue={formData.orderNumber}
          redirectMessage="Redirecting to main menu..."
          onDone={handleCloseFloating}
        />
      )}

      {/* Header */}
      <div className="relative bg-blue-600 text-white p-8 shadow-lg px-10 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-7xl font-bold mb-2">Parts Assistance</h1>
          <p className="text-3xl text-white font-bold">
            Mills Brands Click & Collect Kiosk
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {[
            { num: 1, label: 'Verify Order', icon: Package },
            { num: 2, label: 'Contact Info', icon: UserRoundPen },
            { num: 3, label: 'Confirm', icon: PackageCheck }
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex flex-col items-center flex-1">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold mb-2 transition-all ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {step > num ? '✓' : <Icon size={40} />}
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

          {/* Validation Errors Alert */}
          {stepValidationErrors.length > 0 && (
            <div className="mb-6 bg-red-50 border-4 border-red-500 rounded-2xl p-8">
              <h3 className="text-3xl font-bold text-red-700 mb-4">REQUIRED FIELDS CANNOT BE BLANK:</h3>
              <ul className="list-disc list-inside space-y-2">
                {stepValidationErrors.map((error, index) => (
                  <li key={index} className="text-2xl text-red-600 font-semibold">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 1: Verify Order */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10 text-black">
                <h2 className="text-5xl font-bold mb-8 text-gray-800">Enter Your Order Details</h2>

                <div className="space-y-10">
                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">Order Number(s)</label>
                    <input
                      type="text"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleChange}
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                      placeholder="e.g., E1234567, M7654321, 100000123456"
                    />

                    {errors.orderNumber && <p className="text-red-600 text-xl mt-2">{errors.orderNumber}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-5xl font-bold mb-8 text-gray-800">Your Contact Information</h2>

                <div className="space-y-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-4xl font-semibold mb-4 text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        pattern="^[A-Za-z\s'-]+$"
                        className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                        placeholder="Enter First Name"
                      />
                      {errors.firstName && (
                        <p className="text-red-600 text-xl mt-2">{errors.firstName}</p>
                      )}
                    </div>
                    
                    {/* Last Name */}
                    <div>
                      <label className="block text-4xl font-semibold mb-4 text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        pattern="^[A-Za-z\s'-]+$"
                        className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                        placeholder="Enter Last Name"
                      />
                      {errors.lastName && (
                        <p className="text-red-600 text-xl mt-2">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">Phone Number</label>
                    <div className="flex gap-4">
                      <div className="text-3xl p-6 border-4 border-gray-300 rounded-2xl bg-gray-50 text-gray-400">AU</div>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          let digits = e.target.value.replace(/\D/g, "");
                          if (digits.length > 10) digits = digits.slice(0, 10);

                          let formatted = digits;
                          if (digits.length > 4 && digits.length <= 7) {
                            formatted = digits.slice(0, 4) + " " + digits.slice(4);
                          } else if (digits.length > 7) {
                            formatted = digits.slice(0, 4) + " " + digits.slice(4, 7) + " " + digits.slice(7);
                          }

                          handleChange({
                            ...e,
                            target: { ...e.target, value: formatted, name: "phone" }
                          });
                        }}
                        className="flex-1 text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                        placeholder="04XX XXX XXX"
                        required
                      />
                    </div>
                    {errors.phone && <p className="text-red-600 text-xl mt-2">{errors.phone}</p>}
                  </div>
                </div>
              </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-6xl font-bold mb-8 text-gray-800">Review & Confirm</h2>

                <div className="space-y-4 mb-8 bg-gray-50 p-8 rounded-2xl">
                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Order Number{formData.orderNumber.includes(',') ? 's' : ''}:</span>
                    <span className="font-bold text-black">{formData.orderNumber}</span>
                  </div>
                  {formData.orderNumber.includes(',') && (
                    <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <p className="text-2xl text-blue-700 font-semibold">
                        Processing {formData.orderNumber.split(',').filter(o => o.trim()).length} orders
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Name:</span>
                    <span className="font-bold text-black">{formData.firstName} {formData.lastName}</span>
                  </div>

                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Phone:</span>
                    <span className="font-bold text-black">{formData.phone}</span>
                  </div>

                  <div className="mt-6 p-6 bg-yellow-100 border-4 border-yellow-400 rounded-2xl">
                    <p className="text-3xl font-semibold text-yellow-800">
                      Please proceed to the window reception for further assistance. Thank you!
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-3xl font-semibold mb-2 text-gray-700 text-center">
                    Select Car Park Bay
                  </label>
                  <label className="block text-xl font-semibold mb-6 text-red-700 text-center">
                    Note: Please do not relocate after confirming your bay.
                  </label>

                  <div className="mt-6 flex items-center justify-between rounded-2xl border bg-white p-6">
                    <div>
                      <div className="text-xl font-extrabold text-gray-900">Car Park Bay</div>
                      <div className="text-4xl font-bold text-gray-600 mt-1">
                        {formData.carParkBay ? formData.carParkBay : "Not selected"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBayPopup(true)}
                      className="px-10 py-5 rounded-2xl bg-blue-600 text-white text-2xl font-extrabold hover:bg-blue-700 active:scale-95"
                    >
                      {formData.carParkBay ? "Change" : "Select Bay"}
                    </button>
                  </div>

                  <CarParkBayPopup
                    open={showBayPopup}
                    onClose={() => setShowBayPopup(false)}
                    value={formData.carParkBay}

                    onConfirm={(v) => {
                        setFormData((p) => ({ ...p, carParkBay: v }));
                        setStepValidationErrors([]);
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.carParkBay;
                          return copy;
                        });
                      }}
                  />

                  {errors.carParkBay && (
                    <p className="text-red-600 text-xl mt-4 text-center">
                      {errors.carParkBay}
                    </p>
                  )}
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

                {errors.confirmed && (
                  <p className="text-red-600 text-xl mt-2">{errors.confirmed}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t-4 border-gray-200 p-8 shadow-lg px-10 py-20">
        <div className="max-w-4xl mx-auto flex gap-6">
          {step === 1 && (
            <Link
              href="/choose-service"
              className="flex-1 text-4xl font-bold py-8 px-10 bg-yellow-200 text-yellow-700 rounded-2xl hover:bg-yellow-300 transition-all flex items-center justify-center"
            >
              ⬑ Main Menu
            </Link>
          )}

          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 text-4xl font-bold py-8 px-10 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all"
            >
              ← Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleContinue}
              className={`flex-1 text-4xl font-bold py-8 px-10 rounded-2xl transition-all flex items-center justify-center gap-4 ${canProceed() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              Continue
              <ChevronRight size={36} />
            </button>
          ) : (
           <button
              type="button"
              onClick={() => {
                const errs = validateStep(4);
              
                if (errs.length > 0) {
                  setStepValidationErrors(errs);
                  return;
                }
              
                handleSubmit();
              }}
              disabled={isSubmitting}
              className={`flex-1 text-4xl font-bold py-8 px-10 rounded-2xl transition-all ${
                !isSubmitting
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
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