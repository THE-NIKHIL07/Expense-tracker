import * as SecureStore from 'expo-secure-store';
import { TransactionRepository, BudgetRepository, GoalRepository, SettingsRepository, NotificationRepository, ChatRepository } from '../db/repository';
import { formatDateISO, MONTH_NAMES } from './date';
import { ALL_CATEGORIES } from '../constants/categories';
import { ChatMessage } from '../db/schema';

export interface ChatbotResponse {
  text: string;
  isAi: boolean;
  actionExecuted?: boolean;
}

function resolveCategoryName(catInput: string): string {
  const raw = (catInput || '').trim();
  if (!raw) return 'Other';
  const match = ALL_CATEGORIES.find(
    (c) => c.name.toLowerCase() === raw.toLowerCase() || c.label.toLowerCase() === raw.toLowerCase() || c.id.toLowerCase() === raw.toLowerCase()
  );
  if (match) {
    return match.name;
  }
  return raw.toLowerCase();
}

function cleanNoteDescription(noteInput: string, fallbackCategory: string): string {
  let cleaned = (noteInput || '').trim();
  cleaned = cleaned
    .replace(/\b(?:costing|costed|costs?|paying|paid|spent|spend|spending)\s+(?:me\s+)?(?:around\s+|approx\s+|about\s+)?(?:rs\.?|inr|₹|\$)?\s*\d+(?:\.\d+)?\b/gi, '')
    .replace(/\b(?:which\s+(?:is|was)|that\s+(?:is|was)|for\s+(?:a\s+)?total\s+of)\s+(?:rs\.?|inr|₹|\$)?\s*\d+(?:\.\d+)?\b/gi, '')
    .replace(/\b(?:prompt|base|less|action|execute|transaction)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || fallbackCategory;
}

function executeLoggedAction(text: string): boolean {
  try {
    const actionRegex = new RegExp('ACTION_EXECUTE:(\\{[\\s\\S]*?\\})', 'g');
    const matches = Array.from(text.matchAll(actionRegex));
    if (!matches || matches.length === 0) return false;

    let anyExecuted = false;
    const now = new Date();
    const todayStr = formatDateISO(now);
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    for (const match of matches) {
      if (!match[1]) continue;
      let actionData: any;
      try {
        actionData = JSON.parse(match[1]);
      } catch {
        continue;
      }

      if (actionData.action === 'add_transaction') {
        const amount = Number(actionData.amount) || 0;
        if (amount <= 0) continue;
        const type = actionData.type === 'income' ? 'income' : 'expense';
        const category = resolveCategoryName(actionData.category);
        const note = cleanNoteDescription(actionData.note, category);
        const date = actionData.date || todayStr;
        if (date > todayStr) continue;
        const id = `tx_ai_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        TransactionRepository.addTransaction({
          id,
          amount,
          type,
          category,
          note,
          date,
          payment_method: 'cash',
        });
        anyExecuted = true;
      } else if (actionData.action === 'update_transaction') {
        let targetId = actionData.id;
        if (!targetId && (actionData.search || actionData.category || actionData.note)) {
          const txs = TransactionRepository.getTransactions({ limit: 20 });
          const found = txs.find((t) => {
            if (actionData.category && t.category.toLowerCase().includes(actionData.category.toLowerCase())) return true;
            if (actionData.note && t.note && t.note.toLowerCase().includes(actionData.note.toLowerCase())) return true;
            return false;
          });
          if (found) targetId = found.id;
        }
        if (!targetId) continue;

        const updates: any = {};
        if (actionData.amount !== undefined) updates.amount = Number(actionData.amount);
        if (actionData.category !== undefined) updates.category = resolveCategoryName(actionData.category);
        if (actionData.note !== undefined) updates.note = cleanNoteDescription(actionData.note, updates.category || 'other');
        if (actionData.type !== undefined) updates.type = actionData.type;
        if (actionData.date !== undefined) updates.date = actionData.date;
        if (actionData.payment_method !== undefined) updates.payment_method = actionData.payment_method;

        TransactionRepository.updateTransaction(targetId, updates);
        anyExecuted = true;
      } else if (actionData.action === 'delete_transaction') {
        let targetId = actionData.id;
        if (!targetId && (actionData.category || actionData.note || actionData.amount)) {
          const txs = TransactionRepository.getTransactions({ limit: 20 });
          const found = txs.find((t) => {
            if (actionData.amount && Number(t.amount) === Number(actionData.amount)) return true;
            if (actionData.category && t.category.toLowerCase().includes(actionData.category.toLowerCase())) return true;
            if (actionData.note && t.note && t.note.toLowerCase().includes(actionData.note.toLowerCase())) return true;
            return false;
          });
          if (found) targetId = found.id;
        }
        if (!targetId) continue;

        TransactionRepository.deleteTransaction(targetId);
        anyExecuted = true;
      } else if (actionData.action === 'add_to_goal' || actionData.action === 'deposit_to_goal') {
        const depositAmount = Number(actionData.amount) || 0;
        if (depositAmount <= 0) continue;
        const goals = GoalRepository.getGoals();
        const goalTitle = (actionData.title || actionData.goal || '').toLowerCase();
        const target = goals.find((g) => g.id === actionData.id || (goalTitle && g.title.toLowerCase().includes(goalTitle)));
        if (!target) continue;

        const newSaved = target.saved_amount + depositAmount;
        if (target.target_amount > 0 && newSaved >= target.target_amount) {
          GoalRepository.deleteGoal(target.id);
          NotificationRepository.addNotification(
            'Goal Completed 🎉',
            `Congratulations! You completed your goal "${target.title}"! It has been archived.`,
            'goal'
          );
        } else {
          GoalRepository.updateGoal(target.id, { saved_amount: newSaved });
        }
        anyExecuted = true;
      } else if (actionData.action === 'update_goal' || actionData.action === 'edit_goal') {
        const goals = GoalRepository.getGoals();
        const goalTitle = (actionData.title || actionData.goal || '').toLowerCase();
        const target = goals.find((g) => g.id === actionData.id || (goalTitle && g.title.toLowerCase().includes(goalTitle)));
        if (!target) continue;

        const updates: any = {};
        if (actionData.saved_amount !== undefined) {
          updates.saved_amount = Math.max(0, Number(actionData.saved_amount) || 0);
        } else if (actionData.amount !== undefined && (actionData.field === 'saved' || actionData.field === 'saved_amount')) {
          updates.saved_amount = Math.max(0, Number(actionData.amount) || 0);
        }

        if (actionData.target_amount !== undefined) {
          updates.target_amount = Math.max(1, Number(actionData.target_amount) || 0);
        } else if (actionData.amount !== undefined && (actionData.field === 'target' || actionData.field === 'target_amount')) {
          updates.target_amount = Math.max(1, Number(actionData.amount) || 0);
        }

        if (actionData.title && actionData.new_title) {
          updates.title = String(actionData.new_title).trim();
        }

        if (actionData.due_date && actionData.due_date >= todayStr) {
          updates.due_date = actionData.due_date;
        }

        const finalSaved = updates.saved_amount !== undefined ? updates.saved_amount : target.saved_amount;
        const finalTarget = updates.target_amount !== undefined ? updates.target_amount : target.target_amount;
        updates.status = finalSaved >= finalTarget && finalTarget > 0 ? 'completed' : 'active';

        GoalRepository.updateGoal(target.id, updates);
        anyExecuted = true;
      } else if (actionData.action === 'delete_goal') {
        const goals = GoalRepository.getGoals();
        const goalTitle = (actionData.title || '').toLowerCase();
        const target = goals.find((g) => g.id === actionData.id || (goalTitle && g.title.toLowerCase().includes(goalTitle)));
        if (!target) continue;
        GoalRepository.deleteGoal(target.id);
        anyExecuted = true;
      } else if (actionData.action === 'add_goal' || actionData.action === 'add_due') {
        const title = (actionData.title || 'Goal').trim();
        const target_amount = Number(actionData.target_amount || actionData.amount) || 0;
        if (target_amount <= 0) continue;
        const saved_amount = Number(actionData.saved_amount) || 0;
        const due_date = actionData.due_date || todayStr;
        if (due_date < todayStr) continue;
        const category = actionData.action === 'add_due' ? 'Payment Due' : (actionData.category || 'General');
        const id = `goal_ai_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        GoalRepository.addGoal({
          id,
          title,
          target_amount,
          saved_amount,
          due_date,
          category,
          status: saved_amount >= target_amount ? 'completed' : 'active',
        });

        NotificationRepository.addNotification(
          actionData.action === 'add_due' ? 'Payment Due Created' : 'New Goal Created',
          `"${title}" due on ${due_date}`,
          'goal'
        );
        anyExecuted = true;
      } else if (actionData.action === 'set_budget' || actionData.action === 'update_budget' || actionData.action === 'add_budget') {
        const category = resolveCategoryName(actionData.category);
        const amount = Number(actionData.amount) || 0;
        if (amount > 0) {
          BudgetRepository.setBudget(category, amount, currentMonth, currentYear);
          NotificationRepository.addNotification(
            'Budget Updated',
            `Monthly budget for ${category} set to ₹${amount}`,
            'budget'
          );
          anyExecuted = true;
        }
      } else if (actionData.action === 'delete_budget') {
        const category = resolveCategoryName(actionData.category);
        const bList = BudgetRepository.getBudgets(currentMonth, currentYear);
        const target = bList.find((b) => b.category.toLowerCase() === category.toLowerCase() || b.id === actionData.id);
        if (target) {
          BudgetRepository.deleteBudget(target.id);
          NotificationRepository.addNotification(
            'Budget Deleted',
            `Monthly budget for ${target.category} has been removed`,
            'budget'
          );
          anyExecuted = true;
        }
      }
    }

    return anyExecuted;
  } catch {}
  return false;
}

function sanitizeOutput(str: string): string {
  let cleaned = str
    .replace(new RegExp('<think>[\\s\\S]*?</think>', 'gi'), '')
    .replace(new RegExp('<think>[\\s\\S]*', 'gi'), '')
    .replace(new RegExp('ACTION_EXECUTE:\\s*\\{[\\s\\S]*?\\}', 'g'), '')
    .replace(new RegExp('ACTION_EXECUTE:[^\\n]*', 'g'), '');

  if (cleaned.toLowerCase().includes("here's a thinking process:") || cleaned.toLowerCase().includes("here is a thinking process:")) {
    const splitIndex = cleaned.lastIndexOf('[Output Generation] ->');
    if (splitIndex !== -1) {
      cleaned = cleaned.substring(splitIndex + 22).replace(/^[\s":]+/, '').replace(/["\s]+$/, '');
    } else {
      const draftMatch = cleaned.match(/(?:Draft Response|Final Response|Response)[^:]*:\s*\n*([\s\S]+?)(?=\n\s*(?:5\.|Check|\*|\[|$))/i);
      if (draftMatch && draftMatch[1]) {
        cleaned = draftMatch[1].trim().replace(/^"/, '').replace(/"$/, '');
      } else {
        cleaned = cleaned.replace(/Here'?s a thinking process:[\s\S]*?(?=\n\n[A-Z]|\n\n"|$)/i, '').trim();
      }
    }
  }

  return cleaned.trim();
}

export async function askFinancialChatbot(
  userMessage: string,
  currencySymbol: string,
  onToken?: (token: string, fullText: string) => void,
  historyMessages: ChatMessage[] = []
): Promise<ChatbotResponse> {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return { text: 'How can I assist you with your finances today?', isAi: false };
  }

  const isAiEnabled = SettingsRepository.getSetting('ai_enabled', 'false') === 'true';
  if (!isAiEnabled) {
    return {
      text: 'FinBot Assistant is currently disabled. Please enable it and enter your API key in Settings to use the assistant.',
      isAi: false,
    };
  }

  let grokApiKey: string | null = null;
  try {
    grokApiKey = await SecureStore.getItemAsync('grok_api_key');
  } catch {}

  if (!grokApiKey) {
    grokApiKey = SettingsRepository.getSetting('ai_api_key_backup', '');
  }

  if (!grokApiKey || grokApiKey.trim().length < 5) {
    return {
      text: 'No API key found. Please enter your API key in Settings > FinBot to activate the assistant.',
      isAi: false,
    };
  }

  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthName = MONTH_NAMES[now.getMonth()];
    const todayDateStr = formatDateISO(now);
    const summary = TransactionRepository.getFinancialSummary(currentMonth, currentYear);
    const allTx = TransactionRepository.getTransactions({ limit: 100 });
    const budgets = BudgetRepository.getBudgets(currentMonth, currentYear);
    const goals = GoalRepository.getGoals();

    const financialData = {
      today: todayDateStr,
      currentMonth: currentMonthName,
      currentMonthNumber: currentMonth,
      currentYear: currentYear,
      currentPeriod: `${currentMonthName} ${currentYear}`,
      currency: currencySymbol,
      monthlyOverview: {
        totalIncome: summary.monthIncome,
        totalExpenses: summary.monthExpenses,
        currentBalance: summary.totalBalance,
      },
      budgets: budgets.map((b) => ({
        id: b.id,
        category: b.category,
        budgeted: b.amount,
        spent: b.spent,
        remaining: Math.max(0, b.amount - b.spent),
        percentUsed: Math.round(b.percentage),
      })),
      goalsAndDues: goals.map((g) => ({
        id: g.id,
        title: g.title,
        type: g.category === 'Payment Due' ? 'Payment Due' : 'Savings Goal',
        targetAmount: g.target_amount,
        savedOrPaid: g.saved_amount,
        remaining: Math.max(0, g.target_amount - g.saved_amount),
        dueDate: g.due_date,
        status: g.status,
      })),
      recordedTransactions: allTx.map((t) => ({
        id: t.id,
        date: t.date,
        type: t.type,
        amount: t.amount,
        category: t.category,
        note: t.note || '',
        paymentMethod: t.payment_method || 'cash',
      })),
    };

    const systemPrompt = `You are FinBot, the friendly, intelligent AI financial assistant in the Expense Tracker app.
Personality & Behavior Guidelines:
- Warm, polite, witty, helpful, and natural human-like tone.
- For casual greetings or friendly messages (such as "hi", "how are you?", "hello", "what's up?"), answer warmly like a personal friend, ask how their day is going, and offer help with their budget, savings goals, or expenses.
- For financial questions, analyze their real-time financial data provided below and give clear, concise, accurate insights.
- FORMATTING & STYLING RULES:
  - Highlight and bold important text that must be noticed—such as key amounts, total spending, budget percentages, category names, dates, and actionable advice—using **bold text** (e.g. "**Total Spent: ${currencySymbol}3,200**", "**Food & Dining: 85% used**", "**Key Tip:**").
  - NEVER output complex markdown tables or ASCII art boxes with |, +, -, or underscores.
  - Instead of tables, organize information with clean bullet points starting with • (e.g. "• **Food**: ${currencySymbol}2,000", "• **Shopping**: ${currencySymbol}1,500").
  - Use helpful emojis to make answers friendly, clear, and pleasing to read.
  - Always use the user's currency symbol (${currencySymbol}) for all monetary figures.

ACTION LOGGING & EDITING CAPABILITIES:
When the user asks you to log, edit, delete, or deposit:
1. Immediately log ALL items in one response. DO NOT ask clarifying questions or confirmation when amounts/items are given.
2. CATEGORY INTELLIGENCE:
   - Predefined standard categories in this app:
     * Expense: "Food & Dining", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Home", "Education", "Other"
     * Income: "Salary", "Freelance", "Investment", "Other"
   - You have full autonomy to decide the category yourself!
   - If an item fits one of the predefined categories above, assign that exact category (e.g. "Food & Dining" for coffee, restaurants, groceries; "Transport" for fuel, uber, metro; "Shopping" for clothes, electronics; etc.).
   - If it is something unique that does NOT fit any predefined category, you can assign a custom category in all lowercase (e.g. "gaming", "pets", "charity").
   - NEVER ask the user what category to choose—decide it yourself!
3. NO PAYMENT METHOD: NEVER ask or care about payment method (cash, card, UPI, etc. are not needed).
4. DESCRIPTION / NOTE CLEANLINESS:
   - The "note" field should ONLY be populated if the user explicitly provided a specific purpose/note (e.g. "birthday gift", "march rent").
   - If the user did NOT give a specific note, leave "note" as "" (empty string).
   - NEVER echo phrases from the user's prompt into the note (e.g., NEVER include "costing me 100", "spent 50 on", "for 100", "prompt", "base", "less", or any payment amount text in the note).
   - If left empty, the system automatically uses the category name.
5. MULTI-ITEM LOGGING: When the user asks to add multiple expenses or incomes in one go (e.g. "spent 50 on coffee, 200 on petrol and 1000 for groceries", or "add 500 food and 300 recharge"):
   - Add every single item immediately!
   - Append one ACTION_EXECUTE line for EACH transaction at the bottom, each on its own line!
   - Same for multiple goals or deadlines.

Action formats (append each on a separate line at the end):
- To add transaction:
ACTION_EXECUTE:{"action":"add_transaction","type":"expense"|"income","amount":number,"category":"string","note":"string","date":"YYYY-MM-DD"}
- To edit / update transaction:
ACTION_EXECUTE:{"action":"update_transaction","id":"string","amount":number,"category":"string","note":"string"}
- To delete transaction:
ACTION_EXECUTE:{"action":"delete_transaction","id":"string","category":"string","amount":number}
- To add savings / deposit to a goal:
ACTION_EXECUTE:{"action":"add_to_goal","title":"string","amount":number}
- To edit / correct goal amount or details:
ACTION_EXECUTE:{"action":"update_goal","title":"string","saved_amount":number,"target_amount":number}
- To delete goal:
ACTION_EXECUTE:{"action":"delete_goal","title":"string"}
- To create savings goal:
ACTION_EXECUTE:{"action":"add_goal","title":"string","target_amount":number,"saved_amount":0,"due_date":"YYYY-MM-DD","category":"string"}
- To create payment due:
ACTION_EXECUTE:{"action":"add_due","title":"string","target_amount":number,"saved_amount":0,"due_date":"YYYY-MM-DD"}
- To set, add, or update a category monthly budget:
ACTION_EXECUTE:{"action":"set_budget","category":"string","amount":number}
- To delete a category budget:
ACTION_EXECUTE:{"action":"delete_budget","category":"string"}

STRICT RULES:
- Output ONLY your friendly conversational response confirming the items logged, followed by the ACTION_EXECUTE lines.
- NEVER ask the user what payment mode (UPI/cash/card) was used.
- NEVER ask the user to pick a category—decide the category yourself.
- NEVER ask user to do them one by one. Log all of them at once.
- NEVER log a budget as an expense! When user asks to set, add, or update a budget (e.g. "budget for food 5000", "set 2000 budget for transport"), ALWAYS use "set_budget".
- NEVER include internal thoughts, "Here's a thinking process:", scratchpad, or step-by-step reasoning notes.
- DATE & TIME CONTEXT:
  * Today's exact date is ${todayDateStr}.
  * Current Month: ${currentMonthName} (${currentYear}), Month number: ${currentMonth}.
  * Current Year: ${currentYear}.
  * All monthly budgets, overview figures, and current period statistics belong to ${currentMonthName} ${currentYear}.
  * If the user mentions relative dates like 'yesterday', '2 days ago', or a specific date in the past, compute the exact YYYY-MM-DD from today's date (${todayDateStr}) and set it in the date field.
  * TRANSACTIONS: Transactions can be logged for today or past dates (date <= ${todayDateStr}). NEVER log a transaction for a future date. If the user asks about a future expense, explain that expenses are for money already spent, and offer to add a payment due instead using add_due.
  * GOALS & PAYMENT DUES: Goals and payment dues can ONLY have deadlines (due_date) set for today or future dates (due_date >= ${todayDateStr}). NEVER set a past date for a goal or payment due. If the user asks to add a goal or payment due for a past date, politely decline and explain that deadlines cannot be in the past.
  * If date is not provided, use today's date ${todayDateStr}.

LIVE FINANCIAL DATA:
${JSON.stringify(financialData, null, 2)}`;

    const trimmedKey = grokApiKey.trim();
    const cleanKey = trimmedKey.replace(/^Bearer\s+/i, '').replace(/[\r\n\t]/g, '').trim();

    const STABLE_MODELS = [
      'llama-3.3-70b-versatile',
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'allam-2-7b',
      'groq/compound-mini',
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b',
      'llama-3.1-8b-instant',
    ];

    let preferredModel = SettingsRepository.getSetting('active_assistant_model', 'llama-3.3-70b-versatile');
    if (!preferredModel || preferredModel.includes('preview')) {
      preferredModel = 'llama-3.3-70b-versatile';
      SettingsRepository.setSetting('active_assistant_model', preferredModel);
    }

    let liveModels: string[] = [];
    try {
      const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
        },
      });
      if (modelsRes.ok) {
        const mJson = await modelsRes.json();
        if (Array.isArray(mJson?.data)) {
          liveModels = mJson.data
            .map((m: any) => m.id)
            .filter((id: any) =>
              typeof id === 'string' &&
              !id.includes('whisper') &&
              !id.includes('preview') &&
              !id.includes('guard') &&
              !id.includes('embed')
            );
        }
      }
    } catch {}

    const candidateModels = Array.from(
      new Set([
        preferredModel,
        ...liveModels,
        ...STABLE_MODELS,
      ])
    ).filter((m) => !m.includes('preview'));

    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    let response: Response | null = null;
    let lastError = '';

    const conversationHistory = (historyMessages.length > 0
      ? historyMessages
      : ChatRepository.getRecentMessages(10)
    ).slice(-10);

    const historyPayload = conversationHistory
      .filter((m) => m.text && m.id !== 'welcome')
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

    for (const model of candidateModels) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...historyPayload,
              { role: 'user', content: trimmed },
            ],
            temperature: 0.7,
            max_tokens: 1024,
            stream: false,
          }),
        });

        if (res.ok) {
          response = res;
          SettingsRepository.setSetting('active_assistant_model', model);
          break;
        }

        const rawText = await res.text();
        let errMsg = rawText;
        try {
          const parsed = JSON.parse(rawText);
          errMsg = parsed.error?.message || rawText;
        } catch {}
        lastError = `[Error ${res.status}] ${errMsg}`;
      } catch (err: any) {
        lastError = `Connection error: ${err?.message || 'Network request failed'}`;
      }
    }

    if (!response) {
      return { text: lastError || 'Failed to connect to assistant service. Please check your network and API key.', isAi: false };
    }

    const rawContent = await response.text();
    let replyText = '';
    try {
      const data = JSON.parse(rawContent);
      const choice = data.choices?.[0];
      replyText =
        choice?.message?.content ||
        choice?.message?.reasoning_content ||
        choice?.text ||
        '';
    } catch {}

    if (!replyText) {
      replyText = rawContent;
    }

    const actionExecuted = executeLoggedAction(replyText);
    let cleanFinal = sanitizeOutput(replyText);

    if (!cleanFinal) {
      if (actionExecuted) {
        cleanFinal = 'Done! I have updated your records.';
      } else if (replyText) {
        cleanFinal =
          replyText
            .replace(new RegExp('<think>', 'g'), '')
            .replace(new RegExp('</think>', 'g'), '')
            .replace(new RegExp('ACTION_EXECUTE:[^\\n]*', 'g'), '')
            .trim() || 'I have processed your request.';
      } else {
        cleanFinal = 'I have processed your request.';
      }
    }

    if (onToken && cleanFinal) {
      const words = cleanFinal.split(' ');
      let currentDisplay = '';
      for (let i = 0; i < words.length; i++) {
        const word = (i === 0 ? '' : ' ') + words[i];
        currentDisplay += word;
        onToken(word, currentDisplay);
        if (words.length > 15 && i % 3 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    }

    return { text: cleanFinal, isAi: true, actionExecuted };
  } catch (error: any) {
    return {
      text: `Connection error: ${error?.message || 'Please verify internet connection'}`,
      isAi: false,
    };
  }
}
