import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
} from "firebase/auth";
import { PulseLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/LoginPage.module.css";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [fade, setFade] = useState(0);
    const [obscurePassword, setObscurePassword] = useState(true);

    useEffect(() => {
        setFade(1);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const auth = getAuth();
            await signInWithEmailAndPassword(auth, email, password);
            // Login successful
            router.push("/dashboard");
        } catch (err) {
            let errorMessage = "Authentication failed";
            switch (err.code) {
                case "auth/user-not-found":
                    errorMessage = "No user found with this email";
                    break;
                case "auth/wrong-password":
                    errorMessage = "Incorrect password";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email format";
                    break;
                default:
                    errorMessage = err.message || "Authentication failed";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Please enter your email address first");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const auth = getAuth();
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent");
        } catch (err) {
            let errorMessage = "Failed to send password reset email";
            if (err.code === "auth/user-not-found") {
                errorMessage = "No user found with this email";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div
                className={styles.loginForm}
                style={{ opacity: fade }} // Apply fade using inline style
            >
                <div className={styles.iconContainer}>
                    <FontAwesomeIcon icon="lock" className={styles.lockIcon} />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className={styles.lockIconSvg}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a3 3 0 00-3-3H7.5a3 3 0 00-3 3v10.5a3 3 0 003 3h7.5a3 3 0 003-3V13.5m-3 0h3m-3 0h-3"
                        />
                    </svg>
                </div>
                <h2 className={styles.heading}>Welcome back</h2>
                <p className={styles.subheading}>
                    Sign in to access your account
                </p>
                <form onSubmit={handleLogin}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email
                        </label>
                        <input
                            className={styles.input}
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <div className={styles.passwordInputContainer}>
                            <input
                                className={styles.input}
                                id="password"
                                type={obscurePassword ? "password" : "text"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setObscurePassword(!obscurePassword)
                                }
                                className={styles.passwordToggleButton}
                            >
                                <FontAwesomeIcon
                                    icon={obscurePassword ? faEyeSlash : faEye}
                                />
                            </button>
                        </div>
                        <p className={styles.forgotPassword}>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                            >
                                Forgot Password?
                            </button>
                        </p>
                    </div>
                    <button
                        className={styles.loginButton}
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <PulseLoader color="white" size={8} />{" "}
                                Loading...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>
                <div className={styles.signupLink}>
                    Don&apos;t have an account?{" "}
                    <button onClick={() => router.push("/signup")}>
                        Create Account
                    </button>
                </div>

                {error && (
                    <div className={styles.error}>
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
