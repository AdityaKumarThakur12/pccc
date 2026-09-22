import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Mic, Square } from 'lucide-react';
import { useChatStore } from '@/stores';

interface ChatInputProps {
  onSend: (text: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onCancel, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isProcessing } = useChatStore();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isProcessing) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
      <div className="flex items-end gap-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-3 py-2 focus-within:border-[var(--accent)] transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your PC anything..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none max-h-32"
        />
        <button
          onClick={() => {}}
          disabled
          className="text-[var(--text-muted)] p-1 cursor-not-allowed"
          title="Voice input (coming soon)"
        >
          <Mic size={18} />
        </button>
        {isProcessing ? (
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-[var(--error)]/15 text-[var(--error)] hover:bg-[var(--error)]/25 transition-colors"
            title="Cancel"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className="p-1.5 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
