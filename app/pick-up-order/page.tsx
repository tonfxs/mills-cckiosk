"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, Package, UserRoundPen, PackageCheck, IdCardIcon } from 'lucide-react';
import SuccessScreen from '@/app/components/SuccessScreen';
import Link from "next/link";



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

interface Errors {
  [key: string]: string;
}



// NumberPad Component
const NumberPad = ({ value, onChange, maxLength }: { value: string; onChange: (value: string) => void; maxLength: number }) => {
  const handleNumberClick = (num: string) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-4">
      <div className="text-5xl font-bold text-center p-6 bg-gray-100 rounded-2xl border-4 border-gray-300 min-h-[100px] flex items-center justify-center text-black">
        {value.length > 0 ? '*'.repeat(value.length) : '----'}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="text-4xl font-bold p-8 bg-white border-4 border-gray-300 rounded-2xl hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="text-3xl font-bold p-8 bg-red-100 border-4 border-red-300 rounded-2xl hover:bg-red-200 transition-all"
        >
          Clear
        </button>
        <button
          onClick={() => handleNumberClick('0')}
          className="text-4xl font-bold p-8 bg-white border-4 border-gray-300 rounded-2xl hover:bg-blue-50 hover:border-blue-400 transition-all"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="text-3xl font-bold p-8 bg-yellow-100 border-4 border-yellow-300 rounded-2xl hover:bg-yellow-200 transition-all"
        >
          ←
        </button>
      </div>
    </div>
  );
};


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

  const handleCloseFloating = () => {
    setShowSuccess(false);
    localStorage.removeItem("doxy-minimized");

    window.location.href = "/";
  };

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepValidationErrors, setStepValidationErrors] = useState<string[]>([]);  

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
        if (["credit-card", "debit-card"].includes(formData.paymentMethod)) {
          if (!formData.creditCard.trim()) {
            stepErrors.push("Last 4 digits of credit card are required");
          } else if (formData.creditCard.length !== 4) {
            stepErrors.push("Credit card must be exactly 4 digits");
          } else if (!/^\d{4}$/.test(formData.creditCard)) {
            stepErrors.push("Credit card must contain only numbers");
          }
        }
        break;
      case 2:
      if (!formData.fullName.trim()) {
        stepErrors.push("Full name is required");
      } else if (!/^[A-Za-z\s'-]+$/.test(formData.fullName)) {
        stepErrors.push(
          "Full name may contain only letters, spaces, hyphens (-) and apostrophes (')."
        );
      }
        if (!formData.phone.trim()) {
          stepErrors.push("Phone number is required");
        } else if (formData.phone.replace(/\s/g, '').length < 9) {
          stepErrors.push("Phone number must be at least 10 digits");
        }
        break;
      case 3:
        if (!formData.validId) {
          stepErrors.push("Please select a valid ID type");
        }
        if (!formData.paymentMethod) {
          stepErrors.push("Please select a payment method");
        }
        break;
      case 4:
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
    const stepErrors = validateStep(step);
    return stepErrors.length === 0;
  };

  const handleContinue = () => {
    const stepErrors = validateStep(step);

    if (stepErrors.length > 0) {
      setStepValidationErrors(stepErrors);
      // alert("Please correct the following before continuing:\n\n• " + stepErrors.join("\n• "));
      return;
    }

    setStepValidationErrors([]);
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    const allErrors: string[] = [];

    // Full Name
    if (!formData.fullName.trim()) {
      allErrors.push("Full name is required");
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.fullName)) {
      allErrors.push("Full name may only contain letters, spaces, hyphens (-), and apostrophes (').");
    }

    // Phone Number
    if (!formData.phone.trim()) {
      allErrors.push("Phone number is required");
    } else if (formData.phone.replace(/\s/g, "").length < 10) {
      allErrors.push("Phone number must be at least 10 digits");
    }

    // Order Number
    if (!formData.orderNumber.trim()) {
      allErrors.push("Order number is required");
    }

    // Credit Card (only validate if credit/debit is selected)
    if (["credit-card", "debit-card"].includes(formData.paymentMethod)) {
      if (!formData.creditCard.trim()) {
        allErrors.push("Last 4 digits of credit card are required");
      } else if (formData.creditCard.length !== 4) {
        allErrors.push("Credit card must be exactly 4 digits");
      } else if (!/^\d{4}$/.test(formData.creditCard)) {
        allErrors.push("Credit card must contain only numbers");
      }
    }

    // Other required fields
    if (!formData.validId) allErrors.push("Please select a valid ID");
    if (!formData.paymentMethod) allErrors.push("Please select a payment method");
    if (!formData.carParkBay.trim()) allErrors.push("Car park bay is required");
    if (!formData.confirmed) allErrors.push("You must confirm the data");

    // Stop here if errors exist
    if (allErrors.length > 0) {
      setStepValidationErrors(allErrors);
      // alert("Please correct the following errors:\n\n• " + allErrors.join("\n• "));
      setIsSubmitting(false);
      return;
    }

    // No errors → continue submitting
    setStepValidationErrors([]);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        const k = key as keyof FormData;
        formDataToSend.append(k, formData[k].toString());
      });

      const response = await fetch("/api/pickup-order", {
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

      // Success screen
      setShowSuccess(true);

      // Redirect in 3 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);

    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
    }

    setIsSubmitting(false);
  };

  const [showCardPopup, setShowCardPopup] = useState(false);

  const validateStep1 = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.orderNumber.trim()) {
    newErrors.orderNumber = "Order number is required";
  }

  if (
    ["credit-card", "debit-card"].includes(formData.paymentMethod) &&
    formData.creditCard.length !== 4
  ) {
    newErrors.creditCard = "Last 4 digit is required";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


// When payment method changes:
useEffect(() => {
  if (["credit-card", "debit-card"].includes(formData.paymentMethod)) {
    setShowCardPopup(true);
  } else {
    setShowCardPopup(false);
  }
}, [formData.paymentMethod]);



  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Success Screen */}
      {showSuccess && (
        <SuccessScreen
          title="Success!"
          message="Your order pickup request has been submitted. Please wait by your car."
          identifierLabel="Order Number"
          identifierValue={formData.orderNumber}
          redirectMessage="Redirecting to main menu..."
          onDone={handleCloseFloating}
        />
      )}

      {/* Header */}
      <div className="relative bg-blue-600 text-white p-8 shadow-lg px-10 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-7xl font-bold mb-2">Pick Up Order</h1>
          <p className="text-3xl text-white font-bold">
            Mills Brands Click & Collect Kiosk
          </p>
          {/* <p className="text-2xl text-blue-100 font-bold">Check in with your name to connect to a Live Agent </p>
          <p className="text-2xl text-blue-100 font-bold">and consent to a live video call for assistance.</p> */}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {[
            { num: 1, label: 'Verify Order', icon: Package },
            { num: 2, label: 'Contact Info', icon: UserRoundPen },
            { num: 3, label: 'Select ID', icon: IdCardIcon },
            { num: 4, label: 'Confirm', icon: PackageCheck }
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
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">Order Number</label>
                    <input
                      type="text"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleChange}

                      // onChange={(e) => {
                      //   let val = e.target.value.toUpperCase();

                      //   // Remove all non-alphanumeric characters
                      //   val = val.replace(/[^A-Z0-9]/g, "");

                      //   // Enforce: first char = letter only
                      //   if (val.length === 1) {
                      //     val = val.replace(/[^A-Z]/g, ""); 
                      //   }

                      //   // Enforce: second → eighth chars = digits only
                      //   if (val.length > 1) {
                      //     val = val[0] + val.slice(1).replace(/\D/g, ""); 
                      //   }

                      //   // Limit to 1 letter + 7 digits = 8 characters total
                      //   val = val.slice(0, 8);

                      //   handleChange({
                      //     ...e,
                      //     target: {
                      //       ...e.target,
                      //       value: val,
                      //       name: "orderNumber"
                      //     }
                      //   });
                      // }}
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                      placeholder="e.g., E1234567 or M1234567"
                    />
                    {errors.orderNumber && <p className="text-red-600 text-xl mt-2">{errors.orderNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">
                      Payment Method
                    </label>

                    {/* <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: "credit-card", label: "Credit Card" },
                        { value: "debit-card", label: "Debit Card" },
                        { value: "cash", label: "Cash" },
                        { value: "others", label: "Others" }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, paymentMethod: value }));
                            if (stepValidationErrors.length > 0) {
                              setStepValidationErrors([]);
                            }
                          }}
                          className={`text-3xl p-8 rounded-2xl border-4 font-semibold transition-all ${formData.paymentMethod === value
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div> */}

                    <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "credit-card", label: "Credit Card" },
                      { value: "debit-card", label: "Debit Card" },
                      { value: "cash", label: "Cash" },
                      { value: "others", label: "Others" }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, paymentMethod: value }));
                        
                          if (value === "credit-card" || value === "debit-card") {
                            setShowCardPopup(true);
                          }
                        
                          if (value === "cash" || value === "others") {
                            setShowCardPopup(false);
                          }
                        
                          // Clear validation errors
                          if (stepValidationErrors.length > 0) {
                            setStepValidationErrors([]);
                          }
                        }}
                        className={`text-3xl p-8 rounded-2xl border-4 font-semibold transition-all ${
                          formData.paymentMethod === value
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {label}
                      </button>
                        ))}
                      </div>
                      
                    {errors.paymentMethod && (
                      <p className="text-red-600 text-xl mt-2">{errors.paymentMethod}</p>
                    )}
                  </div>

                  {/* ✅ Show NumberPad ONLY when credit or debit card is selected */}
                  {/* {["credit-card", "debit-card"].includes(formData.paymentMethod) && (
                    <div className="mt-10">
                      <label className="block text-4xl font-semibold mb-4 text-gray-700">
                        Last 4 Digits of Credit Card
                      </label>

                      <NumberPad
                        value={formData.creditCard}
                        onChange={(value: string) => {
                          setFormData((prev) => ({ ...prev, creditCard: value }));
                          if (stepValidationErrors.length > 0) {
                            setStepValidationErrors([]);
                          }
                        }}
                        maxLength={4}
                      />

                      {errors.creditCard && (
                        <p className="text-red-600 text-xl mt-2">{errors.creditCard}</p>
                      )}

                      <p className="text-gray-500 text-2xl mt-2">Must be exactly 4 digits</p>
                    </div>
                  )} */}

                  {showCardPopup && (
                     <div className="fixed inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center z-50">
                      <div className="relative bg-white p-10 rounded-2xl w-[90%] max-w-xl shadow-2xl border-4 border-blue-600">

                        <button
                          onClick={() => setShowCardPopup(false)}
                          className="absolute top-4 right-4 text-gray-600 hover:text-black text-4xl leading-none"
                        >
                          &times;
                        </button>

                        <h2 className="text-4xl font-semibold mb-6 text-gray-800 text-center pt-10">
                          Enter Last 4 Digits of Your Card
                        </h2>                 

                        <NumberPad
                          value={formData.creditCard}
                          onChange={(value: string) => {
                            setFormData((prev) => ({ ...prev, creditCard: value }));
                            if (stepValidationErrors.length > 0) {
                              setStepValidationErrors([]);
                            }
                          }}
                          maxLength={4}
                        />                  

                        {errors.creditCard && (
                          <p className="text-red-600 text-2xl mt-4 text-center">{errors.creditCard}</p>
                        )}                  

                        <p className="text-gray-500 text-2xl mt-2 text-center">
                          Must be exactly 4 digits
                        </p>    

                        <button
                          onClick={() => {
                            const stepErrors: string[] = [];
                          
                            // 🛑 Order Number required
                            if (!formData.orderNumber.trim()) {
                              stepErrors.push("Order number is required");
                            
                              // ✅ Auto-clear card digits
                              setFormData((prev) => ({
                                ...prev,
                                creditCard: "",
                              }));
                            
                              // ✅ Clear inline card error
                              setErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.creditCard;
                                return copy;
                              });
                            
                              // ✅ Show banner
                              setStepValidationErrors(stepErrors);
                            
                              // ✅ Close numpad
                              setShowCardPopup(false);
                            
                              // 🚫 Stop here
                              return;
                            }
                          
                            // 🛑 Validate card digits
                            if (
                              ["credit-card", "debit-card"].includes(formData.paymentMethod) &&
                              formData.creditCard.length !== 4
                            ) {
                              setErrors((prev) => ({
                                ...prev,
                                creditCard: "Last 4 digit is required",
                              }));
                              return;
                            }
                          
                            // ✅ Clear errors
                            setStepValidationErrors([]);
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.creditCard;
                              return copy;
                            });
                          
                            // ✅ Proceed
                            setShowCardPopup(false);
                            setStep(2);
                          }}
                          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-3xl font-bold"
                        >
                          Done
                        </button>

                      </div>
                    </div>
                    )}

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
                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      pattern="^[A-Za-z\s'-]+$"
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                      placeholder="Enter Full Name Here"
                    />
                    {errors.fullName && <p className="text-red-600 text-xl mt-2">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">Phone Number</label>
                    <div className="flex gap-4">
                      <div className="text-3xl p-6 border-4 border-gray-300 rounded-2xl bg-gray-50 text-gray-400">
                        AU
                      </div>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          // Keep digits only
                          let digits = e.target.value.replace(/\D/g, "");

                          // Limit to 10 digits
                          if (digits.length > 10) digits = digits.slice(0, 10);

                          // Apply formatting: 4-3-3 (AU mobile format)
                          let formatted = digits;
                          if (digits.length > 4 && digits.length <= 7) {
                            formatted = digits.slice(0, 4) + " " + digits.slice(4);
                          } else if (digits.length > 7) {
                            formatted =
                              digits.slice(0, 4) +
                              " " +
                              digits.slice(4, 7) +
                              " " +
                              digits.slice(7);
                          }

                          // Push cleaned digits to state (your handleChange)
                          handleChange({
                            ...e,
                            target: {
                              ...e.target,
                              value: formatted, // store formatted value
                              name: "phone"
                            }
                          });
                        }}
                        className="flex-1 text-3xl p-6 border-4 border-gray-300 rounded-2xl
                                   focus:border-blue-500 focus:outline-none text-black"
                        placeholder="04XX XXX XXX"
                        required
                      />

                    </div>
                    {errors.phone && <p className="text-red-600 text-xl mt-2">{errors.phone}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: ID */}
          {step === 3 && (

            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-5xl font-bold mb-8 text-gray-800">Identification & Payment</h2>

                <div className="space-y-12">

                  {/* VALID ID SECTION */}
                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">
                      Select Valid ID
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'drivers-license', label: "Driver's License" },
                        { value: 'passport', label: 'Passport' },
                        { value: 'medicare-card', label: 'Medicare Card' },
                        { value: 'immicard', label: 'ImmiCard' },
                        { value: 'others', label: 'Others' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, validId: value }));
                            if (stepValidationErrors.length > 0) {
                              setStepValidationErrors([]);
                            }
                          }}
                          className={`text-3xl p-8 rounded-2xl border-4 font-semibold transition-all ${formData.validId === value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {errors.validId && (
                      <p className="text-red-600 text-xl mt-2">{errors.validId}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          )}

          {/* Step 4: Confirm */}
          {step === 4 && (


            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-6xl font-bold mb-8 text-gray-800">Review & Confirm</h2>

                <div className="space-y-4 mb-8 bg-gray-50 p-8 rounded-2xl">
                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Order Number:</span>
                    <span className="font-bold text-black">{formData.orderNumber}</span>
                  </div>

                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Name:</span>
                    <span className="font-bold text-black">{formData.fullName}</span>
                  </div>

                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Phone:</span>
                    <span className="font-bold text-black">{formData.phone}</span>
                  </div>

                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">ID Type:</span>
                    <span className="font-bold capitalize text-black">
                      {formData.validId.replace("-", " ")}
                    </span>
                  </div>

                  <div className="flex justify-between text-4xl">
                    <span className="font-semibold text-gray-600">Payment:</span>
                    <span className="font-bold capitalize text-black">
                      {formData.paymentMethod.replace("-", " ")}
                    </span>
                  </div>


                  {/* Payment Disclaimers */}
                  {(
                    formData.paymentMethod === "credit-card" ||
                    formData.paymentMethod === "debit-card" ||
                    formData.paymentMethod === "others"
                  ) && (
                    <div className="mt-6 p-6 bg-yellow-100 border-4 border-yellow-400 rounded-2xl">
                      <p className="text-3xl font-semibold text-yellow-800">
                        <span className="font-bold">DISCLAIMER:</span> Your payment and valid ID will undergo verification to ensure the payment details match the name on the order.
                      </p>
                    </div>
                  )}


                  {/* ✅ CASH DISCLAIMER */}
                  {formData.paymentMethod === "cash" && (
                    <div className="mt-6 p-6 bg-yellow-100 border-4 border-yellow-400 rounded-2xl">
                      <p className="text-3xl font-semibold text-yellow-800">
                        Please proceed to the window reception to pay in cash.
                      </p>
                    </div>
                  )}
                </div>

                {/* <div className="mb-8">
                  <label className="block text-4xl font-semibold mb-4 text-gray-700">
                    Car Park Bay Number
                  </label>
                  <input
                    type="text"
                    name="carParkBay"
                    value={formData.carParkBay}
                    onChange={handleChange}
                    className="w-full text-4xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                    placeholder="e.g., 15"
                  />
                  {errors.carParkBay && (
                    <p className="text-red-600 text-xl mt-2">{errors.carParkBay}</p>
                  )}
                </div> */}

                <div className="mb-8">
                <label className="block text-4xl font-semibold mb-4 text-gray-700 text-center">
                  Select Car Park Bay
                </label>

                <div className="grid grid-cols-11 gap-4">
                  {Array.from({ length: 21 }, (_, i) => i + 1).map((num) => {
                    const isSelected = formData.carParkBay === String(num);
                  
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          handleChange({
                            target: {
                              name: "carParkBay",
                              value: String(num),
                              type: "select-one",
                            },
                          } as React.ChangeEvent<HTMLSelectElement>)
                        }
                        className={`
                          h-14 rounded-3xl text-3xl font-bold
                          transition-all duration-200
                          ${
                            isSelected
                              ? "bg-blue-600 text-white scale-105 shadow-xl"
                              : "bg-white/70 backdrop-blur-md text-gray-800 shadow-lg hover:scale-105 active:scale-95"
                          }
                        `}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* <select
                  name="carParkBay"
                  value={formData.carParkBay}
                  onChange={handleChange}
                  className="w-full text-4xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black bg-white"
                >
                  <option value="">Select bay number</option>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select> */}


                {errors.carParkBay && (
                  <p className="text-red-600 text-xl mt-4">{errors.carParkBay}</p>
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

          {/* MAIN MENU BUTTON (visible only on step 1) */}
          {step === 1 && (
            <Link
              href="/choose-service"
              className="flex-1 text-4xl font-bold py-8 px-10 
                       bg-yellow-200 text-yellow-700 
                       rounded-2xl hover:bg-yellow-300 transition-all
                       flex items-center justify-center"
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

          {step < 4 ? (
            <button
              onClick={handleContinue}
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


