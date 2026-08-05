import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";

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

const ResumeCard =({resume : {id,companyName,jobTitle,feedback}}:{resume: Resume}) =>{
    return (
        <Link to={`/resume/${id}`} className="flex min-h-[320px] w-full max-w-[500px] flex-col rounded-2xl bg-white p-8 shadow-xl
         transition-all duration-300 ease-in-out
             hover:scale-105 hover:-translate-y-2 hover:shadow-2xl">
            <div className="resume-card-holder">
            <div className="flex flex-col gap-2">
                <h2 className="!text-black font-bold break-words">
                    {companyName}
                </h2>
                <h3 className="!text-lg  break-words text-gray-500">
                    {jobTitle}
                </h3>
            </div>
            <div className="flex-shrink-0">
                <ScoreCircle score = {feedback.overallScore}/>

            </div>
            </div>
            <div className="gradient-border transition-all duration-500 hover:scale-[1.02]">
                <img
                    src={getResumeImage(String(id))}
                    alt="resume"
                    className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                />
            </div>
        </Link>
    );
};
export default ResumeCard;