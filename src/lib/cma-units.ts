export type Unit = { key: string; section: string; index: number; title: string; minutes: number };

const u = (section: string, index: number, title: string, minutes: number): Unit => ({
  key: `${section}-${index}`, section, index, title, minutes,
});

export const SECTIONS: Record<string, { id: string; title: string }> = {
  A: { id: "A", title: "Section A — External Financial Reporting Decisions" },
  B: { id: "B", title: "Section B — Planning, Budgeting, and Forecasting" },
  C: { id: "C", title: "Section C — Performance Management" },
  D: { id: "D", title: "Section D — Cost Management" },
  E: { id: "E", title: "Section E — Internal Controls" },
  F: { id: "F", title: "Section F — Technology and Analytics" },
};

export const UNITS: Unit[] = [
  // Section A
  u("A",1,"A.1. The Financial Statements, The Balance Sheet",90),
  u("A",2,"A.1. Comprehensive Income and the Income Statement",75),
  u("A",3,"A.1. The Statement of Comprehensive Income",75),
  u("A",4,"A.1. The Statement of Owners' Equity and Notes to FS",30),
  u("A",5,"A.1. Statement of Cash Flows Introduction",135),
  u("A",6,"A.1. Operating Activities, the Indirect Method",120),
  u("A",7,"A.1. Investing and Financing Activities, SCF Disclosures",45),
  u("A",8,"A.1. Integrated Reporting",135),
  u("A",9,"A.2. Accounts Receivable",120),
  u("A",10,"A.2. Inventory and Inventory Tracking Methods",180),
  u("A",11,"A.2. Inventory Count, Errors, and Valuation",120),
  u("A",12,"A.2. Investments Overview, Debt Securities",75),
  u("A",13,"A.2. Equity Investments",75),
  u("A",14,"A.2. Business Combinations and Consolidations",45),
  u("A",15,"A.2. Recording Fixed Assets",30),
  u("A",16,"A.2. Depreciation of Fixed Assets and Impairment",165),
  u("A",17,"A.2. Intangible Assets",90),
  u("A",18,"A.2. Reclassification of Short-Term Liabilities",15),
  u("A",19,"A.2. Warranties",60),
  u("A",20,"A.2. Accounting for Income Taxes",135),
  u("A",21,"A.2. Leases",45),
  u("A",22,"A.2. Owners' Equity and Retained Earnings",15),
  u("A",23,"A.2. Common Stock",120),
  u("A",24,"A.2. Preferred Stock",30),
  u("A",25,"A.2. Treasury Stock and Classification of Shares",15),
  u("A",26,"A.2. Revenue Recognition",75),
  u("A",27,"A.2. Right of Return and Consigned Goods",30),
  u("A",28,"A.2. Long-Term Contracts",150),
  u("A",29,"A.2. US GAAP / IFRS Differences",15),
  u("A",30,"A.2. Income Measurement",15),
  u("A",31,"Section A Review",300),
  // Section B
  u("B",1,"B.1. Strategic Planning: Overview, Mission, and Goals",120),
  u("B",2,"B.1. Analyzing External and Internal Environments",120),
  u("B",3,"B.1. Formulating and Implementing Strategies",90),
  u("B",4,"B.1. Other Planning Tools",60),
  u("B",5,"B.2. Budgeting Concepts",210),
  u("B",6,"B.2. Establishing Standards",75),
  u("B",7,"B.3. Forecasting Techniques, Regression Analysis",60),
  u("B",8,"B.3. Learning Curves",165),
  u("B",9,"B.3. Probability",120),
  u("B",10,"B.4. Budget Methodologies",195),
  u("B",11,"B.5. Annual Profit Plan and Supporting Schedules",45),
  u("B",12,"B.5. Preparing the Budget",225),
  u("B",13,"B.5. Estimating Fixed and Variable Costs",90),
  u("B",14,"B.5. Ongoing Budgetary Reporting",30),
  u("B",15,"B.5. Answering Budgeting Calculation Questions",210),
  u("B",16,"B.6. Top-Level Planning and Analysis",75),
  u("B",17,"Section B Review",240),
  // Section C
  u("C",1,"C.1. Introduction to Cost and Variance Measures",135),
  u("C",2,"C.1. Direct Material Variances",180),
  u("C",3,"C.1. Direct Labor Variances",120),
  u("C",4,"C.1. Multiple Input or Multiple Class Variances",150),
  u("C",5,"C.1. Overhead Variances",210),
  u("C",6,"C.1. Sales Variances",150),
  u("C",7,"C.1. Market Variances",15),
  u("C",8,"C.2. Responsibility Centers",150),
  u("C",9,"C.2. Contribution Income Statement for Evaluation",120),
  u("C",10,"C.2. Transfer Pricing",165),
  u("C",11,"C.3. Performance Measures, ROI, and RI",195),
  u("C",12,"C.3. Multiple Performance Measures",135),
  u("C",13,"Section C Review",240),
  // Section D
  u("D",1,"D.1. Measurement Concepts, Classification of Costs",210),
  u("D",2,"D.1. Costing Methods",90),
  u("D",3,"D.1. Cost of Goods Sold and Manufactured",45),
  u("D",4,"D.1. Joint Product Costing",135),
  u("D",5,"D.1. Byproduct Costing",60),
  u("D",6,"D.2. Costing Systems, Process Costing",30),
  u("D",7,"D.2. Job-Order and Life-Cycle Costing",75),
  u("D",8,"D.3. Overhead Costs and Allocation",210),
  u("D",9,"D.3. Accounting for Overhead",60),
  u("D",10,"D.3. Activity-Based Costing",180),
  u("D",11,"D.3. Variable and Absorption Costing",300),
  u("D",12,"D.3. Shared Service Cost Allocation: Single",75),
  u("D",13,"D.3. Shared Service Cost Allocation: Multiple",135),
  u("D",14,"D.4. Supply Chain and Lean Resource Management",75),
  u("D",15,"D.4. Just-In-Time Systems and MRP, MRPII, ERP",75),
  u("D",16,"D.4. Capacity Level and Management Decisions",60),
  u("D",17,"D.5. Business Process Improvement, the Value Chain",60),
  u("D",18,"D.5. Process Analysis",60),
  u("D",19,"D.5. Quality",135),
  u("D",20,"Section D Review",360),
  // Section E
  u("E",1,"E.1. Governance Principles",60),
  u("E",2,"E.1. Hierarchy of Corporate Governance",75),
  u("E",3,"E.1. Introduction to Internal Controls",180),
  u("E",4,"E.1. Transaction Controls",105),
  u("E",5,"E.1. Safeguarding Controls",150),
  u("E",6,"E.1. FCPA and Sarbanes-Oxley",150),
  u("E",7,"E.1. External Audit Opinions",60),
  u("E",8,"E.2. System Controls",300),
  u("E",9,"E.2. Internet Security",135),
  u("E",10,"E.2. Business Continuity Planning",75),
  u("E",11,"Section E Review",240),
  // Section F
  u("F",1,"F.1. Information Systems",90),
  u("F",2,"F.1. Transaction Cycles",165),
  u("F",3,"F.1. Databases",90),
  u("F",4,"F.1. Enterprise Resource Management",60),
  u("F",5,"F.1. Data Warehouse, Data Mart, Data Lake, and EPM",75),
  u("F",7,"F.2. Data Life Cycle and Records Management",75),
  u("F",8,"F.2. Cyberattacks",45),
  u("F",9,"F.2. Defenses Against Cyberattacks",90),
  u("F",10,"F.3. Technology-Enabled Finance Transformation",75),
  u("F",11,"F.3. Artificial Intelligence",60),
  u("F",12,"F.3. Cloud Computing",60),
  u("F",13,"F.3. Blockchain and Smart Contracts",105),
  u("F",14,"F.4. Data Analytics",105),
  u("F",15,"F.4. Data Mining",120),
  u("F",16,"F.4. Types of Data Analytics",195),
  u("F",17,"F.4. Analytic Tools-Sensitivity and Simulation Analysis",45),
  u("F",18,"F.4. Visualization or Visual Discovery",120),
  u("F",19,"Section F Review",240),
];

export function unitsInOrder(sectionOrder: string[]): Unit[] {
  const bySection: Record<string, Unit[]> = {};
  for (const u of UNITS) (bySection[u.section] ||= []).push(u);
  for (const s in bySection) bySection[s].sort((a, b) => a.index - b.index);
  return sectionOrder.flatMap((s) => bySection[s] || []);
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
