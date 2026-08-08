import React from "react";

interface ScoreBadgeProps {
    score: number;
}

const ScoreBadge = ({ score }: ScoreBadgeProps) => {
    const badgeClass =
        score > 69
            ? "bg-badge-green text-green-600"
            : score > 49
                ? "bg-badge-yellow text-yellow-600"
                : "bg-badge-red text-red-600";

    const label =
        score > 69 ? "STRONG" : score > 49 ? "GOOD START" : "NEEDS WORK";

    return (
        <div className={`score-badge ${badgeClass}`}>
            <p>{label}</p>
        </div>
    );
};

export default ScoreBadge;