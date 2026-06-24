import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi there! I am AutoBot, your virtual helper. How can I assist you with your auto parts, branches, or orders today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of message list on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickReplies = [
    { label: '📦 Order Status', query: 'order status' },
    { label: '📍 Branch Locations', query: 'branch locations' },
    { label: '🔄 Returns & Warranty', query: 'return policy' },
    { label: '📞 Support Contact', query: 'support contact' },
  ];

  const getBotResponse = (query) => {
    const cleanQuery = query.toLowerCase().trim();

    if (cleanQuery.includes('order') || cleanQuery.includes('track') || cleanQuery.includes('status') || cleanQuery.includes('shipment')) {
      return 'You can check your order status on the **Orders** page. Standard delivery takes 2 to 4 business days. For real-time dispatches, keep an eye on your live notifications!';
    }
    if (cleanQuery.includes('location') || cleanQuery.includes('branch') || cleanQuery.includes('shop') || cleanQuery.includes('address') || cleanQuery.includes('where')) {
      return 'We have three main branches: \n1. **London Distribution Hub** (Aisle A) \n2. **Manchester Express Outlet** (Aisle B) \n3. **Birmingham Logistics Center** (Aisle C) \nStock is managed dynamically across all locations!';
    }
    if (cleanQuery.includes('return') || cleanQuery.includes('refund') || cleanQuery.includes('exchange') || cleanQuery.includes('policy')) {
      return 'We offer a 30-day return policy for unused products in their original packaging. Please reach out to **support@autodist.com** to initiate a return.';
    }
    if (cleanQuery.includes('warranty') || cleanQuery.includes('guarantee')) {
      return 'All our catalog products (including motor oils, tyres, and tools) come with a standard 12-month manufacturer warranty covering defects.';
    }
    if (cleanQuery.includes('contact') || cleanQuery.includes('email') || cleanQuery.includes('support') || cleanQuery.includes('help') || cleanQuery.includes('phone')) {
      return 'Our support team is available at **support@autodist.com** or +1 (800) 555-0199. You can also leave your feedback directly on the **Customer Feedback** page!';
    }
    if (cleanQuery.includes('product') || cleanQuery.includes('price') || cleanQuery.includes('stock') || cleanQuery.includes('catalog') || cleanQuery.includes('buy')) {
      return 'You can browse our premium catalog of Oils, Tyres, and Spare Parts on the **Products** page. Simply add items to your cart to check out.';
    }
    if (cleanQuery.includes('hi') || cleanQuery.includes('hello') || cleanQuery.includes('hey') || cleanQuery.includes('greet')) {
      return 'Hello! How can I help you today? Ask me about order status, branch locations, returns, or product details!';
    }

    return "I'm not sure I understand that. Try asking about 'order status', 'branch locations', 'return policy', or 'support contact'!";
  };

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: getBotResponse(textToSend),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 750);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group relative"
          title="Ask AutoBot"
        >
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-400 rounded-full animate-ping opacity-75"></span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-400 rounded-full border-2 border-white dark:border-gray-950"></span>
          <MessageSquare className="w-6 h-6 transition-transform group-hover:rotate-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-[360px] h-[500px] max-h-[calc(100vh-100px)] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-indigo-600 dark:bg-indigo-950 text-white flex justify-between items-center border-b border-indigo-550 dark:border-indigo-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-1">
                  AutoBot Assistant
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-indigo-200 font-semibold">Online Helpdesk</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-indigo-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-gray-200 dark:border-gray-700'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="max-w-[70%] space-y-1">
                  <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-150 dark:border-gray-750 rounded-tl-none whitespace-pre-line'
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`block text-[9px] text-gray-400 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-750 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce duration-300"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce duration-300 [animation-delay:0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce duration-300 [animation-delay:0.3s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies chips */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 overflow-x-auto scrollbar-none">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(reply.query)}
                className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 text-gray-700 dark:text-gray-300 rounded-full text-[10px] font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-900/50 hover:text-indigo-650 transition-all duration-200 shadow-xs"
              >
                {reply.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask AutoBot helper..."
              className="flex-1 min-w-0 px-3.5 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white font-medium"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-8.5 h-8.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 dark:disabled:bg-gray-850 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
