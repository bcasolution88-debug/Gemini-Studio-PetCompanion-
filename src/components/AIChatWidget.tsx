import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am your PetCompanion assistant. Ask me anything about pet health or care. (Disclaimer: I cannot replace professional veterinary diagnosis).' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input } as Message];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white dark:bg-stone-800 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-700 flex flex-col overflow-hidden">
          <div className="p-4 bg-rose-500 text-white flex justify-between items-center">
            <h3 className="font-semibold flex items-center">
              <Bot className="w-5 h-5 mr-2" /> Pet Assistant
            </h3>
            <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-stone-100 dark:bg-stone-700 ml-auto' : 'bg-rose-50 dark:bg-stone-900'} max-w-[80%]`}>
                {m.content}
              </div>
            ))}
            {isLoading && <div className="text-sm text-stone-500 italic">Thinking...</div>}
          </div>
          <form onSubmit={handleSubmit} className="p-3 border-t dark:border-stone-700 flex">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 p-2 rounded-xl border dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none"
            />
            <button type="submit" className="ml-2 p-2 bg-rose-500 text-white rounded-xl"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="p-4 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-transform hover:scale-105">
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
