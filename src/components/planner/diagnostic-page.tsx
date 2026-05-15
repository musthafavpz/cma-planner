import { useState } from "react";
import { CheckCircle2, XCircle, Trophy, RotateCcw, ChevronRight, FlaskConical } from "lucide-react";
import { DIAGNOSTIC_QUESTIONS, getQuestionsForSection, MCQ, SectionId, SECTIONS_LIST } from "@/lib/diagnostic-questions";
import { DIAGNOSTIC_QUESTIONS_P2, getQuestionsForSectionP2, SectionIdP2, SECTIONS_LIST_P2 } from "@/lib/diagnostic-questions-p2";
import { scoreToMultiplier } from "@/lib/study-plan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SECTIONS } from "@/lib/cma-units";
import { SECTIONS_P2 } from "@/lib/cma-units-p2";

const SECTION_COLORS: Record<string, string> = {
  A: "var(--accent-blue)", B: "#8b5cf6", C: "#f59e0b",
  D: "#10b981", E: "#ef4444", F: "#6366f1",
};
const SECTION_BG: Record<string, string> = {
  A: "var(--accent-blue-bg)", B: "rgba(139,92,246,0.1)", C: "rgba(245,158,11,0.1)",
  D: "rgba(16,185,129,0.1)", E: "rgba(239,68,68,0.1)", F: "rgba(99,102,241,0.1)",
};

type QuizState = "select" | "quiz" | "result";

interface Props {
  user: any;
  part: 1 | 2;
  multipliers: Record<string, number>;
  setMultipliers: (m: Record<string, number>) => void;
  setPage: (p: any) => void;
}

