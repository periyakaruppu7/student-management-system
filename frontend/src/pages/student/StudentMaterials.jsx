import { useEffect, useState } from "react";
import { getMyMaterials } from "../../api/studentPortal";

export default function StudentMaterials() {
  const [materials, setMaterials] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyMaterials()
      .then(setMaterials)
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            "Could not load study materials."
        );
      });
  }, []);

  return (
    <>
      <header className="portal-page-heading">
        <div>
          <p className="portal-eyebrow">LEARNING RESOURCES</p>
          <h1>Study Materials</h1>
          <p className="portal-muted">
            PDF notes, video lessons, and reference links for
            your courses.
          </p>
        </div>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {!materials ? (
        <div className="portal-loading">
          <div className="spinner-border" />
          Loading materials...
        </div>
      ) : materials.length === 0 ? (
        <div className="portal-card portal-empty">
          No study materials are available for your enrolled
          courses yet.
        </div>
      ) : (
        <div className="portal-resource-list">
          {materials.map((item) => (
            <article
              className="portal-resource-row"
              key={item._id}
            >
              <div
                className={`portal-resource-icon ${
                  item.type === "PDF"
                    ? "type-pdf"
                    : item.type === "Video"
                    ? "type-video"
                    : "type-link"
                }`}
              >
                {item.type === "PDF"
                  ? "PDF"
                  : item.type === "Video"
                  ? "▶"
                  : "↗"}
              </div>

              <div className="portal-resource-info">
                <div className="portal-resource-meta">
                  <span>{item.type}</span>
                  <span>
                    {item.courseId?.title || "Course"}
                  </span>
                </div>

                <h2>{item.title}</h2>

                <p>
                  {item.description ||
                    "Open this resource to study the material."}
                </p>
              </div>

              <a
                className="btn btn-outline-primary portal-open-btn"
                href={item.url}
                target="_blank"
                rel="noreferrer"
              >
                Open resource ↗
              </a>
            </article>
          ))}
        </div>
      )}
    </>
  );
}