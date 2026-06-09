"use client";

import { useState, useRef } from "react";
import SuccessScreen from "@/app/components/SuccessScreen";
import {
  ChevronRight,
  PackageSearch,
  UserRoundPen,
  PackageCheck,
  BarChart2,
  Info,
  CreditCard,
  Truck,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import CarParkBayPopup from "../components/CarParkPopUp";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  enquiryCategory: string;
  firstName: string;
  lastName: string;
  phone: string;
  carParkBay: string;
  notes: string;
}

interface Errors {
  [key: string]: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function isValidAuMobile(phone: string) {
  const digits = normalizePhone(phone);
  return /^04\d{8}$/.test(digits);
}

// ─── Enquiry Categories ───────────────────────────────────────────────────────

const ENQUIRY_CATEGORIES = [
  { value: "stock-check", label: "Stock Check", icon: BarChart2 },
  { value: "product-information", label: "Product Information", icon: Info },
  { value: "payment-checkout", label: "Payment / Checkout", icon: CreditCard },
  { value: "order-follow-up", label: "Order Follow-Up", icon: Truck },
  { value: "returns-query", label: "Returns Query", icon: RotateCcw },
  { value: "others", label: "Others", icon: HelpCircle },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductEnquiryKiosk() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState<FormData>({
    enquiryCategory: "",
    firstName: "",
    lastName: "",
    phone: "",
    carParkBay: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepValidationErrors, setStepValidationErrors] = useState<string[]>([]);
  const [showBayPopup, setShowBayPopup] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;

    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    if (errors[fieldName]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }

    if (stepValidationErrors.length > 0) setStepValidationErrors([]);
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validateStep = (stepNumber: number): string[] => {
    const stepErrors: string[] = [];

    switch (stepNumber) {
      case 1:
        if (!formData.enquiryCategory)
          stepErrors.push("Please select an enquiry category.");
        break;

      case 2:
        if (!formData.firstName.trim())
          stepErrors.push("First name is required.");
        else if (!/^[A-Za-z\s'-]+$/.test(formData.firstName))
          stepErrors.push(
            "First name may contain only letters, spaces, hyphens (-) and apostrophes (')."
          );

        if (!formData.lastName.trim())
          stepErrors.push("Last name is required.");
        else if (!/^[A-Za-z\s'-]+$/.test(formData.lastName))
          stepErrors.push(
            "Last name may contain only letters, spaces, hyphens (-) and apostrophes (')."
          );

        if (!formData.phone.trim())
          stepErrors.push("Phone number is required.");
        else if (!isValidAuMobile(formData.phone))
          stepErrors.push(
            "Phone number must be a valid Australian mobile (10 digits starting with 04)."
          );

        break;

      case 3:
        if (!formData.carParkBay.trim())
          stepErrors.push("Bay number is required.");
        break;
    }

    return stepErrors;
  };

  const canProceed = () => validateStep(step).length === 0;

  const handleContinue = () => {
    const errs = validateStep(step);
    if (errs.length > 0) {
      setStepValidationErrors(errs);
      return;
    }
    setStepValidationErrors([]);
    setStep(step + 1);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const errs = validateStep(3);
    if (errs.length > 0) {
      setStepValidationErrors(errs);
      isSubmittingRef.current = false;
      return;
    }

    setIsSubmitting(true);
    setStepValidationErrors([]);

    const payload = {
      formType: "customer-enquiry",
      enquiryCategory: formData.enquiryCategory,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      carParkBay: formData.carParkBay,
      notes: formData.notes,
    };

    try {
      // Save to Google Sheets (Customer Enquiry tab + MASTER LIST)
      const sheetRes = await fetch("/api/customer-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!sheetRes.ok) throw new Error("Sheet save failed");

      // Send email / Freshdesk ticket
      const emailRes = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!emailRes.ok) throw new Error("Email send failed");

    } catch (err) {
      console.error("Submission error:", err);
      setStepValidationErrors([
        "Submission failed. Please press the Submit button again.",
      ]);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return;
    }

    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setShowSuccess(true);
  };

  // ── Success screen ───────────────────────────────────────────────────────────

  const STEPS = [
    { num: 1, label: "Enquiry Type", icon: PackageSearch },
    { num: 2, label: "Your Details", icon: UserRoundPen },
    { num: 3, label: "Confirm", icon: PackageCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">

      {showSuccess && (
        <SuccessScreen
          title="Success!"
          message="Your enquiry has been submitted. A team member will be with you shortly."
          identifierLabel="Car Park Bay"
          identifierValue={formData.carParkBay}
          redirectMessage="Redirecting to main menu..."
          onDone={() => { window.location.href = "/"; }}
        />
      )}

      {/* Header */}
      <div className="bg-blue-600 text-white px-10 py-16 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-7xl font-bold mb-2">Customer Enquiry</h1>
          <p className="text-3xl text-blue-100 font-semibold">
            Mills Brands Click &amp; Collect Kiosk
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {STEPS.map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex flex-col items-center flex-1">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold mb-2 transition-all ${
                  step >= num
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > num ? "✓" : <Icon size={40} />}
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= num ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">

          {/* Validation Errors */}
          {stepValidationErrors.length > 0 && (
            <div className="mb-6 bg-red-50 border-4 border-red-500 rounded-2xl p-8">
              <h3 className="text-3xl font-bold text-red-700 mb-4">
                PLEASE FIX THE FOLLOWING:
              </h3>
              <ul className="list-disc list-inside space-y-2">
                {stepValidationErrors.map((error, i) => (
                  <li key={i} className="text-2xl text-red-600 font-semibold">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Step 1: Enquiry Category ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-xl p-10 text-black">
              <h2 className="text-5xl font-bold mb-4 text-gray-800">
                What can we help you with?
              </h2>
              <p className="text-3xl text-gray-500 mb-10">
                Please select the category that best describes your enquiry.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {ENQUIRY_CATEGORIES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, enquiryCategory: value }));
                      setStepValidationErrors([]);
                    }}
                    className={`flex flex-col items-center gap-4 text-3xl p-10 rounded-2xl border-4 font-semibold transition-all ${
                      formData.enquiryCategory === value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    <Icon size={48} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Customer Information ─────────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-xl p-10 space-y-8">
              <h2 className="text-5xl font-bold text-gray-800">
                Your Information
              </h2>

              <div className="mt-4 p-6 bg-yellow-100 border-4 border-yellow-400 rounded-2xl">
                <p className="text-3xl font-semibold text-yellow-800">
                  <span className="font-bold">TIP:</span> Tap outside the box or
                  scroll down to continue.
                </p>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-4xl font-semibold mb-3 text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                  placeholder="Enter First Name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-4xl font-semibold mb-3 text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                  placeholder="Enter Last Name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-4xl font-semibold mb-3 text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <div className="text-3xl p-6 border-4 border-gray-300 rounded-2xl bg-gray-50 text-gray-400">
                    +61
                  </div>
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
                        formatted =
                          digits.slice(0, 4) +
                          " " +
                          digits.slice(4, 7) +
                          " " +
                          digits.slice(7);
                      }

                      handleChange({
                        ...e,
                        target: { ...e.target, value: formatted, name: "phone" },
                      } as any);
                    }}
                    className="flex-1 text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                    placeholder="04XX XXX XXX"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-4xl font-semibold mb-3 text-gray-700">
                  Notes{" "}
                  <span className="text-gray-400 font-normal text-3xl">
                    (optional)
                  </span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black resize-none"
                  placeholder="Any additional details about your enquiry..."
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ──────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-6xl font-bold mb-8 text-gray-800">Review &amp; Confirm</h2>

                <div className="space-y-4 mb-8 bg-gray-50 p-8 rounded-2xl">
                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Enquiry Category:</span>
                    <span className="font-bold text-black">
                      {ENQUIRY_CATEGORIES.find((c) => c.value === formData.enquiryCategory)?.label ?? formData.enquiryCategory}
                    </span>
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

                  <div className="flex justify-between text-4xl">
                    <span className="font-semibold text-gray-600">Notes:</span>
                    <span className="font-bold text-black text-right max-w-[60%]">{formData.notes || "—"}</span>
                  </div>

                  {/* <div className="mt-6 p-6 bg-yellow-100 border-4 border-yellow-400 rounded-2xl">
                  <p className="text-3xl font-semibold text-yellow-800">
                    <span className="font-bold">NOTE:</span> Tap outside the box or scroll down to Continue.
                  </p>
                </div> */}

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


              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t-4 border-gray-200 px-10 py-16 shadow-lg">
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
              className={`flex-1 text-4xl font-bold py-8 px-10 rounded-2xl transition-all flex items-center justify-center gap-4 ${
                canProceed()
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continue
              <ChevronRight size={36} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 text-4xl font-bold py-8 px-10 rounded-2xl transition-all ${
                !isSubmitting
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT ENQUIRY"}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}