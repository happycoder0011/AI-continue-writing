/**
 * AI TOOLBAR COMPONENT
 *
 * This component appears when AI has generated content and is waiting
 * for user action. It provides two options:
 * 1. Accept All - Keep the AI-generated content
 * 2. Discard Session - Revert to before AI generation
 *
 * This gives users full control over AI suggestions.
 */

import { Flex, Button, Text, Card } from "@radix-ui/themes";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";

/**
 * AIToolbar Component
 *
 * @param {Object} props
 * @param {Function} props.onAccept - Callback when user accepts AI content
 * @param {Function} props.onDiscard - Callback when user discards session
 */
export function AIToolbar({ onAccept, onDiscard }) {
  return (
    <Card
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "16px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        zIndex: 100,
        minWidth: "400px",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <Flex direction="column" gap="3">
        {/* 
          HEADER
          Explains what the user should do
        */}
        <Flex direction="column" gap="1">
          <Text size="2" weight="bold">
            AI Content Generated
          </Text>
          <Text size="1" color="gray">
            Review the AI-generated text (highlighted in italics) and choose an
            action:
          </Text>
        </Flex>

        {/* 
          ACTION BUTTONS
          
          Two options for handling AI content:
          1. Accept - Keep it (green button)
          2. Discard - Revert everything (red button)
        */}
        <Flex gap="3">
          {/* 
            ACCEPT BUTTON
            Keeps the AI content and makes it permanent
          */}
          <Button
            size="2"
            variant="solid"
            color="green"
            onClick={onAccept}
            style={{ flex: 1 }}
          >
            <CheckIcon />
            Accept
          </Button>

          {/* 
            DISCARD BUTTON
            Reverts the entire document to before AI generation
          */}
          <Button
            size="2"
            variant="soft"
            color="red"
            onClick={onDiscard}
            style={{ flex: 1 }}
          >
            <Cross2Icon />
            Discard
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

/**
 * COMPONENT EXPLANATION:
 *
 * 1. POSITIONING:
 *    - position: fixed - Stays in place even when scrolling
 *    - bottom: 20px - 20px from bottom of screen
 *    - left: 50%, transform: translateX(-50%) - Centers horizontally
 *    - This creates a "floating" toolbar effect
 *
 * 2. RADIX CARD:
 *    - Card component provides elevation and styling
 *    - Built-in padding and border radius
 *    - Accessible container with proper semantics
 *
 * 3. BUTTON VARIANTS:
 *    - solid: Filled background (for primary action)
 *    - soft: Light background (for secondary actions)
 *    - Different colors indicate action severity:
 *      * green: Positive action (accept)
 *      * gray: Neutral action (clear)
 *      * red: Destructive action (discard)
 *
 * 4. USER EXPERIENCE:
 *    - Clear visual hierarchy (title → description → buttons)
 *    - Icons help users quickly identify actions
 *    - Tip provides additional guidance
 *    - Animation makes appearance smooth
 *
 * 5. CALLBACKS:
 *    - onAccept, onClear, onDiscard are functions passed from parent
 *    - When button is clicked, we call the appropriate callback
 *    - Parent component (App) handles the actual logic
 *    - This separation keeps components focused and reusable
 */

/**
 * CSS for slide-up animation
 * Makes the toolbar appear smoothly from bottom
 */
const styles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;

// Inject styles
if (
  typeof document !== "undefined" &&
  !document.getElementById("ai-toolbar-styles")
) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "ai-toolbar-styles";
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
