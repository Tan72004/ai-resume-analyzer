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
    const { fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [statusText, setStatusText] = React.useState(
        "Starting analysis..."
    );

    const state = location.state as {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    } | null;

    React.useEffect(() => {
        if (!state?.file) {
            navigate("/upload");
            return;
        }

        analyzeResume();
    }, []);

    const analyzeResume = async () => {
        if (!state?.file) return;

        try {
            const uuid = generateUUID();

            // ==========================================
            // 1. Validate Resume
            // ==========================================

            if (!(state.file instanceof File)) {
                throw new Error("Invalid resume file.");
            }

            if (state.file.type !== "application/pdf") {
                throw new Error("Please upload a PDF resume.");
            }

            if (state.file.size === 0) {
                throw new Error("The uploaded PDF is empty.");
            }

            console.log("FILE:", state.file);
            console.log("FILE NAME:", state.file.name);
            console.log("FILE TYPE:", state.file.type);
            console.log("FILE SIZE:", state.file.size);

            // ==========================================
            // 2. Upload Resume
            // ==========================================

            setStatusText("Uploading resume...");

            // Give the uploaded file a unique name
            const resumeFile = new File(
                [state.file],
                `resume-${uuid}.pdf`,
                {
                    type: "application/pdf",
                }
            );

            const uploadedResume = await fs.upload(
                [resumeFile],
                undefined,
                {
                    dedupeName: true,
                    overwrite: false,
                }
            );

            console.log("Uploaded Resume:", uploadedResume);

            if (!uploadedResume) {
                throw new Error("Resume upload failed.");
            }

            if (!uploadedResume.path) {
                console.error(
                    "Invalid uploaded resume object:",
                    uploadedResume
                );

                throw new Error(
                    "Resume uploaded, but Puter did not return a valid file path."
                );
            }

            console.log(
                "Resume Path:",
                uploadedResume.path
            );

            // ==========================================
            // 3. Convert PDF to Image
            // ==========================================

            setStatusText(
                "Converting PDF to image..."
            );

            const conversionResult =
                await convertPdfToImage(state.file);

            console.log(
                "Conversion:",
                conversionResult
            );

            if (!conversionResult?.file) {
                throw new Error(
                    conversionResult?.error ||
                    "Failed to convert PDF to image."
                );
            }

            // ==========================================
            // 4. Give Preview Image a Unique Name
            // ==========================================

            const imageExtension =
                conversionResult.file.type === "image/png"
                    ? "png"
                    : "jpg";

            const previewFile = new File(
                [conversionResult.file],
                `resume-preview-${uuid}.${imageExtension}`,
                {
                    type:
                        conversionResult.file.type ||
                        "image/png",
                }
            );

            console.log(
                "Preview File:",
                previewFile
            );

            // ==========================================
            // 5. Upload Preview Image
            // ==========================================

            setStatusText(
                "Uploading resume preview..."
            );

            const uploadedImage = await fs.upload(
                [previewFile],
                undefined,
                {
                    dedupeName: true,
                    overwrite: false,
                }
            );

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
                console.error(
                    "Invalid uploaded image object:",
                    uploadedImage
                );

                throw new Error(
                    "Preview uploaded, but Puter did not return a valid image path."
                );
            }

            console.log(
                "Image Path:",
                uploadedImage.path
            );

            // ==========================================
            // 6. Create Initial Resume Data
            // ==========================================

            const data = {
                id: uuid,
                resumePath: uploadedResume.path,
                imagePath: uploadedImage.path,
                companyName:
                    state.companyName || "",
                jobTitle:
                    state.jobTitle || "",
                jobDescription:
                    state.jobDescription || "",
                feedback: null,
            };

            console.log(
                "Initial Resume Data:",
                data
            );

            // ==========================================
            // 7. Save Initial Data
            // ==========================================

            setStatusText(
                "Preparing resume analysis..."
            );

            await kv.set(
                `resume:${uuid}`,
                JSON.stringify(data)
            );

            // ==========================================
            // 8. AI Analysis
            // ==========================================

            setStatusText(
                "Analyzing resume with AI..."
            );

            console.log(
                "Sending resume to AI:",
                uploadedResume.path
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
                "AI Instructions:",
                instructions
            );

            const feedback = await ai.feedback(
                uploadedResume.path,
                instructions
            );

            console.log(
                "AI Feedback:",
                feedback
            );

            if (!feedback) {
                throw new Error(
                    "AI failed to analyze the resume."
                );
            }

            // ==========================================
            // 9. Extract AI Response
            // ==========================================

            let feedbackText = "";

            if (
                typeof feedback.message?.content ===
                "string"
            ) {
                feedbackText =
                    feedback.message.content;
            } else if (
                Array.isArray(
                    feedback.message?.content
                )
            ) {
                feedbackText =
                    feedback.message.content
                        .map((item: any) =>
                            typeof item === "string"
                                ? item
                                : item?.text || ""
                        )
                        .join("");
            }

            console.log(
                "Raw AI Response:",
                feedbackText
            );

            if (!feedbackText.trim()) {
                throw new Error(
                    "AI returned an empty response."
                );
            }

            // ==========================================
            // 10. Parse JSON
            // ==========================================

            let parsedFeedback;

            try {
                parsedFeedback =
                    JSON.parse(feedbackText);
            } catch (jsonError) {
                console.error(
                    "AI JSON PARSE ERROR:",
                    jsonError
                );

                console.error(
                    "AI RAW RESPONSE:",
                    feedbackText
                );

                throw new Error(
                    "AI returned an invalid JSON response."
                );
            }

            // ==========================================
            // 11. Save Final Data
            // ==========================================

            data.feedback = parsedFeedback;

            setStatusText(
                "Finalizing your resume analysis..."
            );

            await kv.set(
                `resume:${uuid}`,
                JSON.stringify(data)
            );

            // ==========================================
            // 12. Navigate
            // ==========================================

            setStatusText(
                "Analysis complete!"
            );

            console.log(
                "✅ ANALYSIS COMPLETE:",
                data
            );

            navigate(`/resume/${uuid}`);

        } catch (error) {
            console.error(
                "❌ ANALYSIS ERROR:",
                error
            );

            if (error instanceof Error) {
                setStatusText(error.message);
            } else {
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