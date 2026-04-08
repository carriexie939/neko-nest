import { useState, useEffect, useCallback } from 'react'
import { computeSummary } from './domain/summary'
import { evaluateCatState } from './domain/catState'
import * as api from './utils/api'
import { HomeView } from './views/HomeView'
import { InsightsView } from './views/InsightsView'
import { SplitView } from './views/SplitView'
import { TabBar } from './components/TabBar'
import { CharacterOnboarding } from './components/CharacterOnboarding'
import { hasSeenCharacterIntro } from './components/characterIntroState'
import { tokens } from './theme/tokens'

const CATEGORY_OPTIONS = {
  expense: [
    'food',
    'transport',
    'housing',
    'shopping',
    'entertainment',
    'education',
    'healthcare',
    'bills',
    'travel',
    'others',
  ],
  income: ['salary', 'freelance', 'bonus', 'gift', 'other_income'],
}

function toDateInputValue(date = new Date()) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseDateInputToLocalMidnight(value) {
  const parts = String(value).trim().split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
  const [y, m, d] = parts
  const when = new Date(y, m - 1, d, 0, 0, 0, 0)
  if (when.getFullYear() !== y || when.getMonth() !== m - 1 || when.getDate() !== d) return null
  return when
}

function formatTransactionDate(isoString) {
  try {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return String(isoString)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return String(isoString)
  }
}

const TABS = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'insights', label: 'Insights', emoji: '📊' },
  { id: 'split', label: 'Split', emoji: '👥' },
]

function txId(tx) {
  return tx._id || tx.id
}

