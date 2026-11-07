import React, { useState, useEffect } from 'react';
import { 
  Database, 
  GitBranch, 
  Play, 
  Zap, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Code, 
  Copy, 
  Check, 
  Table, 
  Key, 
  Link2, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Trophy,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { 
  soundManager, 
  triggerConfetti, 
  achievementsManager, 
  ACHIEVEMENTS 
} from '../../utils/fun';

export default function DbmsLabPage() {
  const [activeTab, setActiveTab] = useState('er-diagram'); // 'er-diagram' | 'normalisation' | 'triggers' | 'playground' | 'cheat-sheet' | 'quiz'

  // 1. ER Diagram State
  const [schemaData, setSchemaData] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // 2. Triggers Live State
  const [triggerResults, setTriggerResults] = useState({});
  const [testingTrigger, setTestingTrigger] = useState(null);

  // 3. SQL Playground State
  const [queriesList, setQueriesList] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState(1);
  const [customSql, setCustomSql] = useState('');
  const [playgroundResult, setPlaygroundResult] = useState(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundError, setPlaygroundError] = useState(null);

  // 4. Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Load Schema
  const loadSchema = async () => {
    try {
      setSchemaLoading(true);
      const data = await api.getSchema();
      setSchemaData(data);
      if (data.tables && data.tables.length > 0 && !selectedTable) {
        setSelectedTable(data.tables[0]);
      }
    } catch (err) {
      console.error('Failed to load schema', err);
    } finally {
      setSchemaLoading(false);
    }
  };

  // Load Queries
  const loadQueries = async () => {
    try {
      const data = await api.getLabQueries();
      setQueriesList(data);
      if (data.length > 0 && !customSql) {
        setCustomSql(data[0].sql);
      }
    } catch (err) {
      console.error('Failed to load lab queries', err);
    }
  };

  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  useEffect(() => {
    loadSchema();
    loadQueries();
    setUnlockedAchievements(achievementsManager.getUnlocked());

    const handleAch = () => {
      setUnlockedAchievements(achievementsManager.getUnlocked());
    };
    window.addEventListener('farmledger_achievement_unlocked', handleAch);
    return () => window.removeEventListener('farmledger_achievement_unlocked', handleAch);
  }, []);

  const handleSelectQuery = (id) => {
    soundManager.playPop();
    setSelectedQueryId(id);
    const q = queriesList.find(item => item.id === Number(id));
    if (q) {
      setCustomSql(q.sql);
      setPlaygroundResult(null);
      setPlaygroundError(null);
    }
  };

  const handleRunPlayground = async () => {
    try {
      setPlaygroundLoading(true);
      setPlaygroundError(null);
      const res = await api.runPlaygroundQuery(customSql);
      setPlaygroundResult(res);
      soundManager.playSuccess();
      triggerConfetti({ count: 45 });
      achievementsManager.unlock('sql_wizard');
    } catch (err) {
      setPlaygroundError(err.message);
      setPlaygroundResult(null);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const handleTestTrigger = async (scenario) => {
    try {
      setTestingTrigger(scenario);
      const res = await api.testLiveTrigger(scenario);
      setTriggerResults(prev => ({ ...prev, [scenario]: res }));
      soundManager.playShield();
      triggerConfetti({ count: 65 });
      achievementsManager.unlock('trigger_master');
    } catch (err) {
      setTriggerResults(prev => ({
        ...prev,
        [scenario]: { success: false, error: err.message, dbErrorMessage: err.message }
      }));
    } finally {
      setTestingTrigger(null);
    }
  };

  // 15 Project-Specific Quiz Questions
  const QUIZ_QUESTIONS = [
    {
      id: 1,
      question: "Why does crop_cycles reference plots with ON DELETE RESTRICT instead of ON DELETE CASCADE?",
      options: [
        "To delete all plot harvest history automatically when a plot is closed",
        "To preserve historical cultivation and rotation audit logs even if a plot status changes",
        "Because SQLite does not support CASCADE operations",
        "To allow duplicate plot codes to be inserted"
      ],
      correct: 1,
      explanation: "ON DELETE RESTRICT guarantees referential integrity and audit compliance: active or historical harvest records can never be accidentally wiped by dropping or modifying a physical plot."
    },
    {
      id: 2,
      question: "What makes the inventory_transactions table an 'append-only' ledger?",
      options: [
        "Transactions can be freely modified and deleted anytime",
        "Rows are never mutated in-place; all purchases, field applications, and adjustments are recorded as immutable chronological rows",
        "It stores only positive values with no foreign keys",
        "It uses MySQL AUTO_INCREMENT instead of SQLite rowid"
      ],
      correct: 1,
      explanation: "In enterprise DBMS design, append-only ledgers ensure non-repudiation: every gram of fertilizer or seed used is timestamped, audited, and triggers update current stock balances dynamically."
    },
    {
      id: 3,
      question: "Why was a BEFORE INSERT Trigger used instead of a CHECK constraint to prevent negative stock?",
      options: [
        "CHECK constraints only validate columns within the single row being inserted; evaluating current_stock requires querying the inventory_items relation",
        "CHECK constraints cannot use numbers",
        "Triggers run faster than CHECK constraints in all databases",
        "CHECK constraints only work on primary keys"
      ],
      correct: 0,
      explanation: "A standard table CHECK constraint is row-isolated and cannot read other tables. A BEFORE INSERT trigger queries current_stock from inventory_items and fires RAISE(ABORT) if usage > stock."
    },
    {
      id: 4,
      question: "In Third Normal Form (3NF), what is a 'transitive dependency' that FarmLedger eliminates?",
      options: [
        "A primary key referencing another primary key",
        "A non-key attribute depending on another non-key attribute (e.g. storing supplier address directly in inventory_items)",
        "A table having more than three foreign keys",
        "A composite key with two foreign columns"
      ],
      correct: 1,
      explanation: "If supplier address or phone were stored on inventory_items, it would depend on supplier_id, not item_id (X -> Y and Y -> Z). FarmLedger isolates suppliers into its own entity to achieve 3NF."
    },
    {
      id: 5,
      question: "How does the sales_records table automatically enforce total_amount without application code?",
      options: [
        "Through a JavaScript client utility function",
        "Using a GENERATED ALWAYS AS (quantity_sold * unit_price) STORED column",
        "By leaving it NULL and calculating in React",
        "Through an unconstrained VARCHAR text column"
      ],
      correct: 1,
      explanation: "Generated columns guarantee mathematical consistency at the storage layer, preventing rounding discrepancies or out-of-sync calculations between client and backend."
    },
    {
      id: 6,
      question: "What does the trigger trg_prevent_harvest_overselling prevent?",
      options: [
        "Selling produce below the minimum support price (MSP)",
        "Total cumulative sales for a harvest from exceeding the quantity harvested",
        "Selling seeds to unauthorized suppliers",
        "Entering a harvest date in the future"
      ],
      correct: 1,
      explanation: "The trigger computes SUM(quantity_sold) + NEW.quantity_sold and compares it to quantity_harvested, aborting any transaction that would overdraw inventory."
    },
    {
      id: 7,
      question: "Why are database Views (like v_current_stock_levels) used rather than storing stock valuation on disk?",
      options: [
        "Views provide dynamic, real-time encapsulation of computed values without data duplication or sync anomalies",
        "Views permanently duplicate the entire table for backup",
        "Views allow inserting rows without primary keys",
        "Views disable database triggers"
      ],
      correct: 0,
      explanation: "Views provide logical data independence: client apps query live computed stock valuation and reorder levels directly from the relational catalog without redundant physical storage."
    },
    {
      id: 8,
      question: "In Query 5, what is the role of the LAG() OVER window function?",
      options: [
        "It delays query execution by 500 milliseconds",
        "It accesses the crop and completion date of the previous cycle in the same plot to track crop rotation and fallow days",
        "It sums up all crop yields in reverse order",
        "It groups all records into a single row"
      ],
      correct: 1,
      explanation: "LAG() is an SQL:2003 analytical window function that inspects previous partition rows, enabling rotation sequence tracking without complex, expensive self-joins."
    },
    {
      id: 9,
      question: "Why does inventory_transactions store unit_cost even though inventory_items already defines unit_cost?",
      options: [
        "It is a normalisation mistake",
        "Historical price preservation: commodity purchase costs change over time, and past transactions must reflect the exact historical rate paid",
        "Because SQLite requires identical column names",
        "To satisfy First Normal Form"
      ],
      correct: 1,
      explanation: "Financial audit integrity: if urea price rises from ₹280 to ₹350 next year, past usages must continue evaluating at ₹280. Storing point-in-time unit_cost preserves financial reality."
    },
    {
      id: 10,
      question: "What does PRAGMA foreign_keys = ON; accomplish in SQLite?",
      options: [
        "Creates a new database file",
        "Enables enforcement of foreign key referential integrity constraints, which is off by default for backwards compatibility",
        "Converts SQLite into PostgreSQL",
        "Indexes all primary keys"
      ],
      correct: 1,
      explanation: "SQLite maintains backwards compatibility with legacy versions by requiring PRAGMA foreign_keys = ON on connection startup to actively validate referential constraints."
    },
    {
      id: 11,
      question: "How does FarmLedger's schema achieve Second Normal Form (2NF)?",
      options: [
        "By ensuring every table has a single surrogate Primary Key (id) so no partial functional dependency on composite keys can exist",
        "By having exactly two foreign keys per table",
        "By storing all dates as UNIX epoch integers",
        "By combining crops and varieties into one table"
      ],
      correct: 0,
      explanation: "2NF requires that all non-key attributes are fully functionally dependent on the primary key. Using single surrogate primary keys eliminates partial key dependencies by definition."
    },
    {
      id: 12,
      question: "What happens when you record a harvest against an active 'Growing' crop cycle?",
      options: [
        "The crop cycle is permanently deleted",
        "Trigger trg_update_crop_cycle_actual_yield_insert automatically updates crop_cycles.actual_yield and flips status to 'Harvested'",
        "The server throws an unhandled crash error",
        "The plot status resets to Fallow immediately"
      ],
      correct: 1,
      explanation: "The AFTER INSERT trigger on harvest_records aggregates SUM(quantity_harvested) and transitions the crop cycle from Growing to Harvested atomically."
    },
    {
      id: 13,
      question: "What DBMS structure allows Query 3 to compute ROI cleanly across multiple independent aggregations?",
      options: [
        "Common Table Expressions (WITH CycleCosts AS (...), CycleSales AS (...))",
        "A JavaScript for-loop on the backend",
        "Temporary CSV text files",
        "A database trigger"
      ],
      correct: 0,
      explanation: "CTEs modularize intermediate usage aggregations and sales aggregations into named temporary result sets, avoiding duplicate cartesian product join explosions."
    },
    {
      id: 14,
      question: "Why is plot_code in the plots table marked as UNIQUE?",
      options: [
        "To act as a natural candidate key preventing duplicate plot codes on the farm",
        "Because SQLite does not allow duplicate integers",
        "To speed up CSS rendering",
        "To automatically generate primary keys"
      ],
      correct: 0,
      explanation: "A UNIQUE constraint enforces domain entity integrity, ensuring farm operators cannot accidentally register two plots with the same identifier."
    },
    {
      id: 15,
      question: "Why are multi-statement operations wrapped inside BEGIN TRANSACTION ... COMMIT / ROLLBACK blocks?",
      options: [
        "To make queries run on the GPU",
        "To guarantee ACID Atomicity: either all related records insert successfully, or the entire operation rolls back with zero partial corruption",
        "To bypass foreign key checks",
        "To create temporary in-memory tables"
      ],
      correct: 1,
      explanation: "Atomicity is the 'A' in ACID. If a failure occurs halfway through creating an inventory item and its opening transaction, ROLLBACK ensures the database remains in its clean previous state."
    }
  ];

  const handleSelectQuizOption = (qId, optionIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.correct) score++;
    });
    return score;
  };

  const handleCheckQuiz = () => {
    setShowQuizResults(true);
    const score = calculateScore();
    if (score >= 12) {
      soundManager.playFanfare();
      triggerConfetti({ count: 120 });
      achievementsManager.unlock('viva_scholar');
    } else {
      soundManager.playSuccess();
      triggerConfetti({ count: 45 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Database className="w-5 h-5 text-emerald-700" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">DBMS Laboratory & Technical Showcase</h2>
          </div>
          <p className="text-xs text-slate-500">
            Interactive schema introspection, normalisation walkthrough, real-time trigger sandboxes, and analytical SQL playground designed for academic demonstration.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('er-diagram');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'er-diagram' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ER Diagram (10 Tables)
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('normalisation');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'normalisation' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normalisation (1NF-3NF)
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('triggers');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'triggers' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Triggers Live Sandbox
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('playground');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'playground' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SQL Playground
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('cheat-sheet');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cheat-sheet' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Concepts Cheat-Sheet
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('quiz');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'quiz' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DBMS Viva Quiz (15 Qs)
          </button>
        </div>
      </div>

      {/* Gamification Mastery Badges Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-3.5 rounded-xl border border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-300">Viva Mastery Badges:</span>
          <span className="text-xs text-slate-300 font-medium">
            {unlockedAchievements.length} of {ACHIEVEMENTS.length} Unlocked
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            return (
              <div 
                key={ach.id} 
                title={`${ach.title}: ${ach.description}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isUnlocked 
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-xs' 
                    : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 opacity-60'
                }`}
              >
                <span>{ach.icon}</span>
                <span className="text-[11px]">{ach.title}</span>
                {isUnlocked && <Sparkles className="w-3 h-3 text-amber-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ER Diagram & Table Inspector
      ========================================================================== */}
      {activeTab === 'er-diagram' && (
        <div className="space-y-6">
          {/* Conceptual Summary Banner */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-start gap-3">
            <Database className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <span className="font-bold block text-sm">Relational Schema Architecture (3NF Normalised)</span>
              <p>
                FarmLedger organizes farm management into <strong>10 normalized relational entities</strong>, <strong>6 database triggers</strong>, and <strong>5 analytical views</strong>. Foreign keys enforce referential integrity with strict <code>ON DELETE RESTRICT</code> cascades preventing accidental loss of historical agricultural ledgers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left list of 10 tables */}
            <div className="lg:col-span-4 bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Relational Tables ({schemaData?.tables?.length || 10})
                </span>
                <span className="text-xs text-slate-400">Click to inspect</span>
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {schemaData?.tables?.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => {
                      soundManager.playPop();
                      setSelectedTable(table);
                      achievementsManager.unlock('schema_explorer');
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all text-xs ${
                      selectedTable?.name === table.name
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono">{table.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {table.rowCount} rows
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Selected Table Details & Constraints */}
            <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              {selectedTable ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 font-mono">
                          TABLE: {selectedTable.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {selectedTable.rowCount} Live Records
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {selectedTable.columns?.length} Attributes &bull; {selectedTable.foreignKeys?.length} Foreign Key Relationships &bull; {selectedTable.indexes?.length} Secondary Indexes
                      </p>
                    </div>
                  </div>

                  {/* Columns Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Attributes & Data Types
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Key</th>
                            <th className="py-2 px-3">Column Name</th>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3">Nullability</th>
                            <th className="py-2 px-3">Default</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedTable.columns?.map((col) => (
                            <tr key={col.name} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3">
                                {col.pk ? (
                                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                    <Key className="w-3 h-3 text-amber-600" /> PK
                                  </span>
                                ) : selectedTable.foreignKeys?.some(fk => fk.fromColumn === col.name) ? (
                                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                    <Link2 className="w-3 h-3 text-blue-600" /> FK
                                  </span>
                                ) : (
                                  <span className="text-slate-300">&mdash;</span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">{col.name}</td>
                              <td className="py-2 px-3 font-mono text-emerald-700 font-medium">{col.type}</td>
                              <td className="py-2 px-3">
                                {col.notnull ? (
                                  <span className="text-rose-600 font-semibold">NOT NULL</span>
                                ) : (
                                  <span className="text-slate-400">NULLABLE</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                                {col.defaultValue ?? 'None'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Foreign Keys & Constraints */}
                  {selectedTable.foreignKeys && selectedTable.foreignKeys.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Referential Foreign Key Constraints
                      </h4>
                      <div className="space-y-1.5">
                        {selectedTable.foreignKeys.map((fk, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-200 text-xs text-blue-900 font-mono">
                            <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>
                              {selectedTable.name}.{fk.fromColumn} &rarr; {fk.targetTable}.{fk.toColumn} (ON DELETE {fk.onDelete || 'NO ACTION'})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Table DDL */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      DDL CREATE Statement
                    </h4>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                      {selectedTable.ddl}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400">Select a table on the left</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: Normalisation Walkthrough (1NF -> 2NF -> 3NF)
      ========================================================================== */}
      {activeTab === 'normalisation' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <h3 className="text-sm font-bold text-emerald-950 mb-1">
              Database Normalisation Walkthrough: 1NF &rarr; 2NF &rarr; 3NF
            </h3>
            <p className="text-xs text-emerald-800">
              Examining real examples from this project showing how unnormalised "flat spreadsheets" cause insertion anomalies, update anomalies, and deletion anomalies, and how FarmLedger solves them.
            </p>
          </div>

          {/* 1NF Walkthrough */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h4 className="text-sm font-bold text-slate-900">First Normal Form (1NF): Atomic Values & No Repeating Groups</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Rule:</strong> Each column must contain atomic (indivisible) values, and each record must be unique with a primary key. No multi-valued attributes like comma-separated lists.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Bad Unnormalised Design (Non-1NF)
                </span>
                <table className="w-full text-[11px] font-mono bg-white border border-rose-200 rounded">
                  <thead className="bg-rose-100/70 text-rose-900">
                    <tr><th>Plot</th><th>Crop</th><th>Inputs_Used (Violates 1NF)</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Plot 1</td><td>Wheat</td><td className="text-rose-600 font-bold">'Urea 25 bags, DAP 20 bags'</td></tr>
                  </tbody>
                </table>
                <p className="text-[11px] text-rose-700 mt-2">
                  &times; Anomaly: Cannot calculate total fertilizer cost, filter by input type, or index individual quantities.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  FarmLedger Solution (1NF Compliant)
                </span>
                <table className="w-full text-[11px] font-mono bg-white border border-emerald-200 rounded">
                  <thead className="bg-emerald-100/70 text-emerald-900">
                    <tr><th>Tx_ID</th><th>Item</th><th>Quantity</th><th>Unit_Cost</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>#1</td><td>Urea</td><td>25.0</td><td>₹280</td></tr>
                    <tr><td>#2</td><td>DAP</td><td>20.0</td><td>₹1,350</td></tr>
                  </tbody>
                </table>
                <p className="text-[11px] text-emerald-700 mt-2">
                  &check; Every cell contains exactly one atomic quantity and price. Aggregations (SUM, AVG) work cleanly.
                </p>
              </div>
            </div>
          </div>

          {/* 2NF Walkthrough */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <h4 className="text-sm font-bold text-slate-900">Second Normal Form (2NF): No Partial Functional Dependencies</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Rule:</strong> The table must be in 1NF, and all non-key attributes must depend on the <em>entire</em> primary key (not just part of a composite key).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Bad Design with Composite Key (Violates 2NF)
                </span>
                <p className="text-xs text-slate-700 font-mono">
                  Primary Key: (<code>plot_id</code>, <code>crop_id</code>)<br/>
                  Attributes: <code>soil_type</code>, <code>days_to_maturity</code>
                </p>
                <p className="text-[11px] text-rose-700 mt-2">
                  &times; Anomaly: <code>soil_type</code> depends only on <code>plot_id</code>, while <code>days_to_maturity</code> depends only on <code>crop_id</code>. Repeating soil type every time a crop changes causes update anomalies.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  FarmLedger Solution (2NF Compliant)
                </span>
                <p className="text-xs text-slate-700 font-mono">
                  - <code>plots(id, plot_code, soil_type, area)</code><br/>
                  - <code>crop_varieties(id, crop_id, days_to_maturity)</code><br/>
                  - <code>crop_cycles(id, plot_id, crop_variety_id, sowing_date)</code>
                </p>
                <p className="text-[11px] text-emerald-700 mt-2">
                  &check; Decomposed into separate entities with single surrogate primary keys. Every attribute depends completely on its key.
                </p>
              </div>
            </div>
          </div>

          {/* 3NF Walkthrough */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <h4 className="text-sm font-bold text-slate-900">Third Normal Form (3NF): No Transitive Functional Dependencies</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Rule:</strong> The table must be in 2NF, and no non-key attribute can depend on another non-key attribute ($X \to Y$ and $Y \to Z$). "Nothing depends on anything except the key, the whole key, and nothing but the key."
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Transitive Dependency (Violates 3NF)
                </span>
                <p className="text-xs text-slate-700 font-mono">
                  <code>inventory_items(id, name, supplier_id, supplier_phone, supplier_address)</code>
                </p>
                <p className="text-[11px] text-rose-700 mt-2">
                  &times; Anomaly: <code>supplier_phone</code> depends on <code>supplier_id</code>, which depends on <code>item_id</code>. If the supplier changes phone numbers, you must update 100 inventory rows or risk inconsistent phone numbers!
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  FarmLedger Solution (Strict 3NF)
                </span>
                <p className="text-xs text-slate-700 font-mono">
                  - <code>suppliers(id, name, phone, address, rating)</code><br/>
                  - <code>inventory_items(id, name, unit_cost, supplier_id)</code>
                </p>
                <p className="text-[11px] text-emerald-700 mt-2">
                  &check; Supplier details exist in exactly one row in <code>suppliers</code>. Updating phone number is a single $O(1)$ write with zero redundancy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: Triggers Live Sandbox
      ========================================================================== */}
      {activeTab === 'triggers' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <h3 className="text-sm font-bold text-emerald-950 mb-1">
              Live Trigger Verification Sandbox (Zero Risk to Demo Data)
            </h3>
            <p className="text-xs text-emerald-800">
              Click any button below to execute real database constraint checks against the live SQLite engine. Each attempt runs inside a transaction that is <strong>rolled back</strong> so your demonstration data remains completely intact!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario 1: Overuse Stock */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    1. trg_prevent_inventory_underflow_insert
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Underflow Guard
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Attempts to log usage of <strong>9,999 bags of Urea</strong> when the farm only has 163 bags in stock. The database aborts the transaction before committing.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleTestTrigger('underflow')}
                  disabled={testingTrigger === 'underflow'}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{testingTrigger === 'underflow' ? 'Testing Database Rule...' : 'Execute Overuse Test (9999 Bags)'}</span>
                </button>

                {triggerResults.underflow && (
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono space-y-1.5">
                    <div className="text-emerald-400 font-bold">&bull; Before: {triggerResults.underflow.beforeState}</div>
                    <div className="text-rose-400 font-bold">&bull; DB Exception: {triggerResults.underflow.dbErrorMessage}</div>
                    <div className="text-emerald-300 font-bold">&bull; After: {triggerResults.underflow.afterState}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Scenario 2: Oversell Harvest */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    2. trg_prevent_harvest_overselling
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    Oversell Guard
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Harvest #10 has 115 quintals harvested and 110 quintals sold (only <strong>5.0 quintals remain</strong>). Attempts to sell 50 quintals to a buyer.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleTestTrigger('oversell')}
                  disabled={testingTrigger === 'oversell'}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{testingTrigger === 'oversell' ? 'Testing Database Rule...' : 'Execute Oversell Test (Sell 50 q)'}</span>
                </button>

                {triggerResults.oversell && (
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono space-y-1.5">
                    <div className="text-emerald-400 font-bold">&bull; Before: {triggerResults.oversell.beforeState}</div>
                    <div className="text-rose-400 font-bold">&bull; DB Exception: {triggerResults.oversell.dbErrorMessage}</div>
                    <div className="text-emerald-300 font-bold">&bull; After: {triggerResults.oversell.afterState}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Scenario 3: Duplicate Plot Candidate Key */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    3. UNIQUE (plot_code) Constraint
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    Candidate Key
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Attempts to insert a new plot with plot_code <code>'P-NORTH-01'</code> which is already registered on Farm 1. The SQLite unique index prevents duplicate identity.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleTestTrigger('duplicate_plot')}
                  disabled={testingTrigger === 'duplicate_plot'}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{testingTrigger === 'duplicate_plot' ? 'Testing Constraint...' : 'Test Duplicate Plot Code'}</span>
                </button>

                {triggerResults.duplicate_plot && (
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono space-y-1.5">
                    <div className="text-emerald-400 font-bold">&bull; Before: {triggerResults.duplicate_plot.beforeState}</div>
                    <div className="text-rose-400 font-bold">&bull; DB Exception: {triggerResults.duplicate_plot.dbErrorMessage}</div>
                    <div className="text-emerald-300 font-bold">&bull; After: {triggerResults.duplicate_plot.afterState}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Scenario 4: Automated Harvest Roll-Up */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    4. trg_update_crop_cycle_actual_yield_insert
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Cascade Roll-Up
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Inserts a harvest record against active Cycle #11 (status: 'Growing'). An <strong>AFTER INSERT</strong> trigger automatically aggregates yield into crop_cycles and flips status to 'Harvested'!
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleTestTrigger('harvest_rollup')}
                  disabled={testingTrigger === 'harvest_rollup'}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{testingTrigger === 'harvest_rollup' ? 'Testing Trigger Cascade...' : 'Test Automated Harvest Roll-Up'}</span>
                </button>

                {triggerResults.harvest_rollup && (
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono space-y-1.5">
                    <div className="text-emerald-400 font-bold">&bull; Before: {triggerResults.harvest_rollup.beforeState}</div>
                    <div className="text-emerald-300 font-bold">&bull; Live Roll-Up: {triggerResults.harvest_rollup.afterState}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SQL Playground
      ========================================================================== */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 mb-0.5">Interactive SQL Playground & Query Runner</h3>
              <p className="text-xs text-emerald-800">
                Choose any of the 8 examiner queries from <code className="font-mono">queries.sql</code> or type a custom read-only SQL query.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-900">Preset Query:</span>
              <select
                value={selectedQueryId}
                onChange={(e) => handleSelectQuery(e.target.value)}
                className="bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden"
              >
                {queriesList.map(q => (
                  <option key={q.id} value={q.id}>
                    Query {q.id}: {q.title.split(':')[1]?.trim() || q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Query Question & Concepts Display */}
          {queriesList.find(q => q.id === selectedQueryId) && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div>
                <span className="font-bold text-slate-900">Agronomic Question: </span>
                <span className="text-slate-700 italic">"{queriesList.find(q => q.id === selectedQueryId).question}"</span>
              </div>
              <div>
                <span className="font-bold text-emerald-800">DBMS Concepts Tested: </span>
                <span className="font-mono text-emerald-700">{queriesList.find(q => q.id === selectedQueryId).concepts}</span>
              </div>
            </div>
          )}

          {/* SQL Editor Area */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300">Raw Analytical SQL</span>
              <button
                onClick={handleRunPlayground}
                disabled={playgroundLoading}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{playgroundLoading ? 'Executing SQL...' : 'Run Query'}</span>
              </button>
            </div>

            <textarea
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
            />
          </div>

          {/* Query Execution Metrics & Error */}
          {playgroundError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-mono">
              <strong>Query Execution Error:</strong> {playgroundError}
            </div>
          )}

          {playgroundResult && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-800">
                  Query Results ({playgroundResult.rowCount} rows returned)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Execution time: {playgroundResult.executionTimeMs} ms
                </span>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0">
                    <tr>
                      {playgroundResult.columns?.map(col => (
                        <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {playgroundResult.rows?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors font-mono">
                        {playgroundResult.columns?.map(col => (
                          <td key={col} className="py-2 px-3 whitespace-nowrap">
                            {row[col] !== null ? String(row[col]) : <span className="text-slate-300 italic">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: Concepts Cheat-Sheet
      ========================================================================== */}
      {activeTab === 'cheat-sheet' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <h3 className="text-sm font-bold text-emerald-950 mb-1">
              Curriculum DBMS Concepts Map
            </h3>
            <p className="text-xs text-emerald-800">
              Quick reference guide for viva examiners showing where every major database concept is implemented in the codebase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">1. Keys & Constraints</span>
              <h4 className="text-sm font-bold text-slate-900">Primary Keys, Candidate Keys & Foreign Keys</h4>
              <p className="text-xs text-slate-600">
                Surrogate keys on all tables. <code>plots.plot_code</code> enforced as natural candidate key via <code>UNIQUE</code> constraint. Referential integrity enforced with <code>ON DELETE RESTRICT</code> on harvests and plots.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 bg-slate-50 p-2 rounded">
                File: server/db/schema.sql (lines 10-180)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">2. Triggers (Business Logic)</span>
              <h4 className="text-sm font-bold text-slate-900">Stock Underflow, Overselling & Yield Roll-Up</h4>
              <p className="text-xs text-slate-600">
                6 active triggers: <code>trg_prevent_inventory_underflow_insert</code>, <code>trg_prevent_harvest_overselling</code>, and <code>trg_update_crop_cycle_actual_yield_insert/update/delete</code> automating stock accounting and crop cycles.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 bg-slate-50 p-2 rounded">
                File: server/db/schema.sql (lines 185-295)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">3. SQL Views</span>
              <h4 className="text-sm font-bold text-slate-900">Encapsulation & Reporting Views</h4>
              <p className="text-xs text-slate-600">
                5 Views: <code>v_current_stock_levels</code>, <code>v_low_stock_items</code>, <code>v_out_of_stock_items</code>, <code>v_monthly_inventory_value</code>, and <code>v_estimated_vs_actual_yield</code>.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 bg-slate-50 p-2 rounded">
                File: server/db/schema.sql (lines 300-385)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">4. Window Functions</span>
              <h4 className="text-sm font-bold text-slate-900">LAG() OVER Partitioning</h4>
              <p className="text-xs text-slate-600">
                Used in Query 5 to access the previous crop grown in each plot and calculate days fallow, tracking crop rotation without self-joins.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 bg-slate-50 p-2 rounded">
                File: server/db/queries.sql (lines 165-190)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800">5. Common Table Expressions (CTE)</span>
              <h4 className="text-sm font-bold text-slate-900">WITH Modular Aggregations</h4>
              <p className="text-xs text-slate-600">
                Used in Query 3 (<code>WITH CycleCosts AS (...), CycleSales AS (...)</code>) to compute input expenses and sales revenues independently before evaluating ROI.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 bg-slate-50 p-2 rounded">
                File: server/db/queries.sql (lines 78-124)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">6. Storage & Generated Columns</span>
              <h4 className="text-sm font-bold text-slate-900">Deterministic Mathematical Columns</h4>
              <p className="text-xs text-slate-600">
                <code>sales_records.total_amount</code> computed as <code>GENERATED ALWAYS AS (quantity_sold * unit_price) STORED</code> directly in the database.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 bg-slate-50 p-2 rounded">
                File: server/db/schema.sql (lines 155-165)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: DBMS Viva Quiz
      ========================================================================== */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 mb-0.5">FarmLedger Technical Viva Quiz</h3>
              <p className="text-xs text-emerald-800">
                15 multiple-choice questions specifically based on this application's schema, constraints, triggers, and SQL queries.
              </p>
            </div>
            {showQuizResults && (
              <div className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-right shadow-2xs">
                <span className="text-xs text-slate-500 block">Your Score</span>
                <span className="text-lg font-bold text-emerald-700">
                  {calculateScore()} / {QUIZ_QUESTIONS.length}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const selectedOpt = quizAnswers[q.id];
              const isCorrect = selectedOpt === q.correct;

              return (
                <div key={q.id} className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{q.question}</h4>
                  </div>

                  <div className="space-y-2 pl-8">
                    {q.options.map((opt, optIdx) => {
                      let btnStyle = 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200';
                      if (showQuizResults) {
                        if (optIdx === q.correct) {
                          btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                        } else if (selectedOpt === optIdx) {
                          btnStyle = 'bg-rose-100 border-rose-400 text-rose-900 line-through';
                        }
                      } else if (selectedOpt === optIdx) {
                        btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectQuizOption(q.id, optIdx)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {showQuizResults && optIdx === q.correct && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {showQuizResults && selectedOpt === optIdx && optIdx !== q.correct && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {showQuizResults && (
                    <div className="pl-8 pt-2">
                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900">
                        <strong>Explanation: </strong> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setQuizAnswers({});
                setShowQuizResults(false);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Quiz</span>
            </button>
            <button
              onClick={handleCheckQuiz}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Check Answers & View Explanations</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

