import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect , useState} from "react";
import {usePuterStore} from "~/lib/puter";

const getResumeImage = (id: string) => {
    switch (id) {
        case "1":
            return "/images/resume_01.png";
        case "2":
            return "/images/resume_02.png";
        case "3":
            return "/images/resume_03.png";
        default:
            return "/images/resume_01.png";
    }
};

const ResumeCard =({resume : {id,companyName,jobTitle,feedback, imagePath}}:{resume: Resume}) =>{
    const{fs} = usePuterStore();
    const [resumeURL,setResumeUrl]= useState('');
    useEffect(() => {
        const loadResume = async () =>{
            const blob = await fs.read(imagePath);
            if(!blob) return ;
            let url = URL.createObjectURL(blob);
            setResumeUrl(url);
        }
        loadResume();
    }, [imagePath]);
    return (
        <Link to={`/resume/${id}`} className="flex min-h-[320px] w-full max-w-[500px] flex-col rounded-2xl bg-white p-8 shadow-xl
         transition-all duration-300 ease-in-out
             hover:scale-105 hover:-translate-y-2 hover:shadow-2xl">
            <div className="resume-card-holder">
            <div className="flex flex-col gap-2">
                {companyName && (
                    <h2 className="!text-black font-bold break-words">
                    {companyName}
                    </h2>
                )}
                {jobTitle && (
                    <h3 className="!text-lg  break-words text-gray-500">
                    {jobTitle}
                </h3>
                )}
                {!companyName && !jobTitle && (<h2 className=" text-black font-bold">Resume</h2>
                )}
            </div>
            <div className="flex-shrink-0">
                <ScoreCircle score={feedback?.overallScore ?? 0} />

            </div>
            </div>
            <div className="gradient-border transition-all duration-500 hover:scale-[1.02]">
                <img
                    src={resumeURL}
                    alt="resume"
                    className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                />
            </div>
        </Link>
    );
};
export default ResumeCard;