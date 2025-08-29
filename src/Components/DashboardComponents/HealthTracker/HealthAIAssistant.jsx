import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bot, Sparkles, MessageSquare, ChevronDown, Download, Trash2, Crosshair } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';

// Parse Markdown List
export const parseMarkdownList = (lines) => {
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
export const parseMarkdownTable = (lines) => {
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
export const parseSummary = (summaryText) => {
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
    if (line.match(/^\d+\.\s/) || line.match(/^(Good morning|Let's|WELLNESS SCORECARD)/)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: line.match(/^\d+\.\s/)
          ? line.replace(/^\d+\.\s*/, '')
          : line.match(/^Good morning/)
            ? line.replace("Good morning", greeting)
            : line.match(/^Let's/)
              ? line
              : 'Wellness Scorecard',
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
export const renderList = (items, depth = 0) => (
  <ul className={`list-disc ${depth > 0 ? 'ml-6' : 'ml-4'} space-y-2`}>
    {items.map((item, index) => (
      <li key={index} className="text-gray-700 leading-relaxed">
        <span
          className={
            item.text && typeof item.text === 'string' && item.text.includes('Target Achieved')
              ? 'text-emerald-600 font-medium'
              : item.text && typeof item.text === 'string' && item.text.includes('Below Target')
                ? 'text-red-500 font-medium'
                : 'text-gray-700'
          }
        >
          {item.text || 'Item'}
          {item.text && typeof item.text === 'string' && item.text.includes('Target Achieved') && (
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              ✓ Achieved
            </span>
          )}
          {item.text && typeof item.text === 'string' && item.text.includes('Below Target') && (
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
              ⚠ Needs Focus
            </span>
          )}
        </span>
        {item.children && Array.isArray(item.children) && item.children.length > 0 && renderList(item.children, depth + 1)}
      </li>
    ))}
  </ul>
);

// Render Table
export const renderTable = (table) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
    <table className="w-full border-collapse bg-white">
      <thead>
        <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
          {table.headers.map((header, index) => (
            <th
              key={index}
              className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 text-left"
              aria-label={header}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className={`border-b border-gray-100 px-4 py-3 text-sm ${
                  cell.includes('Target Achieved')
                    ? 'text-emerald-600 font-medium'
                    : cell.includes('Below Target')
                      ? 'text-red-500 font-medium'
                      : 'text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  {cell}
                  {cell.includes('Target Achieved') && (
                    <span className="ml-2 text-emerald-500">✓</span>
                  )}
                  {cell.includes('Below Target') && (
                    <span className="ml-2 text-red-500">⚠</span>
                  )}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const HealthAIAssistant = ({ healthData, goals, userId, isAuthenticated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');
  const [responses, setResponses] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const [openReports, setOpenReports] = useState({});
  const [pdfContent, setPdfContent] = useState(null);
  const pdfRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'aiResponses'),
      (snapshot) => {
        const res = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setResponses(res.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      },
      (err) => {
        console.error('AI Responses Snapshot Error:', err);
        setError('Failed to load past reports: ' + err.message);
      }
    );

    return () => unsubscribe();
  }, [userId, isAuthenticated]);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const getPeriodData = useMemo(() => {
    const todayStr = getTodayString();
    const defaultDay = {
      exercise: [],
      sleep: { hours: 0, quality: 0 },
      water: 0,
      waterLogs: [],
      meditation: 0,
      meditationLogs: []
    };

    if (period === 'today') {
      return [healthData.find(d => d.date === todayStr) || defaultDay];
    } else {
      const days = period === 'week' ? 7 : 30;
      const data = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        data.push(healthData.find(d => d.date === dateStr) || defaultDay);
      }
      return data;
    }
  }, [healthData, period]);

  const calculateMetrics = () => {
    const numDays = getPeriodData.length;
    const isAverage = numDays > 1;

    let totalWater = 0, totalSleepHours = 0, totalSleepQuality = 0,
      totalExercise = 0, totalMeditation = 0;
    let exerciseList = [];

    getPeriodData.forEach(day => {
      totalWater += day.water || 0;
      totalSleepHours += day.sleep?.hours || 0;
      totalSleepQuality += day.sleep?.quality || 0;
      const dayExercise = day.exercise?.reduce((sum, ex) => sum + (ex.duration || 0), 0) || 0;
      totalExercise += dayExercise;
      exerciseList.push(...(day.exercise || []).map(ex => `${ex.type} (${ex.duration}min)`));
      totalMeditation += day.meditation || 0;
    });

    const avgWater = totalWater / numDays;
    const avgSleepHours = totalSleepHours / numDays;
    const avgSleepQuality = totalSleepQuality / numDays;
    const avgExercise = totalExercise / numDays;
    const avgMeditation = totalMeditation / numDays;

    const waterScore = Math.min((avgWater / goals.water) * 10, 10) * 0.2;
    const sleepDurationScore = Math.min((avgSleepHours / goals.sleep) * 10, 10) * 0.25;
    const sleepQualityScore = (avgSleepQuality / 10) * 10 * 0.15;
    const exerciseScore = Math.min((avgExercise / goals.exercise) * 10, 10) * 0.25;
    const meditationScore = Math.min((avgMeditation / goals.meditation) * 10, 10) * 0.15;

    const calculatedScore = Math.round(
      waterScore + sleepDurationScore + sleepQualityScore + exerciseScore + meditationScore
    );

    return {
      water: {
        consumed: avgWater,
        goal: goals.water,
        progress: Math.min((avgWater / goals.water) * 100, 100),
        score: waterScore * 10
      },
      sleep: {
        hours: avgSleepHours,
        quality: avgSleepQuality,
        goal: goals.sleep,
        progress: Math.min((avgSleepHours / goals.sleep) * 100, 100),
        durationScore: sleepDurationScore * 10,
        qualityScore: sleepQualityScore * 10
      },
      exercise: {
        totalMinutes: avgExercise,
        types: exerciseList.join(', ') || 'No exercises logged',
        goal: goals.exercise,
        progress: Math.min((avgExercise / goals.exercise) * 100, 100),
        score: exerciseScore * 10
      },
      meditation: {
        minutes: avgMeditation,
        goal: goals.meditation,
        progress: Math.min((avgMeditation / goals.meditation) * 100, 100),
        score: meditationScore * 10
      },
      isAverage,
      periodName: period === 'today' ? 'day' : period,
      numDays,
      calculatedScore
    };
  };

  const generateSummary = async () => {
    if (!isAuthenticated) {
      setError('Authentication required to generate health insights.');
      return;
    }

    if (!apiKey) {
      setError('API configuration error. Please contact support.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const healthDataObj = calculateMetrics();

      const periodLabel = healthDataObj.isAverage
        ? `Average daily values for the past ${healthDataObj.numDays} days`
        : 'Today';

      let prompt;

      if (period === 'today') {
        prompt = `As a health analytics AI, generate a concise daily wellness summary (75-150 words) based on today's data:

TODAY'S HEALTH METRICS:
- Hydration: ${healthDataObj.water.consumed.toFixed(1)}/${healthDataObj.water.goal} cups (${healthDataObj.water.progress.toFixed(1)
          }% of goal)
- Sleep: ${healthDataObj.sleep.hours.toFixed(1)} hours, Quality: ${healthDataObj.sleep.quality.toFixed(1)}/10
- Exercise: ${healthDataObj.exercise.totalMinutes.toFixed(1)} minutes (${healthDataObj.exercise.types || 'none logged'
          })
- Meditation: ${healthDataObj.meditation.minutes.toFixed(1)} minutes

Provide a brief but insightful summary that:
1. Highlights key achievements or areas needing attention
2. Gives one specific, actionable suggestion for tomorrow
3. Maintains an encouraging, professional tone
4. MUST INCLUDE a WELLNESS SCORECARD section in table format:
   | Metric | Score | Status |
   |--------|-------|--------|
   | Hydration | ${Math.round(healthDataObj.water.score)}/100 | ${healthDataObj.water.score >= 80 ? 'Target Achieved' : 'Below Target'
          } |
   | Sleep | ${Math.round((healthDataObj.sleep.durationScore + healthDataObj.sleep.qualityScore) / 2)}/100 | ${healthDataObj.sleep.durationScore >= 80 ? 'Target Achieved' : 'Below Target'
          } |
   | Exercise | ${Math.round(healthDataObj.exercise.score)}/100 | ${healthDataObj.exercise.score >= 80 ? 'Target Achieved' : 'Below Target'
          } |
   | Meditation | ${Math.round(healthDataObj.meditation.score)}/100 | ${healthDataObj.meditation.score >= 80 ? 'Target Achieved' : 'Below Target'
          } |
5. Keep the response between 75-150 words total`;
      } else {
        prompt = `As a professional health analytics AI, generate a comprehensive wellness report based on the following data:

PERIOD: ${periodLabel}

HEALTH METRICS:
1. HYDRATION:
   - Consumption: ${healthDataObj.water.consumed.toFixed(1)}/${healthDataObj.water.goal} cups
   - Goal Completion: ${healthDataObj.water.progress.toFixed(1)}%
   - Performance: ${healthDataObj.water.consumed >= healthDataObj.water.goal ? 'Target Achieved' : 'Below Target'}

2. SLEEP:
   - Duration: ${healthDataObj.sleep.hours.toFixed(1)}/${healthDataObj.sleep.goal} hours
   - Quality: ${healthDataObj.sleep.quality.toFixed(1)}/10
   - Duration Performance: ${healthDataObj.sleep.hours >= healthDataObj.sleep.goal ? 'Target Achieved' : 'Below Target'}

3. EXERCISE:
   - Total Activity: ${healthDataObj.exercise.totalMinutes.toFixed(1)}/${healthDataObj.exercise.goal} minutes
   - Activities: ${healthDataObj.exercise.types}
   - Performance: ${healthDataObj.exercise.totalMinutes >= healthDataObj.exercise.goal ? 'Target Achieved' : 'Below Target'}

4. MEDITATION:
   - Duration: ${healthDataObj.meditation.minutes.toFixed(1)}/${healthDataObj.meditation.goal} minutes
   - Performance: ${healthDataObj.meditation.minutes >= healthDataObj.meditation.goal ? 'Target Achieved' : 'Below Target'}

Please structure your analysis as follows:

1. EXECUTIVE SUMMARY: Brief overview of overall wellness with key highlights
   - Use nested bullet points for sub-details
2. DETAILED ANALYSIS:
   - For each metric, provide data-driven insights
   - Compare performance against established health guidelines
   - Note trends or patterns in the data
3. PERFORMANCE EVALUATION:
   - Highlight areas of excellence with specific metrics
   - Identify improvement opportunities with precise gaps
4. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 evidence-based, specific recommendations with nested sub-points
   - Include measurable targets for each suggestion
5. WELLNESS SCORECARD:
   - Provide in table format:
     | Metric | Score | Status |
     |--------|-------|--------|
     | Hydration | ${Math.round(healthDataObj.water.score)}/100 | ${healthDataObj.water.score >= 80 ? 'Target Achieved' : 'Below Target'
          } |
     | Sleep | ${Math.round((healthDataObj.sleep.durationScore + healthDataObj.sleep.qualityScore) / 2)}/100 | ${healthDataObj.sleep.durationScore >= 80 ? 'Target Achieved' : 'Below Target'
          } |
     | Exercise | ${Math.round(healthDataObj.exercise.score)}/100 | ${healthDataObj.exercise.score >= 80 ? 'Target Achieved' : 'Below Target'
          } |
     | Meditation | ${Math.round(healthDataObj.meditation.score)}/100 | ${healthDataObj.meditation.score >= 80 ? 'Target Achieved' : 'Below Target'
          } |
6. CLINICAL CONSIDERATIONS: Note any patterns that might warrant professional consultation

Maintain a professional, clinical tone while being encouraging. Reference specific metrics throughout. Format the response with clear section headings, nested bullet points, and a table for the scorecard.`;
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
        throw new Error(errorData.error?.message || 'Failed to generate health report');
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        await setDoc(doc(db, 'users', userId, 'aiResponses', new Date().toISOString()), {
          summary: generatedText,
          period,
          timestamp: new Date().toISOString(),
          wellnessScore: healthDataObj.calculatedScore,
          metrics: healthDataObj
        });
      } else {
        throw new Error('No response generated from AI service');
      }
    } catch (err) {
      console.error('Health Report Generation Error:', err);
      setError(err.message || 'Failed to generate health report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (response) => {
    setPdfContent(response.summary);
    setTimeout(() => {
      downloadPDF(response.period);
      setPdfContent(null);
    }, 100);
  };

  const downloadPDF = (reportPeriod) => {
    try {
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

      extractContent(pdfRef.current);
      doc.save(`Health_Report_${reportPeriod}_${getTodayString()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const toggleReport = (id) => {
    setOpenReports((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteReport = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'aiResponses', id));
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report: ' + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 p-8 rounded-2xl shadow-sm border border-red-100 text-center">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please sign in to access AI Health Insights and generate personalized wellness reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" p-2 rounded-2xl shadow-lg  border-indigo-100 transition-all duration-500 hover:shadow-xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl shadow-md">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div className="ml-4">
            <h2 className="text-3xl font-bold ">
              AI Health Insights
            </h2>
            <p className="text-gray-600 text-sm">Powered by advanced wellness analytics</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Period Selector */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-3">Analysis Period</label>
            <div className="relative inline-flex bg-gray-100 rounded-xl p-1 shadow-inner">
              {['today', 'week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`relative px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    period === p 
                      ? 'bg-white text-indigo-600 shadow-md transform scale-105' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateSummary}
            disabled={loading}
            aria-label="Generate AI health insights"
            className="relative group flex items-center justify-center px-3 py-4 font-semibold rounded-2xl shadow-lg 
               bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white 
               transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl 
               active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden
               min-w-[200px]"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white mr-3"></div>
                <span className="tracking-wide">Analyzing Health Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
                <span className="tracking-wide">Generate Health Summary</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Past Reports Section */}
      <div className=" rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg shadow-sm">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 ml-3">Health Report History</h3>
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200">
            <div className="bg-white p-6 rounded-xl shadow-sm max-w-md mx-auto">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium text-gray-800 mb-2">No Reports Yet</h4>
              <p className="text-gray-600">Generate your first AI health report using the button above to get personalized wellness insights!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.slice(0, visibleCount).map((response) => (
              <div
                key={response.id}
                className="rounded-2xl shadow-md border border-gray-300 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
              >
                {/* Report Header */}
                <div className=" p-1">
                  <div className=" rounded-xl p-5">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r  p-2 rounded-lg">
                            <Bot className="w-5 h-5 text-indigo-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800 ml-3">
                            {new Date(response.timestamp).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h4>
                        </div>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-indigo-700 border border-indigo-200">
                            📊 {response.period.charAt(0).toUpperCase() + response.period.slice(1)} Report
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                            response.wellnessScore >= 80 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : response.wellnessScore >= 60 
                                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                          }`}>
                            {response.wellnessScore >= 80 ? '🎯' : response.wellnessScore >= 60 ? '⚡' : '🔄'} 
                            {response.wellnessScore}/100
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadReport(response)}
                          className="group flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all duration-200 hover:scale-105"
                          aria-label="Download report"
                        >
                          <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this report?')) {
                              deleteReport(response.id);
                            }
                          }}
                          className="group flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105"
                          aria-label="Delete report"
                        >
                          <Trash2 className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                <div className="p-6">
                  <button
                    onClick={() => toggleReport(response.id)}
                    className="w-full group flex items-center justify-between p-4 text-lg font-medium text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-300 hover:shadow-md"
                    aria-expanded={openReports[response.id] || false}
                  >
                    <span className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-3" />
                      {openReports[response.id] ? 'Hide Report Details' : 'View Full Report'}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
                        openReports[response.id] ? 'rotate-180 text-indigo-700' : 'text-indigo-900'
                      }`}
                    />
                  </button>
                  
                  {/* Collapsible Content */}
                  <div 
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      openReports[response.id] 
                        ? 'max-h-[200px] opacity-100 mt-6' 
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className=" p-3 rounded- border border-gray-200 shadow-inner">
                      <div className=" max-w-none text-black space-y-6">
                        {parseSummary(response.summary).map((section, index) => (
                          <div key={index} className="group">
                            {section.title && (
                              <div className="mb-4">
                                <h4 className="text-xl font-bold bg-gradient-to-r to-purple-700 pb-2">
                                  {section.title}
                                </h4>
                              </div>
                            )}
                            <div className="ml-4">
                              {section.type === 'table' ? (
                                section.content.map((table, i) => (
                                  <div key={i} className="mb-6 transform transition-all duration-300 hover:scale-[1.01]">
                                    {renderTable(table)}
                                  </div>
                                ))
                              ) : (
                                section.content.map((item, i) => (
                                  <div key={i} className="mb-4">
                                    {item.type === 'list' ? (
                                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        {renderList(item.content)}
                                      </div>
                                    ) : (
                                      <p className="text-gray-700 leading-relaxed text-base bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        {item.content}
                                      </p>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < responses.length && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="group relative inline-flex items-center px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-indigo-100 hover:to-purple-100 text-gray-700 hover:text-indigo-700 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <ChevronDown className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Load More Reports ({responses.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Hidden PDF Content */}
      <div ref={pdfRef} style={{ position: 'absolute', left: '-9999px', width: '800px' }}>
        {pdfContent && (
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" />
              <h3 className="text-xl font-semibold text-slate-800">Your Personalized Health Report</h3>
            </div>
            <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg space-y-4">
              {parseSummary(pdfContent).map((section, index) => (
                <div key={index} className="mb-6">
                  {section.title && (
                    <h3 className="text-lg font-semibold text-indigo-600 mb-2">
                      {section.title}
                    </h3>
                  )}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAIAssistant;