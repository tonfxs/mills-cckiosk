"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Package, UserRoundPen, PackageCheck, IdCardIcon } from "lucide-react";
import SuccessScreen from "@/app/components/SuccessScreen";
import Link from "next/link";
import CarParkBayPopup from "../components/CarParkPopUp";
import OtherPaymentPopup from "@/app/components/OtherPaymentPopup";

interface FormData {
  firstName: string;
  lastName: string;
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

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function isValidAuMobile(phone: string) {
  const digits = normalizePhone(phone);
  return /^04\d{8}$/.test(digits); // starts with 04 + 8 digits = 10 total
}




/**
 * ✅ RULE:
 * - If there is NO comma, treat input as ONE order only
 * - If there IS a comma, treat as multiple
 * - Reject "multiple-looking" entries separated by spaces/newlines when no comma is present
 */
function parseOrderNumbers(raw: string) {
  const input = raw;

  if (!input.trim()) return { list: [], error: "Order number is required" };

  const hasComma = input.includes(",");

  // Single entry: no spaces anywhere
  if (!hasComma) {
    if (/\s/.test(input)) {
      return {
        list: [],
        error:
          "Single order number cannot contain spaces. Remove any spaces before or after the order number.",
      };
    }

    if (!/^[A-Za-z0-9-]+$/.test(input)) {
      return {
        list: [],
        error: "Order number may only contain letters, numbers, and hyphens (-).",
      };
    }

    return { list: [input], error: null };
  }

  // Multiple entries: allow spaces **around commas** only
  const list = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length === 0) return { list: [], error: "Order number is required" };

  for (const order of list) {
    if (!/^[A-Za-z0-9-]+$/.test(order)) {
      return {
        list: [],
        error:
          "Each order number may only contain letters, numbers, and hyphens (-). Spaces inside an order number are not allowed.",
      };
    }
  }

  return { list, error: null };
}

