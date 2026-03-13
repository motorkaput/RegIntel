import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";

export interface DocxContentSection {
  type: 'heading' | 'subheading' | 'paragraph' | 'list' | 'divider' | 'metadata';
  text?: string;
  items?: string[];
  color?: 'green' | 'red' | 'yellow' | 'default';
}

interface ShareResultsProps {
  filename: string;
  generateDocxContent: () => DocxContentSection[];
}

function getFormattedDateTime() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return { date, time, timestamp: `${date}_${time}` };
}

function getFormattedDateTimeForDisplay() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export const APP_NAME_SHORT = 'RegIntel';
export const APP_NAME_FULL = 'RegIntel';
export { getFormattedDateTime, getFormattedDateTimeForDisplay };

export function ShareResults({ 
  filename, 
  generateDocxContent
}: ShareResultsProps) {
  const [wordLoading, setWordLoading] = useState(false);

  const handleDownloadWord = async () => {
    if (!generateDocxContent) return;
    
    const content = generateDocxContent();
    if (!content || content.length === 0) {
      console.warn('No content to export');
      return;
    }
    
    setWordLoading(true);
    try {
      const { timestamp } = getFormattedDateTime();
      
      const response = await fetch('/api/regtech/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content,
          title: filename,
          generatedAt: getFormattedDateTimeForDisplay()
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate Word document');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${APP_NAME_SHORT}_${filename}_${timestamp}.docx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Word download error:', error);
    } finally {
      setWordLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadWord}
        disabled={wordLoading}
        data-testid="button-download-word"
      >
        {wordLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        Download Word
      </Button>
    </div>
  );
}

interface FormattedAnswerProps {
  text: string;
}

export function FormattedAnswer({ text }: FormattedAnswerProps) {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let currentListItems: string[] = [];
  let currentListType: 'ol' | 'ul' | null = null;
  let listKey = 0;
  
  const flushList = () => {
    if (currentListItems.length > 0) {
      if (currentListType === 'ol') {
        elements.push(
          <ol key={`ol-${listKey++}`} className="list-decimal list-inside space-y-1 my-2 text-slate-700">
            {currentListItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${listKey++}`} className="list-disc list-inside space-y-1 my-2 text-slate-700">
            {currentListItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        );
      }
      currentListItems = [];
      currentListType = null;
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      flushList();
      continue;
    }
    
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      if (currentListType !== 'ol') {
        flushList();
        currentListType = 'ol';
      }
      currentListItems.push(numberedMatch[2]);
      continue;
    }
    
    const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (currentListType !== 'ul') {
        flushList();
        currentListType = 'ul';
      }
      currentListItems.push(bulletMatch[1]);
      continue;
    }
    
    flushList();
    
    if (trimmedLine.endsWith(':') && trimmedLine.length < 80) {
      elements.push(
        <p key={`h-${i}`} className="font-medium text-slate-900 mt-3 mb-1">
          {trimmedLine}
        </p>
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed mb-2">
          {trimmedLine}
        </p>
      );
    }
  }
  
  flushList();
  
  return <>{elements}</>;
}

export function parseAnswerForDocx(text: string): { type: 'paragraph' | 'numbered' | 'bullet' | 'heading'; content: string }[] {
  if (!text) return [];
  
  const result: { type: 'paragraph' | 'numbered' | 'bullet' | 'heading'; content: string }[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      result.push({ type: 'numbered', content: numberedMatch[2] });
      continue;
    }
    
    const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      result.push({ type: 'bullet', content: bulletMatch[1] });
      continue;
    }
    
    if (trimmedLine.endsWith(':') && trimmedLine.length < 80) {
      result.push({ type: 'heading', content: trimmedLine });
    } else {
      result.push({ type: 'paragraph', content: trimmedLine });
    }
  }
  
  return result;
}
