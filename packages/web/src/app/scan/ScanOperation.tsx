import SmallLogMessages from "../../features/logging/SmallLogMessages";
import GeneralError from "./GeneralError";
import ScanReportNew from "./ScanReportNew";
import { useAppSelector } from "./store";

export default function ScanOperation() {
  const { scanReport, waiting, error } = useAppSelector((state) => state.scan);

  return (
    <>
      {scanReport && <ScanReportNew />}
      <GeneralError />
      {(waiting || error) && <SmallLogMessages />}
    </>
  );
}
