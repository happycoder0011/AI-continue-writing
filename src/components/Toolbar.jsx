/**
 * TOOLBAR COMPONENT
 * 
 * This component provides the main controls for the editor:
 * - "Continue Writing" button to trigger AI generation
 * - Keyboard shortcut hint
 * - Status indicators
 * 
 * We use Radix UI for accessible, customizable components.
 */

import { Button, Flex, Text, Tooltip } from '@radix-ui/themes';
import { PlusIcon, ReloadIcon } from '@radix-ui/react-icons';

/**
 * Toolbar Component
 * 
 * @param {Object} props
 * @param {Function} props.onContinue - Callback when "Continue Writing" is clicked
 * @param {boolean} props.isProcessing - Whether AI is currently generating
 * @param {boolean} props.hasError - Whether there's an error
 * @param {Function} props.onRetry - Callback to retry after error
 */
export function Toolbar({ onContinue, isProcessing, hasError, onRetry }) {
  /**
   * Detect if user is on Mac (for keyboard shortcut display)
   * navigator.platform tells us the operating system
   */
  const isMac = typeof navigator !== 'undefined' && 
                navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  // Display the appropriate keyboard shortcut
  const shortcutText = isMac ? '⌘+K' : 'Ctrl+K';
  
  return (
    <Flex 
      direction="row" 
      gap="3" 
      align="center"
      className="toolbar"
      style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      {/* 
        CONTINUE WRITING BUTTON
        
        Radix Button component provides:
        - Accessible button with proper ARIA attributes
        - Built-in disabled state handling
        - Customizable variants (solid, soft, outline, ghost)
      */}
      {!hasError ? (
        <Tooltip content={`Click or press ${shortcutText}`}>
          <Button
            size="2"
            variant="solid"
            onClick={() => onContinue(0)}
            disabled={isProcessing}
            style={{ cursor: isProcessing ? 'not-allowed' : 'pointer' }}
          >
            {/* Show different content based on state */}
            {isProcessing ? (
              <>
                {/* Spinning icon during generation */}
                <ReloadIcon className="spinning" />
                Generating...
              </>
            ) : (
              <>
                {/* Plus icon when ready */}
                <PlusIcon />
                Continue Writing
              </>
            )}
          </Button>
        </Tooltip>
      ) : (
        /* RETRY BUTTON - shown when there's an error */
        <Button
          size="2"
          variant="solid"
          color="red"
          onClick={() => onRetry()}
        >
          <ReloadIcon />
          Retry
        </Button>
      )}
      
      {/* 
        KEYBOARD SHORTCUT HINT
        
        Shows users they can use keyboard shortcut instead of clicking
      */}
      <Flex 
        align="center" 
        gap="1"
        style={{
          padding: '4px 8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
        }}
      >
        <Text size="1" color="gray">
          Shortcut:
        </Text>
        <Text size="1" weight="bold" style={{ fontFamily: 'monospace' }}>
          {shortcutText}
        </Text>
      </Flex>
      
      {/* 
        HELP TEXT
        
        Provides context about what the button does
      */}
      <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>
        {isProcessing 
          ? 'AI is writing...' 
          : 'Click to continue your text with AI'}
      </Text>
    </Flex>
  );
}

/**
 * COMPONENT EXPLANATION:
 * 
 * 1. RADIX UI COMPONENTS:
 *    - Button: Accessible button with variants
 *    - Flex: Flexbox layout container
 *    - Text: Typography component with size/weight/color props
 *    - Tooltip: Shows hint on hover
 * 
 * 2. CONDITIONAL RENDERING:
 *    - {condition ? <A /> : <B />} - Show A if true, B if false
 *    - {condition && <A />} - Show A only if condition is true
 * 
 * 3. PROPS:
 *    - Props are like function parameters for components
 *    - Parent component passes data and callbacks via props
 *    - This component is "controlled" - parent manages its state
 * 
 * 4. ACCESSIBILITY:
 *    - Radix components have built-in ARIA attributes
 *    - Keyboard navigation works automatically
 *    - Screen readers can understand the UI
 */

/**
 * CSS for spinning icon animation
 * Add this to your global CSS or component styles
 */
const styles = `
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Inject styles (in a real app, use a proper CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
