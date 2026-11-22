
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =====================================================
   RÉMORA - SUPABASE AUTHENTICATION
===================================================== */

const SUPABASE_URL = "https://mhtkzlnsqcpqnwzoqpfn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_EelD1sgSIahNOHm30_JYnA_Hp3bNvdn";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* =====================================================
   PAGE ELEMENTS
===================================================== */

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");

const switchText = document.getElementById("switchText");
const switchButton = document.getElementById("switchButton");

const authMessage = document.getElementById("authMessage");


/* =====================================================
   MESSAGE FUNCTION
===================================================== */

function showMessage(message, type = "error") {

    if (!authMessage) return;

    authMessage.textContent = message;
    authMessage.className = message ? type : "";

}


/* =====================================================
   BUTTON LOADING
===================================================== */

function setButtonLoading(button, loading, loadingText, normalText) {

    if (!button) return;

    button.disabled = loading;

    button.textContent = loading
        ? loadingText
        : normalText;

}


/* =====================================================
   SWITCH BETWEEN SIGN IN AND SIGN UP
===================================================== */

let showingSignup = false;

if (switchButton && loginForm && signupForm) {

    switchButton.addEventListener("click", () => {

        showingSignup = !showingSignup;

        loginForm.classList.toggle(
            "auth-hidden",
            showingSignup
        );

        signupForm.classList.toggle(
            "auth-hidden",
            !showingSignup
        );


        if (formTitle) {

            formTitle.textContent = showingSignup
                ? "Create Your Account"
                : "Welcome Back";

        }


        if (formSubtitle) {

            formSubtitle.textContent = showingSignup
                ? "Join the RÉMORA community"
                : "Sign in to your account";

        }


        if (switchText) {

            switchText.textContent = showingSignup
                ? "Already have an account?"
                : "Don't have an account?";

        }


        switchButton.textContent = showingSignup
            ? "Sign In"
            : "Sign Up";

        showMessage("");

    });

}


/* =====================================================
   SIGN UP
===================================================== */

if (signupForm) {

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const username =
            document.getElementById("signupUsername")?.value.trim() || "";

        const email =
            document.getElementById("signupEmail")?.value.trim().toLowerCase() || "";

        const password =
            document.getElementById("signupPassword")?.value || "";

        const confirmPassword =
            document.getElementById("confirmPassword")?.value || "";

        const signupButton =
            document.getElementById("signupButton");


        if (username.length < 3) {

            showMessage("Username must contain at least 3 characters.");

            return;

        }


        if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {

            showMessage(
                "Use only letters, numbers, dots, underscores or hyphens in your username."
            );

            return;

        }


        if (password.length < 6) {

            showMessage("Password must contain at least 6 characters.");

            return;

        }


        if (password !== confirmPassword) {

            showMessage("Passwords do not match.");

            return;

        }


        setButtonLoading(
            signupButton,
            true,
            "Creating Account...",
            "Create Account"
        );

        showMessage("");


        try {

            const { data, error } = await supabase.auth.signUp({

                email,

                password,

                options: {

                    data: {
                        username: username
                    }

                }

            });


            if (error) throw error;


            if (data.session) {

                showMessage(
                    "Your account has been created. Redirecting...",
                    "success"
                );

                window.setTimeout(() => {

                    window.location.href = "index.html";

                }, 900);

            } else {

                showMessage(
                    "Account created. Please check your email and confirm your address before signing in.",
                    "success"
                );

            }


        } catch (error) {

            console.error("Sign-up error:", error);

            const message = (error?.message || "").toLowerCase();


            if (
                message.includes("already registered") ||
                message.includes("already been registered")
            ) {

                showMessage(
                    "This email is already registered. Please sign in instead."
                );

            } else if (message.includes("password")) {

                showMessage(error.message);

            } else if (message.includes("email")) {

                showMessage(error.message);

            } else {

                showMessage(
                    error?.message ||
                    "Could not create your account. Please try again."
                );

            }


        } finally {

            setButtonLoading(
                signupButton,
                false,
                "Creating Account...",
                "Create Account"
            );

        }

    });

}


/* =====================================================
   SIGN IN
   Supabase password authentication uses email.
===================================================== */

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const email =
            document.getElementById("loginIdentifier")?.value.trim().toLowerCase() || "";

        const password =
            document.getElementById("loginPassword")?.value || "";

        const loginButton =
            document.getElementById("loginButton");


        if (!email || !email.includes("@")) {

            showMessage(
                "Please enter the email address you used to create your account."
            );

            return;

        }


        if (!password) {

            showMessage("Please enter your password.");

            return;

        }


        setButtonLoading(
            loginButton,
            true,
            "Signing In...",
            "Sign In"
        );

        showMessage("");


        try {

            const { data, error } =
                await supabase.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) throw error;


            if (!data.session) {

                throw new Error(
                    "Sign-in completed but no active session was returned. Please try again."
                );

            }


            showMessage(
                "Signed in successfully. Redirecting...",
                "success"
            );


            window.setTimeout(() => {

                window.location.href = "index.html";

            }, 700);


        } catch (error) {

            console.error("Sign-in error:", error);

            const message = (error?.message || "").toLowerCase();


            if (message.includes("email not confirmed")) {

                showMessage(
                    "Please confirm your email address using the link sent to your inbox."
                );

            } else if (message.includes("invalid login credentials")) {

                showMessage(
                    "Incorrect email or password. Please try again."
                );

            } else {

                showMessage(
                    error?.message ||
                    "Could not sign in. Please try again."
                );

            }


        } finally {

            setButtonLoading(
                loginButton,
                false,
                "Signing In...",
                "Sign In"
            );

        }

    });

}


/* =====================================================
   UPDATE CUSTOMER ACCOUNT LINK
===================================================== */

function updateCustomerNavbar(user) {

    const usernameLink =
        document.getElementById("customerUsername");

    const logoutButton =
        document.getElementById("logoutButton");


    if (!usernameLink || !logoutButton) return;


    if (user) {

        const username =
            user.user_metadata?.username ||
            user.email?.split("@")[0] ||
            "My Account";


        usernameLink.textContent = username;

        usernameLink.href = "#";

        logoutButton.classList.remove(
            "customer-auth-hidden"
        );


    } else {

        usernameLink.textContent = "Sign In";

        usernameLink.href = "auth.html";

        logoutButton.classList.add(
            "customer-auth-hidden"
        );

    }

}


/* =====================================================
   CHECK EXISTING SESSION
===================================================== */

async function checkSession() {

    try {

        const { data, error } =
            await supabase.auth.getSession();


        if (error) throw error;


        updateCustomerNavbar(
            data.session?.user || null
        );


    } catch (error) {

        console.error(
            "Could not check authentication session:",
            error
        );

    }

}


checkSession();


/* =====================================================
   LISTEN FOR LOGIN / LOGOUT CHANGES
===================================================== */

supabase.auth.onAuthStateChange(
    (_event, session) => {

        updateCustomerNavbar(
            session?.user || null
        );

    }
);


/* =====================================================
   LOG OUT
===================================================== */

const logoutButton =
    document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        logoutButton.disabled = true;


        try {

            const { error } =
                await supabase.auth.signOut();


            if (error) throw error;


            window.location.href = "index.html";


        } catch (error) {

            console.error("Logout error:", error);

            alert(
                error?.message ||
                "Could not log out. Please try again."
            );

            logoutButton.disabled = false;

        }

    });

}
