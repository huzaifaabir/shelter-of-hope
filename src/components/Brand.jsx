import { Link } from "react-router-dom";
import logo from "../assets/logo-sm.png";
import iconMark from "../assets/icon-sm.png";
import letterLogo from "../assets/letter-logo-sm.png";

export const Logo = ({ className = "h-12" }) => (
  <Link to="/" aria-label="Shelter of Hope — হোম পেজ">
    <img src={letterLogo} alt="Shelter of Hope" className={`${className} w-auto`} />
  </Link>
);
export { logo, iconMark, letterLogo };
