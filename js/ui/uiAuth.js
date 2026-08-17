const UIAuth = (() => {
    let authContainer;
    let appContainer;

    function start() {
        cacheDOM();
    }

    function cacheDOM() {
        authContainer = document.getElementById("authContainer");
        appContainer = document.getElementById("appContainer");
    }

    function showAuth() {
        appContainer.hidden = true;

        renderAuth();
    }

    function showApp() {
        authContainer.replaceChildren();
        appContainer.hidden = false;
    }

    function renderAuth() {
        authContainer.replaceChildren();

        const screen = document.createElement("div");

        screen.className = "auth-screen";

        const card = document.createElement("div");

        card.className = "auth-card";

        const title = document.createElement("h1");

        title.className = "auth-title";
        title.textContent = "Event Toolkit";

        const inputEmail = document.createElement("input");

        inputEmail.type = "email";
        inputEmail.className = "auth-input";
        inputEmail.placeholder = "Email";
        inputEmail.autocomplete = "username";

        const inputPassword = document.createElement("input");

        inputPassword.type = "password";
        inputPassword.className = "auth-input";
        inputPassword.placeholder = "Password";
        inputPassword.autocomplete = "current-password";

        const error = document.createElement("div");

        error.className = "auth-error";

        const btnLogin = document.createElement("button");

        btnLogin.type = "button";
        btnLogin.className = "auth-button";
        btnLogin.textContent = "Sign in";

        bindLogin(btnLogin, inputEmail, inputPassword, error);

        card.append(title, inputEmail, inputPassword, error, btnLogin);

        screen.appendChild(card);
        authContainer.appendChild(screen);
    }

    function bindLogin(button, inputEmail, inputPassword, error) {
        button.addEventListener("click", async () => {
            error.textContent = "";

            const email = inputEmail.value.trim();
            const password = inputPassword.value;

            try {
                await Auth.signIn(email, password);
            } catch (loginError) {
                ErrorHandler.handle(loginError, "Signing in");

                error.textContent = "Invalid email or password.";
            }
        });
    }

    return {
        start,
        showAuth,
        showApp
    };
})();
