const BASE_URL = "https://frontend-z3se.onrender.com";
/* -------------------- LOGIN USER -------------------- */
async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msgEl = document.getElementById("msg");

    if (!email || !password) {
        msgEl.innerText = "Please enter email & password";
        return;
    }

    try {
        const res = await fetch(BASE_URL + "/api/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: email,
                password: password
            })
        });
    
        const data = await res.json();
        console.log("LOGIN RESPONSE:", data);

        if (!res.ok) {
            msgEl.innerText = data.detail || "Invalid credentials";
            return;
        }

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("email", email);
        localStorage.setItem("name", data.name);
localStorage.setItem("role", data.role);

if (data.role === "admin") {
  window.location.href = "admin-dashboard.html";
} else {
  window.location.href = "dashboard.html";
}
    } catch (err) {
        console.error(err);
        msgEl.innerText = "Login failed. Please try again.";
    }
}
const dropdown = document.getElementById("dropdown");

if (dropdown) {
  dropdown.addEventListener("click", function () {
    const options = document.getElementById("roleOptions");
    options.style.display =
        options.style.display === "block" ? "none" : "block";
  });
}
/* -------------------- REGISTER USER -------------------- */

async function registerUser() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const prn = document.getElementById("prn").value.trim(); 
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;
    const msgEl = document.getElementById("reg_msg");

    if (!name || !email || !password || !role) {
        msgEl.innerText = "All fields are required";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                role: role
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Registration successful! Please login.");
            window.location.href = "login.html";
        } else {
            msgEl.innerText = data.message || "Registration failed";
        }

    } catch (err) {
        console.error(err);
        msgEl.innerText = "Server error. Please try again.";
    }
}
function toggleDropdown() {
    const options = document.getElementById("roleOptions");
    options.style.display =
        options.style.display === "block" ? "none" : "block";
}


function selectRole(event, value) {
    event.stopPropagation(); // stop bubbling

    document.getElementById("selectedRole").innerText =
        value.charAt(0).toUpperCase() + value.slice(1);

    document.getElementById("role").value = value;

    document.getElementById("roleOptions").style.display = "none";
}
document.addEventListener("click", function(e) {
    const options = document.getElementById("roleOptions");

    if (dropdown && options && !dropdown.contains(e.target)) {
        options.style.display = "none";
    }
});
/* -------------------- LOGOUT -------------------- */

function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}
document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.querySelector(".logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
});
function togglePassword() {
    const passwordInput = document.getElementById("password");
    const icon = document.querySelector(".toggle-icon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.innerText = "visibility_off";
    } else {
        passwordInput.type = "password";
        icon.innerText = "visibility";
    }
}