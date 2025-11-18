// "use client";
// import { useState } from "react";

// export default function ReturnAProductForm() {


//   const [formData, setFormData] = useState({
//     arrivalDate: "",
//     arrivalTime: "",
//     rmaID: "",
//     fullName: "",
//     carParkBay: "",
//     itemDescription:"",
//     confirmed: false,
//     heavy: false,
//   });

//   const handleChange = (e: any) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = () => {
//     console.log("Form submitted:", formData);
//     alert("Order submitted successfully!");

//     setFormData({
//       arrivalDate: "",
//       arrivalTime: "",
//       rmaID: "",
//       fullName: "",
//       carParkBay: "",
//       itemDescription:"",
//       confirmed: false,
//       heavy: false,
//     });

//     const now = new Date();

//     const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
//     const time = now.toTimeString().slice(0, 5); // HH:MM

//     setFormData((prev) => ({
//       ...prev,
//       arrivalDate: date,
//       arrivalTime: time,
//     }));
//   };

//   const inputClass =
//     "w-full px-6 md:px-10 py-6 md:py-8 border-2 border-gray-300 rounded-2xl text-2xl md:text-3xl text-black placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all";

//   return (
//     <div className="min-h-screen bg-white flex items-start justify-center p-6 md:p-16">
//       <div className="bg-white w-full max-w-4xl lg:max-w-6xl pt-10 md:pt-16">

//         {/* Header */}
//         <div className="flex justify-between items-center mb-12 md:mb-20">
//           <h1 className="text-4xl md:text-6xl font-bold text-black">RETURN A PRODUCT</h1>

//           <a
//             href="/choose-service"
//             className="p-3 md:p-4 bg-gray-100 rounded-xl md:rounded-2xl hover:bg-gray-200 transition-colors"
//           >
//             <svg
//               className="w-8 h-8 md:w-12 md:h-12"
//               fill="none"
//               stroke="black"
//               viewBox="0 0 24 24"
//               strokeWidth={2.5}
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </a>
//         </div>

//         {/* Form Section */}
//         <h2 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 text-black">
//           Fill in the form
//         </h2>

//         {/* Arrival Date + Arrival Time */}
//         <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-10 md:mb-14">

//           {/* Arrival Date */}
//           <div className="flex flex-col w-full">
//             <span className="text-xl md:text-3xl font-semibold text-black mb-3">
//               Arrival Date:
//             </span>

//             <span className="text-2xl md:text-3xl text-black tracking-wide">
//               {formData.arrivalDate || "--/--/----"}
//             </span>
//           </div>

//           {/* Arrival Time */}
//           <div className="flex flex-col w-full">
//             <span className="text-xl md:text-3xl font-semibold text-black mb-3">
//               Arrival Time:
//             </span>

//             <span className="text-2xl md:text-3xl text-black tracking-wide">
//               {formData.arrivalTime || "--:--"}
//             </span>
//           </div>
//         </div>


//         <div className="mb-6 md:mb-8">
//           <input
//             type="rmaID"
//             name="rmaID"
//             placeholder="RMA ID"
//             value={formData.rmaID}
//             onChange={handleChange}
//             className={inputClass}
//           />
//         </div>

//         {/* Full Name */}
//         <div className="mb-6 md:mb-8">
//           <input
//             type="text"
//             name="fullName"
//             placeholder="Full Name"
//             value={formData.fullName}
//             onChange={handleChange}
//             className={inputClass}
//           />
//         </div>

//         {/* Car Park Bay */}
//         <div className="mb-6 md:mb-8">
//           <input
//             type="text"
//             name="carParkBay"
//             placeholder="Car Park Bay Number"
//             value={formData.carParkBay}
//             onChange={handleChange}
//             className={inputClass}
//           />
//         </div>

//         {/* <div className="mb-10 md:mb-16">
//           <textarea
//             name="itemDescription"
//             placeholder="Item Description"
//             value={formData.itemDescription}
//             onChange={handleChange}
//             className={inputClass}
//           />
//         </div> */}

//         {/* <div className="mb-10 md:mb-12">
//           <label className="flex items-start gap-4 md:gap-6 cursor-pointer">
//             <div className="w-8 h-8 md:w-10 md:h-10 mt-1 border-2 border-gray-300 rounded-lg flex items-center justify-center relative">
//               <input
//                 type="button"
//                 name="heavy"
//                 checked={formData.heavy}
//                 onChange={handleChange}
//                 className="opacity-0 absolute inset-0"
//               />
//               {formData.confirmed && (
//                 <svg
//                   className="w-5 h-5 md:w-7 md:h-7 text-blue-600"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               )}
//             </div>

//             <button className="text-2xl md:text-3xl leading-relaxed text-black">
//               Heavy Item  need assistance/forklift assistance
//             </button>
//           </label>
//         </div> */}

//         {/* Heavy Item Toggle */}
//         <div className="mb-10 md:mb-12">
//           <button
//             type="button"
//             onClick={() =>
//               setFormData((prev) => ({ ...prev, heavy: !prev.heavy }))
//             }
//             className="flex items-center gap-4 md:gap-6 cursor-pointer"
//           >
//             <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
//               {formData.heavy && (
//                 <svg
//                   className="w-5 h-5 md:w-7 md:h-7 text-blue-600"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               )}
//             </div>