function App() {
  const [loading, setLoading] = useState(true)
  const [showCharacterIntro, setShowCharacterIntro] = useState(false)
  const [tab, setTab] = useState('home')
  const [transactions, setTransactions] = useState([])
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS.expense[0])
  const [txDateFrom, setTxDateFrom] = useState(() => toDateInputValue())
  const [txDateTo, setTxDateTo] = useState(() => toDateInputValue())
  const [weeklyBudget, setWeeklyBudget] = useState(300)
  const [budgetInput, setBudgetInput] = useState('300')
  const [insightRange, setInsightRange] = useState('week')
  const [budgetError, setBudgetError] = useState('')
  const [transactionError, setTransactionError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [txs, settings] = await Promise.all([api.fetchTransactions(), api.fetchSettings()])
      setTransactions(txs)
      if (txs.length === 0 && !hasSeenCharacterIntro()) setShowCharacterIntro(true)
      setWeeklyBudget(settings.weeklyBudget || 300)
      setBudgetInput(String(settings.weeklyBudget || 300))
    } catch (err) {
      console.error('Failed to load from API:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const weeklySummary = computeSummary(transactions, { range: 'week', weeklyBudget })
  const monthlySummary = computeSummary(transactions, { range: 'month', weeklyBudget })
  const catState = evaluateCatState({ summary: weeklySummary, transactions, weeklyBudget })

  function handleTypeChange(nextType) {
    setType(nextType)
    setCategory(CATEGORY_OPTIONS[nextType][0])
  }

  async function handleAddTransaction(event) {
    event.preventDefault()
    const trimmed = String(amount).trim()
    if (!trimmed) { setTransactionError('Please enter an amount.'); return }
    const parsedAmount = Number(trimmed)
    if (!Number.isFinite(parsedAmount)) { setTransactionError('Please enter a valid number.'); return }
    if (parsedAmount <= 0) { setTransactionError('Amount must be greater than zero.'); return }
    if (parsedAmount > 99999) { setTransactionError('Amount cannot exceed 5 digits.'); return }
    if (!txDateFrom) { setTransactionError('Please select a date.'); return }
    const date = parseDateInputToLocalMidnight(txDateFrom)
    if (!date) { setTransactionError('Please select a valid date.'); return }

    setTransactionError('')
    const item = {
      title: title.trim() || category,
      description: description.trim(),
      type,
      amount: parsedAmount,
      category,
      date: date.toISOString(),
      source: 'manual',
    }
    try {
      const created = await api.createTransactions([item])
      setTransactions((prev) => [...created, ...prev])
    } catch (err) {
      setTransactionError(err.message)
      return
    }
    setAmount('')
    setTitle('')
    setDescription('')
    setTxDateFrom(toDateInputValue())
    setTxDateTo(toDateInputValue())
  }

  async function handleDeleteTransaction(id) {
    try {
      await api.deleteTransaction(id)
      setTransactions((prev) => prev.filter((tx) => txId(tx) !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  async function handleEditTransaction(id, fields) {
    try {
      const updated = await api.updateTransaction(id, fields)
      setTransactions((prev) => prev.map((tx) => (txId(tx) === id ? updated : tx)))
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  async function handleBudgetSubmit(event) {
    event.preventDefault()
    const trimmed = String(budgetInput).trim()
    if (!trimmed) { setBudgetError('Please enter a weekly budget.'); return }
    const parsedBudget = Number(trimmed)
    if (!Number.isFinite(parsedBudget)) { setBudgetError('Please enter a valid number.'); return }
    if (parsedBudget <= 0) { setBudgetError('Weekly budget must be greater than zero.'); return }
    if (parsedBudget > 99999) { setBudgetError('Weekly budget cannot exceed 5 digits.'); return }
    setBudgetError('')
    try {
      await api.updateSettings({ weeklyBudget: parsedBudget })
      setWeeklyBudget(parsedBudget)
    } catch (err) {
      setBudgetError(err.message)
    }
  }

  async function handleCreateSplitExpense(payload) {
    const cat = 'bills'
    const items = [{
      title: payload.billName,
      description: `Split between ${payload.participantCount} people`,
      type: 'expense',
      amount: Math.min(Number(payload.amount) || 0, 99999),
      category: cat,
      date: new Date().toISOString(),
      source: 'split',
    }]
    try {
      const created = await api.createTransactions(items)
      setTransactions((prev) => [...created, ...prev])
      setTab('home')
    } catch (err) {
      console.error('Split create failed:', err)
    }
  }

  const shell = { background: tokens.color.bg, minHeight: '100vh', color: tokens.color.text }
  const inner = {
    maxWidth: 480,
    margin: '0 auto',
    padding: '20px 16px 96px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  }

  if (loading) {
    return (
      <div style={{ ...shell, display: 'grid', placeItems: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={shell}>
      {showCharacterIntro ? (
        <CharacterOnboarding onComplete={() => setShowCharacterIntro(false)} />
      ) : null}
      <div style={inner}>
        <header style={{ marginBottom: 18 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            NekoNest
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: tokens.color.subtext }}>
            Cozy spending, one nest at a time
          </p>
        </header>
        <div key={tab} className="tab-content">
        {tab === 'home' && (
          <HomeView
            weeklySummary={weeklySummary}
            catState={catState}
            weeklyBudget={weeklyBudget}
            budgetInput={budgetInput}
            setBudgetInput={setBudgetInput}
            budgetError={budgetError}
            setBudgetError={setBudgetError}
            handleBudgetSubmit={handleBudgetSubmit}
            type={type}
            handleTypeChange={handleTypeChange}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            amount={amount}
            setAmount={setAmount}
            category={category}
            setCategory={setCategory}
            txDateFrom={txDateFrom}
            setTxDateFrom={setTxDateFrom}
            txDateTo={txDateTo}
            setTxDateTo={setTxDateTo}
            transactionError={transactionError}
            setTransactionError={setTransactionError}
            handleAddTransaction={handleAddTransaction}
            transactions={transactions}
            handleDeleteTransaction={handleDeleteTransaction}
            handleEditTransaction={handleEditTransaction}
            formatTransactionDate={formatTransactionDate}
            categoryOptions={CATEGORY_OPTIONS}
          />
        )}
        {tab === 'insights' && (
          <InsightsView
            weeklySummary={weeklySummary}
            monthlySummary={monthlySummary}
            insightRange={insightRange}
            setInsightRange={setInsightRange}
            weeklyBudget={weeklyBudget}
          />
        )}
        {tab === 'split' && (
          <SplitView onCreateSplitExpense={handleCreateSplitExpense} />
        )}
        </div>
      </div>
      <TabBar tabs={TABS} activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
export default App
