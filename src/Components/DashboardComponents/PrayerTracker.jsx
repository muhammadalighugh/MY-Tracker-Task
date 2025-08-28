import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  HeartHandshake, BookOpen, TrendingUp, 
  Save, Trash2, CheckCircle, Flame, StickyNote, History, Clock, Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';

const COLORS = {
  prayer: '#4f46e5',
  jamaah: '#8b5cf6',
  quran: '#10b981',
  streak: '#f59e0b',
  goal: '#64748b',
  danger: '#ef4444'
};

// Parse Markdown List (optimized with memoization where possible)
const parseMarkdownList = (lines) => {
  const result = [];
  let currentList = { items: [], parent: null };
  let stack = [currentList];
  let currentLevel = 0;

  lines.forEach((line) => {
    const match = line.match(/^(\s*)[-*]\s(.+)/);
    if (match) {
      const indentLevel = Math.floor(match[1].length / 2);
      const text = match[2].trim().replace(/[*_]+/g, '');

      while (indentLevel < currentLevel) {
        stack.pop();
        currentLevel--;
      }

      currentList = stack[stack.length - 1];
      const newItem = { text, children: [] };
      currentList.items.push(newItem);

      if (indentLevel > currentLevel) {
        const newList = { items: [], parent: currentList };
        newItem.children.push(newList);
        stack.push(newList);
        currentList = newList;
        currentLevel = indentLevel;
      }
    } else {
      stack = [stack[0]];
      currentList = stack[0];
      currentLevel = 0;
      if (line.trim()) {
        result.push({ type: 'text', content: line.replace(/[*_]+/g, '').trim() });
      }
    }
  });

  return result.concat(stack[0].items.length > 0 ? [{ type: 'list', content: stack[0].items }] : []);
};

// Parse Markdown Table
const parseMarkdownTable = (lines) => {
  const tables = [];
  let currentTable = null;

  lines.forEach((line) => {
    if (line.match(/^\|.*\|$/)) {
      if (!currentTable) {
        currentTable = { headers: [], rows: [] };
        const headers = line.split('|').map((h) => h.trim()).filter((h) => h);
        currentTable.headers = headers;
      } else if (line.match(/^\|[-:\s]+\|$/)) {
        // Skip separator line
      } else {
        const row = line.split('|').map((cell) => cell.trim()).filter((cell) => cell);
        currentTable.rows.push(row);
      }
    } else if (currentTable) {
      tables.push(currentTable);
      currentTable = null;
    }
  });
  if (currentTable) tables.push(currentTable);

  return tables;
};

// Parse Summary
const parseSummary = (summaryText) => {
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon";
  } else if (hour >= 18 || hour < 5) {
    greeting = "Good evening";
  }

  const lines = summaryText.replace(/\*\*/g, '').split('\n');
  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    if (line.match(/^\d+\.\s/) || line.match(/^(Good morning|Let's|LEARNING SCORECARD)/)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: line.match(/^\d+\.\s/)
          ? line.replace(/^\d+\.\s*/, '')
          : line.match(/^Good morning/)
            ? line.replace("Good morning", greeting)
            : line.match(/^Let's/)
              ? line
              : 'Prayer Scorecard',
        content: [],
        type: line.match(/^\|.*\|$/) ? 'table' : 'text',
      };
    } else if (line.match(/^\|.*\|$/)) {
      if (currentSection && currentSection.type !== 'table') {
        sections.push(currentSection);
        currentSection = { title: '', content: [line], type: 'table' };
      } else if (!currentSection) {
        currentSection = { title: '', content: [line], type: 'table' };
      } else {
        currentSection.content.push(line);
      }
    } else if (currentSection) {
      currentSection.content.push(line);
    } else {
      sections.push({ title: line, content: [], type: 'text' });
    }
  });
  if (currentSection) sections.push(currentSection);

  return sections.map((section) => ({
    title: section.title,
    content:
      section.type === 'table'
        ? parseMarkdownTable(section.content)
        : parseMarkdownList(section.content),
    type: section.type,
  }));
};

