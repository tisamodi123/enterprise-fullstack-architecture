'use client';

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '../../services/auth.service';
import toast, { Toaster } from 'react-hot-toast';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

// 🛡️ Strong Password Zod Schema matching Senior's Backend Validation
const resetPasswordSchema = z.object({
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            'Must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match!",
    path: ['confirmPassword'],
});

type FormData = z.infer<typeof resetPasswordSchema>;

// Next.js standard ke mutabik query parameters access karne ke liye Suspense wrapper zaroori hai
function ResetFormContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    // 🪙 URL se direct token parameter read karna (?token=abc123xyz...)
    const token = searchParams.get('token');

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (values: FormData) => {
        if (!token) {
            toast.error('Reset token is missing or invalid!');
            return;
        }

        setLoading(true);
        try {
            // Backend mapping request payload match: { token, newPassword }
            const res = await authService.resetPassword({
                token,
                newPassword: values.newPassword
            });

            if (res.errorCode === 200) {
                toast.success(res.message || 'Password updated successfully! 🎉');
                // 2.5 Seconds baad direct login screen par return
                setTimeout(() => {
                    router.push('/login');
                }, 2500);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Token has expired or is invalid. Request a new link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
            <div className="text-center mb-8">
                <div className="flex justify-center text-cyan-400 mb-2">
                    <ShieldCheck className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-white">Create New Password</h2>
                <p className="text-slate-400 text-xs mt-1">Please enter and confirm your new secure operational password</p>
            </div>

            {!token ? (
                <div className="bg-red-950/50 border border-red-500/30 p-4 rounded-lg text-center text-red-400 text-sm">
                    🔴 Route Error: Secure token context parameter is missing from the URL. Please click the link directly from your email.
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* New Password Input */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">New Password</label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                            <input
                                {...register('newPassword')}
                                type={showPass ? 'text' : 'password'}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 pr-10 text-white focus:outline-none focus:border-cyan-500 text-sm"
                                placeholder="Enter new password"
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>}
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confirm Password</label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-cyan-500 text-sm"
                                placeholder="Confirm your password"
                            />
                        </div>
                        {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                    </div>

                    {/* Action Button */}
                    <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg font-bold transition disabled:bg-cyan-800 text-sm">
                        {loading ? 'Processing Update...' : 'Save & Reset Password'}
                    </button>
                </form>
            )}
        </div>
    );
}

// Main Page wrapper using Suspense for client side rendering build optimization
export default function PasswordResetPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 text-slate-100 font-sans">
            <Toaster position="top-right" />
            <Suspense fallback={<div className="text-cyan-400 text-sm font-semibold">Loading system context...</div>}>
                <ResetFormContent />
            </Suspense>
        </div>
    );
}