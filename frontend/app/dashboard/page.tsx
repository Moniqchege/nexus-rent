"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const statsData = [
  {
    icon: "🏢",
    label: "Total Properties",
    value: "2,847",
    change: "↑ 12.4% this month",
    topColor: "var(--neon-blue)",
    valueColor: "var(--neon-blue)",
    changeColor: "var(--accent-success)",
    bgColor: "rgba(0,240,255,0.1)",
    delay: 1,
  },
  {
    icon: "📊",
    label: "Occupancy Rate",
    value: "89.2%",
    change: "↑ 3.1% vs last quarter",
    topColor: "var(--neon-purple)",
    valueColor: "var(--neon-purple)",
    changeColor: "var(--accent-success)",
    bgColor: "rgba(124,58,237,0.1)",
    delay: 2,
  },
  {
    icon: "💰",
    label: "Total Revenue",
    value: "$1.4M",
    change: "↑ 8.7% vs last month",
    topColor: "var(--accent-success)",
    valueColor: "var(--accent-success)",
    changeColor: "var(--accent-success)",
    bgColor: "rgba(0,255,163,0.1)",
    delay: 3,
  },
  {
    icon: "🤖",
    label: "AI Growth Index",
    value: "+14.3%",
    change: "Predicted next 90 days",
    topColor: "var(--accent-danger)",
    valueColor: "var(--accent-danger)",
    changeColor: "var(--text-secondary)",
    bgColor: "rgba(255,59,129,0.1)",
    delay: 4,
  },
];

export default function DashboardPage() {
    const router = useRouter();

    // useEffect(() => {
    //     const token = localStorage.getItem("token");

    //     if (!token) {
    //         router.push("/");
    //     }
    // }, []);
  return (
    <section className="stats-section">
      <div className="stats-row">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={`overview-stat animate-in delay-${stat.delay}`}
          >
            <div
              className="stat-top-bar"
              style={{
                background: stat.topColor,
                boxShadow: `0 0 10px ${stat.topColor}`,
              }}
            ></div>
            <div
              className="stat-icon"
              style={{ background: stat.bgColor }}
            >
              {stat.icon}
            </div>
            <div className="ov-label">{stat.label}</div>
            <div className="ov-value" style={{ color: stat.valueColor }}>
              {stat.value}
            </div>
            <div className="ov-change" style={{ color: stat.changeColor }}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}