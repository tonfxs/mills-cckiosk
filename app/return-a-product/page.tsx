"use client";
import { useState } from "react";

export default function ReturnAProductForm() {

    
  const [formData, setFormData] = useState({
    arrivalDate: "",
    arrivalTime: "",
    rmaID: "",
    fullName: "",
    carParkBay: "",
    itemDescription:"",
    confirmed: false,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    alert("Order submitted successfully!");

    setFormData({
      arrivalDate: "",
      arrivalTime: "",
      rmaID: "",
      fullName: "",
      carParkBay: "",
      itemDescription:"",
      confirmed: false,
    });

    const now = new Date();

    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = now.toTimeString().slice(0, 5); // HH:MM

    setFormData((prev) => ({
      ...prev,
      arrivalDate: date,
      arrivalTime: time,
    }));
  };

  const inputClass =
    "w-full px-6 md:px-10 py-6 md:py-8 border-2 border-gray-300 rounded-2xl text-2xl md:text-3xl text-black placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all";

  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-6 md:p-16">
      <div className="bg-white w-full max-w-4xl lg:max-w-6xl pt-10 md:pt-16">

        {/* Header */}
        <div className="flex justify-between items-center mb-12 md:mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-black">RETURN A PRODUCT</h1>

          <a
            href="/choose-service"
            className="p-3 md:p-4 bg-gray-100 rounded-xl md:rounded-2xl hover:bg-gray-200 transition-colors"
          >
            <svg
              className="w-8 h-8 md:w-12 md:h-12"
              fill="none"
              stroke="black"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </a>
        </div>

        {/* Form Section */}
        <h2 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 text-black">
          Fill in the form
        </h2>

        {/* Arrival Date + Arrival Time */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-10 md:mb-14">
        
          {/* Arrival Date */}
          <div className="flex flex-col w-full">
            <span className="text-xl md:text-3xl font-semibold text-black mb-3">
              Arrival Date:
            </span>
        
            <span className="text-2xl md:text-3xl text-black tracking-wide">
              {formData.arrivalDate || "--/--/----"}
            </span>
          </div>
        
          {/* Arrival Time */}
          <div className="flex flex-col w-full">
            <span className="text-xl md:text-3xl font-semibold text-black mb-3">
              Arrival Time:
            </span>
        
            <span className="text-2xl md:text-3xl text-black tracking-wide">
              {formData.arrivalTime || "--:--"}
            </span>
          </div>
        </div>
        

        <div className="mb-6 md:mb-8">
          <input
            type="rmaID"
            name="rmaID"
            placeholder="RMA ID"
            value={formData.rmaID}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Full Name */}
        <div className="mb-6 md:mb-8">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Car Park Bay */}
        <div className="mb-6 md:mb-8">
          <input
            type="text"
            name="carParkBay"
            placeholder="Car Park Bay Number"
            value={formData.carParkBay}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="mb-10 md:mb-16">
          <textarea
            name="itemDescription"
            placeholder="Item Description"
            value={formData.itemDescription}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Confirm Checkbox */}
        <div className="mb-10 md:mb-12">
          <label className="flex items-start gap-4 md:gap-6 cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 mt-1 border-2 border-gray-300 rounded-lg flex items-center justify-center relative">
              <input
                type="checkbox"
                name="confirmed"
                checked={formData.confirmed}
                onChange={handleChange}
                className="opacity-0 absolute inset-0"
              />
              {formData.confirmed && (
                <svg
                  className="w-5 h-5 md:w-7 md:h-7 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            <span className="text-2xl md:text-3xl leading-relaxed text-black">
              I confirm that all provided data is accurate and valid.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-3xl md:text-4xl py-8 md:py-10 rounded-2xl transition-colors shadow-lg active:scale-95"
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
}