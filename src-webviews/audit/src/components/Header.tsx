import { useState } from "react";
import logo from "./icons/logo-light.svg";
import logoDark from "./icons/logo-dark.svg";
import { ThemeState } from "../themeSlice";

export default function Header({
  openLink,
  themeKind,
}: {
  openLink: any;
  themeKind: ThemeState["kind"];
}) {
  const [isOpen, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen(!isOpen);
  };

  const open = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    openLink(e.currentTarget.href);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="c_header">
      <div className="d-flex justify-content-between">
        <div>
          <span
            className="font-weight-bold"
            style={{ display: "inline-block", verticalAlign: "middle", height: "100%" }}
          >
            Powered by
          </span>
          <span>
            <a href="https://www.42crunch.com" onClick={open}>
              <img src={themeKind === "light" ? logo : logoDark} />
            </a>
          </span>
        </div>
        <div>
          <div className="dropdown">
            <button className="dropbtn" onClick={toggleOpen}>
              Learn More
            </button>
            <div className={isOpen ? "dropdown-content show" : "dropdown-content"}>
              <a href="https://42crunch.com/api-security-audit/" onClick={open}>
                API Contract Security Audit
              </a>
              <a href="https://42crunch.com/api-conformance-scan/" onClick={open}>
                API Contract Conformance Scan
              </a>
              <a href="https://42crunch.com/micro-api-firewall-protection/" onClick={open}>
                API Protection
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
