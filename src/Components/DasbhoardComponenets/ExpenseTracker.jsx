import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  PieChart as PieIcon, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  BarChart3, 
  DollarSign, 
  Target, 
  Award, 
  HandCoins, 
  ShoppingBag 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#4F46E5'];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'PKR', symbol: '₨' }
];

const StatCard = ({ icon: Icon, title, value, subValue, color, currencySymbol }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center text-slate-500 mb-2">
        <Icon className="w-5 h-5 mr-2" style={{ color }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-slate-800">{currencySymbol}{value}</p>
    </div>
    {subValue && <p className="text-sm text-slate-400 mt-1">{subValue}</p>}
  </div>
);

const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full">
    <div className="p-6">
      <div className="flex items-center mb-5">
        <Icon className="w-6 h-6 mr-3" style={{ color }} />
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const ExpenseTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('monthly');
  const [currency, setCurrency] = useState(() => localStorage.getItem('expense-tracker-currency') || 'USD');
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [debts, setDebts] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newGrocery, setNewGrocery] = useState({
    item: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: ''
  });
  const [newDebt, setNewDebt] = useState({
    person: '',
    amount: '',
    type: 'lent',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'unpaid'
  });
  const navigate = useNavigate();

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  useEffect(() => {
    const savedExpenses = JSON.parse(localStorage.getItem('expense-tracker-expenses') || '[]');
    const savedIncomes = JSON.parse(localStorage.getItem('expense-tracker-incomes') || '[]');
    const savedBudgets = JSON.parse(localStorage.getItem('expense-tracker-budgets') || '{}');
    const savedDebts = JSON.parse(localStorage.getItem('expense-tracker-debts') || '[]');
    setExpenses(savedExpenses);
    setIncomes(savedIncomes);
    setBudgets(savedBudgets);
    setDebts(savedDebts);
  }, []);

  useEffect(() => {
    localStorage.setItem('expense-tracker-currency', currency);
  }, [currency]);

  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleAddExpense = () => {
    if (!newExpense.category || !newExpense.amount) return;

    const expense = {
      id: Date.now().toString(),
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      date: newExpense.date
    };

    const updatedExpenses = [...expenses, expense];
    setExpenses(updatedExpenses);
    saveData('expense-tracker-expenses', updatedExpenses);
    setNewExpense({
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddGrocery = () => {
    if (!newGrocery.item || !newGrocery.amount) return;

    const groceryExpense = {
      id: Date.now().toString(),
      category: 'Grocery',
      amount: parseFloat(newGrocery.amount),
      description: `Grocery: ${newGrocery.item}`,
      date: newGrocery.date
    };

    const updatedExpenses = [...expenses, groceryExpense];
    setExpenses(updatedExpenses);
    saveData('expense-tracker-expenses', updatedExpenses);
    setNewGrocery({
      item: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddIncome = () => {
    if (!newIncome.source || !newIncome.amount) return;

    const income = {
      id: Date.now().toString(),
      source: newIncome.source,
      amount: parseFloat(newIncome.amount),
      description: newIncome.description,
      date: newIncome.date
    };

    const updatedIncomes = [...incomes, income];
    setIncomes(updatedIncomes);
    saveData('expense-tracker-incomes', updatedIncomes);
    setNewIncome({
      source: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddDebt = () => {
    if (!newDebt.person || !newDebt.amount) return;

    const debt = {
      id: Date.now().toString(),
      person: newDebt.person,
      amount: parseFloat(newDebt.amount),
      type: newDebt.type,
      description: newDebt.description,
      date: newDebt.date,
      status: 'unpaid'
    };

    const updatedDebts = [...debts, debt];
    setDebts(updatedDebts);
    saveData('expense-tracker-debts', updatedDebts);
    setNewDebt({
      person: '',
      amount: '',
      type: 'lent',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'unpaid'
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleMarkDebtPaid = (id) => {
    const updatedDebts = debts.map(debt => 
      debt.id === id ? { ...debt, status: 'paid', datePaid: new Date().toISOString().split('T')[0] } : debt
    );
    setDebts(updatedDebts);
    saveData('expense-tracker-debts', updatedDebts);
  };

  const handleSetBudget = () => {
    if (!newBudget.category || !newBudget.amount) return;

    const updatedBudgets = { ...budgets, [newBudget.category]: parseFloat(newBudget.amount) };
    setBudgets(updatedBudgets);
    saveData('expense-tracker-budgets', updatedBudgets);
    setNewBudget({ category: '', amount: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteData = () => {
    localStorage.removeItem('expense-tracker-expenses');
    localStorage.removeItem('expense-tracker-incomes');
    localStorage.removeItem('expense-tracker-budgets');
    localStorage.removeItem('expense-tracker-debts');
    setExpenses([]);
    setIncomes([]);
    setBudgets({});
    setDebts([]);
    setShowDeleteConfirm(false);
  };

  const getFinanceStats = () => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const balance = totalIncome - totalExpenses;
    const topCategory = getTopExpenseCategory();
    const monthlyGroceryExpenses = expenses
      .filter(e => e.category === 'Grocery' && new Date(e.date).getMonth() === new Date().getMonth())
      .reduce((sum, e) => sum + e.amount, 0);
    const totalDebtLent = debts.filter(d => d.type === 'lent' && d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);
    const totalDebtBorrowed = debts.filter(d => d.type === 'borrowed' && d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);

    return {
      totalExpenses: totalExpenses.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      balance: balance.toFixed(2),
      monthlyGroceryExpenses: monthlyGroceryExpenses.toFixed(2),
      totalDebtLent: totalDebtLent.toFixed(2),
      totalDebtBorrowed: totalDebtBorrowed.toFixed(2),
      topCategory
    };
  };

  const getTopExpenseCategory = () => {
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    const top = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    return top ? `${top[0]}: ${currencySymbol}${top[1].toFixed(2)}` : 'N/A';
  };

  const getChartData = () => {
    const days = viewPeriod === 'weekly' ? 7 : viewPeriod === 'monthly' ? 30 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dayExpenses = expenses.filter(e => e.date === dateString).reduce((sum, e) => sum + e.amount, 0);
      const dayGroceryExpenses = expenses.filter(e => e.date === dateString && e.category === 'Grocery').reduce((sum, e) => sum + e.amount, 0);
      const dayIncome = incomes.filter(i => i.date === dateString).reduce((sum, i) => sum + i.amount, 0);

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        expenses: dayExpenses,
        groceryExpenses: dayGroceryExpenses,
        income: dayIncome,
        net: dayIncome - dayExpenses
      });
    }

    return data;
  };

  const getPieChartData = () => {
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      value: amount,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getDebtChartData = () => {
    const days = viewPeriod === 'weekly' ? 7 : viewPeriod === 'monthly' ? 30 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dayLent = debts.filter(d => d.date === dateString && d.type === 'lent' && d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);
      const dayBorrowed = debts.filter(d => d.date === dateString && d.type === 'borrowed' && d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lent: dayLent,
        borrowed: dayBorrowed
      });
    }

    return data;
  };

  const getBarChartData = () => {
    const categoryBudgets = {};
    Object.keys(budgets).forEach(cat => {
      const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
      categoryBudgets[cat] = { budget: budgets[cat], spent };
    });

    return Object.entries(categoryBudgets).map(([cat, values]) => ({
      category: cat,
      budget: values.budget,
      spent: values.spent
    }));
  };

  const stats = getFinanceStats();

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Expense Tracker</h1>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</option>
              ))}
            </select>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 transition-colors"
            >
              <Wallet size={16} />
              Home
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <Target size={16} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={CreditCard}
                title="Total Expenses"
                value={stats.totalExpenses}
                subValue="All time"
                color="#EF4444"
                currencySymbol={currencySymbol}
              />
              <StatCard
                icon={DollarSign}
                title="Total Income"
                value={stats.totalIncome}
                subValue="All time"
                color="#10B981"
                currencySymbol={currencySymbol}
              />
              <StatCard
                icon={Wallet}
                title="Balance"
                value={stats.balance}
                subValue={parseFloat(stats.balance) >= 0 ? 'Positive' : 'Negative'}
                color={parseFloat(stats.balance) >= 0 ? '#10B981' : '#EF4444'}
                currencySymbol={currencySymbol}
              />
              <StatCard
                icon={ShoppingBag}
                title="Monthly Groceries"
                value={stats.monthlyGroceryExpenses}
                subValue={stats.topCategory}
                color="#F59E0B"
                currencySymbol={currencySymbol}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <InputCard icon={ShoppingBag} title="Add Grocery Expense" color="#F59E0B">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <Calendar className="mr-2" size={16} />
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newGrocery.date}
                        onChange={(e) => setNewGrocery({ ...newGrocery, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <ShoppingBag className="mr-2" size={16} />
                        Item
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newGrocery.item}
                        onChange={(e) => setNewGrocery({ ...newGrocery, item: e.target.value })}
                        placeholder="e.g., Milk, Bread"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <DollarSign className="mr-2" size={16} />
                        Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newGrocery.amount}
                        onChange={(e) => setNewGrocery({ ...newGrocery, amount: e.target.value })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-yellow-600 text-white font-semibold rounded-md shadow hover:bg-yellow-700 transition-colors disabled:bg-yellow-400 disabled:cursor-not-allowed"
                      onClick={handleAddGrocery}
                      disabled={!newGrocery.item || !newGrocery.amount}
                    >
                      <Plus className="mr-2" size={16} />
                      Add Grocery
                    </button>
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={CreditCard} title="Add General Expense" color="#EF4444">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <Calendar className="mr-2" size={16} />
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <PieIcon className="mr-2" size={16} />
                        Category
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        placeholder="e.g., Food, Transport"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <DollarSign className="mr-2" size={16} />
                        Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <TrendingUp className="mr-2" size={16} />
                        Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-red-600 text-white font-semibold rounded-md shadow hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
                      onClick={handleAddExpense}
                      disabled={!newExpense.category || !newExpense.amount}
                    >
                      <Plus className="mr-2" size={16} />
                      Add Expense
                    </button>
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={DollarSign} title="Add Income" color="#10B981">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <Calendar className="mr-2" size={16} />
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newIncome.date}
                        onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <Award className="mr-2" size={16} />
                        Source
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newIncome.source}
                        onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                        placeholder="e.g., Salary, Freelance"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <DollarSign className="mr-2" size={16} />
                        Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newIncome.amount}
                        onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <TrendingUp className="mr-2" size={16} />
                        Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newIncome.description}
                        onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                      onClick={handleAddIncome}
                      disabled={!newIncome.source || !newIncome.amount}
                    >
                      <Plus className="mr-2" size={16} />
                      Add Income
                    </button>
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={HandCoins} title="Add Debt" color="#8B5CF6">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <Calendar className="mr-2" size={16} />
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newDebt.date}
                        onChange={(e) => setNewDebt({ ...newDebt, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <HandCoins className="mr-2" size={16} />
                        Person/Entity
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newDebt.person}
                        onChange={(e) => setNewDebt({ ...newDebt, person: e.target.value })}
                        placeholder="e.g., John Doe, Bank"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <DollarSign className="mr-2" size={16} />
                        Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newDebt.amount}
                        onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <TrendingUp className="mr-2" size={16} />
                        Type
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newDebt.type}
                        onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
                      >
                        <option value="lent">Lent</option>
                        <option value="borrowed">Borrowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <TrendingUp className="mr-2" size={16} />
                        Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newDebt.description}
                        onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-md shadow hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                      onClick={handleAddDebt}
                      disabled={!newDebt.person || !newDebt.amount}
                    >
                      <Plus className="mr-2" size={16} />
                      Add Debt
                    </button>
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={Target} title="Set Budget" color="#3B82F6">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <PieIcon className="mr-2" size={16} />
                        Category
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newBudget.category}
                        onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                        placeholder="e.g., Food, Transport"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <DollarSign className="mr-2" size={16} />
                        Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newBudget.amount}
                        onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                      onClick={handleSetBudget}
                      disabled={!newBudget.category || !newBudget.amount}
                    >
                      <Plus className="mr-2" size={16} />
                      Set Budget
                    </button>
                    {saved && (
                      <div className="flex items-center p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm">
                        <CheckCircle size={16} className="mr-2" />
                        Successfully saved!
                      </div>
                    )}
                    <button
                      className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-md hover:bg-red-50 hover:border-red-500 transition-colors"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="mr-2" size={16} />
                      Delete All Data
                    </button>
                  </div>
                </InputCard>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center">
                  <ShoppingBag className="w-6 h-6 mr-3" style={{ color: '#F59E0B' }} />
                  Recent Grocery Expenses
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-sm text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Item</th>
                        <th className="p-3 font-semibold">Amount</th>
                        <th className="p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.filter(e => e.category === 'Grocery').slice(0, 5).map(expense => (
                        <tr key={expense.id} className="border-t border-slate-200">
                          <td className="p-3">{expense.date}</td>
                          <td className="p-3 font-medium text-slate-800">{expense.description.replace('Grocery: ', '')}</td>
                          <td className="p-3">{currencySymbol}{expense.amount.toFixed(2)}</td>
                          <td className="p-3">{expense.description || '-'}</td>
                        </tr>
                      ))}
                      {expenses.filter(e => e.category === 'Grocery').length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-slate-600">
                            No grocery expenses logged. Add your first grocery expense to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center">
                  <CreditCard className="w-6 h-6 mr-3" style={{ color: '#EF4444' }} />
                  Recent General Expenses
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-sm text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold">Amount</th>
                        <th className="p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.filter(e => e.category !== 'Grocery').slice(0, 5).map(expense => (
                        <tr key={expense.id} className="border-t border-slate-200">
                          <td className="p-3">{expense.date}</td>
                          <td className="p-3 font-medium text-slate-800">{expense.category}</td>
                          <td className="p-3">{currencySymbol}{expense.amount.toFixed(2)}</td>
                          <td className="p-3">{expense.description || '-'}</td>
                        </tr>
                      ))}
                      {expenses.filter(e => e.category !== 'Grocery').length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-slate-600">
                            No general expenses logged. Add your first expense to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center">
                  <DollarSign className="w-6 h-6 mr-3" style={{ color: '#10B981' }} />
                  Recent Incomes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-sm text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Source</th>
                        <th className="p-3 font-semibold">Amount</th>
                        <th className="p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomes.slice(0, 5).map(income => (
                        <tr key={income.id} className="border-t border-slate-200">
                          <td className="p-3">{income.date}</td>
                          <td className="p-3 font-medium text-slate-800">{income.source}</td>
                          <td className="p-3">{currencySymbol}{income.amount.toFixed(2)}</td>
                          <td className="p-3">{income.description || '-'}</td>
                        </tr>
                      ))}
                      {incomes.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-slate-600">
                            No incomes logged. Add your first income to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center">
                  <HandCoins className="w-6 h-6 mr-3" style={{ color: '#8B5CF6' }} />
                  Debt Summary
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-sm text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Person/Entity</th>
                        <th className="p-3 font-semibold">Type</th>
                        <th className="p-3 font-semibold">Amount</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debts.slice(0, 5).map(debt => (
                        <tr key={debt.id} className="border-t border-slate-200">
                          <td className="p-3">{debt.date}</td>
                          <td className="p-3 font-medium text-slate-800">{debt.person}</td>
                          <td className="p-3">{debt.type.charAt(0).toUpperCase() + debt.type.slice(1)}</td>
                          <td className="p-3">{currencySymbol}{debt.amount.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${debt.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {debt.status.charAt(0).toUpperCase() + debt.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-3">
                            {debt.status === 'unpaid' && (
                              <button
                                onClick={() => handleMarkDebtPaid(debt.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {debts.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-600">
                            No debts logged. Add your first debt to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <TrendingUp className="mr-3" style={{ color: '#3B82F6' }} />
                Finance Analytics
              </h2>
              <div className="flex-shrink-0">
                <span className="relative z-0 inline-flex shadow-sm rounded-md">
                  {['weekly', 'monthly', 'yearly'].map((period, i) => (
                    <button
                      key={period}
                      onClick={() => setViewPeriod(period)}
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
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <TrendingUp className="mr-2" style={{ color: '#3B82F6' }} />
                  Income & Expense Trends
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} formatter={(value) => `${currencySymbol}${value.toFixed(2)}`} />
                      <Line
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#EF4444"
                        strokeWidth={3}
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="groceryExpenses"
                        name="Grocery Expenses"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        name="Net"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <PieIcon className="mr-2" style={{ color: '#3B82F6' }} />
                  Expense Categories
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${currencySymbol}${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <BarChart3 className="mr-2" style={{ color: '#3B82F6' }} />
                Budget vs Actual
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%"/>
                  <BarChart data={getBarChartData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} formatter={(value) => `${currencySymbol}${value.toFixed(2)}`} />
                    <Bar dataKey="budget" name="Budget" fill="#3B82F6" />
                    <Bar dataKey="spent" name="Spent" fill="#EF4444" />
                  </BarChart>
                </div>
              </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <HandCoins className="mr-2" style={{ color: '#8B5CF6' }} />
                Debt Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getDebtChartData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} formatter={(value) => `${currencySymbol}${value.toFixed(2)}`} />
                    <Line
                      type="monotone"
                      dataKey="lent"
                      name="Lent"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="borrowed"
                      name="Borrowed"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Award className="mr-2" style={{ color: '#3B82F6' }} />
                {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Expenses/Day', value: (getChartData().reduce((sum, d) => sum + d.expenses, 0) / getChartData().length).toFixed(2), unit: currencySymbol, color: '#EF4444' },
                  { label: 'Avg Income/Day', value: (getChartData().reduce((sum, d) => sum + d.income, 0) / getChartData().length).toFixed(2), unit: currencySymbol, color: '#10B981' },
                  { label: 'Net Savings', value: getChartData().reduce((sum, d) => sum + d.net, 0).toFixed(2), unit: currencySymbol, color: '#3B82F6' },
                  { label: 'Total Debt Lent', value: stats.totalDebtLent, unit: currencySymbol, color: '#8B5CF6' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.unit}{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-xs text-slate-500">{stat.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h2>
              <p className="text-slate-600 mb-6">Are you sure you want to delete ALL finance data? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-md hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteData}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;