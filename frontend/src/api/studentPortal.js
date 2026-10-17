import portalClient from "./portalClient";

// Student portal
export async function getStudentDashboard() {
  return (await portalClient.get("/student-portal/dashboard")).data;
}

export async function getAvailableCourses() {
  return (await portalClient.get("/student-portal/courses/catalog")).data;
}

export async function getMyCourses() {
  return (await portalClient.get("/student-portal/courses")).data;
}

export async function enrollInCourse(courseId) {
  return (
    await portalClient.post(
      `/student-portal/courses/${encodeURIComponent(courseId)}/enroll`
    )
  ).data;
}

export async function getMyMaterials() {
  return (await portalClient.get("/student-portal/materials")).data;
}

export async function getMyAnnouncements() {
  return (await portalClient.get("/student-portal/announcements")).data;
}

// Admin: students and accounts
export async function getAdminStudents() {
  return (await portalClient.get("/admin/students")).data;
}

export async function createStudentAccount(studentId, password) {
  return (
    await portalClient.post(
      `/admin/students/${encodeURIComponent(studentId)}/account`,
      { password }
    )
  ).data;
}

// Admin: courses
export async function getAdminCourses() {
  return (await portalClient.get("/admin/courses")).data;
}

export async function createCourse(payload) {
  return (await portalClient.post("/admin/courses", payload)).data;
}

export async function enrollStudent(courseId, studentId) {
  return (
    await portalClient.post(
      `/admin/courses/${encodeURIComponent(courseId)}/enroll`,
      { studentId }
    )
  ).data;
}

// Admin: materials
export async function getAdminMaterials() {
  return (await portalClient.get("/admin/materials")).data;
}

export async function createMaterial(payload) {
  return (await portalClient.post("/admin/materials", payload)).data;
}

export async function deleteMaterial(id) {
  return (
    await portalClient.delete(
      `/admin/materials/${encodeURIComponent(id)}`
    )
  ).data;
}

// Admin: announcements
export async function getAdminAnnouncements() {
  return (await portalClient.get("/admin/announcements")).data;
}

export async function createAnnouncement(payload) {
  return (await portalClient.post("/admin/announcements", payload)).data;
}

export async function deleteAnnouncement(id) {
  return (
    await portalClient.delete(
      `/admin/announcements/${encodeURIComponent(id)}`
    )
  ).data;
}
