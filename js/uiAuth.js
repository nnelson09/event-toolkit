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

        renderLogin();
    }

    function showApp() {
        authContainer.replaceChildren();
        appContainer.hidden = false;
    }

    function renderLogin() {
        authContainer.replaceChildren();

        const screen = document.createElement("div");
        screen.className = "auth-screen";

        const card = document.createElement("div");
        card.className = "auth-card";

        const title = document.createElement("h1");
        title.className = "auth-title";
        title.textContent = "Eventos";

        const inputEmail = document.createElement("input");
        inputEmail.type = "email";
        inputEmail.className = "auth-input";
        inputEmail.placeholder = "Email";
        inputEmail.autocomplete = "username";

        const inputPassword = document.createElement("input");
        inputPassword.type = "password";
        inputPassword.className = "auth-input";
        inputPassword.placeholder = "Contraseña";
        inputPassword.autocomplete = "current-password";

        const error = document.createElement("div");
        error.className = "auth-error";

        const btnSignIn = document.createElement("button");
        btnSignIn.type = "button";
        btnSignIn.className = "auth-button";
        btnSignIn.textContent = "Entrar";

        btnSignIn.addEventListener("click", async () => {
            error.textContent = "";

            try {
                await Auth.signIn(inputEmail.value, inputPassword.value);
            } catch (signInError) {
                console.error(signInError);

                error.textContent = "Datos incorrectos.";
            }
        });

        card.append(title, inputEmail, inputPassword, error, btnSignIn);
        screen.appendChild(card);
        authContainer.appendChild(screen);
    }

    return {
        start,
        showAuth,
        showApp
    };
})();
