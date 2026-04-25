import { Mail, Phone, MapPin, Globe, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      className="relative bg-slate-900 text-white pt-16 pb-6 border-t-4 border-yellow-500"
      style={{
        backgroundImage: 'linear-gradient(to right, rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.85)), url(https://www.sscoetjalgaon.ac.in/public/images/backgrounds/footer-section-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">

          {/* Contact Details */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white">Contact Details</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              If you have any doubt regarding our courses, admission or anything else, feel free to contact us. We are ready to help you.
            </p>
            <ul className="space-y-4 text-sm text-slate-300 mb-8">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>PO Box#94, Bambhori, Jalgaon (MS).</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />
                <span>0257 225 8393/94/95</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />
                <span>ssbtcoetjal@gmail.com</span>
              </li>
              <li className="flex items-center">
                <Globe className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />
                <span>www.ssbtcoetjalgaon.ac.in</span>
              </li>
            </ul>

            <div>
              <h4 className="text-white text-sm mb-1">Call Us Now</h4>
              <p className="text-xl font-bold text-white tracking-widest">0257 225 8393/94/95</p>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white">Useful Links</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">AICTE</li>
              <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">NAAC</li>
              <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">NIRF</li>
              <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">Approvals from Statutory Bodies</li>
              <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">Mandatory Disclosures & Shikshan Shulka Samiti Proposals</li>
              <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">Feedback System for Students and Faculty on AICTE Web Portal</li>
              <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">ARIIA</li>
            </ul>
          </div>

          {/* Mandatory Disclosures & Connect */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-6 text-white">Mandatory Disclosures</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">IQAC</li>
                <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">AQAR</li>
                <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">Audit Reports</li>
                <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">EOA Reports</li>
                <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">Fees Approval Proposal</li>
                <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">Right to Information Act</li>
                <li className="border-b border-white/10 pb-2 hover:text-white transition-colors cursor-pointer">FRA - Fee Structure</li>
              </ul>
            </div>

            <div className="mt-10 lg:mt-6">
              <h4 className="text-white text-sm mb-3 font-semibold uppercase tracking-wider opacity-60">Connect With Us</h4>
              <div className="flex space-x-3">
                <a 
                  href="https://www.facebook.com/SSBTCOETOfficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 border border-slate-700 hover:border-brand-500 hover:bg-brand-500/10 transition-all text-slate-400 hover:text-brand-500 rounded-xl group"
                >
                  <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a 
                  href="https://www.instagram.com/coetjalgaon/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 border border-slate-700 hover:border-pink-500 hover:bg-pink-500/10 transition-all text-slate-400 hover:text-pink-500 rounded-xl group"
                >
                  <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a 
                  href="https://www.youtube.com/channel/UCaxPLE3NlG6FdRHJfMGUWXA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 border border-slate-700 hover:border-red-500 hover:bg-red-500/10 transition-all text-slate-400 hover:text-red-500 rounded-xl group"
                >
                  <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a 
                  href="https://x.com/SSBTCOET" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 border border-slate-700 hover:border-white hover:bg-white/10 transition-all text-slate-400 hover:text-white rounded-xl group"
                >
                  <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sub Footer */}
      <div className="bg-[#111111] py-4 w-full border-t border-slate-800 absolute bottom-0 left-0 right-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:flex md:justify-between text-xs text-slate-400">
          <p>Copyright &copy; 1983-{new Date().getFullYear()}. All Rights Reserved</p>
          <div className="mt-2 md:mt-0 space-x-3 flex">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span>|</span>
            <span className="hover:text-white cursor-pointer transition-colors">Disclaimer</span>
            <span>|</span>
            <span className="hover:text-white cursor-pointer transition-colors">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
