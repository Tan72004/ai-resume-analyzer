import React from "react";

interface ATSProps {
    score: number;
    suggestions: {
        type: "good" | "improve";
        tip: string;
    }[];
}

const ATS = ({ score, suggestions }: ATSProps) => {
    const gradientClass =
        score > 69
            ? "from-green-100"
            : score > 49
                ? "from-yellow-100"
                : "from-red-100";

    return (
        <div className={`ats-card bg-linear-to-br ${gradientClass}`}>
            <p>ATS Score: {score}</p>

            {suggestions.map((suggestion, index) => (
                <p key={index}>
                    {suggestion.type === "good" ? "✓" : "⚠"} {suggestion.tip}
                </p>
            ))}
        </div>
    );
};

export default ATS;