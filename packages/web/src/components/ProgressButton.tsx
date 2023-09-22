import styled, { keyframes } from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Spinner } from "../icons";
import { useEffect, useState } from "react";

export function ProgressButton({
  label,
  disabled,
  waiting,
  onClick,
  className,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => unknown;
  label: string;
  disabled?: boolean;
  waiting?: boolean;
  className?: string;
}) {
  const [isWaiting, setIsWaiting] = useState(waiting);

  useEffect(() => {
    let timeoutId: any;
    if (waiting) {
      setIsWaiting(true);
    } else {
      timeoutId = setTimeout(() => {
        setIsWaiting(false);
      }, 300);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [waiting]);

  return (
    <Button
      className={className}
      onClick={onClick}
      disabled={disabled || isWaiting}
      waiting={isWaiting}
    >
      <span>{label}</span>
      <Spinner />
    </Button>
  );
}

const rotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-around;
  cursor: pointer;
  background-color: var(${ThemeColorVariables.buttonBackground});
  color: var(${ThemeColorVariables.buttonForeground});
  border: none;
  ${({ waiting }: { disabled?: boolean; waiting?: boolean }) => waiting && "gap: 8px;"}

  > span {
    flex: 1;
  }
  > svg {
    fill: var(${ThemeColorVariables.buttonForeground});
    animation: ${rotation} 2s infinite linear;
    transition: width 0.2s linear;
    ${({ waiting }: { disabled?: boolean; waiting?: boolean }) => !waiting && "width: 0;"}
  }
`;

export const NormalProgressButton = styled(ProgressButton)`
  padding: 6px 16px;
  border-radius: 2px;
  &:focus {
    outline: 1px solid var(${ThemeColorVariables.focusBorder});
  }
`;
