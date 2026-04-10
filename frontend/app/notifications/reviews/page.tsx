"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";
import { useRouter } from "next/navigation";

interface Review {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  tenant: {
    id: number;
    name: string;
    email: string;
  };
  property: {
    id: number;
    title: string;
    location: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuthStore();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/notifications/reviews');
      setReviews(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateComment = (comment: string, max = 80) => {
    if (!comment) return "No comment";
    return comment.length > max ? comment.slice(0, max).trim() + "…" : comment;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? 'gold' : 'var(--text-secondary)', fontSize: '16px' }}>
        💠
      </span>
    ));
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">💠REVIEWS</div>
       <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          // marginBottom: "24px",
        }}
      >
        <div className="section-label">REVIEWS</div>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <div className="section-label" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neon-purple)' }}>
          Tenant Reviews
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "64px" }}>
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "48px", marginBottom: "6px" }}>💠</div>
          <div style={{ fontSize: "16px", marginBottom: "8px" }}>No reviews yet.</div>
          <div style={{ fontSize: "14px", marginBottom: "8px" }}>Reviews will appear here when tenants rate services.</div>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead className="table-head">
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border-glow)" }}>
                <th style={{ padding: "12px" }}>#</th>
                <th style={{ padding: "12px" }}>Rating</th>
                <th style={{ padding: "12px" }}>Comment</th>
                <th style={{ padding: "12px" }}>Property</th>
                <th style={{ padding: "12px" }}>Tenant</th>
                <th style={{ padding: "12px" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, index) => (
                <tr key={review.id} style={{ borderBottom: "1px solid var(--border-glow)", backgroundColor: "rgba(17,24,39,0.4)" }}>
                  <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {renderStars(review.rating)}
                      <span style={{ fontSize: '12px', color: 'var(--neon-secondary)' }}>({review.rating}/5)</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                    {truncateComment(review.comment || '')}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>
                    {review.property.title}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                    {review.tenant.name}<br />
                    <small>{review.tenant.email}</small>
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                    {formatDate(review.createdAt)}
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
