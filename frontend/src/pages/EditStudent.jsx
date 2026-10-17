
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStudent, updateStudent } from "../api/students";
import "./EditStudent.css";

const initialForm = {
  name: "",
  email: "",
  age: "",
  course: "",
};

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [originalForm, setOriginalForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const hasChanges = Object.keys(form).some(
    (key) => String(form[key]) !== String(originalForm[key])
  );

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      setLoading(true);
      setLoadError("");
      setError("");

      try {
        const student = await getStudent(id);

        if (!student || typeof student !== "object") {
          throw new Error("Student record was not found.");
        }

        const values = {
          name: student.name ?? "",
          email: student.email ?? "",
          age: student.age ?? "",
          course: student.course ?? "",
        };

        if (active) {
          setForm(values);
          setOriginalForm(values);
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err.message || "Unable to load student details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function handleReset() {
    setForm(originalForm);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim();
    const course = form.course.trim();
    const age = Number(form.age);

    if (!name || !email || !course || form.age === "") {
      setError("Please complete all required fields.");
      return;
    }

    if (name.length > 100 || course.length > 100) {
      setError("Name and course must be 100 characters or fewer.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (email.length > 254) {
      setError("Email address is too long.");
      return;
    }

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("Age must be a whole number between 1 and 120.");
      return;
    }

    setSaving(true);

    try {
      await updateStudent(id, { name, email, age, course });

      navigate("/students", {
        state: { message: "Student updated successfully." },
      });
    } catch (err) {
      setError(err.message || "Unable to update the student.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="edit-student-page">
        <div className="edit-state-panel" role="status">
          <span className="spinner-border spinner-border-sm" />
          <div>
            <h2>Loading student details</h2>
            <p>Please wait while the record is retrieved.</p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="edit-student-page">
        <div className="edit-state-panel edit-state-error">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          <div>
            <h2>Unable to open this record</h2>
            <p>{loadError}</p>
            <Link to="/students" className="edit-btn edit-btn-primary">
              <i className="bi bi-arrow-left me-2" />
              Back to students
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="edit-student-page">
      <nav className="edit-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <Link to="/students">Students</Link>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <span aria-current="page">Edit student</span>
      </nav>

      <header className="edit-page-heading">
        <div>
          <p className="edit-eyebrow">STUDENT MANAGEMENT</p>
          <h1>Edit student</h1>
          <p className="edit-subtitle">
            Update the student's personal and academic information.
          </p>
        </div>

        <Link to="/students" className="edit-btn edit-btn-outline">
          <i className="bi bi-arrow-left me-2" />
          Back to list
        </Link>
      </header>

      <div className="edit-layout">
        <section className="edit-form-panel">
          <div className="edit-panel-heading">
            <div>
              <h2>Student details</h2>
              <p>Fields marked with <span>*</span> are required.</p>
            </div>
            <span className="edit-record-label">
              <i className="bi bi-pencil-square me-1" />
              Editing record
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert-danger edit-alert" role="alert">
                <i className="bi bi-exclamation-circle me-2" />
                {error}
              </div>
            )}

            <fieldset className="edit-fieldset">
              <legend>
                <i className="bi bi-person me-2" />
                Personal information
              </legend>

              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor="edit-name" className="form-label">
                    Full name <span>*</span>
                  </label>
                  <input
                    id="edit-name"
                    className="form-control edit-input"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="col-md-8">
                  <label htmlFor="edit-email" className="form-label">
                    Email address <span>*</span>
                  </label>
                  <input
                    id="edit-email"
                    className="form-control edit-input"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="student@example.com"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="edit-age" className="form-label">
                    Age <span>*</span>
                  </label>
                  <input
                    id="edit-age"
                    className="form-control edit-input"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="Age"
                    required
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="edit-fieldset edit-academic-section">
              <legend>
                <i className="bi bi-mortarboard me-2" />
                Academic information
              </legend>

              <div className="row">
                <div className="col-12">
                  <label htmlFor="edit-course" className="form-label">
                    Course / Program <span>*</span>
                  </label>
                  <input
                    id="edit-course"
                    className="form-control edit-input"
                    name="course"
                    type="text"
                    value={form.course}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science Engineering"
                    maxLength={100}
                    required
                  />
                  <div className="edit-field-help">
                    Use the official course or program name.
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="edit-form-actions">
              <p>
                {hasChanges ? (
                  <>
                    <i className="bi bi-pencil me-1" />
                    You have unsaved changes.
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2 me-1" />
                    No changes made.
                  </>
                )}
              </p>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="edit-btn edit-btn-outline"
                  onClick={handleReset}
                  disabled={saving || !hasChanges}
                >
                  Reset changes
                </button>

                <button
                  type="submit"
                  className="edit-btn edit-btn-primary"
                  disabled={saving || !hasChanges}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2 me-2" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="edit-side-column">
          <section className="edit-side-panel">
            <h2>Before saving</h2>
            <p className="edit-side-intro">
              Take a moment to check these details.
            </p>

            <div className="edit-tip">
              <i className="bi bi-person-check" aria-hidden="true" />
              <div>
                <h3>Student name</h3>
                <p>Check the spelling and full name.</p>
              </div>
            </div>

            <div className="edit-tip">
              <i className="bi bi-envelope" aria-hidden="true" />
              <div>
                <h3>Contact email</h3>
                <p>Make sure the address is correct.</p>
              </div>
            </div>

            <div className="edit-tip">
              <i className="bi bi-journal-text" aria-hidden="true" />
              <div>
                <h3>Course details</h3>
                <p>Confirm the student's current program.</p>
              </div>
            </div>

            <div className="edit-side-note">
              <i className="bi bi-info-circle me-2" aria-hidden="true" />
              Saving updates the existing record; it does not create a new
              student.
            </div>
          </section>

          <section className="edit-side-panel edit-help-panel">
            <h2>Need another record?</h2>
            <p>Return to the student list to view or manage other students.</p>
            <Link to="/students" className="edit-text-link">
              View all students
              <i className="bi bi-arrow-right ms-2" />
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
