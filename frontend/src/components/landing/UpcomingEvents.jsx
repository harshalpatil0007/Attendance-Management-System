import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, Clock, MapPin, Tag } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const UpcomingEvents = () => {
  const sectionRef = useRef(null);

  const mockEvents = [
    {
      id: 1,
      title: "Tech Symposium 2024",
      date: "Oct 15, 2024",
      time: "09:00 AM - 05:00 PM",
      venue: "Main Auditorium",
      description: "Annual technology gathering featuring industry leaders, workshops, and project showcases.",
      tag: "Technical",
      color: "from-blue-500 to-cyan-400"
    },
    {
      id: 2,
      title: "Campus Placement Drive",
      date: "Nov 02, 2024",
      time: "10:00 AM - 04:00 PM",
      venue: "Placement Cell",
      description: "Top multinational companies visiting for final year student recruitment.",
      tag: "Career",
      color: "from-emerald-500 to-teal-400"
    },
    {
      id: 3,
      title: "Cultural Fest - Euphoria",
      date: "Dec 10-12, 2024",
      time: "05:00 PM Onwards",
      venue: "Open Ground",
      description: "Three nights of music, dance, arts, and spectacular performances.",
      tag: "Cultural",
      color: "from-fuchsia-500 to-pink-500"
    }
  ];

  useGSAP(() => {
    // Underline animation for title
    gsap.fromTo('.events-underline', 
      { width: 0 },
      { 
        width: "100%", 
        duration: 1, 
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        }
      }
    );

    // Cards staggered entry
    gsap.fromTo('.event-card',
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: '.events-grid',
          start: "top 85%",
        }
      }
    );
  }, { scope: sectionRef });

  return (
    <section id="events" ref={sectionRef} className="py-24 bg-white dark:bg-slate-950 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 inline-block w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4 relative inline-block transition-colors">
            Upcoming Events
            <div className="events-underline absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full"></div>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mt-6 transition-colors">
            Stay updated with what's happening around the campus.
          </p>
        </div>

        <div className="events-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockEvents.map((event) => (
            <div 
              key={event.id}
              className="event-card group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-500 transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`absolute top-0 right-8 transform -translate-y-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-md bg-gradient-to-r ${event.color}`}>
                {event.tag}
              </div>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors mt-2">
                {event.title}
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 transition-colors">
                  <Calendar className="w-4 h-4 mr-2 text-brand-400" />
                  {event.date}
                </div>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 transition-colors">
                  <Clock className="w-4 h-4 mr-2 text-brand-400" />
                  {event.time}
                </div>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 transition-colors">
                  <MapPin className="w-4 h-4 mr-2 text-brand-400" />
                  {event.venue}
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 transition-colors">
                {event.description}
              </p>

              <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-semibold rounded-xl group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 transition-colors flex items-center justify-center">
                <Tag className="w-4 h-4 mr-2" />
                Register Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
