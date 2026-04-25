import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, Users, Award, Building2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Placement = () => {
  const sectionRef = useRef(null);

  const stats = [
    { label: "Placement Rate", value: 94, suffix: "%", icon: TrendingUp, color: "text-brand-500", bg: "bg-brand-50" },
    { label: "Total Offers", value: 450, suffix: "+", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Highest Package", value: 42, suffix: " LPA", prefix: "₹", icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Recruiters", value: 120, suffix: "+", icon: Building2, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  const companies = [
    "Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "IBM", "Capgemini"
  ];

  useGSAP(() => {
    // Number counter animation
    const targets = gsap.utils.toArray('.stat-number');
    
    targets.forEach((target) => {
      const endValue = parseFloat(target.getAttribute('data-value'));
      
      gsap.to(target, {
        innerHTML: endValue,
        duration: 2,
        snap: { innerHTML: 1 },
        ease: "power2.out",
        scrollTrigger: {
          trigger: target,
          start: "top 85%",
        },
        onUpdate: function() {
          target.innerHTML = Math.round(this.targets()[0].innerHTML);
        }
      });
    });

    // Marquee animation
    gsap.to('.marquee-content', {
      xPercent: -50,
      ease: "none",
      duration: 20,
      repeat: -1,
    });

  }, { scope: sectionRef });

  return (
    <section id="placements" ref={sectionRef} className="py-24 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">
            Placement Highlights 2024
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
            Our students consistently achieve excellence, securing placements in top-tier organizations worldwide.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-3xl p-6 text-center border border-slate-200 dark:border-white/10 shadow-sm transform hover:-translate-y-2 transition-all duration-300">
                <div className={`mx-auto w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 flex justify-center items-baseline transition-colors">
                  {stat.prefix && <span>{stat.prefix}</span>}
                  <span className="stat-number" data-value={stat.value}>0</span>
                  <span>{stat.suffix}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium transition-colors">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Infinite Marquee for Company Logos */}
      <div className="relative border-y border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 py-6 overflow-hidden flex transition-all">
        {/* Left and Right shadows for smooth fade */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-slate-100 dark:from-slate-900 to-transparent z-10 pointer-events-none transition-colors"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-100 dark:from-slate-900 to-transparent z-10 pointer-events-none transition-colors"></div>
        
        <div className="marquee-content flex space-x-16 whitespace-nowrap px-8">
          {[...companies, ...companies].map((company, index) => (
            <div key={index} className="text-xl font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider flex items-center shrink-0">
              {company}
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default Placement;
