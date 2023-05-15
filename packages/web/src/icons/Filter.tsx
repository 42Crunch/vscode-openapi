import { SVGProps } from "react";
const SvgFilter = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" {...props}>
    <path d="M0 73.7C0 50.67 18.67 32 41.7 32h428.6c23 0 41.7 18.67 41.7 41.7 0 9.6-3.3 18.9-9.4 26.3L336 304.5v143.2c0 17.8-14.5 32.3-32.3 32.3-7.3 0-14.4-2.5-20.1-7.9l-92.5-72.5c-9.5-7.6-15.1-19.1-15.1-31.3v-63.8L9.373 100A41.503 41.503 0 0 1 0 73.7zM54.96 80 218.6 280.8c3.5 4.3 5.4 9.7 5.4 15.2v68.4l64 50.8V296c0-5.5 1.9-10.9 5.4-15.2L457 80H54.96z" />
  </svg>
);
export default SvgFilter;
