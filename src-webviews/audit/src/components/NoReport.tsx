import logo from "./icons/42crunch_icon.svg";

export default function NoReport() {
  return (
    <>
      <h1>No security audit report available for this file</h1>
      <p>
        Please click the <img src={logo} style={{ width: 16, height: 16 }} /> button to run OpenAPI
        Security Audit
      </p>
    </>
  );
}
