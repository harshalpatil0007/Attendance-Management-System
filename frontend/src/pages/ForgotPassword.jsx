import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Hash, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: Reset
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { mobile_number: mobile });
            setStep(2);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to send OTP. Please check the mobile number.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/auth/verify-otp`, { mobile_number: mobile, otp });
            setStep(3);
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
                mobile_number: mobile,
                otp,
                newPassword
            });
            setStep(4);
            setSuccessMessage(response.data.message);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to reset password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-300/20 blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/20 blur-3xl"></div>

            <div className="max-w-md w-full space-y-8 glassmorphism p-10 rounded-3xl relative z-10 transition-colors">
                <div>
                    <Link to="/login" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-6 group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to login</span>
                    </Link>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
                        {step === 4 ? "Success!" : "Reset Password"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {step === 1 && "Enter your registered mobile number to receive an OTP."}
                        {step === 2 && "We've sent a 6-digit code to your mobile number."}
                        {step === 3 && "Secure your account with a new strong password."}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold border border-red-100 animate-in fade-in duration-300">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form className="mt-8 space-y-6 animate-in slide-in-from-right-4 duration-300" onSubmit={handleSendOtp}>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1 transition-colors">Registered Mobile Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all text-slate-900 dark:text-white font-bold placeholder:font-normal"
                                    placeholder="Enter 10-digit number"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-brand-500/20 text-sm font-black text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Receive OTP"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className="mt-8 space-y-6 animate-in slide-in-from-right-4 duration-300" onSubmit={handleVerifyOtp}>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1 transition-colors">One-Time Password (OTP)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Hash className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all text-slate-900 dark:text-white font-black tracking-[0.5em] text-center"
                                    placeholder="000000"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-brand-500/20 text-sm font-black text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Code"}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form className="mt-8 space-y-6 animate-in slide-in-from-right-4 duration-300" onSubmit={handleResetPassword}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white shadow-sm transition-all text-slate-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1 transition-colors">Confirm New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all text-slate-900 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-brand-500/20 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Update Password"}
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <div className="mt-8 text-center animate-in zoom-in-95 duration-500">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full mb-6 border border-emerald-100 shadow-xl shadow-emerald-500/10">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Password Changed</h3>
                        <p className="text-sm text-slate-500 mb-10">{successMessage}</p>
                         <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-slate-900 dark:bg-brand-500 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 dark:hover:bg-brand-600 transition-all active:scale-95"
                        >
                            Log In Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
