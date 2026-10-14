'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../../services/auth.service';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

// 🛡️ Client-Side Validation Schema matching production standards
const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    // phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Invalid phone number'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            'Must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
});

type FormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(signupSchema),
    });

    // 🚀 Execution: Form Submit handle karna
    const onSignupSubmit = async (values: FormData) => {
        setLoading(true);
        try {
            // Backend api call
            const res = await authService.signup(values);

            // Agar backend successfully response deta hai
            toast.success('Account created successfully!');

            // 2 seconds ke baad automatic login page par redirect kar denge
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 font-sans text-slate-100">
            <Toaster position="top-right" />

            <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Admin Account</h2>
                    <p className="text-slate-400 text-sm mt-1">Register a new system administrator handle</p>
                </div>

                <form onSubmit={handleSubmit(onSignupSubmit)} className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
                        <div className="relative mt-1">
                            <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                            <input {...register('name')} type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-cyan-500 text-sm" placeholder="John Doe" />
                        </div>
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                        <div className="relative mt-1">
                            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                            <input {...register('email')} type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-cyan-500 text-sm" placeholder="admin@example.com" />
                        </div>
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    {/* Phone Field */}
                    {/* <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</label>
                        <div className="relative mt-1">
                            <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                            <input {...register('phone')} type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-cyan-500 text-sm" placeholder="9966885577" />
                        </div>
                        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                    </div> */}

                    {/* Password Field */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                            <input {...register('password')} type={showPassword ? 'text' : 'password'} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 pr-10 text-white focus:outline-none focus:border-cyan-500 text-sm" placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    {/* Submit Button */}
                    <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg font-bold transition disabled:bg-cyan-800 text-sm mt-2">
                        {loading ? 'Registering...' : 'Sign Up'}
                    </button>
                </form>

                {/* Footer Link */}
                <div className="text-center mt-6 text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
                        Sign In here
                    </Link>
                </div>
            </div>
        </div>
    );
}