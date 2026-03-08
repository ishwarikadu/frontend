const BASE_URL = "https://frontend-z3se.onrender.com";

export async function apiRequest(endpoint, options = {}) {
  const access = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");

  options.headers = {
    ...(options.headers || {}),
  };

  // Only attach Authorization if we have access token
  if (access) {
    options.headers.Authorization = `Bearer ${access}`;
  }

  let response = await fetch(BASE_URL + endpoint, options);

  // If access expired → try refresh
  if (response.status === 401 && refresh) {
    const refreshResponse = await fetch(BASE_URL + "/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      localStorage.setItem("access", data.access);

      // Retry original request with new token
      options.headers.Authorization = `Bearer ${data.access}`;
      response = await fetch(BASE_URL + endpoint, options);
    } else {
      // Refresh expired → logout
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }
  }

  return response;
}