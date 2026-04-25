import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    ChevronLeft, Send, Save, Eye, X, Plus, 
    Paperclip, Image as ImageIcon, Link2, Bold as BoldIcon, Italic as ItalicIcon, 
    Underline as UnderlineIcon, List as ListIcon, Clock, ShieldAlert,
    Users, Bell, GraduationCap, Building2,
    Calendar, CheckCircle2, AlertTriangle,
    Megaphone, FileText, MessageSquare, Smartphone, Pin, 
    File, Video, Trash2
} from 'lucide-react';

// Tiptap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { API_BASE_URL } from '../../config/apiConfig';

const AnnouncementEditor = ({ onBack, onSuccess, user, assignedClasses, editId }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        announcement_type: 'general',
        priority: 'normal',
        target_audience: 'students',
        subject_id: '',
        department: user?.department || '',
        year: '',
        division: '',
        channels: ['in_app', 'email'],
        attachments: [],
        is_scheduled: false,
        scheduled_at: '',
        expires_at: '',
        is_pinned: false,
        status: 'sent'
    });

    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [localAttachments, setLocalAttachments] = useState([]);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize Tiptap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Image,
        ],
        content: formData.content,
        onUpdate: ({ editor }) => {
            setFormData(prev => ({ ...prev, content: editor.getHTML() }));
        },
    });

    useEffect(() => {
        if (editId) {
            fetchAnnouncementForEdit();
        }
    }, [editId]);

    useEffect(() => {
        if (editor && formData.content && editor.getHTML() !== formData.content) {
            editor.commands.setContent(formData.content);
        }
    }, [formData.content, editor]);

    const fetchAnnouncementForEdit = async () => {
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/announcements/teacher/details/${editId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            setFormData({
                ...data,
                channels: Array.isArray(data.channels) ? data.channels : JSON.parse(data.channels || '[]'),
                attachments: Array.isArray(data.attachments) ? data.attachments : JSON.parse(data.attachments || '[]'),
                is_scheduled: !!data.is_scheduled
            });
            if (editor) {
                editor.commands.setContent(data.content);
            }
        } catch (error) {
            console.error('Error fetching for edit:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleChannelToggle = (channel) => {
        setFormData(prev => ({
            ...prev,
            channels: prev.channels.includes(channel)
                ? prev.channels.filter(c => c !== channel)
                : [...prev.channels, channel]
        }));
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type.startsWith('image/') ? 'image' : 
                  file.type.startsWith('video/') ? 'video' : 'file',
            file: file
        }));
        setLocalAttachments(prev => [...prev, ...newAttachments]);
        // Reset input
        e.target.value = '';
    };

    const removeAttachment = (id) => {
        setLocalAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleImageInsert = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                editor.chain().focus().setImage({ src: event.target.result }).run();
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const addLink = () => {
        const url = window.prompt('Enter URL');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const handleSubmit = async (submitStatus) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            
            // In a real app, we'd upload localAttachments to a storage service here
            // For now, we'll just include the names in the metadata
            const finalAttachments = [
                ...formData.attachments,
                ...localAttachments.map(a => ({ name: a.name, type: a.type, size: a.size }))
            ];

            const payload = { ...formData, attachments: finalAttachments, status: submitStatus };
            
            if (editId) {
                await axios.put(`${API_BASE_URL}/announcements/teacher/update/${editId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE_URL}/announcements/teacher/create`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Error submitting announcement:', error);
            alert('Failed to submit announcement. Please check all fields.');
        } finally {
            setLoading(false);
        }
    };

    const audienceTypes = [
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'parents', label: 'Parents', icon: Users },
        { id: 'colleagues', label: 'Colleagues', icon: Building2 },
        { id: 'hod', label: 'HOD', icon: ShieldAlert }
    ];

    const announcementTypes = [
        { value: 'general', label: 'General Announcement' },
        { value: 'urgent', label: 'Urgent Alert' },
        { value: 'assignment', label: 'Assignment/Deadline' },
        { value: 'exam', label: 'Exam Related' },
        { value: 'schedule', label: 'Class Schedule Change' },
        { value: 'marks', label: 'Marks Published' },
        { value: 'event', label: 'Event Invitation' },
        { value: 'parent', label: 'Parent Communication' }
    ];

    if (previewMode) {
        return (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center">
                    <button onClick={() => setPreviewMode(false)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Edit Content
                    </button>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Broadcast Preview</h2>
                    <div className="w-20"></div>
                </div>

                <div className="max-w-2xl mx-auto bg-white rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-2xl p-6 sm:p-12 space-y-6 sm:space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500">
                                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-black text-brand-500 uppercase tracking-widest">Broadcast Notification</p>
                                <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest">From: {user?.name}</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Today</span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">{formData.title || 'Broadcast Title Placeholder'}</h1>
                    
                    <div 
                        className="prose prose-slate max-w-none text-slate-600 font-medium text-sm sm:text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formData.content || 'Your message content will appear here...' }}
                    />

                    {localAttachments.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachments</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {localAttachments.map(file => (
                                    <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                                            {file.type === 'video' ? <Video className="w-4 h-4" /> : file.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-slate-700 truncate">{file.name}</p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase">{file.size}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 sm:pt-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Target: {formData.target_audience}</span>
                        <span className="hidden sm:inline">SSBT Faculty Hub</span>
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    <button onClick={() => setPreviewMode(false)} className="px-8 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest">Back to Editor</button>
                    <button onClick={() => handleSubmit('sent')} className="px-10 py-3 bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20">Confirm & Send Now</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            {/* Hidden Inputs for Editor Functions */}
            <input type="file" hidden ref={imageInputRef} accept="image/*" onChange={handleImageInsert} />
            <input type="file" hidden ref={fileInputRef} multiple onChange={handleFileUpload} />

            {/* Nav Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm sticky top-0 sm:static z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase leading-none sm:leading-normal">Compose Broadcast</h1>
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Creating update for your network</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <button 
                        onClick={() => handleSubmit('draft')}
                        disabled={loading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 bg-white text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100 min-w-fit whitespace-nowrap"
                    >
                        <Save className="w-4 h-4" /> <span className="sm:inline">Draft</span>
                    </button>
                    <button 
                        onClick={() => setPreviewMode(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 bg-white text-brand-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-50 transition-all border border-brand-50 min-w-fit whitespace-nowrap"
                    >
                        <Eye className="w-4 h-4" /> <span className="sm:inline">Preview</span>
                    </button>
                    <button 
                        onClick={() => handleSubmit('sent')}
                        disabled={loading}
                        className="flex-[1.5] sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all min-w-fit whitespace-nowrap"
                    >
                        {loading ? 'Sending...' : <><Send className="w-4 h-4" /> <span className="sm:inline">Send Now</span></>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Editor Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Announcement Type */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-brand-500" />
                            1. ANNOUNCEMENT INTENT
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            {announcementTypes.map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setFormData(p => ({ ...p, announcement_type: type.value }))}
                                    className={`p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest text-center transition-all ${
                                        formData.announcement_type === type.value 
                                        ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' 
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-brand-200'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand-500" />
                            2. BROADCAST CORE
                        </h3>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                name="title"
                                placeholder="Headline: e.g. Extra Practice Session"
                                className="w-full px-5 sm:px-6 py-3 sm:py-4 bg-slate-50 border-none rounded-2xl text-sm sm:text-base font-black text-slate-800 tracking-tight focus:ring-2 focus:ring-brand-500"
                                value={formData.title}
                                onChange={handleChange}
                            />
                            
                            <div className="relative group">
                                <div className="absolute left-0 top-0 w-full p-2 sm:p-4 flex flex-wrap gap-1 sm:gap-2 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm rounded-t-2xl z-10 transition-all">
                                    <button 
                                        onClick={() => editor.chain().focus().toggleBold().run()}
                                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${editor?.isActive('bold') ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-brand-500 hover:bg-white'}`}
                                    >
                                        <BoldIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button 
                                        onClick={() => editor.chain().focus().toggleItalic().run()}
                                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${editor?.isActive('italic') ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-brand-500 hover:bg-white'}`}
                                    >
                                        <ItalicIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button 
                                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${editor?.isActive('underline') ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-brand-500 hover:bg-white'}`}
                                    >
                                        <UnderlineIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button 
                                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${editor?.isActive('bulletList') ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-brand-500 hover:bg-white'}`}
                                    >
                                        <ListIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button 
                                        onClick={addLink}
                                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${editor?.isActive('link') ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-brand-500 hover:bg-white'}`}
                                    >
                                        <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button 
                                        onClick={() => imageInputRef.current?.click()}
                                        className="p-1.5 sm:p-2 text-slate-400 hover:text-brand-500 hover:bg-white rounded-lg transition-all"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                                <div className="w-full min-h-[300px] px-6 sm:px-8 pt-16 sm:pt-20 pb-6 sm:pb-8 bg-slate-50 border-none rounded-[24px] sm:rounded-[32px] text-xs sm:text-sm font-medium text-slate-700 leading-relaxed focus-within:ring-2 focus-within:ring-brand-500">
                                    <EditorContent editor={editor} />
                                </div>
                            </div>
                        </div>

                        {/* Local Attachments Display */}
                        {localAttachments.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                {localAttachments.map(file => (
                                    <div key={file.id} className="group relative flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-200 transition-all">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                            {file.type === 'video' ? <Video className="w-5 h-5" /> : file.type === 'image' ? <ImageIcon className="w-5 h-5" /> : <File className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-slate-800 truncate">{file.name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">{file.size}</p>
                                        </div>
                                        <button 
                                            onClick={() => removeAttachment(file.id)}
                                            className="p-2 bg-white text-slate-300 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Attachments Trigger */}
                        <div className="pt-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white border border-dashed border-slate-200 rounded-2xl sm:rounded-3xl text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-brand-500 hover:text-brand-500 transition-all w-full justify-center group"
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" /> Add Attachments
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Configuration */}
                <div className="space-y-6">
                    {/* Target Audience */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Target Audience</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {audienceTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setFormData(p => ({ ...p, target_audience: type.id }))}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border gap-2 transition-all ${
                                        formData.target_audience === type.id 
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                                        : 'bg-white text-slate-400 border-slate-50 hover:border-slate-100'
                                    }`}
                                >
                                    <type.icon className="w-5 h-5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{type.label}</span>
                                </button>
                            ))}
                        </div>

                        {formData.target_audience === 'students' && (
                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Target Year</p>
                                        <select 
                                            name="year"
                                            value={formData.year}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase text-slate-600 focus:ring-0"
                                        >
                                            <option value="">-- ALL YEARS --</option>
                                            {['FE', 'SE', 'TE', 'BE'].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Target Section</p>
                                        <select 
                                            name="division"
                                            value={formData.division}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase text-slate-600 focus:ring-0"
                                        >
                                            <option value="">-- ALL SECTIONS --</option>
                                            {['A', 'B', 'C'].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delivery & Schedule */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Delivery Engine</h3>
                        <div className="space-y-3">
                            {[
                                { id: 'in_app', label: 'Dashboard Notification', icon: Bell },
                                { id: 'email', label: 'Institutional Email', icon: MessageSquare },
                                { id: 'sms', label: 'Direct SMS (Priority)', icon: Smartphone }
                            ].map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => handleChannelToggle(channel.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                        formData.channels.includes(channel.id)
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                                        : 'bg-white text-slate-400 border-slate-50 hover:border-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <channel.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{channel.label}</span>
                                    </div>
                                    {formData.channels.includes(channel.id) && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                </button>
                            ))}
                        </div>

                        {/* Priority Selection */}
                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3">Broadcast Priority</p>
                            <div className="flex gap-2">
                                {['low', 'normal', 'high', 'urgent'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                                        className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${
                                            formData.priority === p 
                                            ? p === 'urgent' ? 'bg-red-500 text-white border-red-500' : 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-400 border-slate-100'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scheduling Options */}
                        <div className="pt-4 border-t border-slate-50">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.is_scheduled ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_scheduled ? 'translate-x-4' : ''}`}></div>
                                </div>
                                <input type="checkbox" name="is_scheduled" className="hidden" onChange={handleChange} checked={formData.is_scheduled} />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Schedule for Later</span>
                            </label>

                            {formData.is_scheduled && (
                                <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <input 
                                            type="datetime-local" 
                                            name="scheduled_at"
                                            className="bg-transparent border-none text-[10px] font-black text-indigo-600 focus:ring-0"
                                            value={formData.scheduled_at}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pinning Option */}
                        <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.is_pinned ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_pinned ? 'translate-x-4' : ''}`}></div>
                                </div>
                                <input type="checkbox" name="is_pinned" className="hidden" onChange={handleChange} checked={formData.is_pinned} />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    pin Broadcast
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementEditor;
