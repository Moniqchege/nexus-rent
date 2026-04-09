"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";
import { useRouter } from "next/navigation";

interface SentSurvey {
  id: number;
  title: string;
  recipientIds: string[];
  recipientCount: number;
  responseCount: number;
  sentAt: string;
}

interface SentResponse {
  surveys: SentSurvey[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function SurveysPage() {
  const [sentSurveys, setSentSurveys] = useState<SentSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const router = useRouter();

  const fetchSentSurveys = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get(`/notifications/surveys/sent?page=${pageNum}&limit=${limit}`);
      const data = res.data as SentResponse;
      
      setSentSurveys(data.surveys);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sent surveys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentSurveys(page);
  }, [page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateTitle = (title: string, max = 60) => {
    if (!title) return "";
    return title.length > max
      ? title.slice(0, max).trim() + "…"
      : title;
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">🛡️SENT SURVEYS</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="section-label">SURVEYS</div>

        <button
          onClick={() => router.push("/notifications/surveys/new")}
          style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          + New Survey
        </button>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-purple)" }}>
          Sent Surveys
        </h2>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "64px" }}>
          Loading sent surveys...
        </div>
      ) : sentSurveys.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4px 32px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "48px", marginBottom: "4px" }}>🛡️</div>
          <div style={{ fontSize: "14px" }}>No sent surveys yet.</div>
          <div style={{ marginTop: "6px", marginBottom: "8px" }}>
            <button
              onClick={() => router.push("/notifications/surveys/new")}
              style={{
                background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
                color: "white",
                borderRadius: "12px",
                padding: "8px 20px",
                border: "none",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "none",
                fontSize: "14px"
              }}
            >
              Create your first survey →
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead className="table-head">
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border-glow)" }}>
                <th>#</th>
                <th style={{ padding: "12px" }}>Date</th>
                <th style={{ padding: "12px" }}>Title Preview</th>
                <th style={{ padding: "12px" }}>Recipients</th>
                <th style={{ padding: "12px" }}>Responses</th>
              </tr>
            </thead>
            <tbody>
              {sentSurveys.map((survey, index) => (
                <tr key={survey.id} style={{ borderBottom: "1px solid var(--border-glow)", backgroundColor: "rgba(17,24,39,0.4)" }}>
                  <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                    {formatDate(survey.sentAt)}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                    {truncateTitle(survey.title, 60)}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>
                    {survey.recipientCount}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: survey.responseCount > 0 ? "var(--neon-green)" : "var(--text-secondary)" }}>
                    {survey.responseCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
