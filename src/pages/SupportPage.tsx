import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { 
  HelpCircle, ArrowLeft, Loader2, Send, CheckCircle2, Clipboard, ChevronRight, MessageSquare, ShieldAlert
} from "lucide-react";

export const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, tickets, createTicket, resolveTicket, addTicketMessage, addNotification 
  } = useApp() as any;

  // Redirection guard - if not logged in, go to /login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(true);
  const [ticketCategory, setTicketCategory] = useState<any>("General Feedback");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketOrder, setTicketOrder] = useState("");
  const [supportMessage, setSupportMessage] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Loading animation simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDesc.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      createTicket(ticketCategory, ticketDesc.trim(), ticketOrder.trim() || undefined);
      addNotification("Ticket Created", "Supervisor desk received your incident report.");
      setTicketDesc("");
      setTicketOrder("");
      setSubmitting(false);
    }, 500);
  };

  const handleSendTicketMsg = (ticketId: string) => {
    const msg = supportMessage[ticketId];
    if (msg && msg.trim()) {
      addTicketMessage(ticketId, msg.trim(), "customer");
      setSupportMessage({ ...supportMessage, [ticketId]: "" });
      
      // Auto reply simulation after 2 seconds
      setTimeout(() => {
        addTicketMessage(ticketId, "Understood. Our hyper-local desk captain is reviewing your order ledger. Hold tight!", "support");
      }, 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-4xl mx-auto pb-24 px-4 pt-4"
      id="support-page-root"
    >
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/account")}
          className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-full border border-zinc-200 transition select-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-700" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            24/7 Help Center Support
          </h1>
          <p className="text-xs text-zinc-400 font-semibold">Instant cancellations, item refunds, freshness complaints, or general queries.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-zinc-400 font-extrabold uppercase tracking-widest">Opening Support Desk...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* File Ticket Form Panel */}
          <form onSubmit={handleCreateTicket} className="lg:col-span-2 bg-white border border-zinc-150 p-6 rounded-[28px] space-y-4 shadow-sm self-start">
            <h3 className="font-extrabold text-xs text-zinc-800 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              File a Support Ticket
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Select Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e: any) => setTicketCategory(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 font-semibold text-zinc-700 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                >
                  <option value="Late Delivery">Late Delivery Dispute</option>
                  <option value="Wrong Item">Wrong Item Received</option>
                  <option value="Damaged Item">Damaged / Spoiled Freshness</option>
                  <option value="Billing Issue">Refund / Billing Discrepancy</option>
                  <option value="General Feedback">General App Feedback</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Order ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. QN-2026-..."
                  value={ticketOrder}
                  onChange={(e) => setTicketOrder(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Describe incident details</label>
                <textarea
                  rows={4}
                  required
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  placeholder="Provide details of your request so our supervisor can audit immediately..."
                  className="w-full p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 transition resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl uppercase tracking-widest transition cursor-pointer shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "SUBMIT INCIDENT REPORT"
              )}
            </button>
          </form>

          {/* Tickets list panel */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-extrabold text-xs text-zinc-850 uppercase tracking-widest">Active Incident Tickets ({tickets.length})</h3>

            {tickets.length === 0 ? (
              <div className="bg-white border border-zinc-150 rounded-[28px] p-10 text-center space-y-3.5 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-zinc-800">No complaints registered</p>
                  <p className="text-[10px] text-zinc-400 font-semibold">Your account dispatch parameters are 100% green.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {tickets.map((t: any) => (
                  <div key={t.id} className="border border-zinc-150 rounded-[24px] bg-white p-4.5 space-y-4 shadow-sm hover:border-zinc-200 transition">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-zinc-100 border border-zinc-200 text-zinc-850 font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                          {t.category}
                        </span>
                        {t.orderId && <span className="text-[9px] text-zinc-400 font-mono font-bold">Order: {t.orderId}</span>}
                      </div>
                      
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                        t.status === "Resolved" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-100 p-3 rounded-xl leading-relaxed italic">
                      "{t.description}"
                    </p>

                    {/* Chat Logs */}
                    <div className="space-y-2 border-t border-zinc-100 pt-3">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Dialogue Log History</p>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {t.messages?.map((msg: any, mIdx: number) => (
                          <div key={mIdx} className={`text-[11px] p-2.5 rounded-2xl max-w-[85%] border shadow-sm ${
                            msg.sender === "customer" 
                              ? "bg-indigo-50/50 text-indigo-900 border-indigo-100 ml-auto" 
                              : "bg-zinc-50 text-zinc-850 border-zinc-150"
                          }`}>
                            <p className="font-extrabold text-[8px] uppercase tracking-wider opacity-60 mb-0.5">{msg.sender}</p>
                            <p className="font-medium leading-relaxed">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ticket Action Reply Panel */}
                    {t.status !== "Resolved" && (
                      <div className="flex gap-2 items-center border-t border-zinc-100 pt-3">
                        <input
                          type="text"
                          placeholder="Write message to incident supervisor..."
                          value={supportMessage[t.id] || ""}
                          onChange={(e) => setSupportMessage({ ...supportMessage, [t.id]: e.target.value })}
                          className="flex-1 p-2.5 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSendTicketMsg(t.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSendTicketMsg(t.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            resolveTicket(t.id);
                            addNotification("Ticket Resolved", "Support complaint has been closed successfully.");
                          }}
                          className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold px-3 py-2.5 rounded-xl border border-emerald-200 cursor-pointer transition select-none"
                        >
                          Resolve
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </motion.div>
  );
};
