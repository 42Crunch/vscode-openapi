import { SVGProps } from "react";
const SvgCircle = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" {...props}>
    <path d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512z" />
  </svg>
);
export default SvgCircle;
