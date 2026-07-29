"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type Student = { id: number; name: string; team: string; role: string; salary: number; avatar: string; points: number; color: string };
type Product = { id: number; name: string; price: number; stock: number; emoji: string };
type Transaction = { id: number; studentId: number; student: string; date: string; type: "salary" | "bonus" | "spend"; item: string; amount: number; balance: number; month?: string; productId?: number };
type Settings = { className: string; teacherName: string; reward: string; goalPoints: number; reasons: string[]; sheetWebhookUrl: string };
type Panel = "students" | "settings" | "payroll" | "bonus" | "store" | "products" | "history" | "stats" | "detail" | null;

const colors = ["#f6c453", "#e98d9a", "#78a7d9", "#a3c98b", "#b89bdd", "#f0a66f", "#78b7aa"];
const initialStudents: Student[] = [
  { id: 1, name: "김민준", team: "햇살 모둠", role: "칠판 담당", salary: 30, avatar: "민", points: 42, color: "#f6c453" },
  { id: 2, name: "이서연", team: "햇살 모둠", role: "환경 담당", salary: 30, avatar: "서", points: 38, color: "#e98d9a" },
  { id: 3, name: "박지호", team: "별빛 모둠", role: "급식 담당", salary: 30, avatar: "지", points: 35, color: "#78a7d9" },
  { id: 4, name: "최하은", team: "별빛 모둠", role: "도서 담당", salary: 30, avatar: "하", points: 31, color: "#a3c98b" },
  { id: 5, name: "정도윤", team: "구름 모둠", role: "학습지 담당", salary: 30, avatar: "도", points: 26, color: "#b89bdd" },
  { id: 6, name: "윤채원", team: "구름 모둠", role: "알림장 담당", salary: 30, avatar: "채", points: 24, color: "#f0a66f" },
];
const initialProducts: Product[] = [{ id: 1, name: "연필", price: 8, stock: 12, emoji: "✎" }, { id: 2, name: "과자", price: 15, stock: 7, emoji: "🍪" }, { id: 3, name: "스티커", price: 5, stock: 20, emoji: "★" }, { id: 4, name: "지우개", price: 6, stock: 10, emoji: "◻" }];
const initialTransactions: Transaction[] = [{ id: 1, studentId: 1, student: "김민준", date: "2026-07-28", type: "salary", item: "칠판 담당 7월 월급", amount: 30, balance: 42, month: "2026-07" }, { id: 2, studentId: 2, student: "이서연", date: "2026-07-28", type: "bonus", item: "친구를 도왔어요", amount: 3, balance: 38 }, { id: 3, studentId: 3, student: "박지호", date: "2026-07-28", type: "spend", item: "연필 1개 구매", amount: -8, balance: 35 }];
const initialSettings: Settings = { className: "햇살초등학교 · 3학년 2반", teacherName: "담임 선생님", reward: "운동장 놀이 시간 20분", goalPoints: 100, reasons: ["친구를 도왔어요", "수업에 집중했어요", "정리정돈을 잘했어요", "용기 있게 발표했어요", "스스로 약속을 지켰어요"], sheetWebhookUrl: "" };

