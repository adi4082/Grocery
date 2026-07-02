import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { MessageSquare, X, Send, AlertCircle, FileText, HelpCircle, CheckCircle, Ticket } from "lucide-react";

export const CustomerSupportBubble: React.FC = () => {
  const { user, orders, tickets, createTicket, addTicketMessage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "ticket" | "faq">("chat");

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot" | "support"; text: string; time: string }>>([
    { sender: "bot", text: "Hello! Welcome to QuickNow Support. How can I help you today? Ask me about products, delivery times, or refund status.", time: "Just now" }
  ]);
  const [userInput, setUserInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Ticket Form States
  const [ticketCategory, setTicketCategory] = useState<"Late Delivery" | "Damaged Item" | "Wrong Item" | "Billing Issue" | "General Feedback">("General Feedback");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketOrderId, setTicketOrderId] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Active Live Tickets (only show customer's own tickets)
  const myTickets = tickets;

  // Selected Ticket to view chat history with support executive
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, selectedTicketId, activeTicket?.messages]);

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const userMsg = userInput.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append user message
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg, time: timeNow }]);
    setUserInput("");

    // Simulate AI support agent response
    setTimeout(() => {
      let botResponse = "I've received your query and I am checking with our dispatch hub. If you need urgent assistance, you can raise an official complaint ticket from the 'Raise Ticket' tab above!";
      const cleanMsg = userMsg.toLowerCase();

      if (cleanMsg.includes("apple") || cleanMsg.includes("banana") || cleanMsg.includes("avocado") || cleanMsg.includes("fruit")) {
        botResponse = "All our fruits & veg are sourced daily at 4:00 AM from organic farms. They are washed and pre-chilled in our dark stores before quick delivery!";
      } else if (cleanMsg.includes("milk") || cleanMsg.includes("dairy") || cleanMsg.includes("butter")) {
        botResponse = "Our milk and dairy items are stored under strict 3°C cold-chain systems. If you received any item that was not perfectly chilled, you can raise a refund ticket!";
      } else if (cleanMsg.includes("time") || cleanMsg.includes("delivery") || cleanMsg.includes("delay") || cleanMsg.includes("late")) {
        botResponse = "QuickNow is committed to dispatching all orders in under 3 minutes and delivering within 10 minutes. If your Rider Captain is delayed, you'll earn ₹1 per minute as late cashback guarantee!";
      } else if (cleanMsg.includes("payment") || cleanMsg.includes("refund") || cleanMsg.includes("wallet") || cleanMsg.includes("upi")) {
        botResponse = "Online payments via UPI and Cards are fully secure. Refund claims are instantly credited back to your QuickNow Wallet as soon as they are approved.";
      } else if (cleanMsg.includes("coupon") || cleanMsg.includes("discount") || cleanMsg.includes("referral")) {
        botResponse = "You can redeem discount codes (like QUICK20 or FIRSTNOW) at the checkout drawer. Also check the 'Daily Gift' scratch cards in the header for premium offers!";
      }

      setChatMessages((prev) => [...prev, { sender: "bot", text: botResponse, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }, 1000);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDesc.trim()) return;

    createTicket(ticketCategory, ticketDesc, ticketOrderId || undefined);
    setFormSuccess(true);
    setTicketDesc("");
    setTicketOrderId("");

    setTimeout(() => {
      setFormSuccess(false);
      setActiveTab("chat"); // redirect or switch
    }, 2500);
  };

  const handleSendTicketReply = () => {
    if (!replyText.trim() || !selectedTicketId) return;
    addTicketMessage(selectedTicketId, replyText.trim(), "customer");
    setReplyText("");
  };

  const FAQS = [
    { q: "What is QuickNow's average delivery time?", a: "We deliver in 10 minutes on average. Our network of micro-warehouses (dark stores) are situated within 2-3 KM of your location to make instant delivery possible." },
    { q: "How do I claim a refund for damaged groceries?", a: "Go to the 'Raise Ticket' tab in this support bubble, select 'Damaged Item', specify your active order ID, and submit. Our managers review it in under 5 minutes." },
    { q: "Can I schedule a delivery for later?", a: "QuickNow is built for instant demands. However, you can toggle subscription delivery or set up auto-reorders from your dashboard for daily staples like fresh milk." },
    { q: "How does the loyalty point system work?", a: "You earn 1 loyalty point for every ₹10 spent. Once you hit 100 points, you can instantly redeem them for ₹10 cash credit directly inside your wallet." }
  ];

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 group hover:scale-110 flex items-center justify-center cursor-pointer border border-white/20 animate-bounce"
        >
          {/* Pulsing ring outer */}
          <div className="absolute inset-0 rounded-full bg-emerald-600/30 animate-ping -z-10" />
          <MessageSquare className="w-6 h-6 animate-pulse" />
          
          <span className="absolute right-full mr-3 bg-zinc-900 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 uppercase tracking-wider border border-zinc-800">
            24/7 Live Support
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-full max-w-[340px] sm:max-w-[400px] bg-white rounded-[32px] shadow-2xl border border-zinc-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 h-[480px] max-h-[75vh]">
      
      {/* Widget Header */}
      <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
            <span className="font-black italic text-sm text-zinc-900">Q</span>
          </div>
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-emerald-400">QuickNow Assist</h4>
            <p className="text-[10px] text-zinc-400 font-bold">Rider & Store Dispatch Support</p>
          </div>
        </div>
        <button 
          onClick={() => { setIsOpen(false); setSelectedTicketId(null); }}
          className="p-1.5 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs list (hide if viewing ticket detail chat) */}
      {!selectedTicketId && (
        <div className="flex border-b border-zinc-100 text-xs font-bold text-zinc-500 bg-zinc-50/50">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === "chat" ? "border-emerald-600 text-emerald-600 font-black" : "border-transparent hover:text-zinc-800"
            }`}
          >
            AI Agent Chat
          </button>
          <button
            onClick={() => setActiveTab("ticket")}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === "ticket" ? "border-emerald-600 text-emerald-600 font-black" : "border-transparent hover:text-zinc-800"
            }`}
          >
            Raise Ticket
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === "faq" ? "border-emerald-600 text-emerald-600 font-black" : "border-transparent hover:text-zinc-800"
            }`}
          >
            F.A.Q. Guide
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
        
        {/* VIEW: Ticket detail screen */}
        {selectedTicketId && activeTicket ? (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-150">
              <button 
                onClick={() => setSelectedTicketId(null)}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
              >
                &larr; Back to List
              </button>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                activeTicket.status === "Open" ? "bg-amber-100 text-amber-700 animate-pulse" :
                activeTicket.status === "In-Progress" ? "bg-blue-100 text-blue-700 animate-pulse" :
                "bg-emerald-100 text-emerald-700"
              }`}>
                {activeTicket.status}
              </span>
            </div>

            <div className="p-3 bg-white border border-zinc-100 rounded-2xl space-y-1 shadow-sm">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">Category: {activeTicket.category}</p>
              <h5 className="text-xs font-black text-zinc-800">ID: {activeTicket.id}</h5>
              {activeTicket.orderId && <p className="text-[10px] text-zinc-500 font-bold">Linked Order: {activeTicket.orderId}</p>}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-56 p-1">
              {activeTicket.messages.map((m, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col max-w-[80%] ${m.sender === "customer" ? "ml-auto items-end" : "mr-auto items-start"}`}
                >
                  <div className={`p-3 rounded-2xl text-xs font-semibold shadow-sm ${
                    m.sender === "customer" 
                      ? "bg-emerald-600 text-white rounded-tr-none" 
                      : "bg-white text-zinc-800 border border-zinc-150 rounded-tl-none"
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-[9px] text-zinc-400 font-bold mt-1 uppercase">{m.sender} &bull; {m.time}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Message Reply Field */}
            {activeTicket.status !== "Resolved" ? (
              <div className="flex items-center gap-2 border-t border-zinc-100 pt-2">
                <input
                  type="text"
                  placeholder="Type message to support desk..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendTicketReply()}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSendTicketReply}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 text-center rounded-2xl text-xs font-black uppercase tracking-wide">
                This ticket is marked resolved.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* TAB: Chat */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full justify-between">
                
                {/* Chat Log */}
                <div className="flex-1 overflow-y-auto space-y-3 max-h-64 p-1">
                  {chatMessages.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex flex-col max-w-[80%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <div className={`p-3 rounded-2xl text-xs font-semibold shadow-sm ${
                        msg.sender === "user"
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : "bg-white text-zinc-800 border border-zinc-150 rounded-tl-none"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-zinc-400 font-bold mt-1">{msg.time}</span>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Send action bar */}
                <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask about products, orders, refunds..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Raise Ticket */}
            {activeTab === "ticket" && (
              <div className="space-y-4">
                
                {formSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-center space-y-3">
                    <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-zinc-800">Complaint Logged!</h4>
                    <p className="text-xs text-zinc-500">Your support ticket has been filed. Our support desk executive will review and response instantly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateTicketSubmit} className="space-y-3 bg-white border border-zinc-100 p-4 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Raise Official Complaint</p>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase">Issue Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-800 cursor-pointer"
                      >
                        <option value="Late Delivery">Late Delivery</option>
                        <option value="Damaged Item">Damaged/Rotten Item</option>
                        <option value="Wrong Item">Wrong Item Shipped</option>
                        <option value="Billing Issue">Billing / Payment Issue</option>
                        <option value="General Feedback">General Feedback</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase">Link Active Order ID (Optional)</label>
                      <select
                        value={ticketOrderId}
                        onChange={(e) => setTicketOrderId(e.target.value)}
                        className="w-full p-2.5 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-800 cursor-pointer"
                      >
                        <option value="">-- No Order Linked --</option>
                        {orders.map(o => (
                          <option key={o.id} value={o.id}>{o.id} (₹{o.total})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase">Describe Your Issue</label>
                      <textarea
                        required
                        value={ticketDesc}
                        onChange={(e) => setTicketDesc(e.target.value)}
                        placeholder="Please supply specific details of the complaint so our team can immediately process standard cashback refunds."
                        rows={3}
                        className="w-full p-2.5 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-800 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl transition cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      File Ticket
                    </button>
                  </form>
                )}

                {/* Active Tickets List */}
                {myTickets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-zinc-400" />
                      Active Help Desk Tickets ({myTickets.length})
                    </p>

                    <div className="space-y-2">
                      {myTickets.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTicketId(t.id)}
                          className="w-full text-left p-3.5 bg-white border border-zinc-150 rounded-2xl hover:border-emerald-500 transition shadow-sm hover:shadow flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-zinc-800">{t.id}</span>
                              <span className="text-[9px] bg-zinc-100 text-zinc-500 font-bold px-1.5 py-0.5 rounded-md uppercase font-mono">
                                {t.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate mt-1 max-w-[200px] font-medium">{t.description}</p>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              t.status === "Open" ? "bg-amber-100 text-amber-700" :
                              t.status === "In-Progress" ? "bg-blue-100 text-blue-700 animate-pulse" :
                              "bg-emerald-100 text-emerald-700"
                            }`}>
                              {t.status}
                            </span>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase">{t.messages.length} Chats</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB: FAQ */}
            {activeTab === "faq" && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                  General FAQ Guidebook
                </p>

                <div className="space-y-2">
                  {FAQS.map((item, idx) => (
                    <div key={idx} className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                      <button
                        onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                        className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                      >
                        <span>{item.q}</span>
                        <span className="text-zinc-400">{openFaqIdx === idx ? "−" : "+"}</span>
                      </button>

                      {openFaqIdx === idx && (
                        <div className="p-4 pt-0 border-t border-zinc-50 text-xs text-zinc-500 leading-relaxed font-medium">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Footer Accent line */}
      <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-emerald-500 to-teal-500" />
    </div>
  );
};
