const Auth = (() => {
    let user = null;
    let initialized = false;

    const listeners = [];

    firebase.auth().onAuthStateChanged(currentUser => {
        user = currentUser;
        initialized = true;

        listeners.forEach(callback => {
            callback(user);
        });
    });

    async function signIn(email, password) {
        const credential = await firebase.auth().signInWithEmailAndPassword(email, password);

        return credential.user;
    }

    async function signOut() {
        await firebase.auth().signOut();
    }

    function getUser() {
        return user;
    }

    function isAuthenticated() {
        return user !== null;
    }

    function onStateChanged(callback) {
        listeners.push(callback);

        if (initialized) {
            callback(user);
        }
    }

    return {
        signIn,
        signOut,
        getUser,
        isAuthenticated,
        onStateChanged
    };
})();
