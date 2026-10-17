
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");
const API_URL = `${API_BASE_URL}/students`;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let errorData = null;

    try {
      errorData = await response.json();
      message =
        errorData.message ||
        errorData.error ||
        message;
    } catch {
      // Keep the default message if the response is not JSON.
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Get all students and support array or paginated responses.
export const getStudents = async ({
  page = 1,
  limit = 100,
  search,
  course,
  status,
  sortBy,
  order,
} = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  for (const [key, value] of Object.entries({
    search,
    course,
    status,
    sortBy,
    order,
  })) {
    if (value != null && value !== "") {
      params.set(key, String(value));
    }
  }

  const data = await request(`${API_URL}?${params}`);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.students)) {
    return data.students;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

export const getStudentStats = () => request(`${API_URL}/stats`);

// Get one student by ID.
export const getStudent = (id) =>
  request(`${API_URL}/${encodeURIComponent(id)}`);

// Create a student.
export const createStudent = (student) =>
  request(API_URL, {
    method: "POST",
    body: JSON.stringify(student),
  });

// Update a student.
export const updateStudent = (id, student) =>
  request(`${API_URL}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(student),
  });

// Delete a student.
export const deleteStudent = (id) =>
  request(`${API_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
