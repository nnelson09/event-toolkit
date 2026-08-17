const Auth = (() => {
    const listeners = [];

    let currentUser = null;
    let initialized = false;

    firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        initialized = true;

        notifyChanged();
    });

    async function signIn(email, password) {
        const credential = await firebase.auth().signInWithEmailAndPassword(email, password);

        return credential.user;
    }

    async function signOut() {
        await firebase.auth().signOut();
    }

    function getUser() {
        return currentUser;
    }

    function isAuthenticated() {
        return currentUser !== null;
    }

    function onStateChanged(callback) {
        listeners.push(callback);

        if (initialized) {
            callback(currentUser);
        }
    }

    function notifyChanged() {
        listeners.forEach(callback => {
            callback(currentUser);
        });
    }

    return {
        signIn,
        signOut,
        getUser,
        isAuthenticated,
        onStateChanged
    };
})();
