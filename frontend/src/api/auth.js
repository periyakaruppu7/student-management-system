import portalClient from "./portalClient";

export async function login(email, password) {
  const { data } = await portalClient.post("/auth/login", {
    email,
    password,
  });

  localStorage.setItem("portalToken", data.token);
  localStorage.setItem(
    "portalUser",
    JSON.stringify(data.user)
  );

  return data;
}

export function logout() {
  localStorage.removeItem("portalToken");
  localStorage.removeItem("portalUser");
}

export function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("portalUser") || "null"
    );
  } catch {
    return null;
  }
}