/**
 * To run this component, ensure you have Tailwind CSS loaded in your environment.
 */
"use client";
import { useState, useMemo } from 'react';

// 1. Define the interfaces and types for strong typing
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

type FormKey = keyof FormData;
// Partial<Record<...>> ensures keys match FormData keys, and values are strings (for errors) or booleans (for touched)
type FormErrors = Partial<Record<FormKey, string>>;
type FormTouched = Partial<Record<FormKey, boolean>>;

export default function PickUpOrderForm() {
  const initialFormData: FormData = {
    fullName: '',
    phone: '',
    orderNumber: '',
    creditCard: '',
    validId: '',
    paymentMethod: '',
    carParkBay: '',
    confirmed: false,
  };

  // 2. Explicitly type the state variables
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Custom hook replacement for alert()
  const displayMessage = (type: 'success' | 'error', text: string) => {
    setSubmitMessage({ type, text });
    setTimeout(() => setSubmitMessage(null), 4000); // Clear after 4 seconds
  }

  // Helper to validate a specific field
  const validateField = (name: FormKey, value: FormData[FormKey]): string => {
    // Note: We cast value to string for most cases, but handle boolean (confirmed) explicitly
    const stringValue = String(value);

    switch (name) {
      case 'fullName':
        if (!stringValue.trim()) return 'Full name is required';
        if (stringValue.trim().length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s]+$/.test(stringValue)) return 'Name can only contain letters';
        return '';

      case 'phone':
        if (!stringValue.trim()) return 'Phone number is required';
        if (!/^\d{8,15}$/.test(stringValue.replace(/\s/g, ''))) return 'Please enter a valid phone number (8-15 digits)';
        return '';

      case 'orderNumber':
        if (!stringValue.trim()) return 'Order number is required';
        if (stringValue.trim().length < 3) return 'Order number must be at least 3 characters';
        return '';

      case 'creditCard':
        if (!stringValue.trim()) return 'Last 4 digits are required';
        if (!/^\d{4}$/.test(stringValue)) return 'Must be exactly 4 digits';
        return '';

      case 'validId':
        if (!stringValue) return 'Please select a valid ID type';
        return '';

      case 'paymentMethod':
        if (!stringValue) return 'Please select a payment method';
        return '';

      case 'carParkBay':
        if (!stringValue.trim()) return 'Car park bay number is required';
        return '';

      case 'confirmed':
        // Handle boolean type specifically
        if (typeof value === 'boolean' && !value) return 'You must confirm the data is accurate';
        return '';

      default:
        return '';
    }
  };

  // Calculate if the form is generally valid
  const isFormValid = useMemo(() => {
    return Object.values(errors).every(error => !error) && 
           Object.keys(touched).length === Object.keys(formData).length; // Check if all are touched
  }, [errors, touched, formData]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    // 3. Cast the dynamic key access
    const name = e.target.name as FormKey;
    setTouched(prev => ({ ...prev, [name]: true }));

    const value = formData[name];
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    // 3. Cast the dynamic key access
    const fieldName = name as FormKey;
    
    const newValue: FormData[FormKey] = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [fieldName]: newValue,
    } as FormData)); // Assert type safety on setFormData

    // Validate if the field has been touched
    if (touched[fieldName]) {
      const error = validateField(fieldName, newValue);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: FormErrors = {};
    const newTouched: FormTouched = {};
    let hasError = false;

    (Object.keys(formData) as FormKey[]).forEach((key) => {
      newTouched[key] = true;
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        hasError = true;
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);

    // Check if there are any errors
    if (!hasError) {
      console.log('Form submitted:', formData);
      displayMessage('success', 'Order submitted successfully! We will be right out.');
      
      // Reset form
      setFormData(initialFormData);
      setErrors({});
      setTouched({});
    } else {
      displayMessage('error', 'Please correct the errors marked in red.');
    }
  };

  const getInputClassName = (fieldName: FormKey) => {
    const baseClass = "w-full px-10 py-8 border-2 rounded-2xl text-3xl placeholder-gray-400 focus:outline-none transition-all font-inter";
    const hasError = touched[fieldName] && errors[fieldName];
    
    if (hasError) {
      return `${baseClass} border-red-500 focus:ring-4 focus:ring-red-300`;
    }
    return `${baseClass} border-gray-300 focus:ring-4 focus:ring-blue-500`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-8 sm:p-12 md:p-16 font-inter">
      {/* Success/Error Message Box (Replaces alert) */}
      {submitMessage && (
        <div 
          className={`fixed top-4 right-4 p-6 rounded-xl shadow-2xl z-50 text-white text-3xl transition-all duration-300 transform ${
            submitMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{ minWidth: '300px' }}
        >
          <div className="flex items-center gap-4">
            {submitMessage.type === 'success' ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{submitMessage.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-6xl p-8 sm:p-12 md:p-16 lg:p-20 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900">PICK UP ORDER</h1>
          <a href='/' className="p-3 sm:p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-shrink-0">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </a>
        </div>

        {/* Form Section */}
        <form onSubmit={(e) => e.preventDefault()}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-gray-800">Fill in the data</h2>

          {/* Full Name */}
          <div className="mb-8">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClassName('fullName')}
            />
            {touched.fullName && errors.fullName && (
              <p className="text-red-600 text-xl sm:text-2xl mt-3 ml-2">{errors.fullName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="relative">
                <button
                  type="button"
                  className="px-6 py-8 sm:px-8 border-2 border-gray-300 rounded-2xl flex items-center gap-2 sm:gap-4 hover:bg-gray-50 flex-shrink-0"
                >
                  <span className="text-3xl sm:text-4xl text-gray-800">🇦🇺</span>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName('phone').replace('w-full', 'flex-1')}
              />
            </div>
            {touched.phone && errors.phone && (
              <p className="text-red-600 text-xl sm:text-2xl mt-3 ml-2">{errors.phone}</p>
            )}
          </div>

          {/* Order Number */}
          <div className="mb-8">
            <input
              type="text"
              name="orderNumber"
              placeholder="Order Number"
              value={formData.orderNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClassName('orderNumber')}
            />
            {touched.orderNumber && errors.orderNumber && (
              <p className="text-red-600 text-xl sm:text-2xl mt-3 ml-2">{errors.orderNumber}</p>
            )}
          </div>

          {/* Last 4 Digits of Credit Card */}
          <div className="mb-8">
            <input
              type="text"
              name="creditCard"
              placeholder="Last 4 Digits of Credit Card"
              maxLength={4}
              value={formData.creditCard}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClassName('creditCard')}
            />
            <p className="text-gray-500 text-xl mt-3 ml-2">**For verification of pre-paid orders only.</p>
            {touched.creditCard && errors.creditCard && (
              <p className="text-red-600 text-xl sm:text-2xl mt-3 ml-2">{errors.creditCard}</p>
            )}
          </div>

          {/* Select Valid ID */}
          <div className="mb-8">
            <div className="relative">
              <select
                name="validId"
                value={formData.validId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName('validId') + ' appearance-none'}
              >
                <option value="" disabled>Select Valid ID</option>
                <option value="drivers-license">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="national-id">National ID</option>
              </select>
              <svg className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {touched.validId && errors.validId && (
              <p className="text-red-600 text-xl sm:text-2xl mt-3 ml-2">{errors.validId}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="mb-8">
            <div className="relative">
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName('paymentMethod') + ' appearance-none'}
              >
                <option value="" disabled>Payment Method</option>
                <option value="credit-card">Credit Card</option>
                <option value="debit-card">Debit Card</option>
                <option value="cash">Cash</option>
              </select>
              <svg className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {touched.paymentMethod && errors.paymentMethod && (
              <p className="text-red-600 text-xl sm:text-2xl mt-3 ml-2">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Car Park Bay Number */}
          <div className="mb-12">
            <input
              type="text"
              name="carParkBay"
              placeholder="Car Park Bay Number"
              value={formData.carParkBay}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClassName('carParkBay')}
            />
            <p className="text-gray-500 text-xl mt-3 ml-2">**Where you are parked for delivery.</p>
            {touched.carParkBay && errors.carParkBay && (
              <p className="text-red-600 text-xl sm:text-2xl mt-3 ml-2">{errors.carParkBay}</p>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className="mb-12">
            <label className="flex items-start gap-4 cursor-pointer">
              <div className={`w-8 h-8 mt-1 border-2 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                touched.confirmed && errors.confirmed ? 'border-red-500 bg-red-50' : 'border-gray-300'
              } ${formData.confirmed ? 'bg-blue-600 border-blue-600' : 'bg-white hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  name="confirmed"
                  checked={formData.confirmed}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="opacity-0 absolute"
                />
                {formData.confirmed && (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-2xl sm:text-3xl leading-relaxed text-gray-700">
                I confirm that all provided data is accurate and valid.
              </span>
            </label>
            {touched.confirmed && errors.confirmed && (
              <p className="text-red-600 text-xl sm:text-2xl mt-3 ml-12">{errors.confirmed}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-3xl sm:text-4xl py-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.99]"
          >
            SUBMIT ORDER FOR PICK UP
          </button>
        </form>
      </div>
    </div>
  );
}