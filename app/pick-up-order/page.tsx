"use client";
import { useState } from "react";
import PickUpConfirmationModal from "../components/PickUpConfirmationModal";

export default function PickUpOrderForm() {
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

  const [showModal, setShowModal] = useState(false);


  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    // console.log("Form submitted:", formData);
    // alert("Order submitted successfully!");

    // Open the modal
    setShowModal(true);

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

  };

  const closeModal = () => setShowModal(false);

  const inputClass =
    "w-full px-6 md:px-10 py-6 md:py-8 border-2 border-gray-300 rounded-2xl text-2xl md:text-3xl text-black placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all";

  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-6 md:p-16">
      <div className="bg-white w-full max-w-4xl lg:max-w-6xl pt-10 md:pt-16">

        {/* Header */}
        <div className="flex justify-between items-center mb-12 md:mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-black">PICK UP ORDER</h1>

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

        {/* Phone Number */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">

            {/* Country code button */}
            <div className="relative">
              <button
                type="button"
                className="px-6 md:px-8 py-6 md:py-8 border-2 border-gray-300 rounded-2xl flex items-center gap-4 hover:bg-gray-50 w-full sm:w-auto"
              >
                <span className="text-3xl md:text-5xl text-black">🇦🇺</span>
                <svg
                  className="w-6 h-6 md:w-8 md:h-8 text-gray-400"
                  fill="none"
                  stroke="black"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Phone input */}
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>

        {/* Order Number */}
        <div className="mb-6 md:mb-8">
          <input
            type="text"
            name="orderNumber"
            placeholder="Order Number"
            value={formData.orderNumber}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Last 4 Digits */}
        <div className="mb-6 md:mb-8">
          <input
            type="text"
            name="creditCard"
            placeholder="Last 4 Digits of Credit Card"
            maxLength={4}
            value={formData.creditCard}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Valid ID */}
        <div className="mb-6 md:mb-8">
          <div className="relative">
            <select
              name="validId"
              value={formData.validId}
              onChange={handleChange}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Select Valid ID</option>
              <option value="drivers-license">Driver's License</option>
              <option value="passport">Passport</option>
              <option value="national-id">National ID</option>
            </select>

            <svg
              className="absolute right-8 md:right-10 top-1/2 -translate-y-1/2 w-6 md:w-8 h-6 md:h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6 md:mb-8">
          <div className="relative">
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Payment Method</option>
              <option value="credit-card">Credit Card</option>
              <option value="debit-card">Debit Card</option>
              <option value="cash">Cash</option>
            </select>

            <svg
              className="absolute right-8 md:right-10 top-1/2 -translate-y-1/2 w-6 md:w-8 h-6 md:h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Car Park Bay */}
        <div className="mb-10 md:mb-16">
          <input
            type="text"
            name="carParkBay"
            placeholder="Car Park Bay Number"
            value={formData.carParkBay}
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
      {/* PickUp Confirmation Modal */}
      {showModal && <PickUpConfirmationModal onClose={closeModal} />}
    </div>
  );
}



// "use client";
// import { useState } from 'react';

// export default function PickUpOrderForm() {
//   const [formData, setFormData] = useState({
//     fullName: '',
//     phone: '',
//     orderNumber: '',
//     creditCard: '',
//     validId: '',
//     paymentMethod: '',
//     carParkBay: '',
//     confirmed: false
//   });

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});

//   // const validateField = (name: string, value: string) => {
//   //   switch (name) {
//   //     case 'fullName':
//   //       if (!value.trim()) return 'Full name is required';
//   //       if (value.trim().length < 2) return 'Name must be at least 2 characters';
//   //       if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters';
//   //       return '';
      
//   //     case 'phone':
//   //       if (!value.trim()) return 'Phone number is required';
//   //       if (!/^\d{8,15}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid phone number';
//   //       return '';
      
//   //     case 'orderNumber':
//   //       if (!value.trim()) return 'Order number is required';
//   //       if (value.trim().length < 3) return 'Order number must be at least 3 characters';
//   //       return '';
      
//   //     case 'creditCard':
//   //       if (!value.trim()) return 'Last 4 digits are required';
//   //       if (!/^\d{4}$/.test(value)) return 'Must be exactly 4 digits';
//   //       return '';
      
//   //     case 'validId':
//   //       if (!value) return 'Please select a valid ID type';
//   //       return '';
      
