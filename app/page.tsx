"use client";

import { useEffect, useMemo, useState } from "react";

type Student = { id: number; name: string; team: string; avatar: string; points: number; color: string };
type Activity = { id: number; student: string; reason: string; points: number; time: string; avatar: string; color: string };
type Settings = { className: string; teacherName: string; reward: string; goalPoints: number; reasons: string[] };

const initialStudents: Student[] = [
  { id: 1, name: "김민준", team: "햇살 모둠", avatar: "민", points: 42, color: "#f6c453" },
  { id: 2, name: "이서연", team: "햇살 모둠", avatar: "서", points: 38, color: "#e98d9a" },
  { id: 3, name: "박지호", team: "별빛 모둠", avatar: "지", points: 35, color: "#78a7d9" },
  { id: 4, name: "최하은", team: "별빛 모둠", avatar: "하", points: 31, color: "#a3c98b" },
  { id: 5, name: "정도윤", team: "구름 모둠", avatar: "도", points: 26, color: "#b89bdd" },
  { id: 6, name: "윤채원", team: "구름 모둠", avatar: "채", points: 24, color: "#f0a66f" },
];
const initialActivities: Activity[] = [
  { id: 1, student: "김민준", reason: "친구의 준비물을 함께 챙겨주었어요", points: 2, time: "오전 10:42", avatar: "민", color: "#f6c453" },
  { id: 2, student: "이서연", reason: "발표할 때 또박또박 말했어요", points: 3, time: "오전 10:15", avatar: "서", color: "#e98d9a" },
  { id: 3, student: "박지호", reason: "교실 책상을 깨끗하게 정리했어요", points: 1, time: "오전 09:50", avatar: "지", color: "#78a7d9" },
];
const initialSettings: Settings = { className: "햇살초등학교 · 3학년 2반", teacherName: "담임 선생님", reward: "운동장 놀이 시간 20분", goalPoints: 100, reasons: ["친구를 도왔어요", "수업에 집중했어요", "정리정돈을 잘했어요", "용기 있게 발표했어요", "스스로 약속을 지켰어요"] };
const colors = ["#f6c453", "#e98d9a", "#78a7d9", "#a3c98b", "#b89bdd", "#f0a66f", "#78b7aa"];

