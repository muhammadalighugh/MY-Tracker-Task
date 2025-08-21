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
  ShoppingBag, 
  AlertTriangle,
  Bell
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useSidebar } from '../../context/SidebarContext';
import { auth, db } from '../../firebase/firebase.config';
import { doc, collection, addDoc, getDocs, deleteDoc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';

// Error Boundary Component
class ExpenseTrackerErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in ExpenseTracker:', error, errorInfo);
    toast.error('An error occurred in the Expense Tracker. Please try again.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-bold text-red-600">Something went wrong.</h2>
          <p className="text-sm text-slate-600">Please refresh the page or try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#4F46E5'];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'PKR', symbol: '₨' }
];

const StatCard = ({ icon: Icon, title, value, subValue, color, currencySymbol }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center text-slate-500 mb-2">
        <Icon className="w-5 h-5 mr-2" style={{ color }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-slate-800">{currencySymbol}{value}</p>
    </div>
    {subValue && <p className="text-sm text-slate-400 mt-1">{subValue}</p>}
  </div>
);

const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full">
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Icon className="w-5 h-5 mr-2" style={{ color }} />
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const ExpenseTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('monthly');
  const [currency, setCurrency] = useState('USD');
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [debts, setDebts] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [user, loading, error] = useAuthState(auth);

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

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  // Fetch data from Firestore
  useEffect(() => {
    if (!user) return;

    const expensesRef = collection(db, 'users', user.uid, 'expenses');
    const incomesRef = collection(db, 'users', user.uid, 'incomes');
    const debtsRef = collection(db, 'users', user.uid, 'debts');
    const budgetsRef = doc(db, 'users', user.uid, 'budgets', 'userBudgets');
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');

    // Initialize budgets if not exist
    const initializeBudgets = async () => {
      try {
        await setDoc(budgetsRef, {}, { merge: true });
      } catch (err) {
        toast.error('Failed to initialize budgets: ' + err.message);
      }
    };

    // Initialize settings if not exist
    const initializeSettings = async () => {
      try {
        await setDoc(settingsRef, { currency: 'USD' }, { merge: true });
      } catch (err) {
        toast.error('Failed to initialize settings: ' + err.message);
      }
    };

    // Fetch expenses
    const unsubscribeExpenses = onSnapshot(expensesRef, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    }, (err) => {
      toast.error('Failed to fetch expenses: ' + err.message);
    });

    // Fetch incomes
    const unsubscribeIncomes = onSnapshot(incomesRef, (snapshot) => {
      const incomesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncomes(incomesData);
    }, (err) => {
      toast.error('Failed to fetch incomes: ' + err.message);
    });

    // Fetch debts
    const unsubscribeDebts = onSnapshot(debtsRef, (snapshot) => {
      const debtsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDebts(debtsData);
    }, (err) => {
      toast.error('Failed to fetch debts: ' + err.message);
    });

    // Fetch budgets
    const unsubscribeBudgets = onSnapshot(budgetsRef, (docSnap) => {
      if (docSnap.exists()) {
        setBudgets(docSnap.data());
      } else {
        initializeBudgets();
      }
    }, (err) => {
      toast.error('Failed to fetch budgets: ' + err.message);
    });

    // Fetch settings (currency)
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrency(docSnap.data().currency || 'USD');
      } else {
        initializeSettings();
      }
    }, (err) => {
      toast.error('Failed to fetch settings: ' + err.message);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeIncomes();
      unsubscribeDebts();
      unsubscribeBudgets();
      unsubscribeSettings();
    };
  }, [user]);

  // Generate alerts
  useEffect(() => {
    const newAlerts = [];
    Object.keys(budgets).forEach(cat => {
      const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
      if (spent > budgets[cat]) {
        newAlerts.push(`Budget exceeded in ${cat} by ${currencySymbol}${(spent - budgets[cat]).toFixed(2)}`);
      }
    });
    const balance = incomes.reduce((sum, i) => sum + i.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0);
    if (balance < 0) {
      newAlerts.push(`Negative balance: ${currencySymbol}${Math.abs(balance).toFixed(2)}`);
    }
    const unpaidDebts = debts.filter(d => d.status === 'unpaid').length;
    if (unpaidDebts > 0) {
      newAlerts.push(`${unpaidDebts} unpaid debt${unpaidDebts > 1 ? 's' : ''}`);
    }
    setAlerts(newAlerts);
  }, [expenses, incomes, budgets, debts, currencySymbol]);

  // Handle loading and error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    toast.error('Authentication error: ' + error.message);
    return null;
  }

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount || !user) return;

    try {
      const expense = {
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        date: newExpense.date,
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'expenses'), expense);
      setNewExpense({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Expense added successfully!');
    } catch (err) {
      toast.error('Failed to add expense: ' + err.message);
    }
  };

  const handleAddGrocery = async () => {
    if (!newGrocery.item || !newGrocery.amount || !user) return;

    try {
      const groceryExpense = {
        category: 'Grocery',
        amount: parseFloat(newGrocery.amount),
        description: `Grocery: ${newGrocery.item}`,
        date: newGrocery.date,
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'expenses'), groceryExpense);
      setNewGrocery({
        item: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Grocery expense added successfully!');
    } catch (err) {
      toast.error('Failed to add grocery expense: ' + err.message);
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome.source || !newIncome.amount || !user) return;

    try {
      const income = {
        source: newIncome.source,
        amount: parseFloat(newIncome.amount),
        description: newIncome.description,
        date: newIncome.date,
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'incomes'), income);
      setNewIncome({
        source: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Income added successfully!');
    } catch (err) {
      toast.error('Failed to add income: ' + err.message);
    }
  };

  const handleAddDebt = async () => {
    if (!newDebt.person || !newDebt.amount || !user) return;

    try {
      const debt = {
        person: newDebt.person,
        amount: parseFloat(newDebt.amount),
        type: newDebt.type,
        description: newDebt.description,
        date: newDebt.date,
        status: 'unpaid',
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'debts'), debt);
      setNewDebt({
        person: '',
        amount: '',
        type: 'lent',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'unpaid'
      });
      toast.success('Debt added successfully!');
    } catch (err) {
      toast.error('Failed to add debt: ' + err.message);
    }
  };

  const handleMarkDebtPaid = async (id) => {
    try {
      const debtRef = doc(db, 'users', user.uid, 'debts', id);
      await updateDoc(debtRef, { status: 'paid', datePaid: new Date().toISOString().split('T')[0] });
      toast.success('Debt marked as paid!');
    } catch (err) {
      toast.error('Failed to mark debt as paid: ' + err.message);
    }
  };

  const handleSetBudget = async () => {
    if (!newBudget.category || !newBudget.amount || !user) return;

    try {
      const budgetsRef = doc(db, 'users', user.uid, 'budgets', 'userBudgets');
      await updateDoc(budgetsRef, { [newBudget.category]: parseFloat(newBudget.amount) });
      setNewBudget({ category: '', amount: '' });
      toast.success('Budget set successfully!');
    } catch (err) {
      toast.error('Failed to set budget: ' + err.message);
    }
  };

  const handleDeleteData = async () => {
    if (!user) return;

    try {
      // Delete expenses
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesRef);
      const deleteExpensesPromises = expensesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteExpensesPromises);

      // Delete incomes
      const incomesRef = collection(db, 'users', user.uid, 'incomes');
      const incomesSnapshot = await getDocs(incomesRef);
      const deleteIncomesPromises = incomesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteIncomesPromises);

      // Reset budgets
      const budgetsRef = doc(db, 'users', user.uid, 'budgets', 'userBudgets');
      await setDoc(budgetsRef, {});

      // Delete debts
      const debtsRef = collection(db, 'users', user.uid, 'debts');
      const debtsSnapshot = await getDocs(debtsRef);
      const deleteDebtsPromises = debtsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteDebtsPromises);

      setShowDeleteConfirm(false);
      toast.success('All data deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete data: ' + err.message);
    }
  };

  const handleChangeCurrency = async (newCurrency) => {
    if (!user) return;

    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
      await updateDoc(settingsRef, { currency: newCurrency });
      setCurrency(newCurrency);
      toast.success('Currency updated successfully!');
    } catch (err) {
      toast.error('Failed to update currency: ' + err.message);
    }
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
    <ExpenseTrackerErrorBoundary>
      <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} p-4 md:p-6 max-w-7xl mx-auto`}>
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Expense Tracker</h1>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              value={currency}
              onChange={(e) => handleChangeCurrency(e.target.value)}
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</option>
              ))}
            </select>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
              >
                <Target size={16} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
              >
                <CreditCard size={16} />
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
              >
                <BarChart3 size={16} />
                Analytics
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <StatCard
                icon={HandCoins}
                title="Debt Lent"
                value={stats.totalDebtLent}
                subValue="Unpaid"
                color="#8B5CF6"
                currencySymbol={currencySymbol}
              />
              <StatCard
                icon={HandCoins}
                title="Debt Borrowed"
                value={stats.totalDebtBorrowed}
                subValue="Unpaid"
                color="#EF4444"
                currencySymbol={currencySymbol}
              />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" style={{ color: '#F59E0B' }} />
                Alerts
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-md text-yellow-700 text-sm">
                      <AlertTriangle className="mr-2 w-4 h-4" />
                      {alert}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 text-center">No alerts at the moment.</p>
                )}
              </div>
            </div>
          </div>
        )}

{activeTab === 'transactions' && (
  <div className="space-y-6">
    {/* Input Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Grocery Expense Card */}
      <InputCard icon={ShoppingBag} title="Add Grocery Expense" color="#F59E0B">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <Calendar className="mr-2 w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newGrocery.date}
              onChange={(e) => setNewGrocery({ ...newGrocery, date: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <ShoppingBag className="mr-2 w-4 h-4" />
              Item
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newGrocery.item}
              onChange={(e) => setNewGrocery({ ...newGrocery, item: e.target.value })}
              placeholder="e.g., Milk, Bread"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <DollarSign className="mr-2 w-4 h-4" />
              Amount
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newGrocery.amount}
              onChange={(e) => setNewGrocery({ ...newGrocery, amount: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <button
            className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white font-semibold rounded-md shadow hover:bg-yellow-700 transition-colors disabled:bg-yellow-400 disabled:cursor-not-allowed text-sm"
            onClick={handleAddGrocery}
            disabled={!newGrocery.item || !newGrocery.amount}
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Grocery
          </button>
        </div>
      </InputCard>

      {/* General Expense Card */}
      <InputCard icon={CreditCard} title="Add General Expense" color="#EF4444">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <Calendar className="mr-2 w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <PieIcon className="mr-2 w-4 h-4" />
              Category
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              placeholder="e.g., Food, Transport"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <DollarSign className="mr-2 w-4 h-4" />
              Amount
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <TrendingUp className="mr-2 w-4 h-4" />
              Description
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <button
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed text-sm"
            onClick={handleAddExpense}
            disabled={!newExpense.category || !newExpense.amount}
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Expense
          </button>
        </div>
      </InputCard>

      {/* Income Card */}
      <InputCard icon={DollarSign} title="Add Income" color="#10B981">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <Calendar className="mr-2 w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newIncome.date}
              onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <Award className="mr-2 w-4 h-4" />
              Source
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newIncome.source}
              onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
              placeholder="e.g., Salary, Freelance"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <DollarSign className="mr-2 w-4 h-4" />
              Amount
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newIncome.amount}
              onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <TrendingUp className="mr-2 w-4 h-4" />
              Description
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newIncome.description}
              onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <button
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed text-sm"
            onClick={handleAddIncome}
            disabled={!newIncome.source || !newIncome.amount}
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Income
          </button>
        </div>
      </InputCard>

      {/* Debt Card */}
      <InputCard icon={HandCoins} title="Add Debt" color="#8B5CF6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <Calendar className="mr-2 w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newDebt.date}
              onChange={(e) => setNewDebt({ ...newDebt, date: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <HandCoins className="mr-2 w-4 h-4" />
              Person/Entity
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newDebt.person}
              onChange={(e) => setNewDebt({ ...newDebt, person: e.target.value })}
              placeholder="e.g., John Doe, Bank"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <DollarSign className="mr-2 w-4 h-4" />
              Amount
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newDebt.amount}
              onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <TrendingUp className="mr-2 w-4 h-4" />
              Type
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newDebt.type}
              onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
            >
              <option value="lent">Lent</option>
              <option value="borrowed">Borrowed</option>
            </select>
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <TrendingUp className="mr-2 w-4 h-4" />
              Description
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newDebt.description}
              onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <button
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed text-sm"
            onClick={handleAddDebt}
            disabled={!newDebt.person || !newDebt.amount}
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Debt
          </button>
        </div>
      </InputCard>

      {/* Budget Card */}
      <InputCard icon={Target} title="Set Budget" color="#3B82F6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <PieIcon className="mr-2 w-4 h-4" />
              Category
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newBudget.category}
              onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
              placeholder="e.g., Food, Transport"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
              <DollarSign className="mr-2 w-4 h-4" />
              Amount
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newBudget.amount}
              onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <button
            className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed text-sm"
            onClick={handleSetBudget}
            disabled={!newBudget.category || !newBudget.amount}
          >
            <Plus className="mr-2 w-4 h-4" />
            Set Budget
          </button>
          <button
            className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-md hover:bg-red-50 hover:border-red-500 transition-colors text-sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 w-4 h-4" />
            Delete All Data
          </button>
        </div>
      </InputCard>
    </div>

    {/* Grocery Expenses Table */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <ShoppingBag className="w-5 h-5 mr-2" style={{ color: '#F59E0B' }} />
          Recent Grocery Expenses
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Date</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Item</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Amount</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Description</th>
                </tr>
              </thead>
              <tbody>
                {expenses.filter(e => e.category === 'Grocery').slice(0, 5).map(expense => (
                  <tr key={expense.id} className="border-t border-slate-200">
                    <td className="p-2 md:p-3 whitespace-nowrap">{expense.date}</td>
                    <td className="p-2 md:p-3 font-medium text-slate-800 whitespace-nowrap">{expense.description.replace('Grocery: ', '')}</td>
                    <td className="p-2 md:p-3 whitespace-nowrap">{currencySymbol}{expense.amount.toFixed(2)}</td>
                    <td className="p-2 md:p-3 max-w-[120px] md:max-w-[200px] truncate" title={expense.description || '-'}>
                      {expense.description || '-'}
                    </td>
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
    </div>

    {/* General Expenses Table */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" style={{ color: '#EF4444' }} />
          Recent General Expenses
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Date</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Category</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Amount</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Description</th>
                </tr>
              </thead>
              <tbody>
                {expenses.filter(e => e.category !== 'Grocery').slice(0, 5).map(expense => (
                  <tr key={expense.id} className="border-t border-slate-200">
                    <td className="p-2 md:p-3 whitespace-nowrap">{expense.date}</td>
                    <td className="p-2 md:p-3 font-medium text-slate-800 whitespace-nowrap">{expense.category}</td>
                    <td className="p-2 md:p-3 whitespace-nowrap">{currencySymbol}{expense.amount.toFixed(2)}</td>
                    <td className="p-2 md:p-3 max-w-[120px] md:max-w-[200px] truncate" title={expense.description || '-'}>
                      {expense.description || '-'}
                    </td>
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
    </div>

    {/* Incomes Table */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" style={{ color: '#10B981' }} />
          Recent Incomes
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Date</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Source</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Amount</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Description</th>
                </tr>
              </thead>
              <tbody>
                {incomes.slice(0, 5).map(income => (
                  <tr key={income.id} className="border-t border-slate-200">
                    <td className="p-2 md:p-3 whitespace-nowrap">{income.date}</td>
                    <td className="p-2 md:p-3 font-medium text-slate-800 whitespace-nowrap">{income.source}</td>
                    <td className="p-2 md:p-3 whitespace-nowrap">{currencySymbol}{income.amount.toFixed(2)}</td>
                    <td className="p-2 md:p-3 max-w-[120px] md:max-w-[200px] truncate" title={income.description || '-'}>
                      {income.description || '-'}
                    </td>
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
    </div>

    {/* Debt Summary Table */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <HandCoins className="w-5 h-5 mr-2" style={{ color: '#8B5CF6' }} />
          Debt Summary
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Date</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Person/Entity</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Type</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Amount</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Status</th>
                  <th className="p-2 md:p-3 font-semibold whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {debts.slice(0, 5).map(debt => (
                  <tr key={debt.id} className="border-t border-slate-200">
                    <td className="p-2 md:p-3 whitespace-nowrap">{debt.date}</td>
                    <td className="p-2 md:p-3 font-medium text-slate-800 whitespace-nowrap">{debt.person}</td>
                    <td className="p-2 md:p-3 whitespace-nowrap">{debt.type.charAt(0).toUpperCase() + debt.type.slice(1)}</td>
                    <td className="p-2 md:p-3 whitespace-nowrap">{currencySymbol}{debt.amount.toFixed(2)}</td>
                    <td className="p-2 md:p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${debt.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {debt.status.charAt(0).toUpperCase() + debt.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-2 md:p-3">
                      {debt.status === 'unpaid' && (
                        <button
                          onClick={() => handleMarkDebtPaid(debt.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
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
  </div>
)}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <TrendingUp className="mr-2 w-5 h-5" style={{ color: '#3B82F6' }} />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <TrendingUp className="mr-2 w-5 h-5" style={{ color: '#3B82F6' }} />
                  Income & Expense Trends
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <PieIcon className="mr-2 w-5 h-5" style={{ color: '#3B82F6' }} />
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

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <BarChart3 className="mr-2 w-5 h-5" style={{ color: '#3B82F6' }} />
                Budget vs Actual
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBarChartData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} formatter={(value) => `${currencySymbol}${value.toFixed(2)}`} />
                    <Bar dataKey="budget" name="Budget" fill="#3B82F6" />
                    <Bar dataKey="spent" name="Spent" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <HandCoins className="mr-2 w-5 h-5" style={{ color: '#8B5CF6' }} />
                Debt Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getDebtChartData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Award className="mr-2 w-5 h-5" style={{ color: '#3B82F6' }} />
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
                    <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.unit}{stat.value}</p>
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
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Confirm Deletion</h2>
              <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete ALL finance data? This action cannot be undone.</p>
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
    </ExpenseTrackerErrorBoundary>
  );
};

export default ExpenseTracker;