//   //     case 'paymentMethod':
//   //       if (!value) return 'Please select a payment method';
//   //       return '';
      
//   //     case 'carParkBay':
//   //       if (!value.trim()) return 'Car park bay number is required';
//   //       return '';
      
//   //     case 'confirmed':
//   //       if (!value) return 'You must confirm the data is accurate';
//   //       return '';
      
//   //     default:
//   //       return '';
//   //   }
//   // };

//   const handleBlur = (e: { target: { name: any; }; }) => {
//     const { name } = e.target;
//     setTouched(prev => ({ ...prev, [name]: true }));
    
//     const error = validateField(name, formData[name]);
//     setErrors(prev => ({ ...prev, [name]: error }));
//   };

//   const handleChange = (e: { target: { name: any; value: any; type: any; checked: any; }; }) => {
//     const { name, value, type, checked } = e.target;
//     const newValue = type === 'checkbox' ? checked : value;
    
//     setFormData(prev => ({
//       ...prev,
//       [name]: newValue
//     }));

//     // Clear error when user starts typing
//     if (touched[name]) {
//       const error = validateField(name, newValue);
//       setErrors(prev => ({ ...prev, [name]: error }));
//     }
//   };

//   const handleSubmit = () => {
//     // Validate all fields
//     const newErrors = {};
//     const newTouched = {};
    
//     Object.keys(formData).forEach(key => {
//       newTouched[key] = true;
//       const error = validateField(key, formData[key]);
//       if (error) newErrors[key] = error;
//     });

//     setTouched(newTouched);
//     setErrors(newErrors);

//     // Check if there are any errors
//     if (Object.keys(newErrors).length === 0) {
//       console.log('Form submitted:', formData);
//       // Reset form after successful submission
//       setFormData({
//         fullName: '',
//         phone: '',
//         orderNumber: '',
//         creditCard: '',
//         validId: '',
//         paymentMethod: '',
//         carParkBay: '',
//         confirmed: false
//       });
//       setErrors({});
//       setTouched({});
//       alert('Order submitted successfully!');
//     }
//   };

//   const getInputClassName = (fieldName: string) => {
//     const baseClass = "w-full px-10 py-8 border-2 rounded-2xl text-3xl text-black placeholder-gray-400 focus:outline-none transition-all";
//     const hasError = touched[fieldName] && errors[fieldName];
    
//     if (hasError) {
//       return `${baseClass} border-red-500 focus:ring-4 focus:ring-red-300`;
//     }
//     return `${baseClass} border-gray-300 focus:ring-4 focus:ring-blue-500`;
//   };

//   return (
//     <div className="min-h-screen bg-white flex items-start justify-center p-16">
//       <div className="bg-white w-full max-w-6xl pt-16">
//         {/* Close Button */}
//         <div className="flex justify-between items-start mb-20">
//           <h1 className="text-6xl font-bold text-black">PICK UP ORDER</h1>
//           <a href='/' className="p-4 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
//             <svg className="w-12 h-12" fill="none" stroke="black" viewBox="0 0 24 24" strokeWidth={2.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </a>
//         </div>

//         {/* Form */}
//         <div>
//           <h2 className="text-5xl font-bold mb-16 text-black">Fill in the form</h2>
//           {/* Full Name */}
//           <div className="mb-8">
//             <input
//               type="text"
//               name="fullName"
//               placeholder="Full Name"
//               value={formData.fullName}
//               onChange={handleChange}
//               onBlur={handleBlur}
//               className={getInputClassName('fullName')}
//             />
//             {touched.fullName && errors.fullName && (
//               <p className="text-red-600 text-2xl mt-3 ml-2">{errors.fullName}</p>
//             )}
//           </div>

//           {/* Phone Number with Country Code */}
//           <div className="mb-8">
//             <div className="flex gap-6">
//               <div className="relative">
//                 <button
//                   type="button"
//                   className="px-8 py-8 border-2 border-gray-300 rounded-2xl flex items-center gap-4 hover:bg-gray-50"
//                 >
//                   <span className="text-5xl text-black">🇦🇺</span>
//                   <svg className="w-8 h-8 text-gray-400" fill="none" stroke="black" viewBox="0 0 24 24" strokeWidth={2.5}>
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//                   </svg>
//                 </button>
//               </div>
//               <input
//                 type="tel"
//                 name="phone"
//                 placeholder="Phone Number"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 className={getInputClassName('phone').replace('w-full', 'flex-1')}
//               />
//             </div>
//             {touched.phone && errors.phone && (
//               <p className="text-red-600 text-2xl mt-3 ml-2">{errors.phone}</p>
//             )}
//           </div>

