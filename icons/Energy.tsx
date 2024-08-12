import { IconProps } from "../utils/types";


const Energy: React.FC<IconProps> = ({ size = 24, className = "" }) => {

    const svgSize = `${size}px`;

    return (
        <svg viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg" version="1.1" fill="#000000" className={className} height={svgSize} width={svgSize}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g transform="translate(0 -1028.4)"> <g> <path d="m7 1028.4-5 12h8l-4 10 14-14h-9l6-8z" fill="#f1c40f"></path> <path fill="#f39c12" d="m7 1028.4-5 12h3l5-12zm3 12-4 10 3-3 4-7z"></path> <path fill="#e67e22" d="m10 1040.4-0.4062 1h2.9062l0.5-1h-3z"></path> </g> </g> </g></svg>
    );
};

export default Energy;