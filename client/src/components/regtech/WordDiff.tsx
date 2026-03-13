import DiffMatchPatch from 'diff-match-patch';

interface WordDiffProps {
  oldText: string;
  newText: string;
  className?: string;
}

function diffWordLevel(text1: string, text2: string): [number, string][] {
  const dmp = new DiffMatchPatch();
  
  const tokens1 = text1.split(/(\s+)/);
  const tokens2 = text2.split(/(\s+)/);
  
  const tokenArray: string[] = [];
  const tokenHash: Map<string, number> = new Map();
  
  function tokenize(tokens: string[]): string {
    return tokens.map(token => {
      if (!tokenHash.has(token)) {
        tokenHash.set(token, tokenArray.length);
        tokenArray.push(token);
      }
      return String.fromCharCode(tokenHash.get(token)!);
    }).join('');
  }
  
  const chars1 = tokenize(tokens1);
  const chars2 = tokenize(tokens2);
  
  const diffs = dmp.diff_main(chars1, chars2);
  dmp.diff_cleanupSemantic(diffs);
  
  return diffs.map(([op, chars]) => {
    let text = '';
    for (let i = 0; i < chars.length; i++) {
      const index = chars.charCodeAt(i);
      if (index < tokenArray.length) {
        text += tokenArray[index];
      }
    }
    return [op, text] as [number, string];
  });
}

export function WordDiff({ oldText, newText, className = '' }: WordDiffProps) {
  const wordDiffs = diffWordLevel(oldText || '', newText || '');

  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      {wordDiffs.map((diff, index) => {
        const [operation, text] = diff;
        
        if (operation === 0) {
          return <span key={index}>{text}</span>;
        } else if (operation === -1) {
          return (
            <span
              key={index}
              className="bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 line-through"
            >
              {text}
            </span>
          );
        } else if (operation === 1) {
          return (
            <span
              key={index}
              className="bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 font-medium"
            >
              {text}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
}

interface WordDiffSummaryProps {
  oldText: string;
  newText: string;
}

export function WordDiffSummary({ oldText, newText }: WordDiffSummaryProps) {
  const wordDiffs = diffWordLevel(oldText || '', newText || '');

  let additions = 0;
  let deletions = 0;
  
  wordDiffs.forEach(([operation, text]) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (operation === 1) additions += words;
    if (operation === -1) deletions += words;
  });

  return (
    <div className="flex items-center gap-3 text-xs">
      {additions > 0 && (
        <span className="text-green-600 dark:text-green-400">
          +{additions} word{additions !== 1 ? 's' : ''}
        </span>
      )}
      {deletions > 0 && (
        <span className="text-red-600 dark:text-red-400">
          -{deletions} word{deletions !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
