const form = document.querySelector('.form-container sign-in-container');
const usernameInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const message = document.getElementById('message');

form.addEventListener('button 1', (event) => {
    event.preventDefault();
    if (usernameInput.value === 'example@email.com' && passwordInput.value === 'password') {
        // Gebruiker is ingelogd
        window.location.href = 'index.html';
    } else {
        // Foutmelding weergeven
        message.textContent = 'Gebruikersnaam of wachtwoord onjuist.';
    }
});
