import { useState } from "react";

export default function collapsible(isDefaultOpen: boolean = false): [boolean, () => void] {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const toggle = () => setIsOpen(!isOpen);
  return [isOpen, toggle];
}
