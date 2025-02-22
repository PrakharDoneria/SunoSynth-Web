// pages/signup.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { PulseLoader } from 'react-spinners';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/SignupPage.module.css'; 

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [fade, setFade] = useState(0);
    const [obscurePassword, setObscurePassword] = useState(true);
    const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);

    useEffect(() => {
        setFade(1);
    }, []);

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Send email verification
            await sendEmailVerification(userCredential.user);

            // Grant signup bonus (call your API endpoint)
            const bonusGranted = await grantSignupBonus(userCredential.user.uid);

            if (!bonusGranted) {
                console.warn('Failed to grant signup bonus.');
                setError('Account created, but failed to grant signup bonus. Please contact support.');
            } else {
                setError('Account created, but failed to grant signup bonus. Please contact support.');
            }

            alert('A verification link has been sent to your email. Please verify to continue.');  //Replace with better UI notification

            router.push('/dashboard');
        } catch (err) {
            let errorMessage = 'Failed to create account';
            switch (err.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format';
                    break;
                default:
                    errorMessage = err.message || 'Account creation failed';
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const grantSignupBonus = async (uid) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_SUNOSYNTH_API_URL; // use env var
            const url = `${baseUrl}/credits/save`;  // Correct endpoint
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uid: uid, amount: 5.0 }),
            });

            if (response.ok) {
                const data = await response.json();
                return data.success === true;
            } else {
                console.error(`Grant bonus failed with status code: ${response.status}, body: ${await response.text()}`);
                return false;
            }
        } catch (error) {
            console.error('Error granting bonus:', error);
            return false;
        }
    };


    return (
        <div className={styles.container}>
            <div className={`${styles.signupForm} opacity-${fade * 100}`}>
                <h2 className={styles.heading}>Create Account</h2>
                <form onSubmit={handleSignup}>
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
                                type={obscurePassword ? 'password' : 'text'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setObscurePassword(!obscurePassword)}
                                className={styles.passwordToggleButton}
                            >
                                <FontAwesomeIcon icon={obscurePassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword" className={styles.label}>
                            Confirm Password
                        </label>
                        <div className={styles.passwordInputContainer}>
                            <input
                                className={styles.input}
                                id="confirmPassword"
                                type={obscureConfirmPassword ? 'password' : 'text'}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setObscureConfirmPassword(!obscureConfirmPassword)}
                                className={styles.passwordToggleButton}
                            >
                                <FontAwesomeIcon icon={obscureConfirmPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.passwordRequirements}>
                        <h3 className={styles.requirementsHeading}>Password requirements:</h3>
                        <ul className={styles.requirementsList}>
                            <li>At least 6 characters</li>
                            <li>Combination of letters and numbers recommended</li>
                            <li>Avoid using easily guessed information</li>
                        </ul>
                    </div>

                    <button
                        className={styles.signupButton}
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <PulseLoader color="white" size={8} /> Loading...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                </form>

                {error && (
                    <div className={styles.error}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

            </div>
        </div>
    );
};

export default SignupPage;