export default function Home() {
  const [students, setStudents] = useState(initialStudents);
  const [activities, setActivities] = useState(initialActivities);
  const [settings, setSettings] = useState(initialSettings);
  const [selectedId, setSelectedId] = useState(1);
  const [reason, setReason] = useState(initialSettings.reasons[0]);
  const [points, setPoints] = useState(2);
  const [notice, setNotice] = useState("");
  const [panel, setPanel] = useState<"students" | "settings" | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({ name: "", team: "햇살 모둠" });
  const [settingsForm, setSettingsForm] = useState(settings);

  useEffect(() => {
    const saved = window.localStorage.getItem("praise-class-data");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.students) setStudents(data.students);
      if (data.activities) setActivities(data.activities);
      if (data.settings) { setSettings(data.settings); setSettingsForm(data.settings); setReason(data.settings.reasons[0] ?? ""); }
    } catch { /* 기본값을 사용합니다. */ }
  }, []);
  useEffect(() => { window.localStorage.setItem("praise-class-data", JSON.stringify({ students, activities, settings })); }, [students, activities, settings]);

  const selected = students.find((student) => student.id === selectedId) ?? students[0];
  const todayTotal = useMemo(() => activities.reduce((sum, activity) => sum + activity.points, 0), [activities]);
  const classTotal = students.reduce((sum, student) => sum + student.points, 0);
  const progress = Math.min(100, Math.round((classTotal / settings.goalPoints) * 100));
  const sortedStudents = [...students].sort((a, b) => b.points - a.points);
  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2600); }
  function givePraise() {
    if (!selected) return;
    setStudents((current) => current.map((student) => student.id === selected.id ? { ...student, points: student.points + points } : student));
    setActivities((current) => [{ id: Date.now(), student: selected.name, reason, points, time: "방금 전", avatar: selected.avatar, color: selected.color }, ...current]);
    showNotice(`${selected.name}에게 칭찬막대 ${points}개를 보냈어요!`);
  }
  function openStudentForm(student?: Student) { setEditingStudent(student ?? null); setStudentForm(student ? { name: student.name, team: student.team } : { name: "", team: "햇살 모둠" }); }
  function saveStudent() {
    const name = studentForm.name.trim(); if (!name) return;
    if (editingStudent) setStudents((current) => current.map((student) => student.id === editingStudent.id ? { ...student, name, team: studentForm.team, avatar: name.slice(0, 1) } : student));
    else { const newStudent = { id: Date.now(), name, team: studentForm.team, avatar: name.slice(0, 1), points: 0, color: colors[students.length % colors.length] }; setStudents((current) => [...current, newStudent]); setSelectedId(newStudent.id); }
    setEditingStudent(null); setStudentForm({ name: "", team: "햇살 모둠" }); showNotice(editingStudent ? "학생 정보를 수정했어요." : "새 학생을 추가했어요.");
  }
  function deleteStudent(student: Student) {
    if (!window.confirm(`${student.name} 학생을 삭제할까요?`)) return;
    setStudents((current) => current.filter((item) => item.id !== student.id));
    if (selectedId === student.id) setSelectedId(students.find((item) => item.id !== student.id)?.id ?? 0);
    showNotice(`${student.name} 학생을 삭제했어요.`);
  }
  function saveSettings() {
    const cleanedReasons = settingsForm.reasons.map((item) => item.trim()).filter(Boolean);
    const next = { ...settingsForm, className: settingsForm.className.trim() || initialSettings.className, teacherName: settingsForm.teacherName.trim() || initialSettings.teacherName, reward: settingsForm.reward.trim() || initialSettings.reward, goalPoints: Math.max(1, Number(settingsForm.goalPoints) || 100), reasons: cleanedReasons.length ? cleanedReasons : initialSettings.reasons };
    setSettings(next); setSettingsForm(next); setReason(next.reasons[0]); setPanel(null); showNotice("설정을 저장했어요.");
  }

  return <main className="app-shell">
    <nav className="topbar"><div className="brand"><span className="brand-mark">✦</span><span>칭찬막대</span></div><div className="class-name">{settings.className}</div><div className="top-actions"><button className="nav-link active">오늘의 교실</button><button className="nav-link" onClick={() => setPanel("students")}>학생 관리</button><button className="nav-link" onClick={() => { setSettingsForm(settings); setPanel("settings"); }}>설정</button><div className="teacher"><span className="teacher-dot">담</span> {settings.teacherName}</div></div></nav>
    <section className="hero"><div><p className="eyebrow">MONDAY, MAY 19 · 2025</p><h1>오늘도 좋은 마음을<br /><em>발견해 보세요.</em></h1><p className="hero-copy">작은 칭찬이 모여 우리 반의 멋진 하루가 됩니다.</p></div><div className="hero-art"><div className="sun">☀</div><div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="flower flower-one">✿</div><div className="flower flower-two">✿</div></div></section>
    <div className="content-grid"><section className="give-card card"><div className="card-heading"><div><p className="eyebrow">PRAISE GIVING</p><h2>칭찬막대 보내기</h2></div><span className="count-chip">이번 주 <strong>{todayTotal}</strong>개</span></div><p className="label">누구에게 보낼까요?</p><div className="student-picker">{students.map((student) => <button key={student.id} className={`student-option ${selectedId === student.id ? "selected" : ""}`} onClick={() => setSelectedId(student.id)}><span className="avatar" style={{ background: student.color }}>{student.avatar}</span><span>{student.name}</span>{selectedId === student.id && <span className="check">✓</span>}</button>)}</div><p className="label reason-label">어떤 점이 멋졌나요?</p><div className="reason-picker">{settings.reasons.map((item) => <button key={item} className={`reason-chip ${reason === item ? "selected" : ""}`} onClick={() => setReason(item)}>{item}</button>)}</div><div className="give-footer"><div className="point-stepper"><button aria-label="막대 줄이기" onClick={() => setPoints(Math.max(1, points - 1))}>−</button><span><strong>{points}</strong> 막대</span><button aria-label="막대 늘리기" onClick={() => setPoints(Math.min(5, points + 1))}>+</button></div><button className="primary-button" onClick={givePraise}>칭찬막대 보내기 <span>→</span></button></div></section>
      <aside className="side-column"><section className="balance-card card"><div className="card-heading"><div><p className="eyebrow">CLASS BALANCE</p><h2>우리 반 칭찬 저금통</h2></div><span className="coin-icon">✦</span></div><div className="balance-number">{classTotal}<span>개</span></div><div className="progress-row"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div><p className="muted">다음 우리 반 보상까지 {Math.max(0, settings.goalPoints - classTotal)}개 남았어요.</p><div className="reward"><span className="reward-icon">♟</span><div><strong>함께 만드는 보상</strong><p>{settings.reward}</p></div><span className="reward-arrow">↗</span></div></section><section className="tip-card"><span className="tip-spark">✦</span><div><p className="eyebrow">TODAY&apos;S TIP</p><p>구체적으로 칭찬하면<br /><strong>마음이 더 잘 자라요.</strong></p></div></section></aside></div>
    <section className="activity-section"><div className="section-title"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>최근 칭찬 기록</h2></div><button className="text-button">전체 기록 보기 <span>→</span></button></div><div className="activity-list">{activities.slice(0, 4).map((activity) => <article className="activity-item" key={activity.id}><span className="avatar large" style={{ background: activity.color }}>{activity.avatar}</span><div className="activity-copy"><strong>{activity.student}</strong><p>{activity.reason}</p></div><time>{activity.time}</time><span className="activity-points">+{activity.points}<small> 막대</small></span></article>)}</div></section>
    <section className="ranking-section"><div className="section-title"><div><p className="eyebrow">KINDNESS RANKING</p><h2>이번 주 마음 온도계</h2></div><span className="muted">서로의 성장을 응원해요</span></div><div className="ranking-grid">{sortedStudents.slice(0, 4).map((student, index) => <div className="ranking-item" key={student.id}><span className={`rank rank-${index + 1}`}>{index + 1}</span><span className="avatar" style={{ background: student.color }}>{student.avatar}</span><div className="rank-name"><strong>{student.name}</strong><small>{student.team}</small></div><div className="rank-points"><strong>{student.points}</strong><small>막대</small></div></div>)}</div></section>
    {panel === "students" && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPanel(null)}><section className="modal-card"><div className="modal-header"><div><p className="eyebrow">CLASS ROSTER</p><h2>학생 관리</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="modal-toolbar"><p>학생 {students.length}명</p><button className="primary-button small-button" onClick={() => openStudentForm()}>+ 학생 추가</button></div><div className="student-admin-list">{students.map((student) => <div className="student-admin-item" key={student.id}><span className="avatar" style={{ background: student.color }}>{student.avatar}</span><div><strong>{student.name}</strong><small>{student.team} · {student.points}막대</small></div><div className="admin-actions"><button onClick={() => openStudentForm(student)}>수정</button><button className="danger" onClick={() => deleteStudent(student)}>삭제</button></div></div>)}</div>{studentForm.name !== "" || editingStudent ? <div className="inline-form"><p className="form-title">{editingStudent ? "학생 정보 수정" : "새 학생 추가"}</p><div className="form-row"><label>이름<input value={studentForm.name} onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} placeholder="예: 홍길동" /></label><label>모둠<input value={studentForm.team} onChange={(event) => setStudentForm({ ...studentForm, team: event.target.value })} placeholder="예: 햇살 모둠" /></label></div><div className="form-actions"><button className="secondary-button" onClick={() => { setEditingStudent(null); setStudentForm({ name: "", team: "햇살 모둠" }); }}>취소</button><button className="primary-button small-button" onClick={saveStudent}>저장</button></div></div> : null}</section></div>}
    {panel === "settings" && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPanel(null)}><section className="modal-card settings-modal"><div className="modal-header"><div><p className="eyebrow">CLASS SETTINGS</p><h2>우리 반 설정</h2></div><button className="close-button" onClick={() => setPanel(null)}>×</button></div><div className="settings-form"><label>학교·학급 이름<input value={settingsForm.className} onChange={(event) => setSettingsForm({ ...settingsForm, className: event.target.value })} /></label><label>선생님 이름<input value={settingsForm.teacherName} onChange={(event) => setSettingsForm({ ...settingsForm, teacherName: event.target.value })} /></label><label>우리 반 목표 막대 수<input type="number" min="1" value={settingsForm.goalPoints} onChange={(event) => setSettingsForm({ ...settingsForm, goalPoints: Number(event.target.value) })} /></label><label>목표 보상 내용<input value={settingsForm.reward} onChange={(event) => setSettingsForm({ ...settingsForm, reward: event.target.value })} /></label><div><label>칭찬 사유 <span className="field-hint">한 줄에 하나씩 입력하세요</span></label><textarea rows={5} value={settingsForm.reasons.join("\n")} onChange={(event) => setSettingsForm({ ...settingsForm, reasons: event.target.value.split("\n") })} /></div></div><div className="form-actions"><button className="secondary-button" onClick={() => setPanel(null)}>취소</button><button className="primary-button" onClick={saveSettings}>설정 저장</button></div></section></div>}
    {notice && <div className="toast"><span>✓</span>{notice}</div>}<footer><span>칭찬은 마음을 밝히는 작은 빛이에요.</span><span>© {settings.className} · 우리 반만의 기록</span></footer>
  </main>;
}
