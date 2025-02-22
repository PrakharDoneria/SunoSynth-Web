import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { getAuth, signOut } from "firebase/auth";
import { PulseLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMusic,
    faSave,
    faSignOutAlt,
    faPlay,
    faPause,
    faStop,
    faSpinner,
    faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/DashboardScreen.module.css";

const DashboardPage = () => {
    const [credits, setCredits] = useState(0);
    const [title, setTitle] = useState("");
    const [lyrics, setLyrics] = useState("");
    const [selectedStyle, setSelectedStyle] = useState("Hip-Hop");
    const [audioPath, setAudioPath] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [customStyle, setCustomStyle] = useState("");
    const [titleCharacterCount, setTitleCharacterCount] = useState(0);
    const [lyricsCharacterCount, setLyricsCharacterCount] = useState(0);
    const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
    const audioRef = useRef(null);
    const router = useRouter();

    const stylesArray = [
        "Hip-Hop",
        "Rock",
        "Pop",
        "Jazz",
        "Classical",
        "Custom",
    ];

    useEffect(() => {
        loadCredits();
    }, []);

    useEffect(() => {
        if (audioPath) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, [audioPath]);

    const loadCredits = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                toast.error("User not signed in.");
                return;
            }
            const baseUrl = process.env.NEXT_PUBLIC_SUNOSYNTH_API_URL;
            const response = await fetch(
                `${baseUrl}/credits/fetch?uid=${user.uid}`,
            );
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCredits(data.credits);
                } else {
                    toast.error(`Failed to load credits: ${data.message}`);
                }
            } else {
                toast.error(`Failed to load credits: ${response.status}`);
            }
        } catch (error) {
            toast.error(`Error loading credits: ${error.message}`);
        }
    };

    const deductCredits = async (amount) => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            const baseUrl = process.env.NEXT_PUBLIC_SUNOSYNTH_API_URL;
            const response = await fetch(`${baseUrl}/credits/deduce`, {
                // Changed endpoint to /deduce
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user.uid, amount }), // Pass as JSON body
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCredits(data.credits);
                    loadCredits();
                } else {
                    toast.error(`Failed to deduct credits: ${data.message}`);
                }
            } else {
                toast.error(`Failed to deduct credits: ${response.status}`);
            }
        } catch (error) {
            toast.error(`Error deducting credits: ${error.message}`);
        }
    };

    const generateMusic = async () => {
        if (credits < 10) {
            toast.error("Not enough credits! You need 10 credits");
            return;
        }
        if (!title || !lyrics) {
            toast.error("Please fill in all fields!");
            return;
        }
        if (title.length > 30) {
            toast.error("Title exceeds the 30 character limit.");
            return;
        }

        if (lyrics.length > 2000) {
            toast.error("Lyrics exceed the 2000 character limit.");
            return;
        }
        if (selectedStyle === "Custom" && !customStyle) {
            toast.error("Please enter a custom style!");
            return;
        }

        setIsLoading(true);
        setAudioPath(null);

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            const baseUrl = process.env.NEXT_PUBLIC_SUNOSYNTH_API_URL;
            const response = await fetch(`${baseUrl}/suno/generate-music`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: user.uid,
                    title: title,
                    lyrics: lyrics,
                    style:
                        selectedStyle === "Custom"
                            ? customStyle
                            : selectedStyle,
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setAudioPath(url);
                await deductCredits(10); // Deduct credits for music generation
                toast.success("Music generated successfully! 🎵");
            } else {
                const data = await response.json();
                toast.error(
                    `Generation failed: ${data.message || "Unknown error"}`,
                );
            }
        } catch (error) {
            toast.error(`Error generating music: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const generateLyrics = async (prompt) => {
        if (credits < 5) {
            toast.error(
                "Not enough credits! You need 5 credits to generate lyrics.",
            );
            return;
        }

        setIsGeneratingLyrics(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_SUNOSYNTH_VERCEL_API_URL;
            const response = await fetch(`${baseUrl}/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ input: prompt }),
            });

            if (response.ok) {
                const data = await response.json();
                setLyrics(data.response || "AI failed to generate lyrics.");
                setLyricsCharacterCount(data.response.length || 0);
                await deductCredits(5); // Deduct credits for lyrics generation
                toast.success("AI Lyrics generated successfully! 🎶");
            } else {
                const data = await response.json();
                toast.error(
                    `Failed to generate AI lyrics: ${data.message || "Unknown error"}`,
                );
            }
        } catch (error) {
            toast.error(`Error generating AI lyrics: ${error.message}`);
        } finally {
            setIsGeneratingLyrics(false);
        }
    };

    const showLyricsPromptDialog = () => {
        const prompt = window.prompt(
            "Enter a prompt to guide the AI lyrics generation:",
            "A love song in a rainy city",
        );
        if (prompt) {
            generateLyrics(prompt);
        }
    };

    const playPauseAudio = () => {
        if (!audioPath) return;
        const audioElement = audioRef.current;

        if (isPlaying) {
            audioElement.pause();
            setIsPlaying(false);
        } else {
            audioElement.play();
            setIsPlaying(true);
        }
    };

    const stopAudio = () => {
        if (!audioPath) return;
        const audioElement = audioRef.current;
        audioElement.pause();
        audioElement.currentTime = 0;
        setIsPlaying(false);
    };

    const downloadMusic = async () => {
        if (!audioPath || isLoading) return; // Prevent multiple downloads
        if (credits < 2) {
            toast.error("Not enough credits! You need 2 credits to download.");
            return;
        }

        setIsLoading(true);
        try {
            const link = document.createElement("a");
            link.href = audioPath;
            link.setAttribute("download", `${title || "suno_synth_music"}.mp3`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            await deductCredits(2); // Deduct credits for downloading music
            toast.success("Download started! Enjoy your music.");
        } catch (error) {
            toast.error(`Error downloading music: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStyleChange = (e) => {
        setSelectedStyle(e.target.value);
    };

    const getCreditColor = () => {
        if (credits >= 50) return styles.textGreen500;
        if (credits >= 20) return styles.textYellow500;
        return styles.textRed500;
    };

    const handleSignOut = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            toast.error(`Sign out failed: ${error.message}`);
        }
    };

    return (
        <>
            <Head>
                <title>SunoSynth - Dashboard</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.background}>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
                <div className={styles.container}>
                    <div className={styles.content}>
                        <h1 className={styles.heading}>
                            <FontAwesomeIcon icon={faMusic} className="mr-2" />
                            SunoSynth Dashboard
                        </h1>
                        <div className={styles.credits}>
                            <span className={styles.creditLabel}>Credits:</span>
                            <span
                                className={`${styles.creditValue} ${getCreditColor()}`}
                            >
                                {credits}
                            </span>
                        </div>
                        <div className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="title" className={styles.label}>
                                    Song Title (Max 30 characters)
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    className={styles.input}
                                    placeholder="Enter song title"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setTitleCharacterCount(
                                            e.target.value.length,
                                        );
                                    }}
                                    maxLength={30}
                                />
                                <p className={styles.characterCount}>
                                    {titleCharacterCount}/30 characters
                                </p>
                            </div>
                            <div className={styles.formGroup}>
                                <label
                                    htmlFor="lyrics"
                                    className={styles.label}
                                >
                                    Lyrics (Max 2000 characters)
                                </label>
                                <div className={styles.lyricsContainer}>
                                    <textarea
                                        id="lyrics"
                                        rows="4"
                                        className={styles.textarea}
                                        placeholder="Enter lyrics"
                                        value={lyrics}
                                        onChange={(e) => {
                                            setLyrics(e.target.value);
                                            setLyricsCharacterCount(
                                                e.target.value.length,
                                            );
                                        }}
                                        maxLength={2000}
                                    />
                                    <button
                                        type="button"
                                        onClick={showLyricsPromptDialog}
                                        className={styles.generateLyricsButton}
                                        disabled={isGeneratingLyrics}
                                    >
                                        {isGeneratingLyrics ? (
                                            <>
                                                <FontAwesomeIcon
                                                    icon={faSpinner}
                                                    spin
                                                    className="mr-2"
                                                />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon
                                                    icon={faFileAlt}
                                                    className="mr-2"
                                                />
                                                Generate Lyrics
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className={styles.characterCount}>
                                    {lyricsCharacterCount}/2000 characters
                                </p>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="style" className={styles.label}>
                                    Music Style
                                </label>
                                <select
                                    id="style"
                                    className={styles.select}
                                    value={selectedStyle}
                                    onChange={handleStyleChange}
                                >
                                    {stylesArray.map((style) => (
                                        <option key={style} value={style}>
                                            {style}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedStyle === "Custom" && (
                                <div className={styles.formGroup}>
                                    <label
                                        htmlFor="custom-style"
                                        className={styles.label}
                                    >
                                        Custom Style (e.g., India Bollywood,
                                        Romantic)
                                    </label>
                                    <input
                                        type="text"
                                        id="custom-style"
                                        className={styles.input}
                                        placeholder="Enter custom style"
                                        value={customStyle}
                                        onChange={(e) =>
                                            setCustomStyle(e.target.value)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        <div className={styles.generateButtonContainer}>
                            <button
                                onClick={generateMusic}
                                disabled={isLoading}
                                className={styles.generateButton}
                            >
                                {isLoading ? (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faSpinner}
                                            spin
                                            className="mr-2"
                                        />
                                        Generating Music...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faMusic}
                                            className="mr-2"
                                        />
                                        Generate Music
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Audio Controls */}
                        {audioPath && (
                            <div className={styles.audioControls}>
                                <audio ref={audioRef} src={audioPath} />
                                <button
                                    onClick={playPauseAudio}
                                    className={styles.playPauseButton}
                                    disabled={isLoading}
                                >
                                    {isPlaying ? (
                                        <>
                                            <FontAwesomeIcon icon={faPause} />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPlay} />
                                            Play
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={stopAudio}
                                    className={styles.stopButton}
                                    disabled={isLoading}
                                >
                                    <FontAwesomeIcon icon={faStop} />
                                    Stop
                                </button>
                            </div>
                        )}

                        {/* Download */}
                        <div className={styles.downloadButtonContainer}>
                            {audioPath && (
                                <button
                                    onClick={downloadMusic}
                                    disabled={isLoading}
                                    className={styles.downloadButton}
                                >
                                    {isLoading ? (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faSpinner}
                                                spin
                                                className="mr-2"
                                            />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faSave}
                                                className="mr-2"
                                            />
                                            Download Music
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.signOutContainer}>
                        <button
                            onClick={handleSignOut}
                            className={styles.signOutButton}
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardPage;
