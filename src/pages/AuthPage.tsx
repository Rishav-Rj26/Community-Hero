import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Shield, Building, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function AuthPage() {
  const { loginUser, registerUser, addToast } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  const fillDemoLogin = (role: 'Citizen' | 'Authority') => {
    if (role === 'Authority') {
      setEmail('admin@hero.com');
      setPassword('admin123');
      return;
    }

    setEmail('alex@hero.com');
    setPassword('hero123');
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Error', 'Please enter email and password', 'error');
      return;
    }
    const success = await loginUser(email, password);
    if (!success) {
      addToast('Login Failed', 'Invalid email or password. Check demo credentials.', 'error');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirm) {
      addToast('Error', 'Please fill in all fields', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      addToast('Error', 'Please enter a valid email', 'error');
      return;
    }
    if (regPassword.length < 6) {
      addToast('Error', 'Password must be at least 6 characters', 'error');
      return;
    }
    if (regPassword !== regConfirm) {
      addToast('Error', 'Passwords do not match', 'error');
      return;
    }
    
    registerUser(regName, regEmail, regPassword, 'Citizen');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Community'}
          </h2>
          <p className="text-slate-400">
            {isLogin ? 'Sign in to report and track issues.' : 'Create an account to make an impact.'}
          </p>
        </div>

        <div className="glass-panel p-1 rounded-2xl mb-6 flex">
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setIsLogin(false)}
          >
            Create Account
          </button>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fillDemoLogin('Citizen')}
                    className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl px-3 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    Citizen Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoLogin('Authority')}
                    className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white rounded-xl px-3 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Building className="w-4 h-4 text-purple-400" />
                    Authority Demo
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="alex@hero.com"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">Password</label>
                    <button type="button" onClick={() => addToast('Notice', 'Please contact admin for password reset in demo mode.', 'info')} className="text-xs text-indigo-400 hover:text-indigo-300">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                    <input 
                      type="text" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="password" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-all"
                        placeholder="Create password"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="password" 
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-all"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}

function InfoIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}
