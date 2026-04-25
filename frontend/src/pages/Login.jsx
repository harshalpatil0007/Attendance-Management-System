import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, User, RefreshCw, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCaptcha = async () => {
    setIsCaptchaLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/captcha`);
      setCaptchaSvg(response.data.svg);
      setCaptchaToken(response.data.captchaToken);
    } catch (error) {
      console.error('Error fetching captcha:', error);
    } finally {
      setIsCaptchaLoading(false);
    }
  };

  useEffect(() => {
    if (import.meta.env.PROD) {
      console.log('App running in production mode. API URL:', API_BASE_URL);
    }
    fetchCaptcha();
  }, []);



  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        ...data,
        captchaToken
      });

      localStorage.setItem('attendease_token', response.data.token);
      localStorage.setItem('attendease_user', JSON.stringify(response.data));

      if (response.data.role === 'admin') navigate('/dashboard/admin');
      else if (response.data.role === 'teacher') navigate('/dashboard/teacher');
      else navigate('/dashboard/student');
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Failed to login. Please try again.');
      fetchCaptcha();
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
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Ja7gfCpnjkyFXUCu_v5gSyxxIGNVuFmSqw&s" alt="SSBT" className="h-12 w-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in to your SSBT AttendEase account
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-100">
            {authError}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register("email", { required: "Email is required", pattern: /^\S+@\S+$/i })}
                  type="email"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 shadow-sm transition-colors text-slate-900 dark:text-white"
                  placeholder="you@university.edu"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register("password", { required: "Password is required" })}
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 shadow-sm transition-colors text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {/* Captcha Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Captcha Verification</label>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-white/10 min-h-[60px]">
                  <div 
                    className="flex-1 bg-white dark:bg-white/90 rounded-lg h-12 flex items-center justify-center overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: captchaSvg || (isCaptchaLoading ? '' : '<span class="text-xs text-red-500 font-medium">Failed to load captcha. Please refresh.</span>') }}
                  />
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={isCaptchaLoading}
                    className="p-2 text-slate-500 hover:text-brand-500 hover:bg-white rounded-lg transition-all shadow-sm"
                    title="Refresh Captcha"
                  >
                    <RefreshCw className={`h-5 w-5 ${isCaptchaLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    {...register("captchaCode", { required: "Captcha is required" })}
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-800 shadow-sm transition-colors text-slate-900 dark:text-white"
                    placeholder="Enter captcha code"
                  />
                </div>
              </div>
              {errors.captchaCode && <p className="mt-1 text-sm text-red-500">{errors.captchaCode.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">Remember me</label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" title="Click to reset password" id="forgot-password" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">Forgot your password?</Link>
            </div>
          </div>



          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 shadow-brand-500/20"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
