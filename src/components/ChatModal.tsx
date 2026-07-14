import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { X, Send, User as UserIcon, MessageSquare } from 'lucide-react';

interface ChatModalProps {
  currentUser: User;
  messages: Message[];
  users: User[];
  onSendMessage: (receiverId: string, text: string) => void;
  onClose: () => void;
}

export default function ChatModal({
  currentUser,
  messages,
  users,
  onSendMessage,
  onClose
}: ChatModalProps) {
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages to find distinct chat partners
  const chatPartnersMap = new Map<string, User>();
  
  messages.forEach((msg) => {
    // If current user is sender, the partner is receiver
    if (msg.senderId === currentUser.id) {
      const partner = users.find((u) => u.id === msg.receiverId);
      if (partner) chatPartnersMap.set(partner.id, partner);
    }
    // If current user is receiver, the partner is sender
    else if (msg.receiverId === currentUser.id) {
      const partner = users.find((u) => u.id === msg.senderId);
      if (partner) chatPartnersMap.set(partner.id, partner);
    }
  });

  const chatPartners = Array.from(chatPartnersMap.values());

  // Set first partner active if none selected
  useEffect(() => {
    if (!activePartnerId && chatPartners.length > 0) {
      setActivePartnerId(chatPartners[0].id);
    }
  }, [chatPartners, activePartnerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePartnerId]);

  // Active messages filter
  const activeMessages = messages.filter(
    (msg) =>
      (msg.senderId === currentUser.id && msg.receiverId === activePartnerId) ||
      (msg.senderId === activePartnerId && msg.receiverId === currentUser.id)
  );

  const activePartner = users.find((u) => u.id === activePartnerId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() === '' || !activePartnerId) return;

    onSendMessage(activePartnerId, inputText);
    const sentText = inputText;
    setInputText('');

    // --- Automatic Reply Simulator ---
    // Simulate active partner typing and replying after 1.5s
    setTimeout(() => {
      let replyText = 'حياك الله! شكراً لتواصلك معنا عبر منصة فيلوريا. كيف يمكنني خدمتك وتسهيل تسليم المنتج لك اليوم؟';
      const cleanText = sentText.toLowerCase();

      if (cleanText.includes('طاولة') || cleanText.includes('خشب')) {
        replyText = 'أهلاً بك يا أخي! نعم، الطاولة متوفرة ومصنوعة يدوياً من خشب الساج الطبيعي المتين، والتسليم فوري في الرياض بمندوب مستقل.';
      } else if (cleanText.includes('حلا') || cleanText.includes('حلويات') || cleanText.includes('كعك')) {
        replyText = 'أهلاً بك! جميع الحلويات طازجة بالكامل ويتم تحضيرها فور طلبك في جدة. هل تود تحديد موعد للتسليم يوم الجمعة؟';
      } else if (cleanText.includes('سعر') || cleanText.includes('خصم')) {
        replyText = 'أسعارنا مناسبة جداً وتنافسية، ولكن بما أن فيلوريا منصة لربط الأطراف فإني مستعد لتخفيض بسيط لك للاتفاق الإيجابي المتبادل!';
      } else if (cleanText.includes('شحن') || cleanText.includes('توصيل')) {
        replyText = 'أهلاً بك، يمكننا شحنها عبر شركات الشحن المحلية أو إرسال مندوب تسليم مباشر في مدينتك والدفع عند المعاينة والاستلام لضمان ثقتك.';
      }

      onSendMessage(currentUser.id, replyText); // Swap sender/receiver for reply
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-100 dark:border-slate-800 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <h2 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              صندوق الرسائل والدردشة المباشرة
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chats layout splitter */}
        <div className="flex-1 flex overflow-hidden">
          {/* List of Partners (Sidebar) */}
          <div className="w-1/3 border-l border-slate-100 dark:border-slate-800 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
            {chatPartners.length === 0 ? (
              <div className="p-4 text-center text-[10px] text-slate-400">
                لا توجد محادثات نشطة حالياً. تصفح المنتجات وانقر على "دردشة مباشرة".
              </div>
            ) : (
              chatPartners.map((partner) => {
                const isSelected = partner.id === activePartnerId;
                return (
                  <button
                    key={partner.id}
                    onClick={() => setActivePartnerId(partner.id)}
                    className={`w-full p-3 flex flex-col items-center gap-1 border-b border-slate-100 dark:border-slate-800/50 transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border-r-4 border-r-amber-500' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <img src={partner.avatar} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-[10px] truncate max-w-full text-slate-700 dark:text-slate-300">
                      {partner.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Active Chat Conversation Panel */}
          <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
            {activePartner ? (
              <>
                {/* Active Partner Info header */}
                <div className="p-3 border-b border-slate-50 dark:border-slate-800/40 flex items-center gap-2 bg-slate-50/30 dark:bg-slate-850/10">
                  <img src={activePartner.avatar} className="w-7 h-7 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-850 dark:text-slate-200">{activePartner.name}</h4>
                    <span className="text-[9px] text-slate-400">نشط الآن</span>
                  </div>
                </div>

                {/* Conversation bubbles */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                  {activeMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed ${
                          isMe
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none self-end text-right'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 rounded-bl-none self-start text-right'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className={`text-[8px] mt-1 block ${isMe ? 'text-slate-800' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Form Input */}
                <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="اكتب رسالة للاتفاق..."
                    className="flex-1 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                <span>يرجى اختيار دردشة من القائمة الجانبية للتواصل والمتابعة.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
