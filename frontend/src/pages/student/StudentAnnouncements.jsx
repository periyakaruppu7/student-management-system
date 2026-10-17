import { useEffect, useState } from "react";
import { getMyAnnouncements } from "../../api/studentPortal";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "";
}

export default function StudentAnnouncements() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyAnnouncements()
      .then(setItems)
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            "Could not load announcements."
        );
      });
  }, []);

  return (
    <>
      <header className="portal-page-heading">
        <div>
          <p className="portal-eyebrow">CAMPUS UPDATES</p>
          <h1>Announcements</h1>
          <p className="portal-muted">
            General notices and updates for your enrolled courses.
          </p>
        </div>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {!items ? (
        <div className="portal-loading">
          <div className="spinner-border" />
          Loading announcements...
        </div>
      ) : items.length === 0 ? (
        <div className="portal-card portal-empty">
          There are no announcements at the moment.
        </div>
      ) : (
        <div className="portal-announcement-list">
          {items.map((item) => (
            <article
              className="portal-announcement-card"
              key={item._id}
            >
              <div className="portal-announcement-marker">
                !
              </div>

              <div className="portal-announcement-content">
                <div className="portal-announcement-meta">
                  <span>
                    {item.courseId?.title ||
                      "General announcement"}
                  </span>

                  <time>{formatDate(item.createdAt)}</time>
                </div>

                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}