// Render List
const renderList = (items, depth = 0) => (
  <ul className={`list-disc ${depth > 0 ? 'ml-6' : 'ml-4'} space-y-1`}>
    {items.map((item, index) => (
      <li key={index} className="text-sm text-slate-600">
        <span
          className={
            item.text && typeof item.text === 'string' && item.text.includes('Target Achieved')
              ? 'text-green-600'
              : item.text && typeof item.text === 'string' && item.text.includes('Below Target')
                ? 'text-red-600'
                : ''
          }
        >
          {item.text || 'Item'}
          {item.text && typeof item.text === 'string' && item.text.includes('Target Achieved') && (
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Achieved
            </span>
          )}
          {item.text && typeof item.text === 'string' && item.text.includes('Below Target') && (
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
              Needs Improvement
            </span>
          )}
        </span>
        {item.children && Array.isArray(item.children) && item.children.length > 0 && renderList(item.children, depth + 1)}
      </li>
    ))}
  </ul>
);

// Render Table
const renderTable = (table) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse border border-slate-200">
      <thead>
        <tr>
          {table.headers.map((header, index) => (
            <th
              key={index}
              className="border border-slate-200 p-3 text-sm font-semibold text-slate-800 bg-slate-50 text-left"
              aria-label={header}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className={`border border-slate-200 p-3 text-sm ${
                  cell.includes('Target Achieved')
                    ? 'text-green-600'
                    : cell.includes('Below Target')
                      ? 'text-red-600'
                      : 'text-slate-600'
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatCard = ({ icon: Icon, title, value, subValue, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full transition-all hover:shadow-md">
    <div>
      <div className="flex items-center text-slate-500 mb-2">
        <Icon className="w-5 h-5 mr-2" style={{ color }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
    {subValue && <p className="text-sm text-slate-400 mt-1">{subValue}</p>}
  </div>
);

const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full transition-all hover:shadow-md">
    <div className="p-6">
      <div className="flex items-center mb-5">
        <Icon className="w-6 h-6 mr-3" style={{ color }} />
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const AIInsights = ({ prayerData, quranData, user }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');
  const [prayerScore, setPrayerScore] = useState(0);
  const [reportData, setReportData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const reportRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const getPeriodData = useMemo(() => {
    const todayStr = getTodayString();
    if (period === 'today') {
      const todayPrayer = prayerData.find(s => s.date === todayStr);
      const todayQuran = quranData.find(s => s.date === todayStr);
      return [{
        date: todayStr,
        prayers: todayPrayer ? Object.values(todayPrayer.prayers).filter(p => p.prayed).length : 0,
        jamaah: todayPrayer ? Object.values(todayPrayer.prayers).filter(p => p.jamaah).length : 0,
        quranDuration: todayQuran ? todayQuran.duration : 0,
        quranPages: todayQuran ? todayQuran.pages : 0
      }];
    } else {
      const days = period === 'week' ? 7 : 30;
      const data = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayPrayer = prayerData.find(s => s.date === dateStr);
        const dayQuran = quranData.find(s => s.date === dateStr);
        data.push({
          date: dateStr,
          prayers: dayPrayer ? Object.values(dayPrayer.prayers).filter(p => p.prayed).length : 0,
          jamaah: dayPrayer ? Object.values(dayPrayer.prayers).filter(p => p.jamaah).length : 0,
          quranDuration: dayQuran ? dayQuran.duration : 0,
          quranPages: dayQuran ? dayQuran.pages : 0
        });
      }
      return data.reverse(); // Oldest to newest
    }
  }, [prayerData, quranData, period]);

  const calculateMetrics = useMemo(() => {
    const numDays = getPeriodData.length;
    const isAverage = numDays > 1;

    let totalPrayers = 0, totalJamaah = 0, totalQuranDuration = 0, totalQuranPages = 0;
    getPeriodData.forEach(day => {
      totalPrayers += day.prayers;
      totalJamaah += day.jamaah;
      totalQuranDuration += day.quranDuration;
      totalQuranPages += day.quranPages;
    });

    const avgPrayers = totalPrayers / numDays;
    const avgJamaah = totalJamaah / numDays;
    const avgQuranDuration = totalQuranDuration / numDays;
    const avgQuranPages = totalQuranPages / numDays;

    const prayerScore = Math.min((avgPrayers / 5) * 10, 10) * 0.4;
    const jamaahScore = Math.min((avgJamaah / avgPrayers) * 10, 10) * 0.3;
    const quranScore = Math.min((avgQuranDuration / 30) * 10, 10) * 0.3; // Assuming 30 min goal

    const calculatedScore = Math.round(prayerScore + jamaahScore + quranScore);

    setPrayerScore(calculatedScore);

    return {
      prayers: {
        average: avgPrayers,
        goal: 5,
        progress: Math.min((avgPrayers / 5) * 100, 100),
        score: prayerScore * 10
      },
      jamaah: {
        average: avgJamaah,
        percentage: avgPrayers > 0 ? (avgJamaah / avgPrayers) * 100 : 0,
        score: jamaahScore * 10
      },
      quran: {
        duration: avgQuranDuration,
        pages: avgQuranPages,
        goal: 30,
        progress: Math.min((avgQuranDuration / 30) * 100, 100),
        score: quranScore * 10
      },
      isAverage,
      periodName: period === 'today' ? 'day' : period,
      numDays,
      calculatedScore
    };
  }, [getPeriodData]);

  const generateSummary = async () => {
    if (!user) {
      setError('Authentication required to generate insights.');
      return;
    }

    if (!apiKey) {
      setError('API configuration error. Please contact support.');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');

    try {
      const metrics = calculateMetrics;
      setReportData(metrics);

      const periodLabel = metrics.isAverage
        ? `Average daily values for the past ${metrics.numDays} days`
        : 'Today';

      let prompt;

      if (period === 'today') {
        prompt = `As a spiritual analytics AI, generate a concise daily prayer and Quran summary (75-150 words) based on today's data:

TODAY'S METRICS:
- Prayers: ${metrics.prayers.average.toFixed(1)}/5 (${metrics.prayers.progress.toFixed(1)}% of goal)
- Jama'ah: ${metrics.jamaah.average.toFixed(1)} (${metrics.jamaah.percentage.toFixed(1)}% of prayed)
- Quran Duration: ${metrics.quran.duration.toFixed(1)}/30 minutes (${metrics.quran.progress.toFixed(1)}% of goal)

Provide a brief but insightful summary that:
1. Highlights key achievements or areas needing attention
2. Gives one specific, actionable suggestion for tomorrow
3. Maintains an encouraging, professional tone
4. MUST INCLUDE a PRAYER SCORECARD section in table format:
   | Metric | Score | Status |
   |--------|-------|--------|
   | Prayers | ${Math.round(metrics.prayers.score)}/100 | ${metrics.prayers.score >= 80 ? 'Target Achieved' : 'Below Target'} |
   | Jama'ah | ${Math.round(metrics.jamaah.score)}/100 | ${metrics.jamaah.score >= 80 ? 'Target Achieved' : 'Below Target'} |
   | Quran | ${Math.round(metrics.quran.score)}/100 | ${metrics.quran.score >= 80 ? 'Target Achieved' : 'Below Target'} |
5. Keep the response between 75-150 words total`;
      } else {
        prompt = `As a professional spiritual analytics AI, generate a comprehensive prayer and Quran report based on the following data:

PERIOD: ${periodLabel}

METRICS:
1. PRAYERS:
   - Average: ${metrics.prayers.average.toFixed(1)}/5
   - Goal Completion: ${metrics.prayers.progress.toFixed(1)}%
   - Performance: ${metrics.prayers.average >= metrics.prayers.goal ? 'Target Achieved' : 'Below Target'}

2. JAMA'AH:
   - Average: ${metrics.jamaah.average.toFixed(1)}
   - Percentage: ${metrics.jamaah.percentage.toFixed(1)}%
   - Performance: ${metrics.jamaah.percentage >= 80 ? 'Target Achieved' : 'Below Target'}

3. QURAN:
   - Duration: ${metrics.quran.duration.toFixed(1)}/30 minutes
   - Pages: ${metrics.quran.pages.toFixed(1)}
   - Goal Completion: ${metrics.quran.progress.toFixed(1)}%
   - Performance: ${metrics.quran.duration >= metrics.quran.goal ? 'Target Achieved' : 'Below Target'}

Please structure your analysis as follows:
1. EXECUTIVE SUMMARY: Brief overview of overall performance with key highlights
   - Use nested bullet points for sub-details
2. DETAILED ANALYSIS:
   - For each metric, provide data-driven insights
   - Compare performance against goals
   - Note trends or patterns
3. PERFORMANCE EVALUATION:
   - Highlight areas of excellence with specific metrics
   - Identify improvement opportunities with precise gaps
4. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 evidence-based, specific recommendations with nested sub-points
   - Include measurable targets for each suggestion
5. PRAYER SCORECARD:
   - Provide in table format:
     | Metric | Score | Status |
     |--------|-------|--------|
     | Prayers | ${Math.round(metrics.prayers.score)}/100 | ${metrics.prayers.score >= 80 ? 'Target Achieved' : 'Below Target'} |
     | Jama'ah | ${Math.round(metrics.jamaah.score)}/100 | ${metrics.jamaah.score >= 80 ? 'Target Achieved' : 'Below Target'} |
     | Quran | ${Math.round(metrics.quran.score)}/100 | ${metrics.quran.score >= 80 ? 'Target Achieved' : 'Below Target'} |
6. CONSIDERATIONS: Note any patterns that might warrant further focus

Maintain a professional, encouraging tone. Reference specific metrics throughout. Format with clear section headings, nested bullet points, and a table for the scorecard.`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: period === 'today' ? 300 : 2048
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate report');
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        setSummary(generatedText);
      } else {
        throw new Error('No response generated from AI service');
      }
    } catch (err) {
      console.error('Report Generation Error:', err);
      setError(err.message || 'Failed to generate report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    try {
      const originalOpenSections = { ...openSections };
      setOpenSections((prev) => {
        const newState = { ...prev };
        Object.keys(newState).forEach((key) => {
          newState[key] = true;
        });
        return newState;
      });

      setTimeout(() => {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: 'letter',
        });

        const margin = 0.5;
        const maxWidth = 7.5;
        let y = 0.5;

        const addText = (text, fontSize, style = 'normal', indent = 0) => {
          if (y > 10) {
            doc.addPage();
            y = 0.5;
          }
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', style);
          const lines = doc.splitTextToSize(text, maxWidth - indent);
          lines.forEach((line) => {
            doc.text(line, margin + indent, y);
            y += fontSize / 36;
          });
          y += 0.1;
        };

        const extractContent = (element) => {
          const nodes = element.childNodes;
          nodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent.trim();
              if (text) addText(text, 12);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const tag = node.tagName.toLowerCase();
              if (['h1', 'h2', 'h3'].includes(tag)) {
                addText(node.textContent.trim(), 16, 'bold');
              } else if (tag === 'ul' || tag === 'ol') {
                Array.from(node.children).forEach((li) => {
                  addText(`• ${li.textContent.trim()}`, 12, 'normal', 0.2);
                });
              } else if (tag === 'table') {
                Array.from(node.querySelectorAll('tr')).forEach((row, index) => {
                  const cells = Array.from(row.cells).map((cell) => cell.textContent.trim());
                  if (index === 0) {
                    addText(cells.join('  '), 12, 'bold');
                    addText('-'.repeat(50), 12);
                  } else {
                    addText(cells.join('  '), 12);
                  }
                });
              } else {
                extractContent(node);
              }
            }
          });
        };

        extractContent(reportRef.current);
        doc.save(`Prayer_Report_${period}_${getTodayString()}.pdf`);
        setOpenSections(originalOpenSections);
      }, 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
        <Bot className="w-8 h-8 mx-auto mb-4 text-red-600" />
        <p className="text-red-600">Please sign in to access AI Insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bot className="w-8 h-8 mr-3 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-800">AI Insights</h2>
        </div>
        {summary && (
          <button
            onClick={downloadPDF}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-all duration-300"
            aria-label="Download report as PDF"
          >
            <Save className="w-5 h-5 mr-2" />
            PDF
          </button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center mb-6 gap-4">
        <div className="flex-shrink-0">
          <span className="relative z-0 inline-flex shadow-sm rounded-md">
            {['today', 'week', 'month'].map((p, i) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-300 ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${period === p ? 'z-10 bg-indigo-100 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </span>
        </div>
        <button
          onClick={generateSummary}
          disabled={loading}
          className="relative flex items-center justify-center px-6 py-3 font-semibold rounded-2xl shadow-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-xl active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <span className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl -z-10" />
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white mr-2"></div>
              <span className="tracking-wide">Generating Insights...</span>
            </>
          ) : (
            <>
              <Bot className="w-5 h-5 mr-2 animate-pulse" />
              <span className="tracking-wide">Generate Insights</span>
            </>
          )}
        </button>
      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <Bot className="w-5 h-5 mr-2 text-red-600" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {summary && (
        <div ref={reportRef} className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
          <div className="flex items-center mb-4">
            <Bot className="w-6 h-6 mr-2 text-indigo-600" />
            <h3 className="text-xl font-semibold text-slate-800">Your Personalized Report</h3>
          </div>
          <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg space-y-4">
            {parseSummary(summary).map((section, index) => (
              <div key={index} className="mb-6">
                {section.title && (
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full flex items-center justify-between text-lg font-semibold text-indigo-600 mb-2"
                    aria-expanded={openSections[index] || false}
                    aria-controls={`section-${index}`}
                  >
                    {section.title}
                    <span className={`transition-transform ${openSections[index] ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                )}
                <div
                  id={`section-${index}`}
                  className={`transition-all duration-300 ${openSections[index] || section.type === 'table' ? 'block' : 'hidden'}`}
                >
                  {section.type === 'table' ? (
                    section.content.map((table, i) => (
                      <div key={i} className="mb-4">
                        {renderTable(table)}
                      </div>
                    ))
                  ) : (
                    section.content.map((item, i) => (
                      <div key={i} className="mb-2">
                        {item.type === 'list' ? (
                          renderList(item.content)
                        ) : (
                          <p className="text-sm text-slate-600">{item.content}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PrayerTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [prayerData, setPrayerData] = useState([]);
  const [quranData, setQuranData] = useState([]);
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();

  const [prayers, setPrayers] = useState({
    fajr: { prayed: false, jamaah: false },
    dhuhr: { prayed: false, jamaah: false },
    asr: { prayed: false, jamaah: false },
    maghrib: { prayed: false, jamaah: false },
    isha: { prayed: false, jamaah: false }
  });

  const [quran, setQuran] = useState({
    duration: 0,
    pages: 0,
    juz: '',
    notes: ''
  });

  useEffect(() => {
    if (loading || !user) return;
    const fetchData = async () => {
      try {
        const prayerCollection = collection(db, 'users', user.uid, 'prayerData');
        const prayerQuery = query(prayerCollection, orderBy('date', 'desc'));
        const prayerSnapshot = await getDocs(prayerQuery);
        const prayerData = prayerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPrayerData(prayerData);

        const quranCollection = collection(db, 'users', user.uid, 'quranData');
        const quranQuery = query(quranCollection, orderBy('date', 'desc'));
        const quranSnapshot = await getDocs(quranQuery);
        const quranData = quranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuranData(quranData);

        const todayPrayer = prayerData.find(entry => entry.date === date);
        setPrayers(todayPrayer?.prayers || {
          fajr: { prayed: false, jamaah: false },
          dhuhr: { prayed: false, jamaah: false },
          asr: { prayed: false, jamaah: false },
          maghrib: { prayed: false, jamaah: false },
          isha: { prayed: false, jamaah: false }
        });

        const todayQuran = quranData.find(entry => entry.date === date);
        setQuran(todayQuran || { duration: 0, pages: 0, juz: '', notes: '' });
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load data. Please try again.');
      }
    };
    fetchData();
  }, [date, user, loading]);

  useEffect(() => {
    if (error) {
      toast.error('Authentication error: ' + error.message);
      navigate('/signin');
    }
    if (!loading && !user) {
      toast.error('Please sign in to access the tracker');
      navigate('/signin');
    }
  }, [user, loading, error, navigate]);

  const handlePrayerChange = (prayer, field) => {
    setPrayers(prev => ({ ...prev, [prayer]: { ...prev[prayer], [field]: !prev[prayer][field] } }));
    setSaved(false);
  };

  const handleQuranChange = (field, value) => {
    setQuran(prev => ({ ...prev, [field]: field === 'duration' || field === 'pages' ? parseInt(value) || 0 : value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save data');
      return;
    }
    try {
      const prayerCollection = collection(db, 'users', user.uid, 'prayerData');
      const quranCollection = collection(db, 'users', user.uid, 'quranData');
      const prayerEntry = { date, prayers, timestamp: new Date().toISOString() };
      const quranEntry = { date, ...quran, timestamp: new Date().toISOString() };

      const existingPrayer = prayerData.find(entry => entry.date === date);
      if (existingPrayer) {
        await updateDoc(doc(db, 'users', user.uid, 'prayerData', existingPrayer.id), prayerEntry);
      } else {
        await addDoc(prayerCollection, prayerEntry);
      }

      const existingQuran = quranData.find(entry => entry.date === date);
      if (existingQuran) {
        await updateDoc(doc(db, 'users', user.uid, 'quranData', existingQuran.id), quranEntry);
      } else {
        await addDoc(quranCollection, quranEntry);
      }

      const prayerSnapshot = await getDocs(query(prayerCollection, orderBy('date', 'desc')));
      const quranSnapshot = await getDocs(query(quranCollection, orderBy('date', 'desc')));
      setPrayerData(prayerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setQuranData(quranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Data saved successfully');
    } catch (err) {
      console.error('Error saving data:', err);
      toast.error('Failed to save data. Please try again.');
    }
  };

  const handleDeleteData = async (type, docId) => {
    if (!user) return;
    try {
      if (type === 'prayer') {
        await deleteDoc(doc(db, 'users', user.uid, 'prayerData', docId));
        setPrayerData(prev => prev.filter(entry => entry.id !== docId));
      } else if (type === 'quran') {
        await deleteDoc(doc(db, 'users', user.uid, 'quranData', docId));
        setQuranData(prev => prev.filter(entry => entry.id !== docId));
      }
      setShowDeleteConfirm(null);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} entry deleted successfully`);
    } catch (err) {
      console.error('Error deleting data:', err);
      toast.error('Failed to delete entry. Please try again.');
    }
  };

  const getPrayerStats = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekPrayerData = prayerData.filter(entry => new Date(entry.date) >= weekStart);
    const totalPrayers = weekPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.prayed).length, 0);
    const avgPrayers = weekPrayerData.length > 0 ? (totalPrayers / weekPrayerData.length).toFixed(1) : 0;
    const totalJamaah = weekPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.jamaah).length, 0);
    const avgJamaah = weekPrayerData.length > 0 ? (totalJamaah / weekPrayerData.length).toFixed(1) : 0;
    const jamaahPercent = totalPrayers > 0 ? Math.round((totalJamaah / totalPrayers) * 100) : 0;
    const totalPrayerDays = weekPrayerData.length;
    return { avgPrayers, avgJamaah, jamaahPercent, totalPrayerDays };
  }, [prayerData]);

  const getQuranStats = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekQuranData = quranData.filter(entry => new Date(entry.date) >= weekStart);
    const totalDuration = weekQuranData.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const avgDuration = weekQuranData.length > 0 ? Math.round(totalDuration / weekQuranData.length) : 0;
    const totalPages = weekQuranData.reduce((sum, entry) => sum + (entry.pages || 0), 0);
    const totalQuranDays = weekQuranData.length;
    return { avgDuration, totalPages, totalQuranDays };
  }, [quranData]);

  const getStreak = useCallback(() => {
    let streak = 0;
    const sortedData = [...prayerData].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const entry of sortedData) {
      if (Object.values(entry.prayers).filter(p => p.prayed).length === 5) streak++;
      else break;
    }
    return streak;
  }, [prayerData]);

  const getChartData = useCallback(() => {
    const now = new Date();
    const data = [];
    if (viewPeriod === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now); day.setDate(day.getDate() - i);
        const dayStr = day.toISOString().split('T')[0];
        const dayPrayer = prayerData.find(entry => entry.date === dayStr);
        const dayQuran = quranData.find(entry => entry.date === dayStr);
        data.push({
          name: day.toLocaleDateString('en-US', { weekday: 'short' }),
          prayers: dayPrayer ? Object.values(dayPrayer.prayers).filter(p => p.prayed).length : 0,
          jamaah: dayPrayer ? Object.values(dayPrayer.prayers).filter(p => p.jamaah).length : 0,
          quran: dayQuran ? dayQuran.duration : 0,
          goal: 5
        });
      }
    } else if (viewPeriod === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
        const weekPrayerData = prayerData.filter(entry => new Date(entry.date) >= weekStart && new Date(entry.date) <= weekEnd);
        const weekQuranData = quranData.filter(entry => new Date(entry.date) >= weekStart && new Date(entry.date) <= weekEnd);
        data.push({
          name: `Week ${4-i}`,
          prayers: weekPrayerData.length > 0 ? (weekPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.prayed).length, 0) / weekPrayerData.length).toFixed(1) : 0,
          jamaah: weekPrayerData.length > 0 ? (weekPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.jamaah).length, 0) / weekPrayerData.length).toFixed(1) : 0,
          quran: weekQuranData.length > 0 ? Math.round(weekQuranData.reduce((sum, entry) => sum + (entry.duration || 0), 0) / weekQuranData.length) : 0,
          goal: 5
        });
      }
    } else if (viewPeriod === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now); month.setMonth(month.getMonth() - i);
        const monthPrayerData = prayerData.filter(entry => new Date(entry.date).getMonth() === month.getMonth() && new Date(entry.date).getFullYear() === month.getFullYear());
        const monthQuranData = quranData.filter(entry => new Date(entry.date).getMonth() === month.getMonth() && new Date(entry.date).getFullYear() === month.getFullYear());
        data.push({
          name: month.toLocaleDateString('en-US', { month: 'short' }),
          prayers: monthPrayerData.length > 0 ? (monthPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.prayed).length, 0) / monthPrayerData.length).toFixed(1) : 0,
          jamaah: monthPrayerData.length > 0 ? (monthPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.jamaah).length, 0) / monthPrayerData.length).toFixed(1) : 0,
          quran: monthQuranData.length > 0 ? Math.round(monthQuranData.reduce((sum, entry) => sum + (entry.duration || 0), 0) / monthQuranData.length) : 0,
          goal: 5
        });
      }
    }
    return data;
  }, [viewPeriod, prayerData, quranData]);

  const getPieChartData = useCallback(() => {
    return Object.entries(prayers)
      .filter(([, p]) => p.prayed)
      .map(([name, prayer]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: 1,
        color: prayer.jamaah ? COLORS.jamaah : COLORS.prayer
      }));
  }, [prayers]);

  const prayerStats = getPrayerStats();
  const quranStats = getQuranStats();
  const streak = getStreak();
  const chartData = getChartData();
  const pieData = getPieChartData();

  const isDateInPreviousWeek = (selectedDate) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const selected = new Date(selectedDate);
    return selected >= weekStart && selected <= now;
  };

  useEffect(() => {
    if (!isDateInPreviousWeek(date)) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      toast.info('You can only log data for the previous week. Reset to today.');
    }
  }, [date]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-50 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: HeartHandshake },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "history", label: "History", icon: History },
    { id: "ai", label: "AI Insights", icon: Bot }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={HeartHandshake} title="Avg Prayers/Day" value={prayerStats.avgPrayers} subValue={`Logged ${prayerStats.totalPrayerDays} days`} color={COLORS.prayer} />
              <StatCard icon={HeartHandshake} title="Avg Jama'ah/Day" value={prayerStats.avgJamaah} subValue={`${prayerStats.jamaahPercent}% of prayed`} color={COLORS.jamaah} />
              <StatCard icon={BookOpen} title="Avg Quran (min)/Day" value={quranStats.avgDuration} subValue={`Total pages: ${quranStats.totalPages}`} color={COLORS.quran} />
              <StatCard icon={Flame} title="Perfect Day Streak" value={streak} subValue="Days with all prayers" color={COLORS.streak} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <InputCard icon={HeartHandshake} title="Log Prayers" color={COLORS.prayer}>
                  <div className="mb-6">
                    <label htmlFor="date-input" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                      id="date-input"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0]}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 sm:max-w-sm md:max-w-md"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-sm text-slate-600">
                        <tr>
                          <th className="p-3 font-semibold">Prayer</th>
                          <th className="p-3 font-semibold">Prayed</th>
                          <th className="p-3 font-semibold">Jama'ah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(prayers).map(([prayer, data]) => (
                          <tr key={prayer} className="border-t border-slate-200">
                            <td className="p-3 font-medium text-slate-800 capitalize">{prayer}</td>
                            <td className="p-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={data.prayed}
                                  onChange={() => handlePrayerChange(prayer, 'prayed')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </td>
                            <td className="p-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={data.jamaah}
                                  onChange={() => handlePrayerChange(prayer, 'jamaah')}
                                  disabled={!data.prayed}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"></div>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </InputCard>
              </div>
              
              <div>
                <InputCard icon={BookOpen} title="Log Quran Recitation" color={COLORS.quran}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="quran-duration" className="flex items-center text-sm font-medium text-slate-700 mb-1"><Clock size={14} className="mr-2"/>Duration (minutes)</label>
                      <input
                        id="quran-duration"
                        type="number"
                        min="0"
                        value={quran.duration}
                        onChange={(e) => handleQuranChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="quran-pages" className="flex items-center text-sm font-medium text-slate-700 mb-1"><BookOpen size={14} className="mr-2"/>Pages Read</label>
                      <input
                        id="quran-pages"
                        type="number"
                        min="0"
                        value={quran.pages}
                        onChange={(e) => handleQuranChange('pages', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="quran-juz" className="flex items-center text-sm font-medium text-slate-700 mb-1"><History size={14} className="mr-2"/>Juz / Hizb</label>
                      <input
                        id="quran-juz"
                        type="text"
                        placeholder="e.g., Juz 1, Hizb 2"
                        value={quran.juz}
                        onChange={(e) => handleQuranChange('juz', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="quran-notes" className="flex items-center text-sm font-medium text-slate-700 mb-1"><StickyNote size={14} className="mr-2"/>Notes</label>
                      <textarea
                        id="quran-notes"
                        rows="4"
                        placeholder="Reflections or memorization progress..."
                        value={quran.notes}
                        onChange={(e) => handleQuranChange('notes', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="pt-2 space-y-3">
                      <button
                        onClick={handleSave}
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors"
                      >
                        <Save size={16} className="mr-2" /> Save Data
                      </button>
                      {saved && (
                        <div className="flex items-center p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm">
                          <CheckCircle size={16} className="mr-2"/>Successfully saved!
                        </div>
                      )}
                    </div>
                  </div>
                </InputCard>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center"><TrendingUp className="mr-3 text-indigo-500" />Analytics</h2>
              <div className="flex-shrink-0">
                <span className="relative z-0 inline-flex shadow-sm rounded-md">
                  {['daily', 'weekly', 'monthly'].map((period, i) => (
                    <button
                      key={period}
                      onClick={() => setViewPeriod(period)}
                      type="button"
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${viewPeriod === period ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Prayer & Quran Trends</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                      <Line type="monotone" dataKey="prayers" name="Avg. Prayers" stroke={COLORS.prayer} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="jamaah" name="Avg. Jama'ah" stroke={COLORS.jamaah} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="quran" name="Avg. Quran (min)" stroke={COLORS.quran} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="goal" name="Goal" stroke={COLORS.goal} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Today's Prayer Status</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center items-center gap-4 text-xs mt-2">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-sm mr-2" style={{backgroundColor: COLORS.prayer}}></span>Prayed</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-sm mr-2" style={{backgroundColor: COLORS.jamaah}}></span>In Jama'ah</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">History</h3>
              <div className="space-y-4">
                {[...prayerData, ...quranData].sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                  <div key={`${entry.id}-${entry.prayers ? 'prayer' : 'quran'}`} className="p-4 bg-slate-50 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium">{entry.date}</p>
                      <p className="text-sm text-slate-600">
                        {entry.prayers
                          ? `Prayers: ${Object.values(entry.prayers).filter(p => p.prayed).length}/5, Jama'ah: ${Object.values(entry.prayers).filter(p => p.jamaah).length}`
                          : `Quran: ${entry.duration} min, ${entry.pages} pages${entry.juz ? `, ${entry.juz}` : ''}${entry.notes ? `, Notes: ${entry.notes.substring(0, 50)}${entry.notes.length > 50 ? '...' : ''}` : ''}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm({ type: entry.prayers ? 'prayer' : 'quran', id: entry.id })}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                {prayerData.length === 0 && quranData.length === 0 && <p className="text-slate-600">No historical data</p>}
              </div>
            </div>
          </div>
        );
      case 'ai':
        return <AIInsights prayerData={prayerData} quranData={quranData} user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-3 md:p-8">
        {/* Tab Navigation */}
        <div className="mb-2 md:mb-2 relative">
          <div className="border-b border-slate-200 bg-white rounded-t-xl shadow-sm">
            <nav className="-mb-px flex overflow-x-auto px-3 md:px-6 relative">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xs:inline">{tab.label}</span>
                    <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h2>
              <p className="text-slate-600 mb-6">Are you sure you want to delete this {showDeleteConfirm.type} entry? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-md hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteData(showDeleteConfirm.type, showDeleteConfirm.id)}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700"
                >
                  Delete Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerTracker;