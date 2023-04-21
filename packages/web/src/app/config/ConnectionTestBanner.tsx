import { Banner, ErrorBanner } from "../../components/Banner";
import { ConnectionTestResult } from "../../../../common/src/config";

export default function ConnectionTestBanner({ result }: { result?: ConnectionTestResult }) {
  if (result !== undefined) {
    if (result.success) {
      return <Banner message="Successfully connected" />;
    } else {
      return <ErrorBanner message="Failed to connect">{result.message}</ErrorBanner>;
    }
  }
  return null;
}