export default function Home() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [settings, setSettings] = useState(initialSettings);
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedId, setSelectedId] = useState(1);
  const [month, setMonth] = useState("2026-07");
  const [bonusForm, setBonusForm] = useState({ studentId: 1, amount: 5, reason: "친구를 도왔어요" });
  const [storeForm, setStoreForm] = useState({ studentId: 1, productId: 1, quantity: 1 });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: "", team: "햇살 모둠", role: "", salary: 30 });
  const [settingsForm, setSettingsForm] = useState(settings);
  const [notice, setNotice] = useState("");
  const [sheetStatus, setSheetStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: 5, stock: 10, emoji: "★" });
  const [statsMonth, setStatsMonth] = useState("2026-07");
  const remoteLoaded = useRef(false);
  const stateSnapshot = { students, products, transactions, settings };

  useEffect(() => {
    const saved = window.localStorage.getItem("praise-bank-data") ?? window.localStorage.getItem("praise-class-data");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.students) setStudents(data.students.map((s: Partial<Student>, i: number) => ({ ...initialStudents[i % initialStudents.length], ...s, role: s.role ?? "역할 미정", salary: Number(s.salary ?? 30) })));
      if (data.products) setProducts(data.products);
      if (data.transactions) setTransactions(data.transactions);
      if (data.settings) { setSettings({ ...initialSettings, ...data.settings }); setSettingsForm({ ...initialSettings, ...data.settings }); }
    } catch { /* 기본값을 사용합니다. */ }
    async function loadRemoteState() {
      if (!supabase) { remoteLoaded.current = true; return; }
      const { data, error } = await supabase.from("classroom_state").select("payload").eq("class_id", "main").maybeSingle();
      if (!error && data?.payload) {
        const remote = data.payload as Partial<typeof stateSnapshot>;
        if (remote.students) setStudents(remote.students as Student[]);
        if (remote.products) setProducts(remote.products as Product[]);
        if (remote.transactions) setTransactions(remote.transactions as Transaction[]);
        if (remote.settings) { const nextSettings = { ...initialSettings, ...remote.settings }; setSettings(nextSettings); setSettingsForm(nextSettings); }
      } else if (!error) {
        const seed = saved ? JSON.parse(saved) : stateSnapshot;
        const { error: seedError } = await supabase.from("classroom_state").upsert({ class_id: "main", payload: seed, updated_at: new Date().toISOString() });
        if (seedError) { console.error("Supabase 초기 저장 실패", seedError); showNotice("Supabase 저장에 실패했어요. 환경변수를 확인해주세요."); }
      } else {
        console.error("Supabase 불러오기 실패", error);
        showNotice("Supabase 연결에 실패했어요.");
      }
      remoteLoaded.current = true;
    }
    void loadRemoteState();
  }, []);
  useEffect(() => {
    window.localStorage.setItem("praise-bank-data", JSON.stringify(stateSnapshot));
    if (!supabase || !remoteLoaded.current) return;
    void supabase.from("classroom_state").upsert({ class_id: "main", payload: stateSnapshot, updated_at: new Date().toISOString() }).then(({ error }) => {
      if (error) { console.error("Supabase 저장 실패", error); showNotice("Supabase 저장에 실패했어요."); }
    });
  }, [students, products, transactions, settings]);

  const selected = students.find((student) => student.id === selectedId) ?? students[0];
  const classTotal = students.reduce((sum, student) => sum + student.points, 0);
  const recent = transactions.slice(0, 5);
  const progress = Math.min(100, Math.round((classTotal / settings.goalPoints) * 100));
  const monthLabel = `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;
  const selectedProduct = products.find((product) => product.id === storeForm.productId) ?? products[0];
  const storeStudent = students.find((student) => student.id === storeForm.studentId) ?? students[0];
  const storeTotal = selectedProduct ? selectedProduct.price * storeForm.quantity : 0;
  const detailStudent = students.find((student) => student.id === selectedId) ?? students[0];
  const detailTransactions = transactions.filter((transaction) => transaction.studentId === detailStudent?.id);
  const statsTransactions = transactions.filter((transaction) => transaction.date.slice(0, 7) === statsMonth);
  const statsIncome = statsTransactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0);
  const statsSpend = Math.abs(statsTransactions.filter((transaction) => transaction.amount < 0).reduce((sum, transaction) => sum + transaction.amount, 0));
  const lowBalanceStudents = students.filter((student) => student.points <= 5);
  const duplicatePayrollCount = transactions.filter((transaction) => transaction.type === "salary" && transaction.month === month).length > students.length;

  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2800); }
  async function syncToSheet(rows: Transaction[]) {
    if (!settings.sheetWebhookUrl.trim()) { setSheetStatus("idle"); return; }
    setSheetStatus("sending");
    try {
      await Promise.all(rows.map((row) => fetch(settings.sheetWebhookUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(row) })));
      setSheetStatus("success");
    } catch { setSheetStatus("error"); }
  }
  function recordRows(rows: Transaction[]) { setTransactions((current) => [...rows, ...current]); syncToSheet(rows); }
  function openStudentForm(student?: Student) { setEditingStudent(student ?? null); setStudentFormOpen(true); setStudentForm(student ? { name: student.name, team: student.team, role: student.role, salary: student.salary } : { name: "", team: "햇살 모둠", role: "", salary: 30 }); }
  function saveStudent() {
    const name = studentForm.name.trim(); if (!name) return;
    if (editingStudent) setStudents((current) => current.map((s) => s.id === editingStudent.id ? { ...s, ...studentForm, name, avatar: name.slice(0, 1), salary: Math.max(0, Number(studentForm.salary)) } : s));
    else { const newStudent = { id: Date.now(), ...studentForm, name, avatar: name.slice(0, 1), salary: Math.max(0, Number(studentForm.salary)), points: 0, color: colors[students.length % colors.length] }; setStudents((current) => [...current, newStudent]); setSelectedId(newStudent.id); }
    setEditingStudent(null); setStudentFormOpen(false); setStudentForm({ name: "", team: "햇살 모둠", role: "", salary: 30 }); showNotice(editingStudent ? "학생 정보를 수정했어요." : "새 학생을 추가했어요.");
  }
  function deleteStudent(student: Student) { if (!window.confirm(`${student.name} 학생을 삭제할까요?`)) return; setStudents((current) => current.filter((s) => s.id !== student.id)); showNotice("학생을 삭제했어요."); }
  function paySalaries() {
    const alreadyPaid = new Set(transactions.filter((t) => t.type === "salary" && t.month === month).map((t) => t.studentId));
    const pending = students.filter((student) => !alreadyPaid.has(student.id));
    if (!pending.length) { showNotice(`${monthLabel} 월급은 이미 모두 지급했어요.`); return; }
    const balances = new Map(students.map((student) => [student.id, student.points]));
    const rows = pending.map((student) => { const balance = (balances.get(student.id) ?? 0) + student.salary; balances.set(student.id, balance); return { id: Date.now() + student.id, studentId: student.id, student: student.name, date: new Date().toISOString().slice(0, 10), type: "salary" as const, item: `${student.role} ${monthLabel} 월급`, amount: student.salary, balance, month }; });
    setStudents((current) => current.map((student) => ({ ...student, points: student.points + (alreadyPaid.has(student.id) ? 0 : student.salary) }))); recordRows(rows); setPanel(null); showNotice(`${pending.length}명에게 ${monthLabel} 월급을 지급했어요.`);
  }
  function giveBonus() {
    const student = students.find((s) => s.id === Number(bonusForm.studentId)); if (!student || bonusForm.amount <= 0) return;
    const balance = student.points + Number(bonusForm.amount); const row: Transaction = { id: Date.now(), studentId: student.id, student: student.name, date: new Date().toISOString().slice(0, 10), type: "bonus", item: bonusForm.reason, amount: Number(bonusForm.amount), balance };
    setStudents((current) => current.map((s) => s.id === student.id ? { ...s, points: balance } : s)); recordRows([row]); setPanel(null); showNotice(`${student.name}에게 보너스 ${bonusForm.amount}개를 지급했어요.`);
  }
  function buyProduct() {
    if (!storeStudent || !selectedProduct) return;
    if (storeTotal > storeStudent.points) { showNotice("잔액이 부족해 구매할 수 없어요."); return; }
    if (storeForm.quantity > selectedProduct.stock) { showNotice("재고가 부족해 구매할 수 없어요."); return; }
    const balance = storeStudent.points - storeTotal; const row: Transaction = { id: Date.now(), studentId: storeStudent.id, student: storeStudent.name, date: new Date().toISOString().slice(0, 10), type: "spend", item: `${selectedProduct.name} ${storeForm.quantity}개 구매`, amount: -storeTotal, balance, productId: selectedProduct.id };
    setStudents((current) => current.map((s) => s.id === storeStudent.id ? { ...s, points: balance } : s)); setProducts((current) => current.map((p) => p.id === selectedProduct.id ? { ...p, stock: p.stock - storeForm.quantity } : p)); recordRows([row]); setPanel(null); showNotice(`${storeStudent.name}의 구매가 완료되었어요.`);
  }
  function saveSettings() { const next = { ...settingsForm, goalPoints: Math.max(1, Number(settingsForm.goalPoints) || 100), reasons: settingsForm.reasons.map((r) => r.trim()).filter(Boolean) }; setSettings(next); setSettingsForm(next); setPanel(null); showNotice("설정을 저장했어요."); }
  function openProductForm(product?: Product) { setEditingProduct(product ?? null); setProductForm(product ? { name: product.name, price: product.price, stock: product.stock, emoji: product.emoji } : { name: "", price: 5, stock: 10, emoji: "★" }); }
  function saveProduct() {
    const name = productForm.name.trim(); if (!name) return;
    if (editingProduct) setProducts((current) => current.map((product) => product.id === editingProduct.id ? { ...product, ...productForm, name, price: Math.max(0, Number(productForm.price)), stock: Math.max(0, Number(productForm.stock)) } : product));
    else setProducts((current) => [...current, { id: Date.now(), ...productForm, name, price: Math.max(0, Number(productForm.price)), stock: Math.max(0, Number(productForm.stock)) }]);
    setEditingProduct(null); setProductForm({ name: "", price: 5, stock: 10, emoji: "★" }); showNotice(editingProduct ? "상품 정보를 수정했어요." : "상품을 추가했어요.");
  }
  function deleteProduct(product: Product) { if (!window.confirm(`${product.name} 상품을 삭제할까요?`)) return; setProducts((current) => current.filter((item) => item.id !== product.id)); showNotice("상품을 삭제했어요."); }
  function refillProduct(product: Product) { const amount = Number(window.prompt(`${product.name} 재고를 몇 개 충전할까요?`, "10")); if (!amount || amount < 1) return; setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: item.stock + amount } : item)); showNotice(`${product.name} 재고를 ${amount}개 충전했어요.`); }
  function exportCSV() {
    const header = ["사용일자", "학생", "거래유형", "사용항목", "증감 막대", "남은 잔액"];
    const rows = transactions.map((t) => [t.date, t.student, t.type === "salary" ? "월급" : t.type === "bonus" ? "보너스" : "사용", t.item, t.amount, t.balance]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `칭찬막대_거래내역_${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url); showNotice("CSV 파일을 다운로드했어요.");
  }
  function resetSemester() {
    if (!window.confirm("학기 데이터를 초기화할까요? 학생·역할 정보는 유지되고 잔액·거래내역·재고만 초기화됩니다.")) return;
    setStudents((current) => current.map((student) => ({ ...student, points: 0 })));
    setTransactions([]); setProducts(initialProducts); setPanel(null); showNotice("새 학기 데이터로 초기화했어요.");
  }

  return <main className="app-shell">
    <nav className="topbar"><div className="brand"><span className="brand-mark">✦</span><span>칭찬막대 뱅크</span></div><div className="class-name">{settings.className}</div><div className="top-actions"><button className="nav-link active">오늘의 교실</button><button className="nav-link" onClick={() => setPanel("students")}>학생 관리</button><button className="nav-link" onClick={() => setPanel("settings")}>설정</button><div className="teacher"><span className="teacher-dot">담</span> {settings.teacherName}</div></div></nav>
    <section className="hero"><div><p className="eyebrow">CLASS REWARD BANK · {monthLabel}</p><h1>우리 반의 좋은 마음을<br /><em>차곡차곡 모아보세요.</em></h1><p className="hero-copy">역할 월급부터 보너스, 문방구 사용까지 한눈에 관리해요.</p></div><div className="hero-art"><div className="sun">☀</div><div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="flower flower-one">✿</div><div className="flower flower-two">✿</div></div></section>
    <div className="bank-summary"><div className="summary-card"><span className="summary-icon">◉</span><div><small>전체 학생 잔액</small><strong>{classTotal} <em>막대</em></strong></div></div><div className="summary-card"><span className="summary-icon salary-icon">＋</span><div><small>이번 달 월급 지급</small><strong>{transactions.filter((t) => t.type === "salary" && t.month === month).length} <em>/ {students.length}명</em></strong></div></div><div className="summary-card"><span className="summary-icon store-icon">⌁</span><div><small>이번 달 사용 금액</small><strong>{Math.abs(transactions.filter((t) => t.type === "spend").reduce((sum, t) => sum + t.amount, 0))} <em>막대</em></strong></div></div><div className="summary-progress"><div><small>우리 반 보상까지</small><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div></div>
    {(lowBalanceStudents.length > 0 || duplicatePayrollCount || sheetStatus === "error") && <div className="alert-strip">{lowBalanceStudents.length > 0 && <span className="alert-item warning">⚠ 잔액 부족: {lowBalanceStudents.map((student) => student.name).join(", ")}</span>}{duplicatePayrollCount && <span className="alert-item danger-alert">⚠ 이번 달 월급 중복 지급을 확인하세요.</span>}{sheetStatus === "error" && <span className="alert-item danger-alert">⚠ Google Sheets 전송에 실패했어요.</span>}</div>}
    <div className="content-grid"><section className="give-card card"><div className="card-heading"><div><p className="eyebrow">CLASS OPERATIONS</p><h2>이번 달 학급 운영</h2></div><span className="count-chip">{monthLabel}</span></div><div className="operation-grid"><button className="operation-card" onClick={() => setPanel("payroll")}><span className="operation-mark salary-mark">₩</span><strong>월급 일괄 지급</strong><small>1인 1역 역할에 따라 지급</small><b>→</b></button><button className="operation-card" onClick={() => setPanel("bonus")}><span className="operation-mark bonus-mark">✦</span><strong>보너스 지급</strong><small>멋진 행동을 칭찬해요</small><b>→</b></button><button className="operation-card" onClick={() => setPanel("store")}><span className="operation-mark store-mark">⌂</span><strong>문방구 사용</strong><small>상품 구매 후 잔액 차감</small><b>→</b></button><button className="operation-card" onClick={() => setPanel("products")}><span className="operation-mark products-mark">▦</span><strong>상품·재고 관리</strong><small>상품 추가·가격·재고 충전</small><b>→</b></button></div><div className="card-heading balance-heading"><div><p className="eyebrow">STUDENT BALANCE</p><h2>학생별 보유 현황</h2></div><div className="heading-actions"><button className="text-button" onClick={() => setPanel("stats")}>월별 통계</button><button className="text-button" onClick={() => setPanel("history")}>거래 내역</button><button className="text-button" onClick={exportCSV}>CSV 저장</button></div></div><div className="balance-table"><div className="table-row table-head"><span>학생</span><span>1인 1역</span><span>잔액</span></div>{[...students].sort((a, b) => b.points - a.points).map((student) => <button className={`table-row table-body ${selectedId === student.id ? "selected-row" : ""}`} key={student.id} onClick={() => { setSelectedId(student.id); setPanel("detail"); }}><span className="student-cell"><i className="avatar" style={{ background: student.color }}>{student.avatar}</i><strong>{student.name}</strong></span><span className="role-cell">{student.role}<small>월급 {student.salary}</small></span><span className="points-cell">{student.points}<small>막대</small></span></button>)}</div></section>
      <aside className="side-column"><section className="balance-card card"><div className="card-heading"><div><p className="eyebrow">CLASS REWARD</p><h2>우리 반 보상 저금통</h2></div><span className="coin-icon">✦</span></div><div className="balance-number">{classTotal}<span>개</span></div><div className="progress-row"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div><p className="muted">다음 보상까지 {Math.max(0, settings.goalPoints - classTotal)}개 남았어요.</p><div className="reward"><span className="reward-icon">♟</span><div><strong>함께 만드는 보상</strong><p>{settings.reward}</p></div><span className="reward-arrow">↗</span></div></section><section className="tip-card"><span className="tip-spark">✦</span><div><p className="eyebrow">TODAY&apos;S TIP</p><p>역할을 다한 뒤 받은 월급은<br /><strong>책임감의 기록이 됩니다.</strong></p></div></section></aside></div>
    <section className="activity-section"><div className="section-title"><div><p className="eyebrow">RECENT TRANSACTIONS</p><h2>최근 거래 내역</h2></div><div className="heading-actions"><span className={`sheet-status ${sheetStatus}`}>{sheetStatus === "sending" ? "Sheets 전송 중…" : sheetStatus === "success" ? "✓ Sheets 저장 완료" : sheetStatus === "error" ? "! Sheets 저장 실패" : ""}</span><button className="text-button" onClick={() => setPanel("history")}>전체 내역 보기 <span>→</span></button></div></div><div className="activity-list">{recent.map((transaction) => <article className="activity-item" key={transaction.id}><span className={`transaction-badge ${transaction.type}`}>{transaction.type === "spend" ? "−" : "+"}</span><div className="activity-copy"><strong>{transaction.student}</strong><p>{transaction.item}</p></div><time>{transaction.date}</time><span className={`activity-points ${transaction.amount < 0 ? "spent" : ""}`}>{transaction.amount > 0 ? "+" : ""}{transaction.amount}<small> 막대</small></span></article>)}</div></section>
    {panel === "students" && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card"><div className="modal-header"><div><p className="eyebrow">CLASS ROSTER</p><h2>학생·1인 1역 관리</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="modal-toolbar"><p>학생 {students.length}명</p><button className="primary-button small-button" onClick={() => openStudentForm()}>+ 학생 추가</button></div><div className="student-admin-list">{students.map((student) => <div className="student-admin-item" key={student.id}><span className="avatar" style={{ background: student.color }}>{student.avatar}</span><div><strong>{student.name}</strong><small>{student.role} · 월급 {student.salary}막대</small></div><div className="admin-actions"><button onClick={() => openStudentForm(student)}>수정</button><button className="danger" onClick={() => deleteStudent(student)}>삭제</button></div></div>)}</div>{studentFormOpen && <div className="inline-form"><p className="form-title">{editingStudent ? "학생 정보 수정" : "새 학생 추가"}</p><div className="form-row"><label>이름<input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} placeholder="예: 홍길동" /></label><label>모둠<input value={studentForm.team} onChange={(e) => setStudentForm({ ...studentForm, team: e.target.value })} /></label><label>1인 1역<input value={studentForm.role} onChange={(e) => setStudentForm({ ...studentForm, role: e.target.value })} placeholder="예: 화분 담당" /></label><label>월급<input type="number" min="0" value={studentForm.salary} onChange={(e) => setStudentForm({ ...studentForm, salary: Number(e.target.value) })} /></label></div><div className="form-actions"><button className="secondary-button" onClick={() => { setEditingStudent(null); setStudentFormOpen(false); setStudentForm({ name: "", team: "햇살 모둠", role: "", salary: 30 }); }}>취소</button><button className="primary-button small-button" onClick={saveStudent}>저장</button></div></div>}</section></div>}
    {panel === "settings" && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card settings-modal"><div className="modal-header"><div><p className="eyebrow">CLASS SETTINGS</p><h2>우리 반 설정</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="settings-form"><label>학교·학급 이름<input value={settingsForm.className} onChange={(e) => setSettingsForm({ ...settingsForm, className: e.target.value })} /></label><label>선생님 이름<input value={settingsForm.teacherName} onChange={(e) => setSettingsForm({ ...settingsForm, teacherName: e.target.value })} /></label><label>우리 반 목표 막대 수<input type="number" min="1" value={settingsForm.goalPoints} onChange={(e) => setSettingsForm({ ...settingsForm, goalPoints: Number(e.target.value) })} /></label><label>목표 보상 내용<input value={settingsForm.reward} onChange={(e) => setSettingsForm({ ...settingsForm, reward: e.target.value })} /></label><div><label>칭찬 사유 <span className="field-hint">한 줄에 하나씩 입력</span></label><textarea rows={4} value={settingsForm.reasons.join("\n")} onChange={(e) => setSettingsForm({ ...settingsForm, reasons: e.target.value.split("\n") })} /></div><div className="sheet-connect"><label>Google Sheets 자동 저장 주소 <span className="field-hint">선택 입력</span></label><input value={settingsForm.sheetWebhookUrl} onChange={(e) => setSettingsForm({ ...settingsForm, sheetWebhookUrl: e.target.value })} placeholder="Apps Script 웹 앱 URL을 붙여 넣으세요" /><small>거래가 생길 때마다 사용일자·사용항목·금액·잔액을 자동 전송합니다.</small></div></div><div className="form-actions"><button className="danger-outline" onClick={resetSemester}>학기 초기화</button><span className="form-spacer" /><button className="secondary-button" onClick={() => setPanel(null)}>취소</button><button className="primary-button" onClick={saveSettings}>설정 저장</button></div></section></div>}
    {panel === "payroll" && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card"><div className="modal-header"><div><p className="eyebrow">MONTHLY PAYROLL</p><h2>1인 1역 월급 지급</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="settings-form"><label>지급 월<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label></div><div className="payroll-list">{students.map((student) => { const paid = transactions.some((t) => t.type === "salary" && t.month === month && t.studentId === student.id); return <div className="payroll-row" key={student.id}><span>{student.name}</span><small>{student.role}</small><strong>{student.salary}막대</strong><em className={paid ? "done" : "pending"}>{paid ? "완료" : "대기"}</em></div>; })}</div><div className="payroll-summary">{students.length}명 중 {transactions.filter((t) => t.type === "salary" && t.month === month).length}명 지급 완료</div><div className="form-actions"><button className="secondary-button" onClick={() => setPanel(null)}>취소</button><button className="primary-button" onClick={paySalaries}>월급 지급 실행</button></div></section></div>}
    {panel === "bonus" && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card"><div className="modal-header"><div><p className="eyebrow">BONUS REWARD</p><h2>보너스 지급</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="settings-form"><label>학생<select value={bonusForm.studentId} onChange={(e) => setBonusForm({ ...bonusForm, studentId: Number(e.target.value) })}>{students.map((s) => <option value={s.id} key={s.id}>{s.name} · 현재 {s.points}막대</option>)}</select></label><label>보너스 막대 수<input type="number" min="1" value={bonusForm.amount} onChange={(e) => setBonusForm({ ...bonusForm, amount: Number(e.target.value) })} /></label><label>보너스 사유<input value={bonusForm.reason} onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })} /></label></div><div className="form-actions"><button className="secondary-button" onClick={() => setPanel(null)}>취소</button><button className="primary-button" onClick={giveBonus}>보너스 지급</button></div></section></div>}
    {panel === "store" && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card"><div className="modal-header"><div><p className="eyebrow">CLASS STORE</p><h2>학급 문방구</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="settings-form"><label>구매 학생<select value={storeForm.studentId} onChange={(e) => setStoreForm({ ...storeForm, studentId: Number(e.target.value) })}>{students.map((s) => <option value={s.id} key={s.id}>{s.name} · 잔액 {s.points}막대</option>)}</select></label><label>상품<select value={storeForm.productId} onChange={(e) => setStoreForm({ ...storeForm, productId: Number(e.target.value) })}>{products.map((p) => <option value={p.id} key={p.id} disabled={p.stock === 0}>{p.emoji} {p.name} · {p.price}막대 · 재고 {p.stock}</option>)}</select></label><label>수량<input type="number" min="1" max={selectedProduct?.stock ?? 1} value={storeForm.quantity} onChange={(e) => setStoreForm({ ...storeForm, quantity: Math.max(1, Number(e.target.value)) })} /></label></div><div className="purchase-result"><span>구매 전 잔액 <strong>{storeStudent?.points ?? 0}</strong></span><span>사용 금액 <strong className="spent">-{storeTotal}</strong></span><span>구매 후 잔액 <strong>{(storeStudent?.points ?? 0) - storeTotal}</strong></span></div><div className="form-actions"><button className="secondary-button" onClick={() => setPanel(null)}>취소</button><button className="primary-button" disabled={!storeStudent || !selectedProduct || storeTotal > storeStudent.points || storeForm.quantity > selectedProduct.stock} onClick={buyProduct}>구매 처리</button></div></section></div>}
    {panel === "products" && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card"><div className="modal-header"><div><p className="eyebrow">PRODUCT INVENTORY</p><h2>문방구 상품·재고 관리</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="modal-toolbar"><p>상품 {products.length}종</p><button className="primary-button small-button" onClick={() => openProductForm()}>+ 상품 추가</button></div><div className="product-admin-list">{products.map((product) => <div className="product-admin-row" key={product.id}><span className="product-emoji">{product.emoji}</span><div><strong>{product.name}</strong><small>{product.price}막대 · 재고 {product.stock}개</small></div><div className="admin-actions"><button onClick={() => refillProduct(product)}>+ 재고</button><button onClick={() => openProductForm(product)}>수정</button><button className="danger" onClick={() => deleteProduct(product)}>삭제</button></div></div>)}</div>{(productForm.name !== "" || editingProduct) && <div className="inline-form"><p className="form-title">{editingProduct ? "상품 정보 수정" : "상품 추가"}</p><div className="form-row"><label>상품명<input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="예: 색연필" /></label><label>아이콘<input value={productForm.emoji} onChange={(e) => setProductForm({ ...productForm, emoji: e.target.value })} /></label><label>가격<input type="number" min="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} /></label><label>재고<input type="number" min="0" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} /></label></div><div className="form-actions"><button className="secondary-button" onClick={() => { setEditingProduct(null); setProductForm({ name: "", price: 5, stock: 10, emoji: "★" }); }}>취소</button><button className="primary-button small-button" onClick={saveProduct}>저장</button></div></div>}</section></div>}
    {panel === "stats" && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card stats-modal"><div className="modal-header"><div><p className="eyebrow">MONTHLY REPORT</p><h2>월별 통계·지출내역</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="stats-filter"><label>조회 월<input type="month" value={statsMonth} onChange={(e) => setStatsMonth(e.target.value)} /></label></div><div className="stats-cards"><div><small>수입</small><strong>+{statsIncome}</strong><em>막대</em></div><div><small>지출</small><strong className="spent">-{statsSpend}</strong><em>막대</em></div><div><small>거래 건수</small><strong>{statsTransactions.length}</strong><em>건</em></div></div><h3 className="subheading">지출 내역</h3><div className="spending-list">{statsTransactions.filter((t) => t.amount < 0).length ? statsTransactions.filter((t) => t.amount < 0).map((t) => <div className="spending-row" key={t.id}><span>{t.date}</span><strong>{t.student}</strong><small>{t.item}</small><b className="spent">{t.amount}</b></div>) : <p className="empty-state">선택한 달의 지출 내역이 없습니다.</p>}</div></section></div>}
    {panel === "detail" && detailStudent && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card history-modal"><div className="modal-header"><div><p className="eyebrow">STUDENT LEDGER</p><h2>{detailStudent.name}의 거래 내역</h2><p className="modal-subcopy">{detailStudent.role} · 현재 잔액 {detailStudent.points}막대</p></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="history-list">{detailTransactions.length ? detailTransactions.map((t) => <div className="history-row" key={t.id}><span className={`transaction-badge ${t.type}`}>{t.type === "spend" ? "−" : "+"}</span><div><strong>{t.item}</strong><small>{t.date}</small></div><b className={t.amount < 0 ? "spent" : ""}>{t.amount > 0 ? "+" : ""}{t.amount} <small>막대</small></b><em>잔액 {t.balance}</em></div>) : <p className="empty-state">아직 거래 내역이 없습니다.</p>}</div></section></div>}
    {panel === "history" && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}><section className="modal-card history-modal"><div className="modal-header"><div><p className="eyebrow">LEDGER</p><h2>전체 거래 내역</h2></div><div className="heading-actions"><button className="text-button" onClick={exportCSV}>CSV 다운로드</button><button className="close-button" onClick={() => setPanel(null)}>×</button></div></div><div className="history-list">{transactions.map((t) => <div className="history-row" key={t.id}><span className={`transaction-badge ${t.type}`}>{t.type === "spend" ? "−" : "+"}</span><div><strong>{t.student}</strong><small>{t.date} · {t.item}</small></div><b className={t.amount < 0 ? "spent" : ""}>{t.amount > 0 ? "+" : ""}{t.amount} <small>막대</small></b><em>잔액 {t.balance}</em></div>)}</div></section></div>}
    {notice && <div className="toast"><span>✓</span>{notice}</div>}<footer><span>칭찬은 마음을 밝히는 작은 빛이에요.</span><span>© {settings.className} · 우리 반만의 기록</span></footer>
  </main>;
}
