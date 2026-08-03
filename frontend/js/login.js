/* ============================================================
   LOGIN.JS
   Handles the login form: validation, submit, session storage,
   and redirect to the owner dashboard.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Auth.redirectIfAuthenticated();

  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('toggle-password');

  togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
  });

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach((el) => {
      el.textContent = '';
      el.classList.remove('show');
    });
  }

  function setError(inputId, message) {
    const el = document.getElementById(`${inputId}-error`);
    if (el) {
      el.textContent = message;
      el.classList.add('show');
    }
  }

  function validate() {
    clearErrors();
    let valid = true;

    if (!usernameInput.value.trim()) {
      setError('username', 'Username is required.');
      valid = false;
    }

    if (!passwordInput.value.trim()) {
      setError('password', 'Password is required.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const response = await API.login(usernameInput.value.trim(), passwordInput.value);

      Auth.saveSession(response.access, response.refresh, response.user);
      Toast.success(response.message || 'Login successful.');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (err) {
      /* Error toast already shown by api.js */
    }
  });
});
