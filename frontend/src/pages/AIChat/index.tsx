import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setDocuments } from '../../store/slices/documentSlice';
import uploadService from '../../services/upload/uploadService';
import searchService from '../../services/search/searchService';
import { 
  Send, Bot, User, FileText, 
  Trash2, Loader2, Info 
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  docReference?: {
    id: string;
    name: string;
  } | null;
}

const AIChat: React.FC = () => {
  const dispatch = useAppDispatch();
  const { documents } = useAppSelector((state) => state.document);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your Document Deduplication System Assistant. Ask me anything about your ingested documents, or select a specific file to chat with directly.'
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents for select options
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const list = await uploadService.list();
        dispatch(setDocuments(list));
      } catch (err) {
        console.error('Failed to load documents for chat context:', err);
      }
    };
    fetchDocs();
  }, [dispatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    // 1. Add user message
    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: query
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      // 2. Query RAG Chat API
      const result = await searchService.chat(query, selectedDocId);
      
      // 3. Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: result.response,
        docReference: result.referenced_doc_id && result.referenced_doc_name ? {
          id: result.referenced_doc_id,
          name: result.referenced_doc_name
        } : null
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I encountered an error while retrieving document context. Please verify the backend services.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Hello! I am your Document Deduplication System Assistant. Ask me anything about your ingested documents, or select a specific file to chat with directly.'
      }
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '4px' }}>RAG Document Chat</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Interact directly with the semantic vector index of your document library.</p>
        </div>

        {/* Clear chat button */}
        <button
          onClick={handleClearChat}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: 'auto',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
        >
          <Trash2 size={14} /> Clear History
        </button>
      </div>

      {/* Main chat window layout */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0px' }}>
        {/* Context bar selection at top */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
          borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)'
        }}>
          <Info size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chat Context:</span>
          
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            style={{
              padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)',
              color: '#fff', borderRadius: '4px', outline: 'none'
            }}
          >
            <option value="">Query All Ingested Documents (Auto-routing)</option>
            {documents.filter(d => d.status === 'completed').map((doc) => (
              <option key={doc.id} value={doc.id}>
                Focus: {doc.filename}
              </option>
            ))}
          </select>
        </div>

        {/* Message logs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div 
                key={msg.id} 
                style={{
                  display: 'flex', gap: '12px',
                  justifyContent: isBot ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  alignSelf: isBot ? 'flex-start' : 'flex-end'
                }}
              >
                {/* Bot Icon */}
                {isBot && (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Bot size={16} style={{ color: 'var(--primary)' }} />
                  </div>
                )}

                {/* Message bubble */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: '16px',
                    borderTopLeftRadius: isBot ? '2px' : '16px',
                    borderTopRightRadius: !isBot ? '2px' : '16px',
                    background: isBot ? 'rgba(255, 255, 255, 0.03)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    border: isBot ? '1px solid var(--glass-border)' : 'none',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    boxShadow: !isBot ? '0 4px 15px rgba(99, 102, 241, 0.2)' : 'none'
                  }}>
                    {msg.text}
                  </div>

                  {/* Reference indicator */}
                  {msg.docReference && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '0.75rem', color: 'var(--accent-pink)', paddingLeft: '4px'
                    }}>
                      <FileText size={12} />
                      Source Document: <b>{msg.docReference.name}</b>
                    </div>
                  )}
                </div>

                {/* User Icon */}
                {!isBot && (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <User size={16} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                )}
              </div>
            );
          })}
          
          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(99,102,241,0.1)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{
                padding: '12px 18px', borderRadius: '16px', borderTopLeftRadius: '2px',
                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <Loader2 size={16} className="animate-spin-glow" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Searching index...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input panel at bottom */}
        <form onSubmit={handleSend} style={{
          display: 'flex', gap: '12px', padding: '16px 20px',
          borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.15)'
        }}>
          <input
            type="text"
            className="glass-input"
            placeholder={loading ? "AI is typing..." : "Type your question about documents (e.g. 'summarize the financial tables')..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{ borderRadius: 'var(--radius-sm)' }}
          />
          
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: (loading || !input.trim()) ? 'var(--text-disabled)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: '#fff',
              fontWeight: 600,
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: (loading || !input.trim()) ? 'none' : '0 4px 12px var(--primary-glow)',
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={14} /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
