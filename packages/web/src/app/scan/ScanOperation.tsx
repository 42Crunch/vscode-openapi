import SmallLogMessages from "../../features/logging/SmallLogMessages";
import GeneralError from "./GeneralError";
import ScanReport from "./ScanReport";
import { useAppSelector } from "./store";

export default function ScanOperation() {
  const { scanReport, waiting, error } = useAppSelector((state) => state.scan);

  return (
    <>
      {scanReport && <ScanReport />}
      <GeneralError />
      {(waiting || error) && <SmallLogMessages />}
    </>
  );
}
