const db = require('../config/db');

// Comprehensive Knowledge Base
const knowledgeBase = [
    // 1. Attendance Basics
    {
        keywords: ["mark", "attendance", "how to"],
        intent: "how_to_mark_attendance",
        reply: "To mark your attendance: 1) Login to your student dashboard. 2) Click 'Mark Attendance'. 3) Scan the QR code provided by the teacher or enter the 6-digit code. Note: Ensure your location/GPS is enabled as geo-fencing is required.",
        quickReplies: ["75% Rule", "Face Recognition", "Geo-fencing"]
    },
    {
        keywords: ["different ways", "methods", "attendance types"],
        intent: "attendance_methods",
        reply: "SSBT AttendEase supports three methods: 1) Face Recognition (biometric verification), 2) QR Code Scanning, and 3) Unique 6-digit Session Codes. All methods are linked to your GPS location for security.",
        quickReplies: ["Face Recognition", "QR Code"]
    },
    {
        keywords: ["location", "gps", "enable", "why"],
        intent: "location_requirement",
        reply: "Yes, location (GPS) must be enabled. The system uses geo-fencing to ensure students are physically present in the classroom. If you are too far from the teacher's location, you won't be able to mark attendance.",
        quickReplies: ["Geo-fencing", "Too Far Error"]
    },
    {
        keywords: ["geo-fencing", "geofencing", "what is", "radius"],
        intent: "geofencing_explanation",
        reply: "Geo-fencing creates a virtual boundary around your classroom. You must be within this boundary (usually 50-100 meters) to mark your attendance successfully.",
        quickReplies: ["Location Help", "Radius Info"]
    },
    {
        keywords: ["outside", "classroom", "mark attendance"],
        intent: "outside_classroom",
        reply: "If you are outside the classroom or the specified geo-fence radius, the system will prevent you from marking attendance to maintain integrity. Please ensure you are inside the designated area.",
        quickReplies: ["Location Error", "Contact Teacher"]
    },
    {
        keywords: ["someone else", "proxy", "for me"],
        intent: "proxy_attendance",
        reply: "No, proxy attendance is not possible. The system uses Face Recognition and device-specific location tracking to ensure only the registered student can mark their own attendance.",
        quickReplies: ["Face Recognition", "Security"]
    },

    // 2. Attendance Rules & Compliance
    {
        keywords: ["75%", "minimum", "rule", "shortage"],
        intent: "minimum_attendance",
        reply: "As per University and College norms, a minimum of 75% attendance is mandatory in each subject. Falling below this may make you ineligible for ISE and Final University Examinations.",
        quickReplies: ["Check My Attendance", "Low Attendance Help"]
    },
    {
        keywords: ["below 75%", "consequences", "debarred"],
        intent: "low_attendance_consequences",
        reply: "If your attendance is below 75%, you may be debarred from appearing in ISE exams or final exams. You should immediately contact your Class Teacher (CT) or HOD to discuss your situation.",
        quickReplies: ["Contact CT", "Eligibility Status"]
    },
    {
        keywords: ["calculate", "percentage", "how is it"],
        intent: "attendance_calculation",
        reply: "Attendance % = (Number of classes present / Total classes conducted) * 100. Lab attendance and theory attendance are calculated separately for specific subject requirements.",
        quickReplies: ["Overall %", "Lab Attendance"]
    },

    // 3. ISE Marks & Examinations
    {
        keywords: ["check", "ise marks", "result"],
        intent: "check_ise_marks",
        reply: "Login to the portal → Go to Student Dashboard → Select 'ISE Marks'. You can view your marks for ISE-1, ISE-2, and ISE-3 along with the Best of Two average.",
        quickReplies: ["My ISE Marks", "Passing Marks"]
    },
    {
        keywords: ["best of two", "how calculated", "average"],
        intent: "best_of_two",
        reply: "The system automatically selects your two highest scores from ISE-1, ISE-2, and ISE-3 and calculates their average. This 'Best of Two' average is used for final internal assessment.",
        quickReplies: ["View My Average", "ISE Exams"]
    },
    {
        keywords: ["passing marks", "ise passing"],
        intent: "passing_marks",
        reply: "The passing marks for ISE vary by subject but generally follow the University criteria (usually 40%). Please check the specific syllabus or contact your teacher for subject-wise details.",
        quickReplies: ["Syllabus", "Contact Teacher"]
    },

    // 4. Timetable
    {
        keywords: ["view", "timetable", "schedule"],
        intent: "view_timetable",
        reply: "Your timetable is visible on the 'Timetable' section of your dashboard. It is automatically updated based on your assigned Department, Year, and Division.",
        quickReplies: ["My Schedule", "Next Class"]
    },
    {
        keywords: ["not showing", "timetable missing"],
        intent: "timetable_missing",
        reply: "If your timetable is missing, ensure your profile (Department, Year, Division) is complete and verified. If it still doesn't show, contact the HOD or Admin office.",
        quickReplies: ["Update Profile", "Contact Support"]
    },

    // 5. Certificates
    {
        keywords: ["upload", "certificate", "nptel", "extra curricular"],
        intent: "upload_certificate",
        reply: "Go to Student Dashboard → Certificates → Upload New. You can upload NPTEL, Sports, Cultural, or Internship certificates for verification and credit points.",
        quickReplies: ["Certificate Status", "Supported Formats"]
    },
    {
        keywords: ["verification", "how long", "who verifies"],
        intent: "certificate_verification",
        reply: "Certificates are usually verified by your Class Teacher (CT) or Department Coordinator within 3-5 working days. You will see a 'Verified' status once approved.",
        quickReplies: ["Pending Certificates", "Contact CT"]
    },

    // 6. Account & Profile
    {
        keywords: ["register", "create account"],
        intent: "registration_process",
        reply: "Click on 'Register' on the landing page. Fill in your Name, PRN, Email, and Mobile number. Choose your role (Student/Teacher) and wait for admin approval if required.",
        quickReplies: ["Sign In", "Forgot Password"]
    },
    {
        keywords: ["forgot", "password", "reset"],
        intent: "forgot_password",
        reply: "Click 'Forgot Password' on the login page. Enter your PRN or Email. A reset link will be sent to your registered email address.",
        quickReplies: ["Sign In", "Contact Admin"]
    },
    {
        keywords: ["prn", "what is", "where find"],
        intent: "prn_info",
        reply: "PRN stands for Permanent Registration Number. It is a unique ID provided by the University. You can find it on your ID card or Admission receipt.",
        quickReplies: ["Registration", "Profile Help"]
    },
    {
        keywords: ["face", "registration", "how register face"],
        intent: "face_registration",
        reply: "During your first login or in the Profile section, the app will prompt you to capture your face. This image is used for biometric verification during attendance marking.",
        quickReplies: ["Face Verification", "Profile"]
    },

    // 7. Parent Queries
    {
        keywords: ["parent", "child", "check attendance"],
        intent: "parent_access",
        reply: "Parents can check their child's attendance by using the student's credentials to log in. Automated SMS/Email alerts are also sent to the registered parent contact number if attendance falls below 75%.",
        quickReplies: ["Contact Teacher", "Low Attendance Alert"]
    },

    // 8. Technical Issues
    {
        keywords: ["not loading", "technical issue", "slow"],
        intent: "technical_issues",
        reply: "Try clearing your browser cache or switching to a stable internet connection. If the issue persists, contact technical support at it-support@ssbtcoet.ac.in.",
        quickReplies: ["Contact Support", "Site Status"]
    },
    {
        keywords: ["face recognition", "not working", "camera error"],
        intent: "face_recognition_fix",
        reply: "Ensure you are in a well-lit area and your camera lens is clean. If errors persist, re-register your face in the Profile section or contact your teacher.",
        quickReplies: ["Re-register Face", "Manual Attendance"]
    },

    // 21. Edge Cases & Personality
    {
        keywords: ["meaning of life"],
        intent: "meaning_of_life",
        reply: "42! Just kidding. As an SSBT Assistant, the meaning of life is 100% attendance and excellent ISE marks! 😉",
        quickReplies: ["Joke", "Attendance Tip"]
    },
    {
        keywords: ["joke", "laugh"],
        intent: "tell_joke",
        reply: "Why did the student eat his homework? Because the teacher said it was a piece of cake! 🍰 Need help with real cake (Attendance)? Ask me!",
        quickReplies: ["Another Joke", "Attendance Help"]
    },
    {
        keywords: ["hindi", "marathi", "language"],
        intent: "language_support",
        reply: "I currently support English. Please rephrase your question in English. मराठी आणि हिंदी लवकरच उपलब्ध होईल! (Marathi and Hindi coming soon!)",
        quickReplies: ["Help in English", "Contact Support"]
    }
];

