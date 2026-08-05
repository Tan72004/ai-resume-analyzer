import React from "react";
import {Link} from "react-router";

const Navbar = () => {
    return (
        <nav className="Navbar flex items-center justify-between ">
            <Link to = "/">
                <p className="text-2xl font-bold text-gradient">RESUMind</p>
            </Link>
            <Link to = "/upload" className= "primary-button w-fit">
                Upload Resume
            </Link>
        </nav>
    );
};

export default Navbar;