// NumberPad Component
const NumberPad = ({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) => {
  const handleNumberClick = (num: string) => {
    if (value.length < maxLength) onChange(value + num);
  };

  const handleBackspace = () => onChange(value.slice(0, -1));
  const handleClear = () => onChange("");

  return (
    <div className="space-y-4">
      <div className="text-5xl font-bold text-center p-6 bg-gray-100 rounded-2xl border-4 border-gray-300 min-h-[100px] flex items-center justify-center text-black">
        {value.length > 0 ? "*".repeat(value.length) : "----"}
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
          onClick={() => handleNumberClick("0")}
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
    firstName: "",
    lastName: "",
    phone: "",
    orderNumber: "",
    creditCard: "",
    validId: "",
    paymentMethod: "",
    carParkBay: "",
    confirmed: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepValidationErrors, setStepValidationErrors] = useState<string[]>([]);
  const [showBayPopup, setShowBayPopup] = useState(false);
  const [showOtherPaymentPopup, setShowOtherPaymentPopup] = useState(false);
  const [showCardPopup, setShowCardPopup] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const fieldName = name as keyof FormData;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: type === "checkbox" ? checked : value.replace(/\s+$/, " "),
    }));

    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    if (stepValidationErrors.length > 0) setStepValidationErrors([]);
  };

  const validateStep = (stepNumber: number): string[] => {
    const stepErrors: string[] = [];

    switch (stepNumber) {
      case 1: {
        const parsed = parseOrderNumbers(formData.orderNumber);

        if (parsed.error) {
          stepErrors.push(parsed.error);
        } else {
          const orderNumbers = parsed.list;
          const uniqueNumbers = new Set(orderNumbers);

          if (orderNumbers.length !== uniqueNumbers.size) {
            stepErrors.push("Duplicate order numbers detected.");
            stepErrors.push("Each order number must be unique.");
          }
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
      }

      case 2:
        if (!formData.firstName.trim()) {
          stepErrors.push("First name is required");
        } else if (!/^[A-Za-z\s'-]+$/.test(formData.firstName)) {
          stepErrors.push("First name may contain only letters, spaces, hyphens (-) and apostrophes (').");
        }

        if (!formData.lastName.trim()) {
          stepErrors.push("Last name is required");
        } else if (!/^[A-Za-z\s'-]+$/.test(formData.lastName)) {
          stepErrors.push("Last name may contain only letters, spaces, hyphens (-) and apostrophes (').");
        }

        if (!formData.phone.trim()) {
          stepErrors.push("Phone number is required");
        }  else if (!isValidAuMobile(formData.phone)) {
          stepErrors.push("Phone number must be a valid Australian mobile (10 digits starting with 04)");
        }
        break;

      case 3:
        if (!formData.validId) stepErrors.push("Please select a valid ID type");
        if (!formData.paymentMethod) stepErrors.push("Please select a payment method");
        break;

      case 4:
        if (!formData.carParkBay.trim()) stepErrors.push("Car park bay number is required");
        if (!formData.confirmed) stepErrors.push("You must confirm that all information is accurate");
        break;
    }

    return stepErrors;
  };

  // const canProceed = () => validateStep(step).length === 0;
  const canProceed = () => {
  const errors = validateStep(step);
  if (step === 2 && !isValidAuMobile(formData.phone)) return false;
  return errors.length === 0;
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
      allErrors.push("First name is required");
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.firstName)) {
      allErrors.push("First name may contain only letters, spaces, hyphens (-) and apostrophes (').");
    }

    if (!formData.lastName.trim()) {
      allErrors.push("Full name is required");
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.lastName)) {
      allErrors.push("Last name may contain only letters, spaces, hyphens (-) and apostrophes (').");
    }

    if (!formData.phone.trim()) {
      allErrors.push("Phone number is required");
    } else if (!isValidAuMobile(formData.phone)) {
      allErrors.push("Phone number must be a valid Australian mobile (10 digits starting with 04)");
    }

    // ✅ Use the SAME parser rule on submit too
    const parsed = parseOrderNumbers(formData.orderNumber);
    if (parsed.error) allErrors.push(parsed.error);

    if (["credit-card", "debit-card"].includes(formData.paymentMethod)) {
      if (!formData.creditCard.trim()) {
        allErrors.push("Last 4 digits of credit card are required");
      } else if (formData.creditCard.length !== 4) {
        allErrors.push("Credit card must be exactly 4 digits");
      } else if (!/^\d{4}$/.test(formData.creditCard)) {
        allErrors.push("Credit card must contain only numbers");
      }
    }

    if (!formData.validId) allErrors.push("Please select a valid ID");
    if (!formData.paymentMethod) allErrors.push("Please select a payment method");
    if (!formData.carParkBay.trim()) allErrors.push("Car park bay is required");
    if (!formData.confirmed) allErrors.push("You must confirm the data");

    // Duplicate check on submit (only when parse succeeded)
    if (!parsed.error) {
      const unique = new Set(parsed.list);
      if (unique.size !== parsed.list.length) {
        allErrors.push("Duplicate order numbers detected.");
        allErrors.push("Each order number must be unique.");
      }
    }

    if (allErrors.length > 0) {
      setStepValidationErrors(allErrors);
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

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    const parsed = parseOrderNumbers(formData.orderNumber);
    if (parsed.error) newErrors.orderNumber = parsed.error;

    if (["credit-card", "debit-card"].includes(formData.paymentMethod) && formData.creditCard.length !== 4) {
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
        />
      )}

      {/* Header */}
      <div className="relative bg-blue-600 text-white p-8 shadow-lg px-10 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-7xl font-bold mb-2">Pick Up Order</h1>
          <p className="text-3xl text-white font-bold">Mills Brands Click & Collect Kiosk</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {[
            { num: 1, label: "Verify Order", icon: Package },
            { num: 2, label: "Contact Info", icon: UserRoundPen },
            { num: 3, label: "Select ID", icon: IdCardIcon },
            { num: 4, label: "Confirm", icon: PackageCheck },
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex flex-col items-center flex-1">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold mb-2 transition-all ${
                  step >= num ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > num ? "✓" : <Icon size={40} />}
              </div>
              <span className={`text-sm font-medium ${step >= num ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
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
                    <p className="text-red-600 text-3xl font-semibold my-4">(Note: Separate multiple order numbers with a comma.)</p>
                    <input
                      type="text"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleChange}
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black "
                      placeholder="e.g., E1234567, M7654321, 100000123456"
                    />
                    {errors.orderNumber && <p className="text-red-600 text-xl mt-2">{errors.orderNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">
                      Payment Method
                      <p className="text-red-600 text-3xl my-4">(Note: Only select the payment method used during purchase. This is for verification purposes only.)</p>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: "credit-card", label: "Credit Card" },
                        { value: "debit-card", label: "Debit Card" },
                        { value: "eBay", label: "eBay" },
                        { value: "others", label: "Others" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, paymentMethod: value }));

                            if (value === "credit-card" || value === "debit-card") {
                              setShowCardPopup(true);
                            }

                            if (value === "others") {
                              const parsed = parseOrderNumbers(formData.orderNumber);
                              if (parsed.error) {
                                setStepValidationErrors([parsed.error]);
                                return;
                              }

                              const unique = new Set(parsed.list);
                              if (unique.size !== parsed.list.length) {
                                setStepValidationErrors([
                                  "Duplicate order numbers detected.",
                                  "Each order number must be unique.",
                                ]);
                                return;
                              }

                              setShowCardPopup(false);
                              setShowOtherPaymentPopup(true);
                              if (stepValidationErrors.length > 0) setStepValidationErrors([]);
                            }

                            if (stepValidationErrors.length > 0) setStepValidationErrors([]);
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

                    {errors.paymentMethod && <p className="text-red-600 text-xl mt-2">{errors.paymentMethod}</p>}
                  </div>

                  <OtherPaymentPopup
                    open={showOtherPaymentPopup}
                    onClose={() => setShowOtherPaymentPopup(false)}
                    onSelect={(method) => {
                      setFormData((prev) => ({ ...prev, paymentMethod: method }));
                      setShowOtherPaymentPopup(false);
                      if (stepValidationErrors.length > 0) setStepValidationErrors([]);
                    }}
                    onAfterSelect={() => setStep((s) => s + 1)}
                  />

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
                            if (stepValidationErrors.length > 0) setStepValidationErrors([]);
                          }}
                          maxLength={4}
                        />

                        {errors.creditCard && <p className="text-red-600 text-2xl mt-4 text-center">{errors.creditCard}</p>}

                        <p className="text-gray-500 text-2xl mt-2 text-center">Must be exactly 4 digits</p>

                        <button
                          onClick={() => {
                            // ✅ Reuse parser here too
                            const parsed = parseOrderNumbers(formData.orderNumber);
                            if (parsed.error) {
                              // Auto-clear card digits
                              setFormData((prev) => ({ ...prev, creditCard: "" }));
                              // Clear inline card error
                              setErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.creditCard;
                                return copy;
                              });
                              // Show banner error
                              setStepValidationErrors([parsed.error]);
                              // Close numpad
                              setShowCardPopup(false);
                              return;
                            }

                            const unique = new Set(parsed.list);
                            if (unique.size !== parsed.list.length) {
                              setFormData((prev) => ({ ...prev, creditCard: "" }));
                              setErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.creditCard;
                                return copy;
                              });
                              setStepValidationErrors([
                                "Duplicate order numbers detected.",
                                "Each order number must be unique.",
                              ]);
                              setShowCardPopup(false);
                              return;
                            }

                            if (
                              ["credit-card", "debit-card"].includes(formData.paymentMethod) &&
                              formData.creditCard.length !== 4
                            ) {
                              setErrors((prev) => ({ ...prev, creditCard: "Last 4 digits are required" }));
                              return;
                            }

                            setStepValidationErrors([]);
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.creditCard;
                              return copy;
                            });

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
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      pattern="^[A-Za-z\s'\-]+$"
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                      placeholder="Enter First Name"
                    />
                    {errors.firstName && <p className="text-red-600 text-xl mt-2">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      pattern="^[A-Za-z\s'\-]+$"
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                      placeholder="Enter Last Name"
                    />
                    {errors.lastName && <p className="text-red-600 text-xl mt-2">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="my-6 block text-4xl font-semibold mb-4 text-gray-700">Phone Number</label>
                  <div className="flex gap-4">
                    <div className="text-3xl p-6 border-4 border-gray-300 rounded-2xl bg-gray-50 text-gray-400">+61</div>
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
                          target: {
                            ...e.target,
                            value: formatted,
                            name: "phone",
                          },
                        } as any);
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

          {/* Step 3: ID */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-5xl font-bold mb-8 text-gray-800">Identification & Payment</h2>

                <div className="space-y-12">
                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">Select Valid ID</label>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: "drivers-license", label: "Driver's License" },
                        { value: "passport", label: "Passport" },
                        { value: "medicare-card", label: "Medicare Card" },
                        { value: "immicard", label: "ImmiCard" },
                        { value: "others", label: "Others" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, validId: value }));
                            if (stepValidationErrors.length > 0) setStepValidationErrors([]);
                          }}
                          className={`text-3xl p-8 rounded-2xl border-4 font-semibold transition-all ${
                            formData.validId === value
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {errors.validId && <p className="text-red-600 text-xl mt-2">{errors.validId}</p>}
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
                    <span className="font-bold text-black">
                      {formData.firstName} {formData.lastName}
                    </span>
                  </div>

                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Phone:</span>
                    <span className="font-bold text-black">{formData.phone}</span>
                  </div>

                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">ID Type:</span>
                    <span className="font-bold capitalize text-black">{formData.validId.replace("-", " ")}</span>
                  </div>

                  <div className="flex justify-between text-4xl">
                    <span className="font-semibold text-gray-600">Payment:</span>
                    <span className="font-bold capitalize text-black">{formData.paymentMethod.replace("-", " ")}</span>
                  </div>

                  {(formData.paymentMethod === "credit-card" ||
                    formData.paymentMethod === "debit-card" ||
                    formData.paymentMethod === "others" ||
                    ["paypal", "ebay", "zippay", "stripe", "storecredit", "electronictransfer", "afterpay", "overthephone", "cardatwindow"].includes(
                      formData.paymentMethod
                    )) && (
                    <div className="mt-6 p-6 bg-yellow-100 border-4 border-yellow-400 rounded-2xl">
                      <p className="text-xl font-semibold text-yellow-800">
                        <span className="font-bold">DISCLAIMER:</span> Your payment and valid ID will undergo verification to ensure the payment details
                        match the name on the order.
                      </p>
                    </div>
                  )}

                  {formData.paymentMethod === "cash" && (
                    <div className="mt-6 p-6 bg-yellow-100 border-4 border-yellow-400 rounded-2xl">
                      <p className="text-2xl font-semibold text-yellow-800">Please proceed to the window reception to pay in cash.</p>
                    </div>
                  )}
                </div>

                {/* CARPARK */}
                <div className="mb-8">
                  <label className="block text-3xl font-semibold mb-2 text-gray-700 text-center">Select Car Park Bay</label>

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

                  {errors.carParkBay && <p className="text-red-600 text-xl mt-4 text-center">{errors.carParkBay}</p>}
                </div>
              </div>

              <label className="flex items-start gap-6 p-6 bg-blue-50 border-4 border-blue-300 rounded-2xl cursor-pointer">
                <input type="checkbox" name="confirmed" checked={formData.confirmed} onChange={handleChange} className="w-12 h-12 mt-1" />
                <span className="text-3xl font-semibold text-gray-800">I confirm that all provided information is accurate and valid</span>
              </label>

              {errors.confirmed && <p className="text-red-600 text-xl mt-2">{errors.confirmed}</p>}
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

          {step < 4 ? (
            <button
              onClick={handleContinue}
              className={`flex-1 text-4xl font-bold py-8 px-10 rounded-2xl transition-all flex items-center justify-center gap-4 ${
                canProceed() ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg" : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                !isSubmitting ? "bg-green-600 text-white hover:bg-green-700 shadow-lg" : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
