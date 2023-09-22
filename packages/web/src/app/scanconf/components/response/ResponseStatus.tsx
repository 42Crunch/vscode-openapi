import styled from "styled-components";
import { HttpResponse } from "@xliic/common/http";

export default function ResponseStatus({
  className,
  response,
}: {
  className?: string;
  response: HttpResponse;
}) {
  return (
    <div className={className}>
      {response.statusCode} {response.statusMessage}
    </div>
  );
}

const Container = styled.div``;
