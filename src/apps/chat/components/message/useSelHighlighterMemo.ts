import * as React from 'react';

import type { DMessageId } from '~/common/stores/chat/chat.message';
import { createTextContentFragment, DMessageContentFragment, DMessageFragment, DMessageFragmentId, isTextPart } from '~/common/stores/chat/chat.fragments';

import { BUBBLE_MIN_TEXT_LENGTH } from './ChatMessage';


/* Note: future evolution of Marking:
 * 'data-purpose'?: 'review' | 'important' | 'note'; // Purpose of the highlight
 * 'data-user-id'?: string; // Unique user identifier
 * 'data-context'?: string; // Context or description of the highlight
 * 'data-version'?: string; // Version of the document/content
 * 'data-platform'?: 'web' | 'mobile' | 'extension'; // Platform or tool that created the highlight
 * 'data-category'?: string; // Category for organization
 *
 * Example:
 * <mark id="highlight-123" data-purpose="important" data-user-id="user123" data-context="Key point in the document" data-version="1.0" data-platform="web" data-category="summary">
 *   This is an important highlight.
 * </mark>
 */
const APPLY_HIGHLIGHT = (text: string) => `<mark>${text}</mark>`;


export function useSelHighlighterMemo(
  messageId: DMessageId,
  selText: string | null,
  contentFragments: DMessageContentFragment[],
  fromAssistant: boolean,
  onMessageFragmentReplace?: (messageId: DMessageId, fragmentId: DMessageFragmentId, newFragment: DMessageFragment) => void,
): (() => void) | null {
  return React.useMemo(() => {

    // Existence check
    if (!selText || selText.length < BUBBLE_MIN_TEXT_LENGTH || !fromAssistant || !onMessageFragmentReplace)
      return null;

    // Create the highlighter function, if there's 1 and only 1 occurrence of the selection
    const highlightFunction = contentFragments.reduce((acc: false /* not found */ | (() => void) | true /* more than one */, fragment) => {
      if (!acc && isTextPart(fragment.part)) {
        const fragmentText = fragment.part.text;
        let index = fragmentText.indexOf(selText);

        while (index !== -1) {

          // If we've found more than one occurrence, we can stop
          if (acc) return true;

          index = fragmentText.indexOf(selText, index + 1);

          // make the highlighter function
          acc = () => {
            const highlighted = APPLY_HIGHLIGHT(selText);
            const newFragmentText =
              fragmentText.includes(highlighted) ? fragmentText.replace(highlighted, selText) // toggles selection
                : fragmentText.replace(selText, highlighted);
            onMessageFragmentReplace(messageId, fragment.fId, createTextContentFragment(newFragmentText));
          };
        }
      }
      return acc;
    }, false);

    return typeof highlightFunction === 'function' ? highlightFunction : null;
  }, [selText, fromAssistant, onMessageFragmentReplace, contentFragments, messageId]);
}
