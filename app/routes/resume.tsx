import { Link, type MetaFunction, useParams,useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";

export const meta: MetaFunction = () => [
    { title: "Resumind | Review" },
    {
        name: "description",
        content: "Detailed overview of your resume",
    },
];

const Resume = () => {
    const { fs, kv ,auth} = usePuterStore();
    const { id } = useParams();
    const navigate = useNavigate();

    const [resumeURL, setResumeURL] = useState("");
    const [imageURL, setImageURL] = useState("");
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
            if (!auth.isAuthenticated) {
                navigate(`/auth?next=/resume/${id}`);
            }
        },
        [auth.isAuthenticated , id,navigate])

    useEffect(() => {
        let pdfURL = "";
        let imageObjectURL = "";

        const loadResume = async () => {
            try {
                setIsLoading(true);
                setError("");

                if (!id) {
                    setError("Resume ID is missing.");
                    return;
                }

                console.log("Loading resume with ID:", id);

                const resume = await kv.get(`resume:${id}`);

                console.log("KV response:", resume);

                if (!resume) {
                    setError("Resume not found.");
                    return;
                }

                // Parse stored data
                const data = JSON.parse(resume);

                console.log("Resume data:", data);
                console.log("Resume path:", data.resumePath);
                console.log("Image path:", data.imagePath);


                if (data.resumePath) {
                    console.log(
                        "Reading PDF from:",
                        data.resumePath
                    );

                    const resumeBlob = await fs.read(
                        data.resumePath
                    );

                    console.log("PDF blob:", resumeBlob);

                    if (resumeBlob) {
                        const pdfBlob = new Blob(
                            [resumeBlob],
                            {
                                type: "application/pdf",
                            }
                        );

                        pdfURL =
                            URL.createObjectURL(pdfBlob);

                        setResumeURL(pdfURL);

                        console.log(
                            "Created PDF URL:",
                            pdfURL
                        );
                    } else {
                        console.error(
                            "PDF could not be read."
                        );
                    }
                } else {
                    console.error(
                        "resumePath is missing from KV data."
                    );
                }



                if (data.imagePath) {
                    console.log(
                        "Reading image from:",
                        data.imagePath
                    );

                    const imageBlob = await fs.read(
                        data.imagePath
                    );

                    console.log(
                        "Image blob:",
                        imageBlob
                    );

                    if (imageBlob) {
                        imageObjectURL =
                            URL.createObjectURL(
                                imageBlob
                            );

                        setImageURL(
                            imageObjectURL
                        );

                        console.log(
                            "Created image URL:",
                            imageObjectURL
                        );
                    } else {
                        console.error(
                            "Image could not be read."
                        );
                    }
                } else {
                    console.error(
                        "imagePath is missing from KV data."
                    );
                }


                if (data.feedback) {
                    setFeedback(data.feedback);
                }
            } catch (err) {
                console.error(
                    "Error loading resume:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load resume."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadResume();

        // Cleanup object URLs
        return () => {
            if (pdfURL) {
                URL.revokeObjectURL(pdfURL);
            }

            if (imageObjectURL) {
                URL.revokeObjectURL(
                    imageObjectURL
                );
            }
        };
    }, [id, fs, kv]);

    return (
        <main className="!pt-0">

            <nav className="resume-nav">
                <Link
                    to="/"
                    className="back-button flex items-center gap-2"
                >
                    <img src ="/iconss.jpg" alt ="logo" className="w-2.5 h-2.5"/>

                    <span className="text-gray-800 text-sm font-semibold">
                        Back to HomePage
                    </span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section">
                    <h2 className= "text-4xl !text-black font-bold">
                        Resume Review
                    </h2>
                    {feedback ?(
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback ={feedback}/>
                            <ATS score = {feedback.ATS.score||0} suggestions = {feedback.ATS.tips || []} />
                            <Details feedback ={feedback}/>
                        </div>
                    ):(
                        <img src="/images/resume-scan-2.gif" className="w-full"/>
                    )}
                </section>
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageURL && resumeURL &&(
                        <div className= "animate-in fade-in duration-1000 gradient-border max-sm:0 h-[90%] max-wxl:h-fit w-fit">
                           <a href={resumeURL} target="_blank" rel="noopener noreferrer">

                            <img
                            src={imageURL}
                            className="w-full h-full object-contain rounded-2xl"
                            title="resume"/>
                           </a>
                        </div>



                    )}

                </section>


            </div>
        </main>
    )
}

export default Resume;