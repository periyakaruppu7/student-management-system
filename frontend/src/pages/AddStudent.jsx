
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createStudent } from "../api/students";
import "./AddStudent.css";

const initialForm = {
  name: "",
  email: "",
  age: "",
  course: "",
  studentId: "",
  phone: "",
  department: "",
  yearOfStudy: "",
  semester: "",
  gender: "",
  academicStatus: "Active",
  address: "",
  profileImage: "",
};
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s()-]{7,20}$/;

export default function AddStudent() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imagePreview = form.profileImage.trim();

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  }

  function validateForm() {
    const name = form.name.trim();
    const email = form.email.trim();
    const course = form.course.trim();
    const age = Number(form.age);

    if (!name || !email || !form.age || !course) {
      return "Please complete all required fields.";
    }

    if (name.length < 2) {
      return "Name must contain at least 2 characters.";
    }

    if (!emailRegex.test(email)) {
      return "Enter a valid email address.";
    }

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return "Enter a valid whole-number age between 1 and 120.";
    }

    if (form.phone.trim() && !phoneRegex.test(form.phone.trim())) {
      return "Enter a valid phone number.";
    }

    if (
      form.yearOfStudy &&
      (!Number.isInteger(Number(form.yearOfStudy)) ||
        Number(form.yearOfStudy) < 1 ||
        Number(form.yearOfStudy) > 10)
    ) {
      return "Year of study must be between 1 and 10.";
    }

    if (
      form.semester &&
      (!Number.isInteger(Number(form.semester)) ||
        Number(form.semester) < 1 ||
        Number(form.semester) > 20)
    ) {
      return "Semester must be between 1 and 20.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      age: Number(form.age),
      course: form.course.trim(),
      academicStatus: form.academicStatus,
    };

    // Save the profile image URL when provided.
    if (form.profileImage.trim()) {
      payload.profileImage = form.profileImage.trim();
    }

    // Include optional fields only when the user has entered a value.
    if (form.studentId.trim()) {
      payload.studentId = form.studentId.trim().toUpperCase();
    }

    if (form.phone.trim()) {
      payload.phone = form.phone.trim();
    }

    if (form.department.trim()) {
      payload.department = form.department.trim();
    }

    if (form.yearOfStudy) {
      payload.yearOfStudy = Number(form.yearOfStudy);
    }

    if (form.semester) {
      payload.semester = Number(form.semester);
    }

    if (form.gender) {
      payload.gender = form.gender;
    }

    if (form.address.trim()) {
      payload.address = {
        street: form.address.trim(),
        country: "India",
      };
    }

    setSaving(true);

    try {
      await createStudent(payload);

      navigate("/students", {
        replace: true,
        state: {
          message: "Student added successfully.",
        },
      });
    } catch (err) {
      const status = err.status;
      const serverMessage = err.data?.message;

      if (status === 409) {
        setError(
          serverMessage || "This email or student ID is already registered."
        );
      } else if (status === 400) {
        setError(serverMessage || "Please check the entered information.");
      } else if (!status) {
        setError(
          "Unable to connect to the server. Check that your backend is running."
        );
      } else {
        setError(serverMessage || "Unable to save the student. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm({ ...initialForm });
    setError("");
  }

  return (
    <main className="add-student-page">
      <nav className="add-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <span>/</span>
        <Link to="/students">Students</Link>
        <span>/</span>
        <span className="current">Add student</span>
      </nav>

      <header className="add-page-header">
        <div>
          <span className="add-page-kicker">STUDENT RECORDS</span>
          <h1>Add a student</h1>
          <p>Create a student record by entering the details below.</p>
        </div>

        <Link to="/students" className="add-back-link">
          <i className="bi bi-arrow-left" aria-hidden="true" />
          <span>Back to students</span>
        </Link>
      </header>

      <div className="add-layout">
        <section className="add-form-card">
          <div className="add-card-header">
            <div>
              <h2>Student information</h2>
              <p>
                Fields marked with <span>*</span> are required.
              </p>
            </div>
            <i
              className="bi bi-person-vcard add-header-icon"
              aria-hidden="true"
            />
          </div>

          {error && (
            <div className="add-error" role="alert" aria-live="polite">
              <i className="bi bi-exclamation-circle" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="add-form-section">
              <div className="add-section-heading">
                <span className="add-section-number">01</span>
                <div>
                  <h3>Personal details</h3>
                  <p>Basic information and contact details.</p>
                </div>
              </div>

              <div className="add-fields-grid">
                <div className="add-field">
                  <label htmlFor="student-name">
                    Full name <span>*</span>
                  </label>
                  <input
                    id="student-name"
                    name="name"
                    type="text"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={100}
                    autoComplete="name"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="add-profile-upload">
                  <div className="add-profile-preview">
                    {imagePreview && !imageError ? (
                      <img
                        src={imagePreview}
                        alt="Student profile preview"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <i className="bi bi-person" aria-hidden="true" />
                    )}
                  </div>

                  <div className="add-profile-controls">
                    <label htmlFor="student-profile-image">
                      Profile image URL
                    </label>

                    <input
                      id="student-profile-image"
                      name="profileImage"
                      type="url"
                      placeholder="https://example.com/student.jpg"
                      value={form.profileImage}
                      onChange={(event) => {
                        handleChange(event);
                        setImageError(false);
                      }}
                      maxLength={2048}
                      disabled={saving}
                    />

                    <small>
                      Enter a publicly accessible image URL. JPG, PNG, and WebP are
                      recommended.
                    </small>
                  </div>
                </div>

                <div className="add-field">
                  <label htmlFor="student-email">
                    Email address <span>*</span>
                  </label>
                  <input
                    id="student-email"
                    name="email"
                    type="email"
                    placeholder="student@example.com"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={254}
                    autoComplete="email"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="add-field">
                  <label htmlFor="student-age">
                    Age <span>*</span>
                  </label>
                  <input
                    id="student-age"
                    name="age"
                    type="number"
                    placeholder="Enter age"
                    min="1"
                    max="120"
                    step="1"
                    value={form.age}
                    onChange={handleChange}
                    required
                    disabled={saving}
                  />
                  <small>Whole number between 1 and 120.</small>
                </div>

                <div className="add-field">
                  <label htmlFor="student-gender">Gender</label>
                  <select
                    id="student-gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">
                      Prefer not to say
                    </option>
                  </select>
                </div>

                <div className="add-field">
                  <label htmlFor="student-phone">Phone number</label>
                  <input
                    id="student-phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={20}
                    autoComplete="tel"
                    disabled={saving}
                  />
                </div>

                <div className="add-field">
                  <label htmlFor="student-address">Address</label>
                  <input
                    id="student-address"
                    name="address"
                    type="text"
                    placeholder="Street address"
                    value={form.address}
                    onChange={handleChange}
                    maxLength={250}
                    autoComplete="street-address"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div className="add-form-section add-academic-section">
              <div className="add-section-heading">
                <span className="add-section-number">02</span>
                <div>
                  <h3>Academic details</h3>
                  <p>Course, department and current academic status.</p>
                </div>
              </div>

              <div className="add-fields-grid">
                <div className="add-field">
                  <label htmlFor="student-id">Student ID</label>
                  <input
                    id="student-id"
                    name="studentId"
                    type="text"
                    placeholder="e.g. STU2026001"
                    value={form.studentId}
                    onChange={handleChange}
                    maxLength={50}
                    disabled={saving}
                  />
                  <small>Leave blank if the ID is assigned later.</small>
                </div>

                <div className="add-field">
                  <label htmlFor="student-course">
                    Course or programme <span>*</span>
                  </label>
                  <input
                    id="student-course"
                    name="course"
                    type="text"
                    placeholder="e.g. Computer Science Engineering"
                    value={form.course}
                    onChange={handleChange}
                    maxLength={100}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="add-field">
                  <label htmlFor="student-department">Department</label>
                  <input
                    id="student-department"
                    name="department"
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={form.department}
                    onChange={handleChange}
                    maxLength={100}
                    disabled={saving}
                  />
                </div>

                <div className="add-field">
                  <label htmlFor="student-year">Year of study</label>
                  <select
                    id="student-year"
                    name="yearOfStudy"
                    value={form.yearOfStudy}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">Select year</option>
                    {[1, 2, 3, 4, 5, 6].map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="add-field">
                  <label htmlFor="student-semester">Semester</label>
                  <select
                    id="student-semester"
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">Select semester</option>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map(
                      (semester) => (
                        <option key={semester} value={semester}>
                          Semester {semester}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="add-field">
                  <label htmlFor="student-status">Academic status</label>
                  <select
                    id="student-status"
                    name="academicStatus"
                    value={form.academicStatus}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="add-form-actions">
              <p>
                <i className="bi bi-info-circle" aria-hidden="true" />
                Review the information before saving.
              </p>

              <div className="add-action-buttons">
                <button
                  type="button"
                  className="add-btn add-reset-btn"
                  onClick={handleReset}
                  disabled={saving}
                >
                  Reset
                </button>

                <Link to="/students" className="add-btn add-cancel-btn">
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="add-btn add-submit-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2" aria-hidden="true" />
                      <span>Save student</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="add-sidebar">
          <section className="add-sidebar-card">
            <h2>Before you save</h2>
            <p className="add-sidebar-intro">
              A quick check to help keep your records accurate.
            </p>

            <div className="add-check-item">
              <i className="bi bi-person-check" aria-hidden="true" />
              <div>
                <strong>Student details</strong>
                <p>Use the student's correct full name and age.</p>
              </div>
            </div>

            <div className="add-check-item">
              <i className="bi bi-envelope" aria-hidden="true" />
              <div>
                <strong>Contact information</strong>
                <p>Check the email address and phone number.</p>
              </div>
            </div>

            <div className="add-check-item">
              <i className="bi bi-book" aria-hidden="true" />
              <div>
                <strong>Academic information</strong>
                <p>Confirm the course, department and status.</p>
              </div>
            </div>

            <div className="add-sidebar-note">
              <i className="bi bi-shield-check" aria-hidden="true" />
              <p>Only submit information you have checked.</p>
            </div>
          </section>

          <section className="add-sidebar-help">
            <i className="bi bi-question-circle" aria-hidden="true" />
            <div>
              <strong>Managing existing records?</strong>
              <Link to="/students">
                View student list <i className="bi bi-arrow-right" />
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <footer className="add-page-footer">
        <span>Student Management System</span>
        <span>Student records / New entry</span>
      </footer>
    </main>
  );
}
