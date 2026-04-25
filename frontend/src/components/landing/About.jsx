import { useRef, useState, useEffect, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ExternalLink, Target, Eye, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const About = () => {
  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const images = [
    "https://www.sscoetjalgaon.ac.in/public/images/slider/snap.jpg",
    "https://www.sscoetjalgaon.ac.in/public/images/slider/DJI_0528.jpg",
    "https://www.sscoetjalgaon.ac.in/public/images/slider/snap9.jpg",
    "https://www.sscoetjalgaon.ac.in/public/images/slider/slide1.jpg",
    "https://www.sscoetjalgaon.ac.in/public/images/slider/snap23.jpg",
    "https://www.sscoetjalgaon.ac.in/public/images/slider/snap105.jpg"
  ];

  const totalSlides = images.length;

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
    gsap.to(sliderRef.current, {
      xPercent: -(100 / totalSlides) * index,
      duration: 1.2,
      ease: "power2.inOut"
    });
  }, [totalSlides]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    goToSlide((currentIndex + 1) % totalSlides);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    goToSlide((currentIndex - 1 + totalSlides) % totalSlides);
  };

  const handleDotClick = (index) => {
    setIsAutoPlaying(false);
    goToSlide(index);
  };

  useEffect(() => {
    let timer;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        const nextIndex = (currentIndex + 1) % totalSlides;
        setCurrentIndex(nextIndex);
        gsap.to(sliderRef.current, {
          xPercent: -(100 / totalSlides) * nextIndex,
          duration: 1.5,
          ease: "power2.inOut"
        });
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, currentIndex, totalSlides]);

  return (
    <div ref={containerRef} className="pb-20 lg:pb-32 bg-white dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      
      {/* Section 1: Full-Width & Full-Height Hero Slider */}
      <div className="relative w-full overflow-hidden group">
        
        {/* Golden Top Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 z-20"></div>

        {/* Main Slider Display Area - Full Height Configured */}
        <div className="relative w-full h-[calc(100vh-72px)] min-h-[500px] bg-slate-200 overflow-hidden shadow-sm">
          <div 
            ref={sliderRef}
            className="flex h-full w-full"
            style={{ width: `${totalSlides * 100}%` }}
          >
            {images.map((src, index) => (
              <div 
                key={index} 
                className="h-full flex-shrink-0"
                style={{ width: `${100 / totalSlides}%` }}
              >
                <img 
                  src={src} 
                  alt={`Campus Slide ${index + 1}`} 
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <button 
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-black/10 hover:bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-black/10 hover:bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Navigation Dots (Pagination) */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3.5 h-3.5 rounded-full transition-all border border-white/50 ${
                  currentIndex === index ? 'bg-white scale-125 shadow-xl' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Detailed Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24 lg:mt-32">
        <div className="space-y-16">
          
          <div className="text-center">
            <h2 className="text-sm font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase mb-4 px-4 py-1.5 bg-brand-50 dark:bg-brand-500/10 inline-block rounded-full transition-colors">
              About our Institute
            </h2>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight transition-colors">
              Shram Sadhana Bombay Trust's <br />
              <span className="text-gradient">College of Engineering & Technology</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-16">
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed text-center max-w-5xl mx-auto transition-colors">
              SSBT's College of Engineering & Technology at Bambhori, Jalgaon, is a premier industrial & technical headquarters in Maharashtra. Distributed across a lush green 25-acre campus on the banks of River Girna, we are committed to providing the flame of quality education and progressive technology.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/10 hover:border-brand-200 dark:hover:border-brand-500 transition-all group shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-8 text-brand-500 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">Our Vision</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                  Today we carry the flame of quality education, knowledge and progressive technology for global societal development; tomorrow the flame will glow even brighter.
                </p>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/10 hover:border-brand-200 dark:hover:border-brand-500 transition-all group shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-8 text-brand-500 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">Our Mission</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                  To provide conducive environment for preparing competent, value added and patriotic engineers of integrity of par excellence to meet global standards for societal development.
                </p>
              </div>
            </div>

             <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-12 border-t border-slate-100 dark:border-white/10 transition-colors">
              <div className="flex items-center gap-5 px-8 py-5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-colors">
                <Award className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-xl font-bold">Accreditated NAAC 'A' Grade</p>
                  <p className="text-sm font-semibold opacity-80">(CGPA of 3.14 on a four point scale)</p>
                </div>
              </div>
              
              <a 
                href="https://www.sscoetjalgaon.ac.in/about/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-bold text-xl group transition-all"
              >
                Explore More on Official Website 
                <ExternalLink className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
