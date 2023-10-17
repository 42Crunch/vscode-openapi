import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $nodesOfType, TextNode } from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import { $createVariableNode, VariableNode } from "./VariableNode";
import { ThemeColorVariables } from "@xliic/common/theme";

import styled from "styled-components";
import { useLexicalTextEntity } from "@lexical/react/useLexicalTextEntity";

const SUGGESTION_LIST_LENGTH_LIMIT = 10;

function checkForVariables(text: string, minMatchLength: number): MenuTextMatch | null {
  const ENV_VAR_REGEX = /({{([\w.\-$^}]*))/;
  const match = ENV_VAR_REGEX.exec(text);

  if (match !== null) {
    const matchingString = match[2];
    if (matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index,
        matchingString,
        replaceableString: match[1],
      };
    }
  }
  return null;
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForVariables(text, 0);
}

class VariableTypeaheadOption extends MenuOption {
  name: string;

  constructor(name: string) {
    super(name);
    this.name = name;
  }
}

function VariablesTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: VariableTypeaheadOption;
}) {
  let className = "item";
  if (isSelected) {
    className += " selected";
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={className}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={"typeahead-item-" + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <span className="text">{option.name}</span>
    </li>
  );
}

export default function VariablesPlugin({
  variables,
}: {
  variables: string[];
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  const createVariableNode = useCallback(
    (textNode: TextNode): VariableNode => {
      const name = textNode.getTextContent().slice(2, -2);
      return $createVariableNode(textNode.getTextContent(), variables.includes(name));
    },
    [variables]
  );

  const getVariableMatch = useCallback((text: string) => {
    const matchArr = ENV_VAR_REGEX.exec(text);

    if (matchArr === null) {
      return null;
    }

    const hashtagLength = matchArr[1].length;
    const startOffset = matchArr.index;
    const endOffset = startOffset + hashtagLength;

    return {
      start: startOffset,
      end: endOffset,
    };
  }, []);

  useLexicalTextEntity(getVariableMatch, VariableNode, createVariableNode);

  useEffect(() => {
    editor.update(() => {
      const nodes = $nodesOfType(VariableNode);
      for (const node of nodes) {
        const name = node.getTextContent().slice(2, -2);
        node.setExists(variables.includes(name));
      }
    });
  }, [variables]);

  const [queryString, setQueryString] = useState<string | null>(null);
  const [results, setResults] = useState<Array<string>>([]);

  useEffect(() => {
    if (queryString !== null) {
      setResults(variables.filter((variable) => variable.toLowerCase().includes(queryString)));
    } else {
      setResults(variables);
    }
  }, [variables, queryString]);

  const options = useMemo(
    () =>
      results
        .map((result) => new VariableTypeaheadOption(result))
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );

  const onSelectOption = useCallback(
    (
      selectedOption: VariableTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const variableNode = $createVariableNode("{{" + selectedOption.name + "}}", true);
        if (nodeToReplace) {
          nodeToReplace.replace(variableNode);
        }
        variableNode.select();
        closeMenu();
      });
    },
    [editor]
  );

  const checkForVariableMatch = useCallback(
    (text: string) => {
      return getPossibleQueryMatch(text);
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<VariableTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForVariableMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) =>
        anchorElementRef.current && results.length
          ? ReactDOM.createPortal(
              <VariablesMenu>
                <ul>
                  {options.map((option, i: number) => (
                    <VariablesTypeaheadMenuItem
                      index={i}
                      isSelected={selectedIndex === i}
                      onClick={() => {
                        setHighlightedIndex(i);
                        selectOptionAndCleanUp(option);
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(i);
                      }}
                      key={option.key}
                      option={option}
                    />
                  ))}
                </ul>
              </VariablesMenu>,
              anchorElementRef.current
            )
          : null
      }
    />
  );
}

const ENV_VAR_REGEX = /({{[\w-$]+}})/;

const VariablesMenu = styled.div`
  margin-top: 20px;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  border: 1px solid var(${ThemeColorVariables.dropdownBorder});
  min-width: 150px;
  padding: 4px;

  > ul {
    padding: 0;
    list-style: none;
    margin: 0;
    // max-height: 200px;
    // overflow-y: scroll;
    // -ms-overflow-style: none;
    // scrollbar-width: none;

    > li.selected {
      background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
      color: var(${ThemeColorVariables.listActiveSelectionForeground});
    }

    > li:hover {
      //background-color: var(${ThemeColorVariables.listHoverBackground});
    }

    > li {
      margin: 2px;
      color: var(${ThemeColorVariables.dropdownForeground});
      display: flex;
      gap: 8px;
      align-items: center;

      // margin: 0;
      // min-width: 180px;
      // font-size: 14px;
      // outline: none;
      // cursor: pointer;
      // border-radius: 8px;

      // margin: 0 8px 0 8px;
      // padding: 8px;
      // color: #050505;
      // cursor: pointer;
      // line-height: 16px;
      // font-size: 15px;
      // display: flex;
      // align-content: center;
      // flex-direction: row;
      // flex-shrink: 0;
      // background-color: #fff;
      // border-radius: 8px;
      // border: 0;
    }
  }

  > ul::-webkit-scrollbar {
    // display: none;
  }
`;
