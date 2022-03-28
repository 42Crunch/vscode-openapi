export default function GoToFullReport({ goToFullReport }: { goToFullReport: any }) {
  return (
    <h4>
      <a
        className="go-full-report"
        href="#"
        onClick={(e) => {
          goToFullReport();
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        Go back to full report
      </a>
    </h4>
  );
}
