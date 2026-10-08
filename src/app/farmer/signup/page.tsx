'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFarmer } from '@/context/FarmerContext';
import { FarmingMethod } from '@/types';
import FarmerAvatar from '@/components/common/FarmerAvatar';
import {
  Leaf,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Tractor,
  User,
  UploadCloud,
  FileCheck,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Sparkles,
  Camera,
  Layers,
  FileText,
  Trash2,
} from 'lucide-react';

interface MockFile {
  name: string;
  size: string;
  previewUrl?: string;
}

export default function FarmerSignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { showToast } = useFarmer();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profilePhotoName, setProfilePhotoName] = useState('');

  // Step 2 Fields
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [farmingMethod, setFarmingMethod] = useState<'Organic' | 'Natural' | 'Conventional' | 'Mixed'>('Organic');
  const [yearsFarming, setYearsFarming] = useState<string>('5');
  const [mainCrops, setMainCrops] = useState('');
  const [farmDescription, setFarmDescription] = useState('');

  // Step 3 Mock Uploads
  const [govtIdFile, setGovtIdFile] = useState<MockFile | null>(null);
  const [ownershipDocFile, setOwnershipDocFile] = useState<MockFile | null>(null);
  const [farmPhotoFile, setFarmPhotoFile] = useState<MockFile | null>(null);

  // Step 4 Review & Confirmation
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      showToast('Please upload a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB.', 'error');
      return;
    }
    setProfilePhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePhoto(reader.result);
        showToast('Profile photo attached!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('');
    setProfilePhotoName('');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
    showToast('Profile photo removed.', 'info');
  };

  // Demo Auto-fill helpers
  const handleFillDemoStep1 = () => {
    setFullName('Ramesh Chandra Gowda');
    setEmail('ramesh.gowda@krishifarm.in');
    setPhone('9845012890');
    setPassword('krishi2026');
    setConfirmPassword('krishi2026');
    setErrors({});
    showToast('Sample personal details populated!', 'info');
  };

  const handleFillDemoStep2 = () => {
    setFarmName('Kaveri Organic Meadows');
    setFarmLocation('Survey No. 42/B, Gunjur Village, Varthur Hobli');
    setCity('Bengaluru');
    setState('Karnataka');
    setPincode('560087');
    setFarmingMethod('Organic');
    setYearsFarming('8');
    setMainCrops('Tomatoes, Spinach, Capsicum, Carrots');
    setFarmDescription('Certified organic farm practicing zero-chemical regenerative soil farming.');
    setErrors({});
    showToast('Sample farm details populated!', 'info');
  };

  // Validation functions
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName || !fullName.trim()) {
      errs.fullName = 'Full name is required';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    // Normalizing phone number (strip whitespace, hyphens, and country code +91 / 0)
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (!phone || !phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (cleanPhone.length !== 10) {
      errs.phone = 'Phone number must be a 10-digit mobile number';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm password is required';
    } else if (password && confirmPassword && password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!farmName || !farmName.trim()) errs.farmName = 'Farm name is required';
    if (!farmLocation || !farmLocation.trim()) errs.farmLocation = 'Farm location is required';
    if (!city || !city.trim()) errs.city = 'City is required';
    if (!state || !state.trim()) errs.state = 'State is required';
    const cleanPin = pincode.replace(/[^0-9]/g, '');
    if (!pincode || !pincode.trim()) {
      errs.pincode = 'Pincode is required';
    } else if (cleanPin.length !== 6) {
      errs.pincode = 'Please enter a valid 6-digit pincode';
    }
    if (!mainCrops || !mainCrops.trim()) errs.mainCrops = 'Please list at least one crop';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep === 1) {
      if (validateStep1()) {
        setErrors({});
        setCurrentStep(2);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast('Please complete all required fields on Step 1', 'error');
        if (typeof window !== 'undefined') window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setErrors({});
        setCurrentStep(3);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast('Please complete all required fields on Step 2', 'error');
        if (typeof window !== 'undefined') window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    } else if (currentStep === 3) {
      setErrors({});
      setCurrentStep(4);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: 1 | 2 | 3 | 4) => {
    if (step === currentStep) return;
    if (step < currentStep) {
      setErrors({});
      setCurrentStep(step);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Navigating forward requires validation of current step
    if (currentStep === 1) {
      if (validateStep1()) {
        setErrors({});
        setCurrentStep(step);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast('Please complete Step 1 before proceeding', 'warning');
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setErrors({});
        setCurrentStep(step);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast('Please complete Step 2 before proceeding', 'warning');
      }
    } else {
      setErrors({});
      setCurrentStep(step);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Mock File Upload handlers
  const handleSelectMockGovtId = () => {
    setGovtIdFile({
      name: 'Aadhaar_Government_ID_Scanned.pdf',
      size: '1.4 MB',
    });
  };

  const handleSelectMockOwnership = () => {
    setOwnershipDocFile({
      name: 'Land_Pahani_RTC_Extract_78B.pdf',
      size: '2.1 MB',
    });
  };

  const handleSelectMockPhoto = () => {
    setFarmPhotoFile({
      name: 'Green_Valley_Sunrise_Polyhouse.jpg',
      size: '3.6 MB',
      previewUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    });
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedAccuracy) {
      setErrors({ confirmation: 'Please confirm that the information provided is accurate.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const cropsArray = mainCrops.split(',').map((c) => c.trim()).filter(Boolean);

    try {
      const signupResult = await signup({
        fullName,
        email,
        phone,
        password,
        profilePhoto: profilePhoto || undefined,
        farmName,
        farmLocation,
        city,
        state,
        pincode,
        farmingMethod: farmingMethod as FarmingMethod,
        yearsFarming: Number(yearsFarming) || 1,
        mainCrops: cropsArray,
        farmDescription: farmDescription || `${farmName} grows fresh natural produce for the local community.`,
        govtIdFileName: govtIdFile?.name || 'Aadhaar_ID.pdf',
        ownershipDocFileName: ownershipDocFile?.name || 'Land_Verification.pdf',
        farmPhotoUrl: farmPhotoFile?.previewUrl || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
      });

      if (signupResult.success) {
        setIsSubmitted(true);
        showToast('Registration submitted! Account verification is now Pending.', 'info');
      } else {
        showToast(signupResult.error || 'Registration failed. Please check your details and try again.', 'error');
        setErrors({ confirmation: signupResult.error || 'Registration failed. Please check your details and try again.' });
      }
    } catch (error: any) {
      console.error('Registration submission error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred during registration.';
      showToast(errorMessage, 'error');
      setErrors({ confirmation: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // REGISTRATION SUCCESS SCREEN (Section 3)
  // ==========================================
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-earth-50/70 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl w-full mx-auto my-auto">
          <div className="bg-white rounded-3xl border border-earth-200 shadow-2xl p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                ✓ Registration Submitted Successfully
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
                Registration submitted successfully.
              </h1>
            </div>

            {/* Verification Status Pill */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Verification Status
              </div>
              <div className="text-base font-extrabold text-amber-950 flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>🟡 Pending Admin Approval</span>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              <p>
                Your Farmer profile is currently under review by our Admin team.
              </p>
              <p className="font-medium text-amber-900">
                Please login after registration to check your verification status.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/farmer/login"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Go to Farmer Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-earth-300 hover:bg-earth-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MULTI-STEP REGISTRATION FORM (Section 2)
  // ==========================================
  return (
    <div className="min-h-screen bg-earth-50/70 p-4 sm:p-6 lg:p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/farmer/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-earth-200 px-3.5 py-2 rounded-2xl shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-forest-800 text-white flex items-center justify-center font-bold">
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-extrabold text-slate-900 text-sm font-serif">
              Krishi<span className="text-forest-700 font-sans">Market</span>
            </div>
          </Link>
        </div>

        {/* Step Indicator Progress Bar (Interactive) */}
        <div className="bg-white rounded-3xl border border-earth-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Step {currentStep} of 4</span>
            <span className="text-forest-800 font-semibold">
              {currentStep === 1 && '1. Personal Information'}
              {currentStep === 2 && '2. Farm Information'}
              {currentStep === 3 && '3. Verification Documents'}
              {currentStep === 4 && '4. Final Review'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => goToStep(step as 1 | 2 | 3 | 4)}
                title={`Go to Step ${step}`}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentStep >= step ? 'bg-forest-800 hover:bg-forest-900' : 'bg-earth-200 hover:bg-earth-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-earth-200 shadow-xl p-6 sm:p-10 space-y-6">
          <div>
            <span className="text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200 uppercase tracking-wider inline-block mb-1">
              Farmer Onboarding
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
              Join Krishi Market as a Farmer
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Connect directly with customers and grow your farm business.
            </p>
          </div>

          {/* ========================================== */}
          {/* STEP 1: Personal Information */}
          {/* ========================================== */}
          {currentStep === 1 && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-earth-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
                  <User className="w-4 h-4" />
                  <span>Step 1 — Personal Information</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoStep1}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-800 border border-emerald-200 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fill Demo Details</span>
                </button>
              </div>

              {/* Validation alert banner if errors exist */}
              {Object.keys(errors).some((k) => errors[k]) && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in-50 duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Please complete the required information below:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-rose-700">
                      {Object.entries(errors)
                        .filter(([, msg]) => Boolean(msg))
                        .map(([k, msg]) => (
                          <li key={k}>{msg}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Profile Photo Upload */}
              <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <FarmerAvatar
                    src={profilePhoto}
                    name={fullName || 'Farmer'}
                    className="w-16 h-16 rounded-2xl shadow-sm text-lg border-2 border-forest-200"
                    size={64}
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Profile Photo</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-earth-200/70 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {profilePhotoName ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[180px]">{profilePhotoName}</span>
                        </span>
                      ) : (
                        'JPG, PNG, or WebP up to 5MB. Initials used if skipped.'
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white border border-earth-300 hover:bg-earth-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra Gowda"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                  }`}
                />
                {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh.gowda@krishifarm.in"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium ${
                      errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number (10 Digits) *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 98450 12890"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium ${
                      errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                    }`}
                  />
                  {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      className={`w-full px-3.5 pr-10 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-mono ${
                        errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-mono ${
                      errors.confirmPassword ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                {Object.keys(errors).length > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 w-full sm:w-auto">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Please complete the required fields above</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 hidden sm:block">
                    Step 1 of 4: Personal Details
                  </div>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleFillDemoStep1}
                    className="px-4 py-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fill Demo</span>
                  </button>

                  <button
                    type="button"
                    id="btn-continue-step-1"
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Continue to Farm Info</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 2: Farm Information */}
          {/* ========================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-earth-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
                  <Tractor className="w-4 h-4" />
                  <span>Step 2 — Farm Information</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoStep2}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-800 border border-emerald-200 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fill Demo Details</span>
                </button>
              </div>

              {/* Validation alert banner if errors exist */}
              {Object.keys(errors).some((k) => errors[k]) && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in-50 duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Please complete the required farm information below:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-rose-700">
                      {Object.entries(errors)
                        .filter(([, msg]) => Boolean(msg))
                        .map(([k, msg]) => (
                          <li key={k}>{msg}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kaveri Organic Meadows"
                  value={farmName}
                  onChange={(e) => {
                    setFarmName(e.target.value);
                    if (errors.farmName) setErrors((prev) => ({ ...prev, farmName: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium ${
                    errors.farmName ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                  }`}
                />
                {errors.farmName && <p className="text-[11px] text-rose-600 mt-1">{errors.farmName}</p>}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Location / Address *</label>
                <input
                  type="text"
                  placeholder="e.g. Survey No. 42/B, Gunjur Village, Varthur Hobli"
                  value={farmLocation}
                  onChange={(e) => {
                    setFarmLocation(e.target.value);
                    if (errors.farmLocation) setErrors((prev) => ({ ...prev, farmLocation: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium ${
                    errors.farmLocation ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                  }`}
                />
                {errors.farmLocation && <p className="text-[11px] text-rose-600 mt-1">{errors.farmLocation}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State *</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      if (errors.state) setErrors((prev) => ({ ...prev, state: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode (6 Digits) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 560087"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 font-medium ${
                      errors.pincode ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                    }`}
                  />
                  {errors.pincode && <p className="text-[11px] text-rose-600 mt-1">{errors.pincode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Farming Method *</label>
                  <select
                    value={farmingMethod}
                    onChange={(e) =>
                      setFarmingMethod(e.target.value as 'Organic' | 'Natural' | 'Conventional' | 'Mixed')
                    }
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    <option value="Organic">Organic (Certified Chemical-Free)</option>
                    <option value="Natural">Natural (Zero Budget Natural Farming)</option>
                    <option value="Conventional">Conventional</option>
                    <option value="Mixed">Mixed Farming</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Years of Farming Experience *</label>
                  <select
                    value={yearsFarming}
                    onChange={(e) => setYearsFarming(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    <option value="1">1 – 2 Years</option>
                    <option value="3">3 – 5 Years</option>
                    <option value="8">6 – 10 Years</option>
                    <option value="15">10+ Years (Generational)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Main Crops Grown *</label>
                <input
                  type="text"
                  placeholder="e.g. Tomatoes, Palak, Baby Carrots, Cucumbers"
                  value={mainCrops}
                  onChange={(e) => {
                    setMainCrops(e.target.value);
                    if (errors.mainCrops) setErrors((prev) => ({ ...prev, mainCrops: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-2xl text-slate-900 font-medium ${
                    errors.mainCrops ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                  }`}
                />
                {errors.mainCrops && <p className="text-[11px] text-rose-600 mt-1">{errors.mainCrops}</p>}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe your soil, seed choices, and harvesting practices."
                  value={farmDescription}
                  onChange={(e) => setFarmDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-earth-50 border border-earth-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-earth-300 text-slate-700 font-bold text-xs hover:bg-earth-100 transition-colors cursor-pointer"
                >
                  Back
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleFillDemoStep2}
                    className="px-4 py-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fill Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 3: Verification (Mock Uploads) */}
          {/* ========================================== */}
          {currentStep === 3 && (
            <div className="space-y-5 text-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
                <ShieldCheck className="w-4 h-4" />
                <span>Step 3 — Verification Documents</span>
              </div>

              <p className="text-slate-500">
                Upload your identification and land documents. This helps verify your farm badge on the marketplace.
                <span className="text-forest-700 font-semibold block mt-0.5">
                  (Frontend Mock Upload: Click &ldquo;Upload&rdquo; to simulate document attachment).
                </span>
              </p>

              {/* 1. Government ID */}
              <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-800/10 text-forest-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Government ID (Aadhaar / Voter ID)</div>
                    <div className="text-[11px] text-slate-500">
                      {govtIdFile ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{govtIdFile.name} ({govtIdFile.size})</span>
                        </span>
                      ) : (
                        'PNG, JPG, or PDF up to 10MB'
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSelectMockGovtId}
                  className="px-4 py-2 rounded-xl bg-white border border-earth-300 hover:bg-earth-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{govtIdFile ? 'Change File' : 'Upload ID'}</span>
                </button>
              </div>

              {/* 2. Farm Ownership / Verification Document */}
              <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-800/10 text-forest-800 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Farm Ownership / Land RTC Extract</div>
                    <div className="text-[11px] text-slate-500">
                      {ownershipDocFile ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{ownershipDocFile.name} ({ownershipDocFile.size})</span>
                        </span>
                      ) : (
                        'Pahani RTC or Organic Certification PDF'
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSelectMockOwnership}
                  className="px-4 py-2 rounded-xl bg-white border border-earth-300 hover:bg-earth-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{ownershipDocFile ? 'Change File' : 'Upload Record'}</span>
                </button>
              </div>

              {/* 3. Farm Photo */}
              <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {farmPhotoFile?.previewUrl ? (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-forest-300">
                      <Image
                        src={farmPhotoFile.previewUrl}
                        alt="Farm Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-forest-800/10 text-forest-800 flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900">Farm Photo / Packhouse View</div>
                    <div className="text-[11px] text-slate-500">
                      {farmPhotoFile ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{farmPhotoFile.name}</span>
                        </span>
                      ) : (
                        'Clear photo of your farm plot or polyhouse'
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSelectMockPhoto}
                  className="px-4 py-2 rounded-xl bg-white border border-earth-300 hover:bg-earth-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{farmPhotoFile ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-2xl border border-earth-300 text-slate-700 font-bold text-xs hover:bg-earth-100 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Continue to Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 4: Review and Submit */}
          {/* ========================================== */}
          {currentStep === 4 && (
            <form onSubmit={handleSubmitRegistration} className="space-y-5 text-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
                <CheckCircle2 className="w-4 h-4" />
                <span>Step 4 — Review Your Application</span>
              </div>

              {/* Review Summary Grid */}
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Personal Details</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-forest-700 hover:underline text-[11px]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3 py-1">
                    <FarmerAvatar
                      src={profilePhoto}
                      name={fullName || 'Farmer'}
                      className="w-11 h-11 rounded-xl shadow-2xs text-xs border border-earth-300"
                      size={44}
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {profilePhoto ? 'Uploaded Profile Photo' : 'Initials Avatar (Generated)'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {profilePhoto ? profilePhotoName || 'Custom photo attached' : 'Initials will display across portal'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 pt-1 border-t border-earth-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                      <span className="font-semibold text-slate-800">{fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                      <span className="font-semibold text-slate-800">{email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                      <span className="font-semibold text-slate-800">{phone}</span>
                    </div>
                  </div>
                </div>

                {/* Farm Details */}
                <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Farm & Agriculture</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-forest-700 hover:underline text-[11px]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Farm Name & Location</span>
                      <span className="font-semibold text-slate-800">{farmName} ({farmLocation}, {city})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Farming Method</span>
                      <span className="font-semibold text-emerald-800">{farmingMethod} ({yearsFarming}+ years experience)</span>
                    </div>
                  </div>
                  <div className="pt-1 text-slate-600">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Main Crops</span>
                    <span className="font-semibold text-slate-800">{mainCrops}</span>
                  </div>
                </div>

                {/* Documents Checklist */}
                <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Verification Documents</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-forest-700 hover:underline text-[11px]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                      <span>{govtIdFile?.name || 'Aadhaar ID Attached'}</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                      <span>{ownershipDocFile?.name || 'Land RTC Attached'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Accuracy Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={confirmedAccuracy}
                    onChange={(e) => setConfirmedAccuracy(e.target.checked)}
                    className="accent-forest-700 rounded w-4 h-4 mt-0.5"
                  />
                  <span className="font-semibold leading-relaxed">
                    I confirm that the information provided is accurate and represents genuine agricultural cultivation in Karnataka.
                  </span>
                </label>
                {errors.confirmation && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.confirmation}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-2xl border border-earth-300 text-slate-700 font-bold text-xs hover:bg-earth-100 transition-colors cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-forest-900/10 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <span>Submit Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