//             <span className="text-2xl md:text-3xl leading-relaxed text-black">
//               Heavy item – need assistance / forklift assistance
//             </span>
//           </button>
//         </div>


//         {/* Confirm Checkbox */}
//         <div className="mb-10 md:mb-12">
//           <label className="flex items-start gap-4 md:gap-6 cursor-pointer">
//             <div className="w-8 h-8 md:w-10 md:h-10 mt-1 border-2 border-gray-300 rounded-lg flex items-center justify-center relative">
//               <input
//                 type="checkbox"
//                 name="confirmed"
//                 checked={formData.confirmed}
//                 onChange={handleChange}
//                 className="opacity-0 absolute inset-0"
//               />
//               {formData.confirmed && (
//                 <svg
//                   className="w-5 h-5 md:w-7 md:h-7 text-blue-600"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               )}
//             </div>

//             <span className="text-2xl md:text-3xl leading-relaxed text-black">
//               I confirm that all provided data is accurate and valid.
//             </span>
//           </label>
//         </div>

//         {/* Submit Button */}
//         <button
//           onClick={handleSubmit}
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-3xl md:text-4xl py-8 md:py-10 rounded-2xl transition-colors shadow-lg active:scale-95"
//         >
//           SUBMIT
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";
import { useState, useRef } from 'react';
import { ChevronRight, Package, CreditCard, FileText, Car, Camera } from 'lucide-react';

interface FormData {
  fullName: string;
  phone: string;
  rmaID: string;
  carParkBay: string;
  itemIsHeavy: boolean;
  confirmed: boolean;
}

interface Errors {
  [key: string]: string;
}

export default function ReturnAProductForm() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    rmaID: "",
    carParkBay: "",
    itemIsHeavy: false,
    confirmed: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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


  const canProceed = () => {
    switch (step) {
      case 1: return formData.rmaID;
      case 2: return formData.fullName;
      case 3: return formData.confirmed && formData.carParkBay;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    const newErrors: Errors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.rmaID.trim()) newErrors.rmaID = "RMA ID is required";
    if (!formData.carParkBay.trim()) newErrors.carParkBay = "Car park bay is required";
    if (!formData.confirmed) newErrors.confirmed = "You must confirm the data";

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
            <p className="text-3xl text-gray-600 mb-8">Your order return request has been submitted</p>
            <div className="bg-blue-50 rounded-3xl p-8 border-4 border-blue-200">
              <p className="text-2xl text-gray-700 mb-2">RMA ID:</p>
              <p className="text-5xl font-bold text-blue-600">{formData.rmaID}</p>
            </div>
            <p className="text-2xl text-gray-500 mt-8">Redirecting to main menu...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 text-white p-8 shadow-lg px-10 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-7xl font-bold mb-2">Return a Product</h1>
          <p className="text-4xl text-blue-100">Mills Click & Collect - Return</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {[
            { num: 1, label: 'Verify RMA ID', icon: Package },
            { num: 2, label: 'Information', icon: CreditCard },
            { num: 3, label: 'Confirm', icon: FileText }
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

          {/* Step 1: Verify RMA ID */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-5xl font-bold mb-8 text-gray-800">Enter Your RMA ID</h2>

                <div className="space-y-10">
                  <div>
                    <label className="block text-4xl font-semibold mb-4 text-gray-700">RMA ID</label>
                    <input
                      type="text"
                      name="rmaID"
                      value={formData.rmaID}
                      onChange={handleChange}
                      className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                      placeholder="e.g., ORD-12345"
                    />
                    {errors.rmaID && <p className="text-red-600 text-xl mt-2">{errors.rmaID}</p>}
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


          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-6xl font-bold mb-8 text-gray-800">Review & Confirm</h2>

                <div className="space-y-4 mb-8 bg-gray-50 p-8 rounded-2xl">
                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Order Number:</span>
                    <span className="font-bold text-black">{formData.rmaID}</span>
                  </div>
                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Name:</span>
                    <span className="font-bold text-black">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between text-4xl border-b border-gray-200 pb-4">
                    <span className="font-semibold text-gray-600">Phone:</span>
                    <span className="font-bold text-black">{formData.phone}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-4xl font-semibold mb-4 text-gray-700">Car Park Bay Number</label>
                  <input
                    type="number"
                    name="carParkBay"
                    value={formData.carParkBay}
                    onChange={handleChange}
                    className="w-full text-4xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black"
                    placeholder="e.g., Bay 15"
                  />
                  {errors.carParkBay && <p className="text-red-600 text-xl mt-2">{errors.carParkBay}</p>}
                </div>

                <div className="mb-8 flex flex-col gap-4">
                  <label className="flex items-start gap-6 p-6 bg-blue-50 border-4 border-blue-300 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    name="itemIsHeavy"
                    checked={formData.itemIsHeavy}
                    onChange={handleChange}
                    className="w-12 h-12 mt-1"
                  />
                  <span className="text-3xl font-semibold text-gray-800">
                    My item is heavy and I need assistance/forklift assistance.
                  </span>
                </label>
                {errors.confirmed && <p className="text-red-600 text-xl mt-2">{errors.itemIsHeavy}</p>}

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
            </div>
          )}

        </div>
      </div>

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
              {isSubmitting ? "SUBMITTING..." : "SUBMIT RETURN REQUEST"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}