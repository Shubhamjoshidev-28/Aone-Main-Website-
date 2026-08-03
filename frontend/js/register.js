/* ============================================================
   REGISTER.JS
   Handles owner registration: validation, submit and redirect
   to login once the account is created.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Auth.redirectIfAuthenticated();

  const form = document.getElementById('register-form');
  const nameInput = document.getElementById('name');
  const usernameInput = document.getElementById('reg-username');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('reg-password');
  const confirmPasswordInput = document.getElementById('confirm-password');

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

    if (!nameInput.value.trim()) {
      setError('name', 'Name is required.');
      valid = false;
    }

    if (!usernameInput.value.trim()) {
      setError('reg-username', 'Username is required.');
      valid = false;
    }

    if (!phoneInput.value.trim() || !/^\d{7,15}$/.test(phoneInput.value.trim())) {
      setError('phone', 'Enter a valid phone number.');
      valid = false;
    }

    if (!passwordInput.value || passwordInput.value.length < 6) {
      setError('reg-password', 'Password must be at least 6 characters.');
      valid = false;
    }

    if (confirmPasswordInput.value !== passwordInput.value) {
      setError('confirm-password', 'Passwords do not match.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      Name: nameInput.value.trim(),
      username: usernameInput.value.trim(),
      Phone_No: phoneInput.value.trim(),
      password: passwordInput.value,
      confirm_password: confirmPasswordInput.value
    };

    try {
      const response = await API.register(payload);
      Toast.success(response.message || 'Owner account created successfully.');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 700);
    } catch (err) {
      /* Error toast already shown by api.js */
    }
  });
});
