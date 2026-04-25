import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Sparkles } from 'lucide-react';

import collegeImage from '../../assets/college.jpg';

const Hero = () => {
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // Initial reveal of words
    tl.fromTo('.hero-heading-part',
      { y: 100, opacity: 0, rotate: 10 },
      { y: 0, opacity: 1, rotate: 0, duration: 1.2, stagger: 0.2, ease: "power4.out" }
    )
      .fromTo('.hero-sub-text',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.6"
      )

      .fromTo('.hero-main-card',
        { x: 100, opacity: 0, rotateY: 45 },
        { x: 0, opacity: 1, rotateY: 0, duration: 1.5, ease: "power3.out" },
        "-=1"
      );

    // Floating animation for background blobs
    gsap.to('.blob-1', {
      x: '30%',
      y: '20%',
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to('.blob-2', {
      x: '-20%',
      y: '-30%',
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1
    });

    // Gentle float for the main card
    gsap.to(cardRef.current, {
      y: -20,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, { scope: containerRef });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();

    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;

    gsap.to(cardRef.current, {
      rotateY: x * 15,
      rotateX: -y * 15,
      duration: 0.5,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.5,
      ease: "power2.out"
    });
  };

  return (
    <div ref={containerRef} className="relative pt-32 pb-24 lg:pt-24 lg:pb-40 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="blob-1 absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-400/10 blur-[120px]"></div>
        <div className="blob-2 absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-400/10 blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          <div className="space-y-10">
            <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-sm text-sm font-bold text-brand-600 transition-colors">
              <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
              Smart Attendance. Simplified.
            </div>

            <h1 className="text-6xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tight transition-colors">
              <span className="hero-heading-part inline-block">Smart</span> <br />
              <span className="hero-heading-part inline-block text-gradient">Attendance.</span> <br />
              <span className="hero-heading-part inline-block">Smarter Campus.</span>
            </h1>

            <p className="hero-sub-text text-xl lg:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl transition-colors">
              Effortless tracking meets next-gen facial recognition. Experience the future of SSBT Campus life.
            </p>


          </div>

          <div
            className="perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              ref={cardRef}
              className="hero-main-card relative z-10 w-full max-w-lg mx-auto lg:ml-auto p-1.5 rounded-[3rem] bg-white dark:bg-slate-900/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden transition-colors"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="rounded-[2.7rem] overflow-hidden">
                <img
                  src={collegeImage}
                  alt="SSBT College"
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Hero;
