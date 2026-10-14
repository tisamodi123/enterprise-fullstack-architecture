'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../../services/auth.service';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShieldAlert, KeyRound, ArrowLeft } from 'lucide-react';

// 🛡️ Zod Schemas for Client Side Checks
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().optional(),
});

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false); // 🔄 Controls which form is visible
  const [userEmail, setUserEmail] = useState('');          // 🔒 Keeps email safe for Step 2
  const [isPasswordless, setIsPasswordless] = useState(false); //password-less login
  const [loading, setLoading] = useState(false);

  // Forms Hook Setup
  const loginForm = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const forgotForm = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });

  const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema) });

  // 🚪 STEP 1: Login Submit (Password Verification -> Trigger OTP)
  // const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
  //   setLoading(true);
  //   try {
  //     const res = await authService.login(values);
  //     if (res.status === 'success') {
  //       toast.success('OTP sent to your email!');
  //       setUserEmail(values.email); // Save email for the next OTP endpoint call 🔑
  //       setShowOtpField(true);      // 🔄 Toggle screen to OTP entry layout
  //     }
  //   } catch (err: any) {
  //     toast.error(err.response?.data?.message || 'Login Failed');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  //password-less login
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
  if (!isPasswordless && (!values.password || values.password.length < 6)) {
    loginForm.setError('password', { type: 'manual', message: 'Password must be at least 6 characters' });
    return;
  }
  setLoading(true);
  try {
    let res;
    if (isPasswordless) {
      // Agar modern mode active hai toh sirf email bhejenge
       res = await authService.passwordlessLogin({ email: values.email });
    } else {
      // Purana password flow
      res = await authService.login(values);
    }

    if (res.status === 'success') {
      toast.success('Magic OTP fired up successfully!');
      setUserEmail(values.email);
      setShowOtpField(true); // Direct move to verification step!
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Authentication Failed');
  } finally {
    setLoading(false);
  }
};

  // 🔥 STEP 2: Handle Final OTP Verification Submit
  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    setLoading(true);
    try {
      // Formatted precisely to match your payload: Record<string, string> signature
      const res = await authService.verifyOTP({ email: userEmail, otp: values.otp });
      if (res.status === 'success') {
        localStorage.setItem('admin_user', JSON.stringify(res.data.user));
        toast.success('Authentication Successful! Welcome Admin.');
        router.push('/dashboard'); // 🚀 Safe Entry to Protected Dashboard
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or Expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // ✉️ Execution: Send Forgot Link
  const onForgotSubmit = async (values: z.infer<typeof forgotSchema>) => {
    setLoading(true);
    try {
      const res = await authService.forgotPassword(values.email);
      if (res.status === 'success' || res.errorCode === 200) {
        toast.success(res.message || 'Reset link dispatched!');
        setIsForgotOpen(false);
        forgotForm.reset();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification Error');
    } finally {
      setLoading(false);
    }
  };

  // return (

  //   <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 font-sans text-slate-100">
  //     <Toaster position="top-right" />

  //     <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">

  //       {/* 🔄 Dynamic Heading Section */}
  //       <div className="text-center mb-8">
  //         <h2 className="text-3xl font-extrabold text-white tracking-tight">
  //           {showOtpField ? '🔒 Two-Factor Auth' : '🔑 Admin Panel'}
  //         </h2>
  //         <p className="text-slate-400 text-sm mt-1">
  //           {showOtpField ? `Enter the verification code sent to ${userEmail}` : 'Sign in to control your system operations'}
  //         </p>
  //       </div>

  //       {/* 🔄 CONDITIONAL VIEW SWITCHING ENGINE */}
  //       {!showOtpField ? (
  //         /* ==================== 🔑 VIEW A: EMAIL & PASSWORD FORM ==================== */
  //         <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
  //           <div>
  //             <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
  //             <div className="relative mt-1">
  //               <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
  //               <input {...loginForm.register('email')} type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-cyan-500" placeholder="admin@kavera.com" />
  //             </div>
  //             {loginForm.formState.errors.email && <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.email.message}</p>}
  //           </div>

  //           <div>
  //             <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
  //             <div className="relative mt-1">
  //               <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
  //               <input {...loginForm.register('password')} type={showPassword ? 'text' : 'password'} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 pr-10 text-white focus:outline-none focus:border-cyan-500" placeholder="••••••••" />
  //               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
  //                 {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
  //               </button>
  //             </div>
  //             {loginForm.formState.errors.password && <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.password.message}</p>}
  //           </div>

  //           <div className="flex justify-end">
  //             <button type="button" onClick={() => setIsForgotOpen(true)} className="text-xs text-cyan-400 hover:underline">Forgot Password?</button>
  //           </div>

  //           <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg font-bold transition disabled:bg-cyan-800">
  //             {loading ? 'Processing...' : 'Sign In'}
  //           </button>
  //         </form>
  //       ) : (
  //         /* ==================== 🔒 VIEW B: 6-DIGIT OTP VERIFICATION FORM ==================== */
  //         <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
  //           <div>
  //             <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
  //               Secure Authentication Token
  //             </label>
  //             <div className="relative mt-1">
  //               <KeyRound className="absolute left-4 top-3.5 h-6 w-6 text-emerald-500" />
  //               <input
  //                 {...otpForm.register('otp')}
  //                 type="text"
  //                 maxLength={6}
  //                 placeholder="000000"
  //                 className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-12 text-center text-2xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-emerald-500"
  //               />
  //             </div>
  //             {otpForm.formState.errors.otp && <p className="text-red-400 text-xs text-center mt-2">{otpForm.formState.errors.otp.message}</p>}
  //           </div>

  //           <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg font-bold transition disabled:bg-emerald-800">
  //             {loading ? 'Verifying...' : 'Verify & Open System'}
  //           </button>

  //           <button
  //             type="button"
  //             onClick={() => { setShowOtpField(false); otpForm.reset(); }}
  //             className="flex items-center justify-center space-x-1 w-full text-center text-xs text-slate-400 hover:text-white transition mt-2"
  //           >
  //             <ArrowLeft className="h-3.5 w-3.5" />
  //             <span>Back to credentials login</span>
  //           </button>
  //         </form>
  //       )}
  //     </div>

  //     {/* 🛡️ FORGOT PASSWORD MODAL */}
  //     {isForgotOpen && (
  //       <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4">
  //         <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
  //           <div className="flex items-center space-x-2 text-cyan-400 mb-3">
  //             <ShieldAlert className="h-6 w-5" />
  //             <h3 className="text-lg font-bold text-white">Recover Password</h3>
  //           </div>
  //           <p className="text-xs text-slate-400 mb-4">Enter your admin email and your senior's router configuration will fire a token link immediately.</p>

  //           <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
  //             <input {...forgotForm.register('email')} type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 text-sm" placeholder="Enter system email" />
  //             {forgotForm.formState.errors.email && <p className="text-red-400 text-xs">{forgotForm.formState.errors.email.message}</p>}

  //             <div className="flex justify-end space-x-3 text-sm">
  //               <button type="button" onClick={() => setIsForgotOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
  //               <button type="submit" disabled={loading} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg disabled:bg-cyan-800">Send Link</button>
  //             </div>
  //           </form>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 font-sans text-slate-100">
      <Toaster position="top-right" />

      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">

        {/* 🔄 Dynamic Heading Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {showOtpField ? '🔒 Two-Factor Auth' : '🔑 Admin Panel'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {showOtpField ? `Enter the verification code sent to ${userEmail}` : 'Sign in to control your system operations'}
          </p>
        </div>

        {/* 🔄 CONDITIONAL VIEW SWITCHING ENGINE */}
        {!showOtpField ? (
          /* ==================== 🔑 VIEW A: EMAIL & PASSWORD FORM ==================== */
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                <input {...loginForm.register('email')} type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-cyan-500" placeholder="admin@kavera.com" />
              </div>
              {loginForm.formState.errors.email && <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.email.message}</p>}
            </div>

            {/* 🟢 FIXED: Password field wrapped tightly inside condition */}
            {!isPasswordless && (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                    <input {...loginForm.register('password')} type={showPassword ? 'text' : 'password'} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 pr-10 text-white focus:outline-none focus:border-cyan-500" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.password.message}</p>}
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setIsForgotOpen(true)} className="text-xs text-cyan-400 hover:underline">Forgot Password?</button>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg font-bold transition disabled:bg-cyan-800">
              {loading ? 'Processing...' : 'Sign In'}
            </button>

            {/* 🟢 FIXED: Toggle option placed beautifully under the main submission block */}
            <div className="text-center mt-3 pt-2 border-t border-slate-700/50">
              <button 
                type="button" 
                onClick={() => setIsPasswordless(!isPasswordless)} 
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition duration-150 hover:underline inline-flex items-center space-x-1"
              >
                <span>{isPasswordless ? "🔒 Use Standard Password Instead" : "✨ Sign in with Magic OTP (Passwordless)"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* ==================== 🔒 VIEW B: 6-DIGIT OTP VERIFICATION FORM ==================== */
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
            <div>
              <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Secure Authentication Token
              </label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-4 top-3.5 h-6 w-6 text-emerald-500" />
                <input
                  {...otpForm.register('otp')}
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-12 text-center text-2xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              {otpForm.formState.errors.otp && <p className="text-red-400 text-xs text-center mt-2">{otpForm.formState.errors.otp.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg font-bold transition disabled:bg-emerald-800">
              {loading ? 'Verifying...' : 'Verify & Open System'}
            </button>

            <button
              type="button"
              onClick={() => { setShowOtpField(false); otpForm.reset(); }}
              className="flex items-center justify-center space-x-1 w-full text-center text-xs text-slate-400 hover:text-white transition mt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to credentials login</span>
            </button>
          </form>
        )}
      </div>

      {/* 🛡️ FORGOT PASSWORD MODAL */}
      {isForgotOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-2 text-cyan-400 mb-3">
              <ShieldAlert className="h-6 w-5" />
              <h3 className="text-lg font-bold text-white">Recover Password</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Enter your admin email and your senior's router configuration will fire a token link immediately.</p>

            <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
              <input {...forgotForm.register('email')} type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 text-sm" placeholder="Enter system email" />
              {forgotForm.formState.errors.email && <p className="text-red-400 text-xs">{forgotForm.formState.errors.email.message}</p>}

              <div className="flex justify-end space-x-3 text-sm">
                <button type="button" onClick={() => setIsForgotOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg disabled:bg-cyan-800">Send Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}