//           {/* Order Number */}
//           <div className="mb-8">
//             <input
//               type="text"
//               name="orderNumber"
//               placeholder="Order Number**"
//               value={formData.orderNumber}
//               onChange={handleChange}
//               onBlur={handleBlur}
//               className={getInputClassName('orderNumber')}
//             />
//             {touched.orderNumber && errors.orderNumber && (
//               <p className="text-red-600 text-2xl mt-3 ml-2">{errors.orderNumber}</p>
//             )}
//           </div>

//           {/* Last 4 Digits of Credit Card */}
//           <div className="mb-8">
//             <input
//               type="text"
//               name="creditCard"
//               placeholder="Last 4 Digits of Credit Card**"
//               maxLength="4"
//               value={formData.creditCard}
//               onChange={handleChange}
//               onBlur={handleBlur}
//               className={getInputClassName('creditCard')}
//             />
//             {touched.creditCard && errors.creditCard && (
//               <p className="text-red-600 text-2xl mt-3 ml-2">{errors.creditCard}</p>
//             )}
//           </div>

//           {/* Select Valid ID */}
//           <div className="mb-8">
//             <div className="relative">
//               <select
//                 name="validId"
//                 value={formData.validId}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 className={getInputClassName('validId') + ' appearance-none'}
//               >
//                 <option value="">Select Valid ID</option>
//                 <option value="drivers-license">Driver's License</option>
//                 <option value="passport">Passport</option>
//                 <option value="national-id">National ID</option>
//               </select>
//               <svg className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//               </svg>
//             </div>
//             {touched.validId && errors.validId && (
//               <p className="text-red-600 text-2xl mt-3 ml-2">{errors.validId}</p>
//             )}
//           </div>

//           {/* Payment Method */}
//           <div className="mb-8">
//             <div className="relative">
//               <select
//                 name="paymentMethod"
//                 value={formData.paymentMethod}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 className={getInputClassName('paymentMethod') + ' appearance-none'}
//               >
//                 <option value="">Payment Method</option>
//                 <option value="credit-card">Credit Card</option>
//                 <option value="debit-card">Debit Card</option>
//                 <option value="cash">Cash</option>
//               </select>
//               <svg className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//               </svg>
//             </div>
//             {touched.paymentMethod && errors.paymentMethod && (
//               <p className="text-red-600 text-2xl mt-3 ml-2">{errors.paymentMethod}</p>
//             )}
//           </div>

//           {/* Car Park Bay Number */}
//           <div className="mb-16">
//             <input
//               type="text"
//               name="carParkBay"
//               placeholder="Car Park Bay Number**"
//               value={formData.carParkBay}
//               onChange={handleChange}
//               onBlur={handleBlur}
//               className={getInputClassName('carParkBay')}
//             />
//             {touched.carParkBay && errors.carParkBay && (
//               <p className="text-red-600 text-2xl mt-3 ml-2">{errors.carParkBay}</p>
//             )}
//           </div>

//           {/* Confirmation Checkbox */}
//           <div className="mb-12">
//             <label className="flex items-start gap-6 cursor-pointer">
//               <div className={`w-10 h-10 mt-1 border-2 rounded-lg flex items-center justify-center flex-shrink-0 ${
//                 touched.confirmed && errors.confirmed ? 'border-red-500' : 'border-gray-300'
//               }`}>
//                 <input
//                   type="checkbox"
//                   name="confirmed"
//                   checked={formData.confirmed}
//                   onChange={handleChange}
//                   onBlur={handleBlur}
//                   className="opacity-0 absolute"
//                 />
//                 {formData.confirmed && (
//                   <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                   </svg>
//                 )}
//               </div>
//               <span className="text-3xl leading-relaxed text-black">
//                 I confirm that all provided data is accurate and valid.
//               </span>
//             </label>
//             {touched.confirmed && errors.confirmed && (
//               <p className="text-red-600 text-2xl mt-3 ml-14">{errors.confirmed}</p>
//             )}
//           </div>

//           {/* Submit Button */}
//           <button
//             onClick={handleSubmit}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-4xl py-10 rounded-2xl transition-colors shadow-lg active:scale-98"
//           >
//             SUBMIT
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

