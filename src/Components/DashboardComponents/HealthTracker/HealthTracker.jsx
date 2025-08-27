import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Moon,
  Droplets,
  Brain,
  Plus,
  BarChart3,
  LayoutDashboard,
  TrendingUp,
  Award,
  Bot,
  Sparkles,
  MessageSquare,
  MoreVertical,
  ChevronDown,
  History,
  Crosshair,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useSidebar } from '../../../context/SidebarContext';
import { collection, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../../firebase/firebase.config';
import { Navigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
// Parse Markdown List
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
      const newItem = { text, children: [] }; // Initialize children as empty array
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
  // Get current hour
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
                className={`border border-slate-200 p-3 text-sm ${cell.includes('Target Achieved')
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

// StatCard component
const StatCard = ({ icon: Icon, title, current, goal, unit, color, progress }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md">
    <div>
      <div className="flex items-center text-slate-500 mb-2">
        <Icon className="w-5 h-5 mr-2" style={{ color }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold text-slate-800">{current}</p>
        <p className="text-sm text-slate-600 ml-1">/ {goal} {unit}</p>
      </div>
    </div>
    <div className="mt-3">
      <p className="text-lg font-bold text-right" style={{ color }}>{Math.round(progress)}%</p>
      <p className="text-xs text-slate-400 text-right">Complete</p>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  </div>
);

// InputCard component
const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full transition-all duration-300 hover:shadow-md">
    <div className="p-6">
      <div className="flex items-center mb-5">
        <Icon className="w-6 h-6 mr-3" style={{ color }} />
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

// GoalSetting component
const GoalSetting = ({ goals, setGoals, userId, isAuthenticated }) => {
  const [newGoals, setNewGoals] = useState(goals);
  const [error, setError] = useState('');

  const handleGoalChange = (key, value) => {
    const numValue = parseFloat(value);
    if (numValue < 0) {
      setError('Goals cannot be negative.');
      return;
    }
    setError('');
    setNewGoals(prev => ({ ...prev, [key]: numValue || 0 }));
  };

  const saveGoals = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to save goals.');
      return;
    }
    if (Object.values(newGoals).some(val => val <= 0)) {
      setError('All goals must be greater than zero.');
      return;
    }
    try {
      await setDoc(doc(db, 'users', userId, 'settings', 'goals'), newGoals);
      setGoals(newGoals);
      alert('Goals saved successfully!');
    } catch (error) {
      console.error('Error saving goals:', error);
      setError('Failed to save goals: ' + error.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-4 text-red-600" />
        <p className="text-red-600">Please sign in to set goals.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center mb-6">
        <Crosshair className="w-8 h-8 mr-3 text-indigo-600" />
        <h2 className="text-2xl font-bold text-slate-800">Set Your Goals</h2>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'water', label: 'Water (cups)', color: '#0d6efd' },
          { key: 'sleep', label: 'Sleep (hours)', color: '#6f42c1' },
          { key: 'exercise', label: 'Exercise (min)', color: '#198754' },
          { key: 'meditation', label: 'Meditation (min)', color: '#fd7e14' },
        ].map(({ key, label, color }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
              type="number"
              value={newGoals[key] || ''}
              onChange={(e) => handleGoalChange(key, e.target.value)}
              placeholder="Enter goal"
              min="0"
              step={key === 'sleep' ? '0.5' : '1'}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              aria-label={`Set ${label} goal`}
            />
          </div>
        ))}
      </div>
      <button
        onClick={saveGoals}
        className="mt-6 w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors duration-300"
        aria-label="Save health goals"
      >
        <Crosshair className="mr-2" size={16} />
        Save Goals
      </button>
    </div>
  );
};

// AIAssistantContent component
const AIAssistantContent = ({ healthData, goals, userId, isAuthenticated }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');
  const [wellnessScore, setWellnessScore] = useState(0);
  const [reportData, setReportData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const reportRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

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

    setWellnessScore(calculatedScore);

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
    setSummary('');

    try {
      const healthDataObj = calculateMetrics();
      setReportData(healthDataObj);

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
        setSummary(generatedText);
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


  const downloadPDF = () => {
    try {
      // Temporarily expand all sections
      const originalOpenSections = { ...openSections };
      setOpenSections((prev) => {
        const newState = { ...prev };
        Object.keys(newState).forEach((key) => {
          newState[key] = true; // Open all sections
        });
        return newState;
      });

      // Wait for DOM to update (React may need a tick to render)
      setTimeout(() => {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: 'letter',
        });

        const margin = 0.5;
        const maxWidth = 7.5;
        let y = 0.5;

        // Helper function to add text with styling
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
            y += fontSize / 36; // Dynamic line spacing
          });
          y += 0.1; // Extra spacing after block
        };

        // Extract and process content from reportRef
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
                    // Table header
                    addText(cells.join('  '), 12, 'bold');
                    addText('-'.repeat(50), 12); // Separator
                  } else {
                    // Table row
                    addText(cells.join('  '), 12);
                  }
                });
              } else {
                extractContent(node); // Recurse into nested elements
              }
            }
          });
        };

        // Process reportRef content
        extractContent(reportRef.current);

        // Save PDF
        doc.save(`Health_Report_${period}_${getTodayString()}.pdf`);

        // Restore original section state
        setOpenSections(originalOpenSections);
      }, 100); // Delay to ensure DOM updates
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-4 text-red-600" />
        <p className="text-red-600">Please sign in to access AI Health Insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bot className="w-8 h-8 mr-3 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-800">AI Report</h2>
        </div>
        {summary && (
          <button
            onClick={downloadPDF}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-all duration-300"
            aria-label="Download health report as PDF"
          >
            <Download className="w-5 h-5 " />
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
          aria-label="Generate AI health insights"
          className="relative flex items-center justify-center px-6 py-3 font-semibold rounded-2xl shadow-md 
             bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white 
             transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-xl 
             active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          {/* Glass effect overlay - now behind content */}
          <span className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl -z-10" />

          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white mr-2"></div>
              <span className="tracking-wide">Generating Insights...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
              <span className="tracking-wide">Generate Health Summary</span>
            </>
          )}
        </button>

      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-red-600" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {summary && (
        <div
          ref={reportRef}
          className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-sm"
        >
          <div className="flex items-center mb-4">
            <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" />
            <h3 className="text-xl font-semibold text-slate-800">Your Personalized Health Report</h3>
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
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${openSections[index] ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                )}
                <div
                  id={`section-${index}`}
                  className={`transition-all duration-300 ${openSections[index] || section.type === 'table' ? 'block' : 'hidden'
                    }`}
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

// HealthTracker component
const HealthTracker = () => {
  const { sidebarOpen, collapsed } = useSidebar();
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [meditationDuration, setMeditationDuration] = useState('');
  const [healthData, setHealthData] = useState([]);
  const [goals, setGoals] = useState({
    water: 8,
    sleep: 8,
    exercise: 30,
    meditation: 15,
  });
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });
  const [lastAIResponse, setLastAIResponse] = useState(null);
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [loading, setLoading] = useState({ exercise: false, sleep: false, water: false, meditation: false });
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userId, setUserId] = useState(null);
  const [openSections, setOpenSections] = useState({});

  const auth = getAuth();

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'log', label: 'Log Activities', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'goals', label: 'Set Goals', icon: Crosshair },
  ];

  const LOG_FILTERS = [
    { id: 'all', label: 'All', icon: null },
    { id: 'exercise', label: 'Exercise', icon: Activity },
    { id: 'sleep', label: 'Sleep', icon: Moon },
    { id: 'water', label: 'Water', icon: Droplets },
    { id: 'meditation', label: 'Meditation', icon: Brain },
  ];

  const getTodayString = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.uid);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setError('Please sign in to access health tracking features.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const unsubscribeHealthData = onSnapshot(collection(db, 'users', userId, 'healthData'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHealthData(data);
    }, (err) => {
      console.error('Health Data Snapshot Error:', err);
      setError('Failed to load health data: ' + err.message);
    });

    const fetchGoals = async () => {
      try {
        const goalsDoc = await getDoc(doc(db, 'users', userId, 'settings', 'goals'));
        if (goalsDoc.exists()) {
          setGoals(goalsDoc.data());
        }
      } catch (err) {
        console.error('Error fetching goals:', err);
        setError('Failed to load goals: ' + err.message);
      }
    };
    fetchGoals();

    const fetchStreaks = async () => {
      try {
        const streaksDoc = await getDoc(doc(db, 'users', userId, 'settings', 'streaks'));
        if (streaksDoc.exists()) {
          setStreaks(streaksDoc.data());
        }
      } catch (err) {
        console.error('Error fetching streaks:', err);
        setError('Failed to load streaks: ' + err.message);
      }
    };
    fetchStreaks();

    const unsubscribeAIResponse = onSnapshot(
      collection(db, 'users', userId, 'aiResponses'),
      (snapshot) => {
        const responses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const latestResponse = responses.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        setLastAIResponse(latestResponse);
      },
      (err) => {
        console.error('AI Response Snapshot Error:', err);
        setError('Failed to load AI responses: ' + err.message);
      }
    );

    return () => {
      unsubscribeHealthData();
      unsubscribeAIResponse();
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const today = getTodayString();
    const todayData = healthData.find(d => d.date === today);
    if (!todayData) {
      try {
        setDoc(doc(db, 'users', userId, 'healthData', today), {
          date: today,
          exercise: [],
          sleep: { hours: 0, quality: 0 },
          water: 0,
          waterLogs: [],
          meditation: 0,
          meditationLogs: [],
        }, { merge: true });
      } catch (err) {
        console.error('Error initializing today’s data:', err);
        setError('Failed to initialize data: ' + err.message);
      }
    }
  }, [healthData, isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const checkStreaks = async () => {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today);
      if (!todayData) return;

      const totalExercise = todayData.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0);
      const allGoalsMet =
        todayData.water >= goals.water &&
        todayData.sleep.hours >= goals.sleep &&
        totalExercise >= goals.exercise &&
        todayData.meditation >= goals.meditation;

      if (allGoalsMet) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayData = healthData.find(d => d.date === yesterdayStr);
        const yesterdayGoalsMet = yesterdayData &&
          yesterdayData.water >= goals.water &&
          yesterdayData.sleep.hours >= goals.sleep &&
          yesterdayData.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0) >= goals.exercise &&
          yesterdayData.meditation >= goals.meditation;

        const newStreaks = {
          current: yesterdayGoalsMet ? streaks.current + 1 : 1,
          longest: Math.max(streaks.longest, yesterdayGoalsMet ? streaks.current + 1 : 1),
        };
        setStreaks(newStreaks);
        try {
          await setDoc(doc(db, 'users', userId, 'settings', 'streaks'), newStreaks);
        } catch (err) {
          console.error('Error updating streaks:', err);
          setError('Failed to update streaks: ' + err.message);
        }
      } else if (streaks.current > 0) {
        const newStreaks = { ...streaks, current: 0 };
        setStreaks(newStreaks);
        try {
          await setDoc(doc(db, 'users', userId, 'settings', 'streaks'), newStreaks);
        } catch (err) {
          console.error('Error resetting streaks:', err);
          setError('Failed to reset streaks: ' + err.message);
        }
      }
    };
    checkStreaks();
  }, [healthData, goals, streaks, isAuthenticated, userId]);

  const addExercise = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to log exercise.');
      return;
    }
    if (!exerciseType || !exerciseDuration || exerciseDuration <= 0) {
      setError('Please enter valid exercise type and duration.');
      return;
    }
    setLoading(prev => ({ ...prev, exercise: true }));
    try {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today) || {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        waterLogs: [],
        meditation: 0,
        meditationLogs: [],
      };
      const newExercise = {
        type: exerciseType,
        duration: parseInt(exerciseDuration),
        id: Date.now(),
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userId, 'healthData', today), {
        ...todayData,
        exercise: [...todayData.exercise, newExercise],
      }, { merge: true });
      setExerciseType('');
      setExerciseDuration('');
      setError('');
    } catch (error) {
      console.error('Error adding exercise:', error);
      setError('Failed to log exercise: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, exercise: false }));
    }
  };

  const addSleep = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to log sleep.');
      return;
    }
    if (!sleepHours || !sleepQuality || sleepHours <= 0 || sleepQuality < 1 || sleepQuality > 10) {
      setError('Please enter valid sleep hours (0-24) and quality (1-10).');
      return;
    }
    setLoading(prev => ({ ...prev, sleep: true }));
    try {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today) || {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        waterLogs: [],
        meditation: 0,
        meditationLogs: [],
      };
      await setDoc(doc(db, 'users', userId, 'healthData', today), {
        ...todayData,
        sleep: {
          hours: parseFloat(sleepHours),
          quality: parseInt(sleepQuality),
          timestamp: new Date().toISOString(),
        },
      }, { merge: true });
      setSleepHours('');
      setSleepQuality('');
      setError('');
    } catch (error) {
      console.error('Error adding sleep:', error);
      setError('Failed to log sleep: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, sleep: false }));
    }
  };

  const addWater = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to log water intake.');
      return;
    }
    setLoading(prev => ({ ...prev, water: true }));
    try {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today) || {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        waterLogs: [],
        meditation: 0,
        meditationLogs: [],
      };
      await setDoc(doc(db, 'users', userId, 'healthData', today), {
        ...todayData,
        water: todayData.water + 1,
        waterLogs: [...(todayData.waterLogs || []), { timestamp: new Date().toISOString() }],
      }, { merge: true });
      setError('');
    } catch (error) {
      console.error('Error adding water:', error);
      setError('Failed to log water: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, water: false }));
    }
  };

  const addMeditation = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to log meditation.');
      return;
    }
    if (!meditationDuration || meditationDuration <= 0) {
      setError('Please enter valid meditation duration.');
      return;
    }
    setLoading(prev => ({ ...prev, meditation: true }));
    try {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today) || {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        waterLogs: [],
        meditation: 0,
        meditationLogs: [],
      };
      const duration = parseInt(meditationDuration);
      await setDoc(doc(db, 'users', userId, 'healthData', today), {
        ...todayData,
        meditation: todayData.meditation + duration,
        meditationLogs: [...(todayData.meditationLogs || []), { duration, timestamp: new Date().toISOString() }],
      }, { merge: true });
      setMeditationDuration('');
      setError('');
    } catch (error) {
      console.error('Error adding meditation:', error);
      setError('Failed to log meditation: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, meditation: false }));
    }
  };

  const getTodayData = () => {
    const today = getTodayString();
    return healthData.find(d => d.date === today) || {
      date: today,
      exercise: [],
      sleep: { hours: 0, quality: 0 },
      water: 0,
      waterLogs: [],
      meditation: 0,
      meditationLogs: [],
    };
  };

  const getChartData = useMemo(() => {
    const days = viewPeriod === 'weekly' ? 7 : viewPeriod === 'monthly' ? 30 : 365;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayData = healthData.find(d => d.date === dateString);
      const totalExercise = dayData?.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0) || 0;
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        water: dayData?.water || 0,
        sleep: dayData?.sleep.hours || 0,
        exercise: totalExercise,
        meditation: dayData?.meditation || 0,
        sleepQuality: dayData?.sleep.quality || 0,
      });
    }
    return data;
  }, [healthData, viewPeriod]);

  const getLogData = useMemo(() => {
    const logs = [];
    healthData.forEach(day => {
      if (day.exercise?.length > 0) {
        day.exercise.forEach(ex => {
          logs.push({
            type: 'exercise',
            description: `${ex.type} (${ex.duration} min)`,
            timestamp: ex.timestamp,
            date: day.date,
          });
        });
      }
      if (day.sleep?.hours > 0) {
        logs.push({
          type: 'sleep',
          description: `${day.sleep.hours}h (Quality: ${day.sleep.quality}/10)`,
          timestamp: day.sleep.timestamp,
          date: day.date,
        });
      }
      if (day.waterLogs?.length > 0) {
        day.waterLogs.forEach(water => {
          logs.push({
            type: 'water',
            description: '1 glass of water',
            timestamp: water.timestamp,
            date: day.date,
          });
        });
      }
      if (day.meditationLogs?.length > 0) {
        day.meditationLogs.forEach(med => {
          logs.push({
            type: 'meditation',
            description: `${med.duration} min`,
            timestamp: med.timestamp,
            date: day.date,
          });
        });
      }
    });
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [healthData]);

  const todayData = getTodayData();
  const totalExerciseToday = todayData.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0);
  const getProgress = (current, goal) => Math.min((current / goal) * 100, 100);

  const renderTabContent = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (activeTab === 'dashboard') {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Droplets}
              title="Water Intake"
              current={todayData.water}
              goal={goals.water}
              unit="cups"
              color="#0d6efd"
              progress={getProgress(todayData.water, goals.water)}
            />
            <StatCard
              icon={Moon}
              title="Sleep"
              current={todayData.sleep.hours}
              goal={goals.sleep}
              unit="hours"
              color="#6f42c1"
              progress={getProgress(todayData.sleep.hours, goals.sleep)}
            />
            <StatCard
              icon={Activity}
              title="Exercise"
              current={totalExerciseToday}
              goal={goals.exercise}
              unit="min"
              color="#198754"
              progress={getProgress(totalExerciseToday, goals.exercise)}
            />
            <StatCard
              icon={Brain}
              title="Meditation"
              current={todayData.meditation}
              goal={goals.meditation}
              unit="min"
              color="#fd7e14"
              progress={getProgress(todayData.meditation, goals.meditation)}
            />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <Award className="mr-2" style={{ color: '#6f42c1' }} />
              Streaks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-slate-50 transition-all hover:bg-slate-100">
                <p className="text-2xl font-bold text-indigo-600">{streaks.current}</p>
                <p className="text-sm text-slate-600">Current Streak (days)</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-50 transition-all hover:bg-slate-100">
                <p className="text-2xl font-bold text-indigo-600">{streaks.longest}</p>
                <p className="text-sm text-slate-600">Longest Streak (days)</p>
              </div>
            </div>
          </div>
          {lastAIResponse && (
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-md transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-800">Latest AI Health Report</h3>
            </div>
              <div className="prose prose-sm max-w-none text-slate-700 bg-white p-4 rounded-lg space-y-4">
                {parseSummary(lastAIResponse.summary).map((section, index) => (
                  <div key={index} className="mb-6">
                    {section.title && (
                      <button
                        onClick={() => setOpenSections(prev => ({ ...prev, [`latest-${index}`]: !prev[`latest-${index}`] }))}
                        className="w-full flex items-center justify-between text-lg font-semibold text-indigo-600 mb-2"
                        aria-expanded={openSections[`latest-${index}`] || false}
                        aria-controls={`latest-section-${index}`}
                      >
                        {section.title}
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${openSections[`latest-${index}`] ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                    )}
                    <div
                      id={`latest-section-${index}`}
                      className={`transition-all duration-300 ${openSections[`latest-${index}`] || section.type === 'table' ? 'block' : 'hidden'
                        }`}
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
    }

    if (activeTab === 'log') {
      return (
        <div className="space-y-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-red-600" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {logFilter === 'all' || logFilter === 'exercise' ? (
              <InputCard icon={Activity} title="Log Exercise" color="#198754">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Exercise Type</label>
                    <input
                      type="text"
                      value={exerciseType}
                      onChange={(e) => setExerciseType(e.target.value)}
                      placeholder="e.g., Running, Weightlifting, Yoga"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      aria-label="Exercise type"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={exerciseDuration}
                      onChange={(e) => setExerciseDuration(e.target.value)}
                      placeholder="30"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      aria-label="Exercise duration in minutes"
                    />
                  </div>
                  <button
                    onClick={addExercise}
                    disabled={loading.exercise || !exerciseType || !exerciseDuration || exerciseDuration <= 0}
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition-colors duration-300 disabled:bg-green-400 disabled:cursor-not-allowed"
                    aria-label="Add exercise"
                  >
                    {loading.exercise ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2" size={16} />
                        Add Exercise
                      </>
                    )}
                  </button>
                </div>
              </InputCard>
            ) : null}
            {logFilter === 'all' || logFilter === 'sleep' ? (
              <InputCard icon={Moon} title="Log Sleep" color="#6f42c1">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hours Slept</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      placeholder="8"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      aria-label="Hours slept"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sleep Quality (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(e.target.value)}
                      placeholder="8"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      aria-label="Sleep quality rating"
                    />
                  </div>
                  <button
                    onClick={addSleep}
                    disabled={loading.sleep || !sleepHours || !sleepQuality || sleepHours <= 0 || sleepQuality < 1 || sleepQuality > 10}
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-md shadow hover:bg-purple-700 transition-colors duration-300 disabled:bg-purple-400 disabled:cursor-not-allowed"
                    aria-label="Log sleep"
                  >
                    {loading.sleep ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Logging...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2" size={16} />
                        Log Sleep
                      </>
                    )}
                  </button>
                </div>
              </InputCard>
            ) : null}
            {logFilter === 'all' || logFilter === 'water' ? (
              <InputCard icon={Droplets} title="Water Intake" color="#0d6efd">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-slate-800">{todayData.water} / {goals.water}</div>
                  <div className="text-sm text-slate-600">Glasses consumed today</div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 mb-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${getProgress(todayData.water, goals.water)}%`, backgroundColor: '#0d6efd' }}
                  />
                </div>
                <button
                  onClick={addWater}
                  disabled={loading.water || todayData.water >= goals.water}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  aria-label="Add one glass of water"
                >
                  {loading.water ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2" size={16} />
                      Add 1 Glass
                    </>
                  )}
                </button>
                {todayData.water >= goals.water && (
                  <div className="flex items-center justify-center text-green-600 font-semibold mt-3">
                    <Award className="mr-2" size={16} />
                    Goal Achieved!
                  </div>
                )}
              </InputCard>
            ) : null}
            {logFilter === 'all' || logFilter === 'meditation' ? (
              <InputCard icon={Brain} title="Log Meditation" color="#fd7e14">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={meditationDuration}
                      onChange={(e) => setMeditationDuration(e.target.value)}
                      placeholder="15"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      aria-label="Meditation duration in minutes"
                    />
                  </div>
                  <button
                    onClick={addMeditation}
                    disabled={loading.meditation || !meditationDuration || meditationDuration <= 0}
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white font-semibold rounded-md shadow hover:bg-orange-700 transition-colors duration-300 disabled:bg-orange-400 disabled:cursor-not-allowed"
                    aria-label="Add meditation"
                  >
                    {loading.meditation ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2" size={16} />
                        Add Meditation
                      </>
                    )}
                  </button>
                </div>
              </InputCard>
            ) : null}
          </div>
        </div>
      );
    }

    if (activeTab === 'analytics') {
      return (
        <div className="space-y-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-300 hover:shadow-md">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <TrendingUp className="mr-3" style={{ color: '#0d6efd' }} />
              Health Analytics
            </h2>
            <div className="flex-shrink-0">
              <span className="relative z-0 inline-flex shadow-sm rounded-md">
                {['weekly', 'monthly', 'yearly'].map((period, i) => (
                  <button
                    key={period}
                    onClick={() => setViewPeriod(period)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-300 ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${viewPeriod === period ? 'z-10 bg-indigo-100 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    aria-label={`View ${period} analytics`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Droplets className="mr-2" style={{ color: '#0d6efd' }} />
                Water & Sleep Tracking
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                    <Line
                      type="monotone"
                      dataKey="water"
                      name="Water (cups)"
                      stroke="#0d6efd"
                      strokeWidth={3}
                      dot={{ fill: '#0d6efd', strokeWidth: 2, r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      name="Sleep (hours)"
                      stroke="#6f42c1"
                      strokeWidth={3}
                      dot={{ fill: '#6f42c1', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Activity className="mr-2" style={{ color: '#198754' }} />
                Exercise & Meditation
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                    <Bar dataKey="exercise" name="Exercise (min)" fill="#198754" />
                    <Bar dataKey="meditation" name="Meditation (min)" fill="#fd7e14" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <Award className="mr-2" style={{ color: '#6f42c1' }} />
              {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Avg Water', value: (getChartData.reduce((sum, d) => sum + d.water, 0) / getChartData.length).toFixed(1), unit: 'cups', color: '#0d6efd' },
                { label: 'Avg Sleep', value: (getChartData.reduce((sum, d) => sum + d.sleep, 0) / getChartData.length).toFixed(1), unit: 'hours', color: '#6f42c1' },
                { label: 'Total Exercise', value: getChartData.reduce((sum, d) => sum + d.exercise, 0), unit: 'min', color: '#198754' },
                { label: 'Total Meditation', value: getChartData.reduce((sum, d) => sum + d.meditation, 0), unit: 'min', color: '#fd7e14' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center p-4 rounded-lg bg-slate-50 transition-all hover:bg-slate-100">
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-xs text-slate-500">{stat.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <History className="mr-2" style={{ color: '#6f42c1' }} />
              Activity Logs
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {LOG_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setLogFilter(filter.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${logFilter === filter.id
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                    }`}
                  aria-label={`Filter logs by ${filter.label}`}
                >
                  {filter.icon && <filter.icon className="w-4 h-4" />}
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {getLogData.filter(log => logFilter === 'all' || log.type === logFilter).map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-md bg-slate-50 transition-all hover:bg-slate-100">
                  <div className="flex items-center">
                    {log.type === 'exercise' && <Activity className="w-5 h-5 mr-2 text-green-600" />}
                    {log.type === 'sleep' && <Moon className="w-5 h-5 mr-2 text-purple-600" />}
                    {log.type === 'water' && <Droplets className="w-5 h-5 mr-2 text-indigo-600" />}
                    {log.type === 'meditation' && <Brain className="w-5 h-5 mr-2 text-orange-600" />}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{log.description}</p>
                      <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{log.date}</p>
                </div>
              ))}
              {getLogData.filter(log => logFilter === 'all' || log.type === logFilter).length === 0 && (
                <p className="text-sm text-slate-500 text-center">No logs available for this filter.</p>
              )}
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === 'ai') {
      return <AIAssistantContent healthData={healthData} goals={goals} userId={userId} isAuthenticated={isAuthenticated} />;
    }

    if (activeTab === 'goals') {
      return <GoalSetting goals={goals} setGoals={setGoals} userId={userId} isAuthenticated={isAuthenticated} />;
    }

    return null;
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} ${sidebarOpen ? 'ml-64' : 'ml-0'} sm:ml-0`}>
      {error && (
        <div className="max-w-7xl mx-auto p-2 sm:p-6 lg:p-4">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto p-2 pt-0 sm:p-6 lg:p-4">
        <div className="mb-4 sm:mb-2 relative">
          <div className="border-b border-slate-200 bg-white rounded-t-xl shadow-sm">
            <nav className="-mb-px flex overflow-x-auto px-3 sm:px-6" aria-label="Tabs">
              {TABS.slice(0, 3).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    aria-label={`View ${tab.label} tab`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className={`lg:hidden flex items-center gap-1 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${mobileNavOpen || TABS.slice(3).some(tab => tab.id === activeTab)
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300'
                  }`}
                aria-label="Toggle more tabs menu"
                aria-expanded={mobileNavOpen}
              >
                {/* <MoreVertical className="w-4 h-4" /> */}
                <span className="hidden sm:inline">More</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
              </button>
              {TABS.slice(3).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`hidden lg:flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    aria-label={`View ${tab.label} tab`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          {mobileNavOpen && (
            <div className="lg:hidden absolute top-full right-3 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 mt-1 min-w-[180px]">
              <div className="space-y-1">
                {TABS.slice(3).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors duration-200 text-left ${activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      aria-label={`View ${tab.label} tab`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="transition-all duration-300">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default HealthTracker;