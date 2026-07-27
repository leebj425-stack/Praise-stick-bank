"use client";

import { useMemo, useState } from "react";

type Student = { id: number; name: string; team: string; avatar: string; points: number; color: string };
type Activity = { id: number; student: string; reason: string; points: number; time: string; avatar: string; color: string };

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

const reasons = ["친구를 도왔어요", "수업에 집중했어요", "정리정돈을 잘했어요", "용기 있게 발표했어요", "스스로 약속을 지켰어요"];

export default function Home() {
  const [students, setStudents] = useState(initialStudents);
  const [activities, setActivities] = useState(initialActivities);
  const [selectedId, setSelectedId] = useState(1);
  const [reason, setReason] = useState(reasons[0]);
  const [points, setPoints] = useState(2);
  const [notice, setNotice] = useState("");
  const selected = students.find((student) => student.id === selectedId) ?? students[0];
  const todayTotal = useMemo(() => activities.reduce((sum, activity) => sum + activity.points, 0), [activities]);
  const sortedStudents = [...students].sort((a, b) => b.points - a.points);

  function givePraise() {
    if (!selected) return;
    setStudents((current) => current.map((student) => student.id === selected.id ? { ...student, points: student.points + points } : student));
    setActivities((current) => [{ id: Date.now(), student: selected.name, reason, points, time: "방금 전", avatar: selected.avatar, color: selected.color }, ...current]);
    setNotice(`${selected.name}에게 칭찬막대 ${points}개를 보냈어요!`);
    window.setTimeout(() => setNotice(""), 2600);
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><span>칭찬막대</span></div>
        <div className="class-name">햇살초등학교 <span>·</span> 3학년 2반</div>
        <div className="top-actions"><button className="nav-link active">오늘의 교실</button><button className="nav-link">학생 관리</button><button className="nav-link">설정</button><div className="teacher"><span className="teacher-dot">담</span> 담임 선생님</div></div>
      </nav>

      <section className="hero">
        <div><p className="eyebrow">MONDAY, MAY 19 · 2025</p><h1>오늘도 좋은 마음을<br /><em>발견해 보세요.</em></h1><p className="hero-copy">작은 칭찬이 모여 우리 반의 멋진 하루가 됩니다.</p></div>
        <div className="hero-art"><div className="sun">☀</div><div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="flower flower-one">✿</div><div className="flower flower-two">✿</div></div>
      </section>

      <div className="content-grid">
        <section className="give-card card">
          <div className="card-heading"><div><p className="eyebrow">PRAISE GIVING</p><h2>칭찬막대 보내기</h2></div><span className="count-chip">이번 주 <strong>{todayTotal}</strong>개</span></div>
          <p className="label">누구에게 보낼까요?</p>
          <div className="student-picker">{students.map((student) => <button key={student.id} className={`student-option ${selectedId === student.id ? "selected" : ""}`} onClick={() => setSelectedId(student.id)}><span className="avatar" style={{ background: student.color }}>{student.avatar}</span><span>{student.name}</span>{selectedId === student.id && <span className="check">✓</span>}</button>)}</div>
          <p className="label reason-label">어떤 점이 멋졌나요?</p>
          <div className="reason-picker">{reasons.map((item) => <button key={item} className={`reason-chip ${reason === item ? "selected" : ""}`} onClick={() => setReason(item)}>{item}</button>)}</div>
          <div className="give-footer"><div className="point-stepper"><button aria-label="막대 줄이기" onClick={() => setPoints(Math.max(1, points - 1))}>−</button><span><strong>{points}</strong> 막대</span><button aria-label="막대 늘리기" onClick={() => setPoints(Math.min(5, points + 1))}>+</button></div><button className="primary-button" onClick={givePraise}>칭찬막대 보내기 <span>→</span></button></div>
        </section>

        <aside className="side-column">
          <section className="balance-card card"><div className="card-heading"><div><p className="eyebrow">CLASS BALANCE</p><h2>우리 반 칭찬 저금통</h2></div><span className="coin-icon">✦</span></div><div className="balance-number">{students.reduce((sum, student) => sum + student.points, 0)}<span>개</span></div><div className="progress-row"><div className="progress-track"><span style={{ width: "68%" }} /></div><strong>68%</strong></div><p className="muted">다음 우리 반 보상까지 38개 남았어요.</p><div className="reward"><span className="reward-icon">♟</span><div><strong>함께 만드는 보상</strong><p>운동장 놀이 시간 20분</p></div><span className="reward-arrow">↗</span></div></section>
          <section className="tip-card"><span className="tip-spark">✦</span><div><p className="eyebrow">TODAY&apos;S TIP</p><p>구체적으로 칭찬하면<br /><strong>마음이 더 잘 자라요.</strong></p></div></section>
        </aside>
      </div>

      <section className="activity-section"><div className="section-title"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>최근 칭찬 기록</h2></div><button className="text-button">전체 기록 보기 <span>→</span></button></div><div className="activity-list">{activities.slice(0, 4).map((activity) => <article className="activity-item" key={activity.id}><span className="avatar large" style={{ background: activity.color }}>{activity.avatar}</span><div className="activity-copy"><strong>{activity.student}</strong><p>{activity.reason}</p></div><time>{activity.time}</time><span className="activity-points">+{activity.points}<small> 막대</small></span></article>)}</div></section>

      <section className="ranking-section"><div className="section-title"><div><p className="eyebrow">KINDNESS RANKING</p><h2>이번 주 마음 온도계</h2></div><span className="muted">서로의 성장을 응원해요</span></div><div className="ranking-grid">{sortedStudents.slice(0, 4).map((student, index) => <div className="ranking-item" key={student.id}><span className={`rank rank-${index + 1}`}>{index + 1}</span><span className="avatar" style={{ background: student.color }}>{student.avatar}</span><div className="rank-name"><strong>{student.name}</strong><small>{student.team}</small></div><div className="rank-points"><strong>{student.points}</strong><small>막대</small></div></div>)}</div></section>
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
      <footer><span>칭찬은 마음을 밝히는 작은 빛이에요.</span><span>© 햇살초 3-2 · 우리 반만의 기록</span></footer>
    </main>
  );
}
