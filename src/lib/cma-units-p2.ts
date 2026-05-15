export type Unit = { key: string; section: string; index: number; title: string; minutes: number };

const u = (section: string, index: number, title: string, minutes: number): Unit => ({
  key: `P2-${section}-${index}`, section, index, title, minutes,
});

export const SECTIONS_P2: Record<string, { id: string; title: string }> = {
  A: { id: "A", title: "Section A — Financial Statement Analysis" },
  B: { id: "B", title: "Section B — Corporate Finance" },
  C: { id: "C", title: "Section C — Business Decision Analysis" },
  D: { id: "D", title: "Section D — Enterprise Risk Management" },
  E: { id: "E", title: "Section E — Capital Investment Decisions" },
  F: { id: "F", title: "Section F — Professional Ethics" },
};

export const UNITS_P2: Unit[] = [
  // Section A — Financial Statement Analysis
  u("A",  1, "A.1. Comparative Financial Statement Analysis",         105),
  u("A",  2, "A.2. Introduction to Financial Ratio Analysis",          30),
  u("A",  3, "A.2. Liquidity Ratios",                                  60),
  u("A",  4, "A.2. Leverage and Coverage Ratios",                     240),
  u("A",  5, "A.2. Activity Ratios",                                  165),
  u("A",  6, "A.2. Profitability Ratios I: Profitability Per Share",  120),
  u("A",  7, "A.2. Profitability Ratios II: Basic EPS",               135),
  u("A",  8, "A.2. Profitability Ratios III: Diluted EPS",            120),
  u("A",  9, "A.2. Profitability Ratios IV: Company Profitability",   135),
  u("A", 10, "A.3. Profitability Analysis",                           135),
  u("A", 11, "A.4. Foreign Currency in Financial Statement Analysis",  30),
  u("A", 12, "A.4. Accounting for Foreign Operations",                 60),
  u("A", 13, "A.4. Inflation and Financial Ratios",                    15),
  u("A", 14, "A.4. Impact of Accounting Changes on Financial Ratios",  75),
  u("A", 15, "A.4. Book/Market Value and Accounting/Economic Profit",  60),
  u("A", 16, "A.4. Earnings Quality",                                  60),
  u("A", 17, "Section A Review",                                      180),

  // Section B — Corporate Finance
  u("B",  1, "B.1. Financial Risk and Return, Types of Financial Risk",  75),
  u("B",  2, "B.1. Capital Asset Pricing Model (CAPM)",                165),
  u("B",  3, "B.1. Portfolio Risk and Return",                          45),
  u("B",  4, "B.2. Introduction to Long-Term Financial Management",     30),
  u("B",  5, "B.2. Introduction to Cost of Capital",                    15),
  u("B",  6, "B.2. Debt Financing (Bonds)",                            135),
  u("B",  7, "B.2. Cost of Capital: Cost of Debt",                      30),
  u("B",  8, "B.2. Term Structure of Interest Rates",                   30),
  u("B",  9, "B.2. Bond Duration",                                      30),
  u("B", 10, "B.2. Equity Financing",                                   75),
  u("B", 11, "B.3. Dividend Policy and Treasury Stock",                105),
  u("B", 12, "B.2. Stock Rights, Warrants, and ADRs",                   60),
  u("B", 13, "B.2. Calculation of the Value of a Share",               105),
  u("B", 14, "B.2. Cost of Capital: Cost of Preferred Stock",           30),
  u("B", 15, "B.2. Cost of Capital: Cost of Common Equity",            105),
  u("B", 16, "B.2. Cost of Capital: Capital Structure and WACC",       135),
  u("B", 17, "B.2. Introduction to Derivatives",                        15),
  u("B", 18, "B.2. Forward and Futures Contracts",                      60),
  u("B", 19, "B.2. Interest Rate and Foreign Currency Swaps",           30),
  u("B", 20, "B.2. Options",                                            90),
  u("B", 21, "B.2. Hedging Strategies with Puts and Calls",             60),
  u("B", 22, "B.3. Raising Capital in Privately-Held Companies",        45),
  u("B", 23, "B.3. Raising Capital in Publicly-Held Companies",         90),
  u("B", 24, "B.3. Financial Markets",                                  45),
  u("B", 25, "B.4. Working Capital Introduction",                      120),
  u("B", 26, "B.4. Cash Management",                                   135),
  u("B", 27, "B.4. Marketable Securities Management",                  120),
  u("B", 28, "B.4. Accounts Receivable Management",                    120),
  u("B", 29, "B.4. Inventory Management",                              135),
  u("B", 30, "B.4. Trade Credit Financing",                             15),
  u("B", 31, "B.4. Bank Loans",                                        135),
  u("B", 32, "B.4. Factoring Receivables and Short-Term Financing",     75),
  u("B", 33, "B.5. Corporate Restructuring, Business Combinations",     45),
  u("B", 34, "B.5. Takeover Defenses",                                  15),
  u("B", 35, "B.5. Divestitures",                                       75),
  u("B", 36, "B.5. Discounted Cash Flow Valuation",                     45),
  u("B", 37, "B.6. International Finance, Foreign Direct Investment",   30),
  u("B", 38, "B.6. Foreign Currency Exchange Rates",                   225),
  u("B", 39, "B.6. Foreign Financing and International Payments",       75),
  u("B", 40, "Section B Review",                                       300),

  // Section C — Business Decision Analysis
  u("C",  1, "C.1. Cost-Volume-Profit (CVP) Analysis",                180),
  u("C",  2, "C.1. Profit Point Analysis",                            120),
  u("C",  3, "C.1. Multiple Product CVP Analysis",                     90),
  u("C",  4, "C.1. Risk and Uncertainty in CVP Analysis",              60),
  u("C",  5, "C.1. Other Decisions in CVP Analysis",                  225),
  u("C",  6, "C.2. Marginal Analysis and Relevant Information",       165),
  u("C",  7, "C.2. Costs Used in Decision Making",                     45),
  u("C",  8, "C.2. Make or Buy Decisions",                            120),
  u("C",  9, "C.2. Special Order Decisions",                          120),
  u("C", 10, "C.2. Sell or Process Further Decisions",                 60),
  u("C", 11, "C.2. Disinvestment Decisions",                           90),
  u("C", 12, "C.2. Introducing a New Product or Changing Output Levels", 60),
  u("C", 13, "C.3. Demand, Supply, and Pricing",                      105),
  u("C", 14, "C.3. Pricing by Market Structure",                      105),
  u("C", 15, "C.3. Pricing Strategy",                                 180),
  u("C", 16, "C.3. New Product and Product Mix Pricing",               30),
  u("C", 17, "C.3. Short-Term and Long-Term Pricing",                  30),
  u("C", 18, "C.3. Product Life Cycle Pricing",                        60),
  u("C", 19, "C.3. Other Pricing Considerations",                      30),
  u("C", 20, "Section C Review",                                      240),

  // Section D — Enterprise Risk Management
  u("D",  1, "D.1. Enterprise Risk Management, Types of Risk",        105),
  u("D",  2, "D.1. Risk Management Process",                          225),
  u("D",  3, "D.1. Enterprise Risk Management (ERM)",                 135),
  u("D",  4, "D.1. Capital Adequacy",                                  30),
  u("D",  5, "Section D Review",                                      150),

  // Section E — Capital Investment Decisions
  u("E",  1, "E.1. Capital Investment Analysis and Relevant Cash Flows", 195),
  u("E",  2, "E.2. Payback and Discounted Payback Methods",           135),
  u("E",  3, "E.2. Net Present Value Method",                         285),
  u("E",  4, "E.2. Internal Rate of Return",                          150),
  u("E",  5, "E.2. Capital Investment Analysis Methods: Other Topics", 225),
  u("E",  6, "E.2. Risk in Capital Investment Analysis, Capital Constraints", 165),
  u("E",  7, "E.2. Real Options in Capital Investment Analysis",      105),
  u("E",  8, "Section E Review",                                      300),

  // Section F — Professional Ethics
  u("F",  1, "F.1. Business Ethics",                                   45),
  u("F",  2, "F.1. Business Fraud",                                    45),
  u("F",  3, "F.1. Values for Ethical Decision-Making",                60),
  u("F",  4, "F.2. The IMA Code of Ethics and the Fraud Triangle",    180),
  u("F",  5, "F.3. Ethical Considerations for the Organization",      120),
  u("F",  6, "F.3. Creating a Values-Based Ethics Culture",            90),
  u("F",  7, "F.3. Governmental Influences on Corporate Behavior",     90),
  u("F",  8, "F.3. Sustainability and Social Responsibility",          45),
  u("F",  9, "F.3. Data Ethics",                                       60),
  u("F", 10, "Section F Review",                                      240),
];

export function unitsInOrderP2(sectionOrder: string[]): Unit[] {
  const bySection: Record<string, Unit[]> = {};
  for (const u of UNITS_P2) (bySection[u.section] ||= []).push(u);
  for (const s in bySection) bySection[s].sort((a, b) => a.index - b.index);
  return sectionOrder.flatMap((s) => bySection[s] || []);
}
