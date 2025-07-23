/*
 * Fetch Patterns AI - React Frontend Application
 * Copyright © 2025 Dark Street. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, distribution,
 * or use of this software, via any medium, is strictly prohibited.
 */

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import WordCloud from "react-wordcloud";
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import FetchPatternsLogo from './FetchPatterns.png';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

const App = () => {
  const [files, setFiles] = useState([]);
  const [summary, setSummary] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);

  const [loading, setLoading] = useState(false);
  const [wordCloudFrequency, setWordCloudFrequency] = useState(50);
  const [customContext, setCustomContext] = useState("");
  const [contextSentiments, setContextSentiments] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Refs for download functionality
  const wordCloudRef = useRef(null);

  // Handle ResizeObserver errors and window resize
  useEffect(() => {
    const handleResizeObserverError = (e) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        e.stopImmediatePropagation();
      }
    };

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('error', handleResizeObserverError);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('error', handleResizeObserverError);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Download functions
  const downloadAsImage = async (elementRef, filename) => {
    if (elementRef.current) {
      try {
        const canvas = await html2canvas(elementRef.current, {
          backgroundColor: 'white',
          scale: 2
        });
        const timestamp = new Date().toLocaleString();
        canvas.toBlob((blob) => {
          saveAs(blob, `Fetch_Patterns_Generated_on_${timestamp.replace(/[/:,\s]/g, '_')}.png`);
        });
      } catch (error) {
        console.error('Error generating image:', error);
      }
    }
  };

  const downloadAsCSV = (data, filename) => {
    let csvContent = '';

    if (filename === 'documents_summary') {
      csvContent = 'Filename,Content,Keywords,Sentiment,Classification,Score\n';
      data.forEach(doc => {
        const keywords = (doc.keywords || []).join('; ');
        const content = (doc.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const topClassification = doc.classification?.labels?.[0] || 'Unclassified';
        const topScore = doc.classification?.scores?.[0] || 0;
        const sentimentLabel = doc.sentiment?.label || 'Neutral';
        csvContent += `"${doc.filename || 'Unknown'}","${content}","${keywords}","${sentimentLabel}","${topClassification}","${topScore}"\n`;
      });
    } else if (filename === 'keywords_data') {
      csvContent = 'Keyword,Frequency\n';
      const keywordCounts = {};
      data.forEach(doc => {
        (doc.keywords || []).forEach(keyword => {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });
      });
      Object.entries(keywordCounts).forEach(([keyword, count]) => {
        csvContent += `"${keyword}","${count}"\n`;
      });
    } else if (filename === 'word_cloud_data') {
      csvContent = 'Word,Frequency\n';
      data.forEach(word => {
        csvContent += `"${word.text}","${word.value}"\n`;
      });
    } else if (filename === 'sentiment_data') {
      csvContent = 'Document,Sentiment,Score\n';
      data.forEach(doc => {
        const filename = doc.filename || 'Unknown';
        const sentimentLabel = doc.sentiment?.label || 'Neutral';
        const sentimentScore = doc.sentiment?.score || 0;
        csvContent += `"${filename}","${sentimentLabel}","${sentimentScore}"\n`;
      });
    } else if (filename === 'context_sentiments') {
      csvContent = 'Context,Positive %,Negative %,Neutral %,Total Mentions,Emotional Tone,Key Phrases,Context Summary\n';
      data.forEach(context => {
        const emotionalTones = (context.insights?.emotionalTones || []).join('; ');
        const keyPhrases = (context.insights?.keyPhrases || []).join('; ');
        const contextSummaries = (context.insights?.contextSummaries || []).join('; ');

        csvContent += `"${context.context}","${context.positive}","${context.negative}","${context.neutral}","${context.total}","${emotionalTones}","${keyPhrases}","${contextSummaries}"\n`;
      });
    }

    const timestamp = new Date().toLocaleString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Fetch_Patterns_Generated_on_${timestamp.replace(/[/:,\s]/g, '_')}.csv`);
  };

  // Extract contextual sentiments from documents (optimized for speed)
  const extractContextualSentiments = async (documents = summary) => {
    if (documents.length === 0) return;

    const contexts = [];
    const combinedContent = documents.map(doc => doc.content || '').join(' ');

    // Reduced business contexts for faster loading
    const businessContexts = [
      'customer satisfaction', 'product quality', 'financial performance',
      'operational efficiency', 'team performance'
    ];

    for (const context of businessContexts) {
      if (combinedContent.toLowerCase().includes(context.toLowerCase())) {
        // Create simplified context sentiment without API call for faster loading
        let positive = 0, negative = 0, neutral = 0, total = 0;

        for (const doc of documents) {
          const content = doc.content?.toLowerCase() || '';
          if (content.includes(context.toLowerCase())) {
            total++;
            const sentiment = doc.sentiment?.label?.toLowerCase() || 'neutral';
            if (sentiment === 'positive') positive++;
            else if (sentiment === 'negative') negative++;
            else neutral++;
          }
        }

        if (total > 0) {
          // Extract key phrases related to this context
          const contextRegex = new RegExp(`\\b\\w*${context.replace(/\s+/g, '\\w*\\s+\\w*')}\\w*\\b`, 'gi');
          const matches = combinedContent.match(contextRegex) || [];
          const uniquePhrases = [...new Set(matches.slice(0, 5))];

          // Generate emotional tones based on context and sentiment
          let emotionalTones = ['professional'];
          if (positive > negative) {
            emotionalTones.push('optimistic', 'confident');
          } else if (negative > positive) {
            emotionalTones.push('concerned', 'cautious');
          } else {
            emotionalTones.push('balanced', 'analytical');
          }

          // Create context summaries
          const contextSummaries = [
            `${context} appears ${total} time${total > 1 ? 's' : ''} across the documents with ${positive > negative ? 'predominantly positive' : negative > positive ? 'predominantly negative' : 'balanced'} sentiment.`,
            `Analysis shows ${Math.round((positive / total) * 100)}% positive, ${Math.round((negative / total) * 100)}% negative sentiment for this context.`
          ];

          const contextSentiment = {
            context,
            positive: Math.round((positive / total) * 100),
            negative: Math.round((negative / total) * 100),
            neutral: Math.round((neutral / total) * 100),
            total,
            insights: {
              keyPhrases: uniquePhrases.length > 0 ? uniquePhrases : [context, 'analysis', 'performance'],
              emotionalTones: emotionalTones,
              contextSummaries: contextSummaries,
              businessImpact: `${total} mentions found across documents with ${positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral'} overall sentiment`
            }
          };
          contexts.push(contextSentiment);
        }
      }
    }

    setContextSentiments(contexts);
  };

  // Enhanced contextual sentiment analysis using OpenAI
  const analyzeContextSentiment = async (context, documents) => {
    try {
      const response = await fetch(`${API_BASE_URL}/contextual-sentiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_terms: [context]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get contextual sentiment');
      }

      const data = await response.json();
      const contextualResults = data.contextual_sentiment;

      // Aggregate results across all documents
      let positive = 0, negative = 0, neutral = 0;
      let total = 0;
      let keyPhrases = [];
      let contextSummaries = [];
      let emotionalTones = [];

      Object.values(contextualResults).forEach(docAnalysis => {
        if (docAnalysis[context]) {
          const analysis = docAnalysis[context];
          total++;

          const sentiment = analysis.sentiment?.toLowerCase() || 'neutral';
          if (sentiment === 'positive') positive++;
          else if (sentiment === 'negative') negative++;
          else neutral++;

          // Collect additional insights
          if (analysis.key_phrases) keyPhrases.push(...analysis.key_phrases);
          if (analysis.context_summary) contextSummaries.push(analysis.context_summary);
          if (analysis.emotional_tone) emotionalTones.push(analysis.emotional_tone);
        }
      });

      return {
        context,
        positive: Math.round((positive / total) * 100) || 0,
        negative: Math.round((negative / total) * 100) || 0,
        neutral: Math.round((neutral / total) * 100) || 0,
        total,
        insights: {
          keyPhrases: [...new Set(keyPhrases)].slice(0, 5),
          contextSummaries: contextSummaries.slice(0, 3),
          emotionalTones: [...new Set(emotionalTones)]
        }
      };
    } catch (error) {
      console.error('Contextual sentiment analysis failed:', error);

      // Fallback to basic analysis
      let positive = 0, negative = 0, neutral = 0;
      let total = 0;

      documents.forEach(doc => {
        const content = (doc.content || '').toLowerCase();
        const contextRegex = new RegExp(`\\b${context.toLowerCase()}\\b`, 'gi');

        if (contextRegex.test(content)) {
          total++;
          const sentiment = (doc.sentiment?.label || 'Neutral').toUpperCase();
          if (sentiment === 'POSITIVE') positive++;
          else if (sentiment === 'NEGATIVE') negative++;
          else neutral++;
        }
      });

      return {
        context,
        positive: Math.round((positive / total) * 100) || 0,
        negative: Math.round((negative / total) * 100) || 0,
        neutral: Math.round((neutral / total) * 100) || 0,
        total,
        insights: {
          keyPhrases: [],
          contextSummaries: [],
          emotionalTones: []
        }
      };
    }
  };

  // Analyze custom context
  const analyzeCustomContext = async () => {
    if (!customContext.trim()) {
      alert('Please enter a context to analyze');
      return;
    }

    const contextSentiment = await analyzeContextSentiment(customContext, summary);
    if (contextSentiment.total === 0) {
      alert('No mentions of this context found in the documents');
      return;
    }

    setContextSentiments(prev => [contextSentiment, ...prev.filter(c => c.context !== customContext)]);
    setCustomContext('');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      for (let file of files) {
        formData.append("files", file);
      }
      const res = await axios.post(`${API_BASE_URL}/upload`, formData);
      if (res.data.status === 'success' && res.data.results.length > 0) {
        setSummary(res.data.results); // Use all results
        extractContextualSentiments(res.data.results);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to format the answer text
  const formatAnswer = (text) => {
    if (!text) return 'No answer available';

    // Remove ** markdown formatting
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '$1');

    // Split into paragraphs and format
    const paragraphs = formatted.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paragraph, index) => {
      // Check if it's a list item
      if (paragraph.includes('\n') && (paragraph.includes('1.') || paragraph.includes('•') || paragraph.includes('-'))) {
        const lines = paragraph.split('\n').filter(line => line.trim());
        return (
          <div key={index} className="answer-list">
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className="answer-list-item">
                {line.trim()}
              </div>
            ))}
          </div>
        );
      } else {
        return (
          <p key={index} className="answer-paragraph">
            {paragraph.trim()}
          </p>
        );
      }
    });
  };

  const handleQuestion = async () => {
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/query`, {
        question,
        context: summary.map(doc => doc.content || '').join(' ')
      });
      if (res.data.status === 'success') {
        setAnswer(res.data);  // Set the entire response object
      }
    } catch (error) {
      console.error("Question failed:", error);
      alert('Failed to get answer. Please try again.');
    }
  };

  const filteredSummary = summary;

  // Enhanced word frequency calculation
  const wordCounts = {};

  filteredSummary.forEach((doc) => {
    const content = doc.content || '';

    // Extract all words from content (not just keywords)
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word =>
        word.length > 3 && // Only words longer than 3 characters
        !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'still', 'should', 'after', 'being', 'now', 'made', 'before', 'here', 'through', 'when', 'where', 'much', 'some', 'these', 'many', 'then', 'them', 'well', 'were'].includes(word) // Filter common words
      );

    // Count word frequencies
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Also include keywords with higher weight
    (doc.keywords || []).forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      wordCounts[keywordLower] = (wordCounts[keywordLower] || 0) + 3; // Give keywords 3x weight
    });
  });

  // Sort by frequency and take top N words based on user selection
  const sortedWords = Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, wordCloudFrequency);

  const wordCloudData = sortedWords.map(([text, value]) => ({
    text: text.charAt(0).toUpperCase() + text.slice(1), // Capitalize first letter
    value,
  }));

  // Enhanced sentiment analysis
  const sentimentAnalysis = {
    distribution: {},
    byDocumentType: {},
    confidenceLevels: { high: 0, medium: 0, low: 0 },
    weightedScore: 0,
    totalWeight: 0,
    riskAssessment: { high: 0, medium: 0, low: 0 }
  };

  summary.forEach((doc) => {
    const sentiment = doc.sentiment?.label || 'NEUTRAL';
    const score = doc.sentiment?.score || 0;
    const docType = doc.classification?.labels?.[0] || 'Unknown';
    const wordCount = doc.content?.split(' ').length || 1;

    // Basic distribution
    sentimentAnalysis.distribution[sentiment] = (sentimentAnalysis.distribution[sentiment] || 0) + 1;

    // Sentiment by document type
    if (!sentimentAnalysis.byDocumentType[docType]) {
      sentimentAnalysis.byDocumentType[docType] = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
    }
    sentimentAnalysis.byDocumentType[docType][sentiment]++;

    // Confidence levels
    if (score >= 0.8) sentimentAnalysis.confidenceLevels.high++;
    else if (score >= 0.6) sentimentAnalysis.confidenceLevels.medium++;
    else sentimentAnalysis.confidenceLevels.low++;

    // Weighted sentiment (by document length)
    const sentimentValue = sentiment === 'POSITIVE' ? score : sentiment === 'NEGATIVE' ? -score : 0;
    sentimentAnalysis.weightedScore += sentimentValue * wordCount;
    sentimentAnalysis.totalWeight += wordCount;

    // Risk assessment
    if (sentiment === 'NEGATIVE' && score > 0.7) sentimentAnalysis.riskAssessment.high++;
    else if (sentiment === 'NEGATIVE' && score > 0.5) sentimentAnalysis.riskAssessment.medium++;
    else sentimentAnalysis.riskAssessment.low++;
  });





  // Geographic data extraction for world map
  const extractCountryMentions = (content) => {
    const countries = [
      'United States', 'USA', 'America', 'China', 'India', 'Germany', 'Japan', 'United Kingdom', 'UK', 'France',
      'Italy', 'Brazil', 'Canada', 'Russia', 'Australia', 'South Korea', 'Mexico', 'Spain', 'Indonesia', 'Netherlands',
      'Saudi Arabia', 'Turkey', 'Taiwan', 'Belgium', 'Argentina', 'Ireland', 'Israel', 'Thailand', 'Nigeria', 'Egypt',
      'South Africa', 'Philippines', 'Bangladesh', 'Vietnam', 'Chile', 'Finland', 'Romania', 'Czech Republic', 'Portugal',
      'New Zealand', 'Peru', 'Greece', 'Iraq', 'Algeria', 'Qatar', 'Kazakhstan', 'Hungary', 'Kuwait', 'Morocco', 'Slovakia'
    ];

    const mentions = {};
    const lowerContent = content.toLowerCase();

    countries.forEach(country => {
      const regex = new RegExp(`\\b${country.toLowerCase()}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        const normalizedCountry = country === 'USA' || country === 'America' ? 'United States' :
                                 country === 'UK' ? 'United Kingdom' : country;
        mentions[normalizedCountry] = (mentions[normalizedCountry] || 0) + matches.length;
      }
    });

    return mentions;
  };

  // Enhanced country analysis with sentiment
  const countryData = {};
  const countrySentiment = {};

  summary.forEach((doc) => {
    const mentions = extractCountryMentions(doc.content || '');
    const docSentiment = doc.sentiment?.label || 'NEUTRAL';
    const sentimentScore = doc.sentiment?.score || 0;

    Object.entries(mentions).forEach(([country, count]) => {
      // Count mentions
      countryData[country] = (countryData[country] || 0) + count;

      // Track sentiment for each country
      if (!countrySentiment[country]) {
        countrySentiment[country] = {
          positive: 0, negative: 0, neutral: 0,
          totalScore: 0, documentCount: 0,
          businessActivity: 0, riskLevel: 'low'
        };
      }

      countrySentiment[country][docSentiment.toLowerCase()]++;
      countrySentiment[country].totalScore += sentimentScore;
      countrySentiment[country].documentCount++;
      countrySentiment[country].businessActivity += count;

      // Risk assessment
      if (docSentiment === 'NEGATIVE' && sentimentScore > 0.7) {
        countrySentiment[country].riskLevel = 'high';
      } else if (docSentiment === 'NEGATIVE' && sentimentScore > 0.5 && countrySentiment[country].riskLevel !== 'high') {
        countrySentiment[country].riskLevel = 'medium';
      }
    });
  });









  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <img src={FetchPatternsLogo} alt="FetchPatterns Logo" className="logo" />
          <div>
            <h1 className="app-title">FetchPatterns</h1>
            <p className="app-subtitle">AI-Powered Document Analysis & Visualization</p>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Upload Section */}
        <div className="upload-section">
          <h3>Upload Documents</h3>
          <div className="upload-area">
            <input
              type="file"
              multiple
              onChange={(e) => setFiles([...e.target.files])}
              accept=".pdf,.docx,.pptx,.xlsx,.txt,.jpg,.jpeg,.png"
            />
            <p>Select multiple files (PDF, DOCX, PPTX, XLSX, TXT, Images)</p>
            <button onClick={handleUpload} disabled={loading}>
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {summary.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{summary.length}</div>
              <div className="stat-label">Documents Processed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{Object.keys(wordCounts).length}</div>
              <div className="stat-label">Unique Keywords</div>
            </div>

            <div className="stat-card" title="Documents with sentiment analysis confidence score above 80%">
              <div className="stat-number">{sentimentAnalysis.confidenceLevels.high}</div>
              <div className="stat-label">High Confidence</div>
              <div className="stat-description">Sentiment confidence > 80%</div>
            </div>
            <div className="stat-card" title="Documents with negative sentiment that may require attention">
              <div className="stat-number">{sentimentAnalysis.riskAssessment.high}</div>
              <div className="stat-label">High Risk Documents</div>
              <div className="stat-description">Negative sentiment documents</div>
            </div>
          </div>
        )}

        {/* Query Section */}
        {summary.length > 0 && (
          <div className="query-section">
            <h3>Ask Questions About Your Documents</h3>
            <div className="query-input-container">
              <input
                type="text"
                className="query-input"
                placeholder="Ask a question about the uploaded files..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuestion()}
              />
              <button className="query-button" onClick={handleQuestion}>Ask Question</button>
            </div>

            {answer && (
              <div className="query-result">
                <div className="question-display">
                  <strong>Question:</strong> {answer.question || question}
                </div>
                <div className="answer-display">
                  <strong>Answer:</strong>
                  <div className="answer-content">
                    {formatAnswer(answer.answer)}
                  </div>
                </div>
                <div className="confidence-display">
                  <strong>Confidence:</strong> {((answer.score || answer.confidence || 0) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document Summary Header */}
        {summary.length > 0 && (
          <div className="section-header">
            <h3 className="section-title">
              {summary.length === 1 ? 'Document Summary' : 'Document Summaries'}
            </h3>
            <p className="section-subtitle">
              AI-generated summaries and insights from your uploaded documents
            </p>
          </div>
        )}

        {/* Documents Grid */}
        {summary.length > 0 ? (
          <div className="document-grid">
            {summary.map((doc, index) => (
              <div key={index} className="document-card">
                <div className="document-header">
                  <h4 className="document-title">{doc.filename || 'Unknown Document'}</h4>
                </div>

                <div className="document-summary">
                  <div className="summary-item">
                    <strong>Classification:</strong>
                    <span className={`classification-tag classification-${doc.classification?.labels?.[0]?.toLowerCase() || 'business'}`}>
                      {doc.classification?.labels?.[0] || 'Business'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <strong>Summary:</strong> {doc.ai_analysis?.business_insights?.executive_summary ||
                      `Document discussing ${(doc.keywords || []).slice(0, 3).join(', ')}.`}
                  </div>
                  <div className="summary-item">
                    <strong>Word Count:</strong> {(doc.content || '').split(' ').length} words
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : summary.length === 0 && !loading && (
          <div className="empty-state">
            <h3>No Documents Yet</h3>
            <p>Upload some documents to get started with AI-powered analysis</p>
          </div>
        )}

        {/* Full Width Visualizations */}
        {summary.length > 0 && (
          <>
            {/* Context-Based Sentiment Analysis - Full Width */}
            <div className="card context-sentiment-card full-width-card">
              <div className="card-header">
                <h4 className="card-title">Context-Based Sentiment Analysis</h4>
                <div className="download-buttons">
                  <button
                    className="download-btn"
                    onClick={() => downloadAsCSV(contextSentiments, 'context_sentiments')}
                  >
                    CSV
                  </button>
                </div>
              </div>

              <div className="custom-context-section">
                <div className="query-input-container">
                  <input
                    type="text"
                    className="query-input"
                    placeholder="Enter a context to analyze (e.g., 'customer satisfaction', 'product quality', 'financial performance')"
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && analyzeCustomContext()}
                  />
                  <button className="query-button" onClick={analyzeCustomContext}>
                    Analyze Context
                  </button>
                </div>
              </div>

              <div className="context-results">
                {contextSentiments.length > 0 ? (
                  contextSentiments.map((context, index) => (
                    <div key={index} className="context-item">
                      <div className="context-header">
                        <h5 className="context-name">{context.context}</h5>
                        <span className="context-mentions">{context.total} mentions</span>
                      </div>
                      <div className="sentiment-bars">
                        <div className="sentiment-bar">
                          <span className="sentiment-label positive">Positive</span>
                          <div className="sentiment-progress">
                            <div
                              className="sentiment-fill positive"
                              style={{width: `${context.positive}%`}}
                            ></div>
                          </div>
                          <span className="sentiment-percentage">{context.positive}%</span>
                        </div>
                        <div className="sentiment-bar">
                          <span className="sentiment-label negative">Negative</span>
                          <div className="sentiment-progress">
                            <div
                              className="sentiment-fill negative"
                              style={{width: `${context.negative}%`}}
                            ></div>
                          </div>
                          <span className="sentiment-percentage">{context.negative}%</span>
                        </div>
                        <div className="sentiment-bar">
                          <span className="sentiment-label neutral">Neutral</span>
                          <div className="sentiment-progress">
                            <div
                              className="sentiment-fill neutral"
                              style={{width: `${context.neutral}%`}}
                            ></div>
                          </div>
                          <span className="sentiment-percentage">{context.neutral}%</span>
                        </div>
                      </div>

                      {/* Enhanced Context Insights */}
                      {context.insights && (
                        <div className="context-insights">
                          {context.insights.emotionalTones && context.insights.emotionalTones.length > 0 && (
                            <div className="insight-section">
                              <strong>Emotional Tone:</strong>
                              <div className="emotional-tones">
                                {context.insights.emotionalTones.map((tone, i) => (
                                  <span key={i} className="emotional-tone-tag">{tone}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {context.insights.keyPhrases && context.insights.keyPhrases.length > 0 && (
                            <div className="insight-section">
                              <strong>Key Phrases:</strong>
                              <div className="key-phrases">
                                {context.insights.keyPhrases.map((phrase, i) => (
                                  <span key={i} className="key-phrase-tag">"{phrase}"</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {context.insights.contextSummaries && context.insights.contextSummaries.length > 0 && (
                            <div className="insight-section">
                              <strong>Context Summary:</strong>
                              <div className="context-summaries">
                                {context.insights.contextSummaries.slice(0, 2).map((summary, i) => (
                                  <p key={i} className="context-summary">{summary}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-contexts">
                    <p>Type in a context you are interested in, to analyze the sentiment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Word Cloud - Full Width */}
            <div className="card full-width-card" ref={wordCloudRef}>
              <div className="card-header">
                <h4 className="card-title">Word Cloud</h4>
                <div className="word-cloud-controls">
                  <label>
                    Words:
                    <input
                      type="number"
                      value={wordCloudFrequency}
                      onChange={(e) => setWordCloudFrequency(parseInt(e.target.value) || 50)}
                      className="frequency-input"
                      min="1"
                      max="200"
                      placeholder="50"
                    />
                  </label>
                </div>
                <div className="download-buttons">
                  <button
                    className="download-btn"
                    onClick={() => downloadAsImage(wordCloudRef, 'wordcloud')}
                  >
                    PNG
                  </button>
                  <button
                    className="download-btn"
                    onClick={() => downloadAsCSV(wordCloudData, 'word_cloud_data')}
                  >
                    CSV
                  </button>
                </div>
              </div>
              <div className="word-cloud-container">
                <WordCloud
                  words={wordCloudData}
                  options={{
                    rotations: 1,
                    rotationAngles: [0],
                    fontSizes: [12, 60],
                    padding: 2,
                    deterministic: true,
                    enableTooltip: false,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 500
                  }}
                  size={[Math.min(800, windowWidth - 100), 400]}
                />
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="loading">
            <p>Fetching patterns...</p>
          </div>
        )}
      </div>

      {/* Copyright Footer */}
      <footer className="app-footer">
        <p>Copyright Dark Street. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
