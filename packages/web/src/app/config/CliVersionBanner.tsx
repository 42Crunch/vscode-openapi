import { CliTestResult } from "@xliic/common/config";
import { Banner, ErrorBanner } from "../../components/Banner";

export default function CliVersionBanner({ result }: { result?: CliTestResult }) {
  if (result !== undefined) {
    if (result.success) {
      return <Banner message={result.version} />;
    } else {
      return <ErrorBanner message="Failed">{result.message}</ErrorBanner>;
    }
  }
  return null;
}
