import { ConnectionTestResult } from "@xliic/common/config";
import { Banner, ErrorBanner } from "../../components/Banner";

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
