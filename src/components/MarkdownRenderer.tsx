'use client';

import React from 'react';

// Custom simple Markdown Renderer Component for Roteiros
export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Normalize newlines in case they are double-escaped or literal
  const normalizedContent = content.replace(/\\n/g, '\n');
  const lines = normalizedContent.split('\n');

  return (
    <div className="space-y-2 text-xs font-sans text-slate-300 leading-relaxed text-left">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed === '') {
          return <div key={index} className="h-1.5" />;
        }

        // Headers: ### Title or ## Title or # Title
        const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const text = headerMatch[2];
          if (level === 1) {
            return <h1 key={index} className="text-sm font-bold text-slate-100 mt-3 mb-1">{parseInlineMarkdown(text)}</h1>;
          }
          if (level === 2) {
            return <h2 key={index} className="text-xs font-bold text-slate-100 mt-2.5 mb-1">{parseInlineMarkdown(text)}</h2>;
          }
          return <h3 key={index} className="text-xs font-bold text-slate-200 mt-2 mb-1">{parseInlineMarkdown(text)}</h3>;
        }

        // Bullet points: * Item or - Item
        const bulletMatch = line.match(/^[\*\-]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <ul key={index} className="list-disc pl-4 space-y-1">
              <li className="text-slate-300">
                {parseInlineMarkdown(bulletMatch[1])}
              </li>
            </ul>
          );
        }

        // Default paragraph
        return (
          <p key={index} className="text-slate-300">
            {parseInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

export function parseInlineMarkdown(text: string) {
  if (!text) return '';
  // Split by bold patterns: **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-indigo-400">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Handle inline code: `code`
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((subPart, j) => {
      if (subPart.startsWith('`') && subPart.endsWith('`')) {
        return (
          <code key={`${i}-${j}`} className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded font-mono text-[10px]">
            {subPart.slice(1, -1)}
          </code>
        );
      }
      return subPart;
    });
  });
}

// Extract clean script text from JSON or truncated JSON
export const cleanScriptText = (text: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.script) return parsed.script;
    } catch (e) {
      // JSON.parse failed. Try matching complete script field first
      const completeMatch = trimmed.match(/"script"\s*:\s*"([\s\S]*?)"\s*(?:,|\})/i) || 
                            trimmed.match(/"script"\s*:\s*"([\s\S]*?)"/i);
      if (completeMatch) {
        return completeMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      
      // If that fails, JSON is likely truncated (no closing quote). Capture up to end of string.
      const truncatedMatch = trimmed.match(/"script"\s*:\s*"([\s\S]*)$/i);
      if (truncatedMatch) {
        let rawContent = truncatedMatch[1];
        
        // Clean trailing JSON fragments
        rawContent = rawContent.replace(/"\s*,\s*"kanbanTasks"[\s\S]*$/i, '');
        rawContent = rawContent.replace(/"\s*,\s*"deliveryAdjustment"[\s\S]*$/i, '');
        rawContent = rawContent.replace(/"\s*\}\s*$/g, '');
        if (rawContent.endsWith('"')) {
          rawContent = rawContent.slice(0, -1);
        }
        
        return rawContent
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
    }
  }
  return text;
};