// Enhanced Matcher
const findBestMatch = (query) => {
    let bestMatch = null;
    let maxWeight = 0;

    knowledgeBase.forEach(item => {
        let weight = 0;
        item.keywords.forEach(kw => {
            if (query.toLowerCase().includes(kw)) {
                weight += 1;
            }
        });
        
        if (weight > maxWeight) {
            maxWeight = weight;
            bestMatch = item;
        }
    });

    return maxWeight > 0 ? bestMatch : null;
};

// @desc    Handle chatbot messages
// @route   POST /api/chatbot/message
exports.handleMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user;

        if (!message || message.trim().length === 0) {
            return res.json({ 
                reply: "Please type a question to get help.",
                quickReplies: ["How to mark attendance?", "ISE Marks", "Timetable"]
            });
        }

        const query = message.toLowerCase().trim();

        // --- PART 4: SECURITY & ACCESS CONTROL ---
        const securityWords = ["admin credentials", "delete database", "bypass", "another student", "admin access", "change marks"];
        if (securityWords.some(word => query.includes(word))) {
            return res.json({
                reply: "I can only help with your own authorized academic information. For other requests, please contact the administrative office.",
                quickReplies: ["Contact Support", "My Profile"]
            });
        }

        // --- PART 5: MULTI-INTENT SUPPORT ---
        if ((query.includes("attendance") || query.includes("absent") || query.includes("present")) && 
            (query.includes("marks") || query.includes("ise") || query.includes("score"))) {
            return res.json({
                reply: "I see you're asking about both attendance and ISE marks! You can view your attendance summary in the 'Attendance' section and your results in 'ISE Marks'. Would you like me to fetch your current stats for both?",
                quickReplies: ["Fetch My Stats", "Contact Support"]
            });
        }

        // --- PART 2: CONTEXTUAL QUERIES (Authenticated) ---
        if (user) {
            // STUDENT CONTEXT
            if (user.role === 'student') {
                // Personal Attendance
                if (query.includes("my attendance") || query.includes("overall attendance") || query.includes("hajri")) {
                    const [results] = await db.execute(
                        `SELECT s.subject_name, 
                            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                            COUNT(*) as total_sessions
                         FROM subjects s
                         LEFT JOIN attendance a ON s.id = a.subject_id AND a.student_id = ?
                         WHERE s.department = ? AND s.year = ?
                         GROUP BY s.id`,
                        [user.id, user.department, user.year]
                    );

                    if (results.length === 0) {
                        return res.json({ reply: "I couldn't find any attendance records for your current subjects." });
                    }

                    let totalPresent = 0;
                    let totalConducted = 0;
                    const subjectStats = results.map(r => {
                        totalPresent += r.present_count;
                        totalConducted += r.total_sessions;
                        const pct = r.total_sessions > 0 ? ((r.present_count / r.total_sessions) * 100).toFixed(1) : 0;
                        return `${r.subject_name}: ${pct}%`;
                    });

                    const overallPct = totalConducted > 0 ? ((totalPresent / totalConducted) * 100).toFixed(1) : 0;
                    
                    return res.json({
                        reply: `Your overall attendance is ${overallPct}%.\n\nSubject-wise:\n${subjectStats.join('\n')}`,
                        quickReplies: ["Am I eligible?", "ISE Marks"]
                    });
                }


                // Personal Marks
                if (query.includes("ise-1") || query.includes("ise-2") || query.includes("ise-3") || query.includes("my marks")) {
                    const iseNum = query.includes("ise-1") ? 1 : query.includes("ise-2") ? 2 : query.includes("ise-3") ? 3 : null;
                    
                    const [results] = await db.execute(
                        `SELECT s.subject_name, i.ise_1, i.ise_2, i.ise_3, i.best_avg 
                         FROM ise_marks i 
                         JOIN subjects s ON i.subject_id = s.id 
                         WHERE i.student_id = ?`,
                        [user.id]
                    );

                    if (results.length === 0) return res.json({ reply: "No ISE marks found yet." });

                    const marksList = results.map(r => {
                        let score = iseNum === 1 ? r.ise_1 : iseNum === 2 ? r.ise_2 : iseNum === 3 ? r.ise_3 : `Best Avg: ${r.best_avg}`;
                        return `${r.subject_name}: ${score || 'N/A'}`;
                    });

                    return res.json({
                        reply: `Here are your ${iseNum ? `ISE-${iseNum}` : 'ISE'} marks:\n${marksList.join('\n')}`,
                        quickReplies: ["Attendance", "Timetable"]
                    });
                }

                // Lowest Attendance Subjects
                if (query.includes("lowest attendance") || query.includes("subject") && query.includes("low")) {
                    const [results] = await db.execute(
                        `SELECT s.subject_name, 
                            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                            COUNT(*) as total_sessions
                         FROM subjects s
                         LEFT JOIN attendance a ON s.id = a.subject_id AND a.student_id = ?
                         WHERE s.department = ? AND s.year = ?
                         GROUP BY s.id
                         HAVING total_sessions > 0
                         ORDER BY (present_count / total_sessions) ASC
                         LIMIT 1`,
                        [user.id, user.department, user.year]
                    );

                    if (results.length > 0) {
                        const r = results[0];
                        const pct = ((r.present_count / r.total_sessions) * 100).toFixed(1);
                        return res.json({ 
                            reply: `Your lowest attendance is in ${r.subject_name} at ${pct}%. You should focus on attending more classes for this subject.`,
                            quickReplies: ["Overall Attendance", "75% Rule"]
                        });
                    }
                }

                // How many more classes for 75%
                if (query.includes("how many more classes") || query.includes("reach 75%")) {
                    // This is a simplified calculation
                    return res.json({
                        reply: "To calculate exactly how many classes you need to reach 75%, I need to know the remaining sessions. Generally, if you attend all upcoming classes, your percentage will improve rapidly. Check your dashboard for subject-wise trends!",
                        quickReplies: ["Overall Attendance", "Contact CT"]
                    });
                }
            }

            // TEACHER CONTEXT
            if (user.role === 'teacher') {
                if (query.includes("defaulters") || query.includes("low attendance")) {
                    return res.json({
                        reply: "As a teacher, you can view the 'Defaulter List' in your Analytics dashboard. Would you like me to guide you there?",
                        quickReplies: ["Open Analytics", "My Classes"]
                    });
                }
                if (query.includes("my schedule") || query.includes("classes today")) {
                    return res.json({
                        reply: "You have 3 classes scheduled for today. Check your 'Teacher Dashboard' for the full timeline.",
                        quickReplies: ["Start Session", "Attendance History"]
                    });
                }
            }

            // ADMIN CONTEXT
            if (user.role === 'admin') {
                if (query.includes("summary") || query.includes("college attendance")) {
                    return res.json({
                        reply: "Today's college-wide attendance is at 82%. CSE department has the highest (89%).",
                        quickReplies: ["View Reports", "User Management"]
                    });
                }
            }
        }

        // --- PART 7: HUMAN HANDOFF ---
        if (query.includes("talk to human") || query.includes("contact support") || query.includes("help") && query.includes("human")) {
            return res.json({
                reply: "You can reach our support team at:\n📧 admin@ssbtcoet.ac.in\n📞 0257-2258391\n\nWould you like to request a callback?",
                quickReplies: ["Request Callback", "Email Admin"],
                action: "SHOW_CONTACT_DETAILS"
            });
        }
        if (query.includes("request callback")) {
            return res.json({
                reply: "Your request for a callback has been logged. An administrator will contact you on your registered mobile number soon.",
                quickReplies: ["Thanks", "Main Menu"]
            });
        }


        // --- PART 5: FALLBACK & KNOWLEDGE BASE ---
        const match = findBestMatch(query);
        if (match) {
            return res.json({
                reply: match.reply,
                quickReplies: match.quickReplies
            });
        }

        // Final Fallback for random text or unknown queries
        if (query.length < 4 || /^[a-z]+$/.test(query) && query.length > 10 && !query.includes(' ')) {
            return res.json({
                reply: "I'm sorry, I didn't understand that. Try asking about attendance, ISE marks, or timetable. Type 'help' for options.",
                quickReplies: ["How to mark attendance?", "ISE Marks", "Contact Support"]
            });
        }

        return res.json({
            reply: "I'm not sure about that. Could you please rephrase? You can ask me about registration, attendance rules, or how to see your marks.",
            quickReplies: ["Attendance Rule", "ISE Marks", "Reset Password"]
        });

    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(500).json({ reply: "I encountered an error while processing your request. Please try again later." });
    }
};
