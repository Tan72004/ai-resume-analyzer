import React from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
const { convertPdfToImage } =
    await import("~/lib/pdf2img");
import{generateUUID} from "~/lib/util";
import {
    prepareInstructions,
    AIResponseFormat,
} from "../../constants";

interface AnalyzeParams {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
}

const Upload = () => {
    const { fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = React.useState(false);
    const [statusText, setStatusText] = React.useState("");
    const [file, setFile] = React.useState<File | null>(null);

    const handleFileSelect = (selectedFile: File | null) => {
        setFile(selectedFile);
    };

    const handleAnalyze = async ({
                                     companyName,
                                     jobTitle,
                                     jobDescription,
                                     file,
                                 }: AnalyzeParams) => {
        try {
            setIsProcessing(true);

            // ==========================
            // Upload Resume
            // ==========================
            setStatusText("Uploading resume...");
            console.log("Selected File:", file);

            let uploadedResume;

            try {
                uploadedResume = await fs.upload([file]);
                console.log("✅ Resume Uploaded:", uploadedResume);
            } catch (error) {
                console.error("❌ Resume Upload Failed:", error);
                setStatusText("Resume upload failed.");
                return;
            }

            if (!uploadedResume) {
                setStatusText("Failed to upload resume.");
                return;
            }

            // ==========================
            // Convert PDF
            // ==========================
            setStatusText("Converting PDF to image...");

            const conversionResult = await convertPdfToImage(file);
            console.log("Conversion Result:", conversionResult);

            if (!conversionResult.file) {
                setStatusText(
                    conversionResult.error ?? "Failed to convert PDF."
                );
                return;
            }

            // ==========================
            // Upload Image
            // ==========================
            setStatusText("Uploading image...");

            let uploadedImage;

            try {
                uploadedImage = await fs.upload([conversionResult.file]);
                console.log(" Image Uploaded:", uploadedImage);
            } catch (error) {
                console.error("Image Upload Failed:", error);
                setStatusText("Image upload failed.");
                return;
            }

            if (!uploadedImage) {
                setStatusText("Failed to upload image.");
                return;
            }

            console.log(" Both uploads completed successfully.");

            // ==========================
            // Save Resume Information
            // ==========================
            const uuid = generateUUID();

            const data = {
                id: uuid,
                resumePath: uploadedResume.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: "",
            };

            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            // ==========================
            // AI Analysis
            // ==========================
            setStatusText("Analyzing resume...");

            const feedback = await ai.feedback(
                uploadedResume.path,
                prepareInstructions({
                    jobTitle,
                    jobDescription,
                    AIResponseFormat,
                })
            );

            console.log("AI Response:", feedback);

            if (!feedback) {
                setStatusText("AI failed to analyze the resume.");
                return;
            }

            const feedbackText =
                typeof feedback.message.content === "string"
                    ? feedback.message.content
                    : feedback.message.content[0].text;

            data.feedback = JSON.parse(feedbackText);

            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText("Analysis complete!");

            console.log(data);

            navigate(`/resume/${uuid}`);

        } catch (error) {
            console.error("Analyze Error:", error);

            setStatusText(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!file) {
            alert("Please upload your resume.");
            return;
        }

        const formData = new FormData(e.currentTarget);

        const companyName = formData.get("companyName") as string;
        const jobTitle = formData.get("jobTitle") as string;
        const jobDescription = formData.get("jobDescription") as string;

        navigate("/analyze", {
            state: {
                companyName,
                jobTitle,
                jobDescription,
                file,
            },
        });
    };
    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart Feedback For Your Dream Job</h1>

                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>

                            <img
                                src="/images/resume-scan.gif"
                                alt="Resume Scan"
                                className="w-full"
                            />
                        </>
                    ) : (
                        <h2>
                            Drop your resume for an ATS score and improvement
                            tips
                        </h2>
                    )}

                    <form
                        id="upload-form"
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                    >
                        <div className="form-div">
                            <label htmlFor="company-name">
                                Company Name
                            </label>

                            <input
                                type="text"
                                id="company-name"
                                name="companyName"
                                placeholder="Company Name"
                                required
                            />
                        </div>

                        <div className="form-div">
                            <label htmlFor="job-title">
                                Job Title
                            </label>

                            <input
                                type="text"
                                id="job-title"
                                name="jobTitle"
                                placeholder="Job Title"
                                required
                            />
                        </div>

                        <div className="form-div">
                            <label htmlFor="job-description">
                                Job Description
                            </label>

                            <textarea
                                id="job-description"
                                name="jobDescription"
                                rows={5}
                                placeholder="Job Description"
                                required
                            />
                        </div>

                        <div className="form-div">
                            <label>Upload Resume</label>

                            <FileUploader
                                onFileSelect={handleFileSelect}
                            />
                        </div>

                        <button
                            type="submit"
                            className="primary-button"
                        >
                            Analyze Resume
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
};

export default Upload;