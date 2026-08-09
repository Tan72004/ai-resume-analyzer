import React from "react";
import { useLocation, useNavigate } from "react-router";
import Navbar from "~/components/Navbar";
import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/util";
import {
    prepareInstructions,
    AIResponseFormat,
} from "../../constants";

const Analyze = () => {
    const { fs, kv } = usePuterStore();

    const navigate = useNavigate();
    const location = useLocation();

    const [statusText, setStatusText] =
        React.useState("Starting analysis...");

    const state = location.state as {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    } | null;

    const hasAnalyzed = React.useRef(false);

    React.useEffect(() => {
        if (!state?.file) {
            navigate("/upload");
            return;
        }

        if (hasAnalyzed.current) return;

        hasAnalyzed.current = true;
        analyzeResume();
    }, []);
    const analyzeWithGemini = async (
        file: File,
        instructions: string
    ): Promise<string> => {
        const apiKey =
            import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error(
                "Gemini API key is missing. Check your .env file."
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let binary = "";
        const chunkSize = 0x8000;

        for (
            let i = 0;
            i < bytes.length;
            i += chunkSize
        ) {
            const chunk = bytes.subarray(
                i,
                Math.min(
                    i + chunkSize,
                    bytes.length
                )
            );

            binary += String.fromCharCode(...chunk);
        }

        const base64Pdf = btoa(binary);

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    inlineData: {
                                        mimeType: "application/pdf",
                                        data: base64Pdf,
                                    },
                                },
                                {
                                    text: `
You are an expert ATS resume analyzer.

Analyze the uploaded resume carefully.

${instructions}

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. Do not use Markdown.
3. Do not use code fences.
4. Do not add explanations before the JSON.
5. Do not add explanations after the JSON.
6. Follow the requested JSON structure exactly.
`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        const result = await response.json();

        console.log(
            "Gemini response:",
            result
        );

        if (!response.ok) {
            console.error(
                "Gemini API error:",
                result
            );

            throw new Error(
                result?.error?.message ||
                `Gemini API request failed with status ${response.status}`
            );
        }

        const text =
            result?.candidates?.[0]
                ?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error(
                "Gemini returned an empty response."
            );
        }

        return text;
    };

    const parseAIResponse = (
        responseText: string
    ) => {
        try {
            let cleaned =
                responseText.trim();

            console.log(
                "Original Gemini response:",
                cleaned
            );

            cleaned = cleaned
                .replace(
                    /^```json\s*/i,
                    ""
                )
                .replace(
                    /^```\s*/i,
                    ""
                )
                .replace(
                    /\s*```$/i,
                    ""
                )
                .trim();

            const firstBrace =
                cleaned.indexOf("{");

            const lastBrace =
                cleaned.lastIndexOf("}");

            if (
                firstBrace === -1 ||
                lastBrace === -1 ||
                lastBrace <= firstBrace
            ) {
                throw new Error(
                    "No valid JSON object found."
                );
            }

            cleaned =
                cleaned.substring(
                    firstBrace,
                    lastBrace + 1
                );

            console.log(
                "Cleaned Gemini response:",
                cleaned
            );

            const parsed =
                JSON.parse(cleaned);

            if (
                !parsed ||
                typeof parsed !== "object"
            ) {
                throw new Error(
                    "Gemini returned an invalid JSON object."
                );
            }

            return parsed;
        } catch (error) {
            console.error(
                "JSON PARSE ERROR:",
                error
            );

            console.error(
                "RAW GEMINI RESPONSE:",
                responseText
            );

            throw new Error(
                "Gemini returned invalid JSON."
            );
        }
    };

    const analyzeResume = async () => {
        if (!state?.file) {
            return;
        }

        try {
            const uuid =
                generateUUID();

            if (
                !(state.file instanceof File)
            ) {
                throw new Error(
                    "Invalid resume file."
                );
            }

            if (
                state.file.type !==
                "application/pdf"
            ) {
                throw new Error(
                    "Please upload a PDF resume."
                );
            }

            if (
                state.file.size === 0
            ) {
                throw new Error(
                    "The uploaded PDF is empty."
                );
            }

            console.log(
                "FILE:",
                state.file
            );

            console.log(
                "FILE NAME:",
                state.file.name
            );

            console.log(
                "FILE TYPE:",
                state.file.type
            );

            console.log(
                "FILE SIZE:",
                state.file.size
            );

            setStatusText(
                "Uploading resume..."
            );

            const resumeFile =
                new File(
                    [state.file],
                    `resume-${uuid}.pdf`,
                    {
                        type: "application/pdf",
                    }
                );

            const uploadedResume =
                await fs.upload([
                    resumeFile,
                ]);

            console.log(
                "Uploaded Resume:",
                uploadedResume
            );

            if (!uploadedResume) {
                throw new Error(
                    "Resume upload failed."
                );
            }

            if (!uploadedResume.path) {
                throw new Error(
                    "Puter did not return a valid resume path."
                );
            }

            console.log(
                "Resume Path:",
                uploadedResume.path
            );

            setStatusText(
                "Converting PDF to image..."
            );

            const conversionResult =
                await convertPdfToImage(
                    state.file
                );

            console.log(
                "Conversion:",
                conversionResult
            );

            if (
                !conversionResult?.file
            ) {
                throw new Error(
                    conversionResult?.error ||
                    "Failed to convert PDF to image."
                );
            }

            const imageExtension =
                conversionResult.file
                    .type === "image/png"
                    ? "png"
                    : "jpg";

            const previewFile =
                new File(
                    [conversionResult.file],
                    `resume-preview-${uuid}.${imageExtension}`,
                    {
                        type:
                            conversionResult.file
                                .type ||
                            "image/png",
                    }
                );

            setStatusText(
                "Uploading resume preview..."
            );

            const uploadedImage =
                await fs.upload([
                    previewFile,
                ]);

            console.log(
                "Uploaded Image:",
                uploadedImage
            );

            if (!uploadedImage) {
                throw new Error(
                    "Resume image upload failed."
                );
            }

            if (!uploadedImage.path) {
                throw new Error(
                    "Puter did not return a valid image path."
                );
            }

            console.log(
                "Image Path:",
                uploadedImage.path
            );

            const data: any = {
                id: uuid,
                resumePath:
                uploadedResume.path,
                imagePath:
                uploadedImage.path,
                companyName:
                    state.companyName || "",
                jobTitle:
                    state.jobTitle || "",
                jobDescription:
                    state.jobDescription || "",
                feedback: null,
            };

            setStatusText(
                "Preparing resume analysis..."
            );

            await kv.set(
                `resume:${uuid}`,
                JSON.stringify(data)
            );

            setStatusText(
                "Analyzing resume with Gemini AI..."
            );

            const instructions =
                prepareInstructions({
                    jobTitle:
                        state.jobTitle || "",
                    jobDescription:
                        state.jobDescription || "",
                    AIResponseFormat,
                });

            console.log(
                "Gemini Instructions:",
                instructions
            );

            const feedbackText =
                await analyzeWithGemini(
                    state.file,
                    instructions
                );

            console.log(
                "Gemini Feedback:",
                feedbackText
            );

            if (
                !feedbackText.trim()
            ) {
                throw new Error(
                    "Gemini returned an empty response."
                );
            }

            const parsedFeedback =
                parseAIResponse(
                    feedbackText
                );

            console.log(
                "Parsed Feedback:",
                parsedFeedback
            );

            data.feedback =
                parsedFeedback;

            setStatusText(
                "Finalizing your resume analysis..."
            );

            await kv.set(
                `resume:${uuid}`,
                JSON.stringify(data)
            );

            setStatusText(
                "Analysis complete!"
            );

            console.log(
                "ANALYSIS COMPLETE:",
                data
            );

            navigate(
                `/resume/${uuid}`
            );
        } catch (error) {
            console.error(
                "ANALYSIS ERROR:",
                error
            );

            if (
                error instanceof Error
            ) {
                console.error(
                    "ERROR MESSAGE:",
                    error.message
                );

                console.error(
                    "ERROR STACK:",
                    error.stack
                );

                setStatusText(
                    error.message
                );
            } else {
                console.error(
                    "UNKNOWN ERROR:",
                    error
                );

                setStatusText(
                    "Something went wrong while analyzing your resume."
                );
            }
        }
    };

    return (
        <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16 text-center">
                    <h1>
                        Analyzing Your Resume
                    </h1>

                    <h2 className="mt-4">
                        {statusText}
                    </h2>

                    <div className="mt-10 flex justify-center">
                        <img
                            src="/images/resume-scan.gif"
                            alt="Analyzing Resume"
                            className="w-full max-w-2xl animate-slide-up"
                        />
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Analyze;