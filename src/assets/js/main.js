window.addEventListener('load', () => {

    const signIn = document.querySelectorAll('.c-signin');
    if (signIn.length > 0) {
        console.log('page sign in here!');
        
        const signUpButton = document.getElementById('signUp');
        const signInButton = document.getElementById('signIn');
        const wrapper = document.getElementById('wrapper');

        signUpButton.addEventListener('click', () => {
            wrapper.classList.add("active");
        });

        signInButton.addEventListener('click', () => {
            wrapper.classList.remove("active");
        });
    }

});