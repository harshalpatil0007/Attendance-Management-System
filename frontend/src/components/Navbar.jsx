import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Sign In', path: '/login' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glassmorphism py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-gradient flex items-center gap-2">
              <img src="/ssbt_logo.png" alt="SSBT" className="h-10 w-auto object-contain" />
              <span>SSBT AttendEase</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-yellow-400" />}
            </button>

            <Link
              to="/register"
              className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Register
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-400"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-yellow-400" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-brand-600 focus:outline-none">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glassmorphism absolute top-full left-0 w-full rounded-b-2xl shadow-xl border-t border-slate-100">
          <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3 flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/register"
              className="block mt-4 text-center bg-gradient-to-r from-brand-500 to-indigo-600 text-white px-3 py-3 rounded-md font-medium"
              onClick={() => setIsOpen(false)}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