export default function DiagnosticPage({ user, part, multipliers, setMultipliers, setPage }: Props) {
  // Derive active data from part
  const ACTIVE_SECTIONS_LIST = part === 1 ? SECTIONS_LIST : SECTIONS_LIST_P2;
  const ACTIVE_SECTIONS      = part === 1 ? SECTIONS      : SECTIONS_P2;
  const getQuestions         = (s: string) =>
    part === 1
      ? getQuestionsForSection(s as SectionId)
      : getQuestionsForSectionP2(s as SectionIdP2);
  const [quizState, setQuizState] = useState<QuizState>("select");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExp, setShowExp] = useState(false);
  const [saving, setSaving] = useState(false);

  function startQuiz(section: string) {
    const qs = getQuestions(section);
    setActiveSection(section);
    setQuestions(qs);
    setCurrent(0);
    setAnswers({});
    setShowExp(false);
    setQuizState("quiz");
  }

  function pickAnswer(opt: string) {
    if (answers[questions[current].id]) return; // already answered
    setAnswers(prev => ({ ...prev, [questions[current].id]: opt }));
    setShowExp(true);
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setShowExp(false);
    } else {
      setQuizState("result");
    }
  }

  const correctCount = questions.filter(q => answers[q.id] === q.correct).length;
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const multiplier = scoreToMultiplier(scorePct);

  async function saveResult() {
    if (!user || !activeSection) return;
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("diagnostic_results").insert({
        user_id: user.id, part, section: activeSection,
        score_pct: scorePct, questions_total: questions.length,
        questions_correct: correctCount, time_multiplier: multiplier,
      }),
      supabase.from("section_time_adjustments").upsert(
        { user_id: user.id, part, section: activeSection, multiplier },
        { onConflict: "user_id,part,section" }
      ),
    ]);
    setSaving(false);

    // Always update local state so study plan recalculates immediately
    const nextMultipliers = { ...multipliers, [activeSection]: multiplier };
    setMultipliers(nextMultipliers);

    if (e1 || e2) {
      toast.warning("Result saved locally but could not sync to database.");
    } else {
      toast.success(`Section ${activeSection} calibrated! Study time adjusted ×${multiplier}`);
    }
    setQuizState("select");
    setPage("study");
  }

  // ── Section select screen ──
  if (quizState === "select") {
    return (
      <div className="fade-up">
        <div className="dashboard-welcome" style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
          <h2>🧪 Diagnostic Quiz — Part {part}</h2>
          <p>Take 15 MCQs per section. Your score calibrates the study time allocated to that section.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, marginTop: 20 }}>
          {ACTIVE_SECTIONS_LIST.map(s => {
            const mult = multipliers[s];
            const done = !!mult;
            const color = SECTION_COLORS[s];
            const bg = SECTION_BG[s];
            return (
              <button key={s} className="diag-section-card" onClick={() => startQuiz(s)}>
                <div className="diag-section-badge" style={{ background: bg, color }}>
                  {s}
                </div>
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                  <div className="diag-section-title">{ACTIVE_SECTIONS[s].title.replace(`Section ${s} — `, "")}</div>
                  <div className="diag-section-meta">15 MCQs</div>
                  {done && (
                    <div className="diag-section-result" style={{ color: "#10b981" }}>
                      ✅ Done
                    </div>
                  )}
                </div>
                <ChevronRight size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>


      </div>
    );
  }

  // ── Quiz screen ──
  if (quizState === "quiz") {
    const q = questions[current];
    const chosen = answers[q.id];
    const isCorrect = chosen === q.correct;

    return (
      <div className="fade-up">
        <div className="quiz-progress-row">
          <span className="quiz-section-badge" style={{ background: SECTION_BG[activeSection!], color: SECTION_COLORS[activeSection!] }}>
            Section {activeSection}
          </span>
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="quiz-counter">{current + 1}/{questions.length}</span>
        </div>

        <div className="quiz-card">
          <div className="quiz-question">{q.question}</div>
          <div className="quiz-options">
            {(["A","B","C","D"] as const).map(opt => {
              let cls = "quiz-opt";
              if (chosen) {
                if (opt === q.correct) cls += " correct";
                else if (opt === chosen) cls += " wrong";
                else cls += " dimmed";
              }
              return (
                <button key={opt} className={cls} onClick={() => pickAnswer(opt)} disabled={!!chosen}>
                  <span className="quiz-opt-letter">{opt}</span>
                  <span className="quiz-opt-text">{q.options[opt]}</span>
                  {chosen && opt === q.correct && <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
                  {chosen && opt === chosen && opt !== q.correct && <XCircle size={16} style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {showExp && (
            <div className={`quiz-explanation ${isCorrect ? "correct" : "wrong"}`}>
              <strong>{isCorrect ? "✅ Correct!" : `❌ Incorrect — correct answer: ${q.correct}`}</strong>
              <p>{q.explanation}</p>
            </div>
          )}

          {chosen && (
            <button className="ms-btn ms-btn-primary" style={{ marginTop: 16, alignSelf: "flex-end", fontSize: "0.85rem", padding: "8px 20px" }} onClick={next}>
              {current < questions.length - 1 ? "Next →" : "See Results"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Result screen ──
  const scoreColor = scorePct >= 80 ? "#10b981" : scorePct >= 70 ? "var(--accent-blue)" : scorePct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="fade-up">
      <div className="quiz-result-card">
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>{scorePct >= 80 ? "🏆" : scorePct >= 70 ? "👍" : scorePct >= 40 ? "📚" : "💪"}</div>
        <div className="quiz-result-score" style={{ color: scoreColor }}>{scorePct}%</div>
        <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: 16 }}>{correctCount} / {questions.length} correct</div>

        {/* Per-question review */}
        <div className="quiz-review-list">
          {questions.map((q, i) => {
            const ok = answers[q.id] === q.correct;
            return (
              <div key={q.id} className={`quiz-review-row ${ok ? "ok" : "fail"}`}>
                <span className="quiz-review-num">Q{i+1}</span>
                <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question}</span>
                {ok ? <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} /> : <XCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="ms-btn ms-btn-danger" style={{ flex: 1 }} onClick={() => startQuiz(activeSection!)}>
            <RotateCcw size={12} /> Retake
          </button>
          <button className="ms-btn ms-btn-primary" style={{ flex: 2, fontSize: "0.85rem", padding: "8px 0" }} onClick={saveResult} disabled={saving}>
            <Trophy size={13} /> {saving ? "Saving…" : "Save & Apply to Plan"}
          </button>
        </div>
        <button className="ms-btn" style={{ width: "100%", marginTop: 8, fontSize: "0.78rem" }} onClick={() => setQuizState("select")}>
          Back to sections
        </button>
      </div>
    </div>
  );
}
