import { useState } from 'react';
import { Copy, Check, RotateCcw, AlertCircle, Loader2, Wrench, User, Bot } from 'lucide-react';
import type { ChatMessageItem } from '@/types';

interface ChatMessageProps {
  message: ChatMessageItem;
  onRetry?: () => void;
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] border-b-0 rounded-t-lg">
        <span className="text-xs text-[var(--text-muted)] font-mono">{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-b-lg p-3 overflow-x-auto">
        <code className="text-xs font-mono text-[var(--text-primary)]">{code}</code>
      </pre>
    </div>
  );
}

function renderMarkdown(content: string): React.ReactNode {
  // Simple markdown renderer for code blocks, bold, and inline code
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(renderInlineMarkdown(text, key++));
    }
    // Code block
    parts.push(<CodeBlock key={key++} code={match[2].trim()} lang={match[1]} />);
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(renderInlineMarkdown(content.slice(lastIndex), key++));
  }

  return parts;
}

function renderInlineMarkdown(text: string, key: number): React.ReactNode {
  // Render inline code, bold, and line breaks
  const lines = text.split('\n');
  return (
    <div key={key} className="markdown-body">
      {lines.map((line, i) => {
        // Inline code
        const codeParts: React.ReactNode[] = [];
        const inlineCodeRegex = /`([^`]+)`/g;
        let lastIdx = 0;
        let m;
        let partKey = 0;
        while ((m = inlineCodeRegex.exec(line)) !== null) {
          if (m.index > lastIdx) {
            codeParts.push(<span key={partKey++}>{line.slice(lastIdx, m.index)}</span>);
          }
          codeParts.push(
            <code key={partKey++} className="bg-[var(--bg-tertiary)] px-1 py-0.5 rounded text-xs font-mono">
              {m[1]}
            </code>
          );
          lastIdx = m.index + m[0].length;
        }
        if (lastIdx < line.length) {
          codeParts.push(<span key={partKey++}>{line.slice(lastIdx)}</span>);
        }

        return (
          <div key={i}>
            {codeParts.length > 0 ? codeParts : line || '\u00A0'}
          </div>
        );
      })}
    </div>
  );
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.sender === 'tool') {
    return (
      <div className="flex items-start gap-2 px-4 py-2 animate-fade-in">
        <div className="flex-shrink-0 mt-0.5">
          <Wrench size={14} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[var(--accent)]">
              {message.metadata?.toolName || 'Tool'}
            </span>
            {message.metadata?.requiresConfirmation && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--warning)]/15 text-[var(--warning)]">
                Confirmation Required
              </span>
            )}
          </div>
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg p-3 text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap max-h-64 overflow-y-auto">
            {message.content}
          </div>
          {message.metadata?.toolResult && (
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {message.metadata.toolSuccess ? '✓' : '✗'}{' '}
              {message.metadata.toolResult.slice(0, 200)}
              {message.metadata.toolResult.length > 200 && '...'}
            </div>
          )}
        </div>
      </div>
    );
  }

  const isUser = message.sender === 'user';
  const isError = message.status === 'error';

  return (
    <div className={`flex items-start gap-3 px-4 py-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isUser ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)] border border-[var(--border-light)]'
      }`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-[var(--accent)]" />}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {isUser ? 'You' : 'AI'}
          </span>
          {message.status === 'loading' && (
            <Loader2 size={12} className="text-[var(--text-muted)] animate-spin-slow" />
          )}
          {isError && <AlertCircle size={12} className="text-[var(--error)]" />}
        </div>

        <div className={`inline-block max-w-full text-left ${
          isUser
            ? 'bg-[var(--accent)] text-white rounded-2xl rounded-tr-sm px-3 py-2'
            : 'text-[var(--text-primary)]'
        }`}>
          {message.status === 'loading' && !message.content ? (
            <span className="text-[var(--text-muted)] text-sm italic">Thinking...</span>
          ) : isUser ? (
            <span className="text-sm whitespace-pre-wrap">{message.content}</span>
          ) : (
            renderMarkdown(message.content)
          )}
        </div>

        {!isUser && message.status === 'complete' && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleCopy}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Copy"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Retry"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        )}

        {isError && message.error && (
          <div className="mt-1 text-xs text-[var(--error)]">
            {message.error}
          </div>
        )}
      </div>
    </div>
  );
}
