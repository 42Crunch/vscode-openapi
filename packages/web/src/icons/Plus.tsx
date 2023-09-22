import { SVGProps } from "react";
const SvgPlus = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1em" height="1em" {...props}>
    <path d="M432 256c0 13.3-10.7 24-24 24H248v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440V280H40c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160V72c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160c13.3 0 24 10.8 24 24z" />
  </svg>
);
export default SvgPlus;
