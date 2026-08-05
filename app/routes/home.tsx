import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import {resumes} from "../../constants";
import {callbackify} from "node:util";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {useLocation, useNavigate} from "react-router";
import {useEffect} from "react";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "RESUMind" },
    { name: "description", content: "Smart feedback for your dream job " },
  ];
}

export default function Home() {

    const { auth, isLoading } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1];
    const navigate = useNavigate();

    useEffect(() => {
          if(!auth.isAuthenticated)navigate('auth?next=/');
        },
        [auth.isAuthenticated , next])

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar>

    </Navbar>
  <section className= "main-section">
    <div className= "page-heading py-16">
      <h1 >Track your application & Resume Ratings</h1>
      <h2>Review your Submissions and Check AI-powered feedback.</h2>
    </div>

  </section>
    {resumes.length >0 &&(
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume)=>(
              <ResumeCard key ={resume.id} resume ={resume}/>
          ))}

        </div>
    )}


  </main>
}
