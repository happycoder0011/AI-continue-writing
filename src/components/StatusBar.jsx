/**
 * STATUS BAR COMPONENT
 * 
 * This component shows the current state of the editor:
 * - Ready (idle)
 * - Generating (AI is working)
 * - Review (AI content ready)
 * - Error (something went wrong)
 * 
 * It provides visual feedback so users always know what's happening.
 */

import { Flex, Badge, Text } from '@radix-ui/themes';
import { 
  CheckCircledIcon, 
  UpdateIcon, 
  ExclamationTriangleIcon,
  EyeOpenIcon 
} from '@radix-ui/react-icons';

/**
 * StatusBar Component
 * 
 * @param {Object} props
 * @param {Object} props.machineState - The XState machine state
 * @param {string} props.errorMessage - Error message if any
 */
export function StatusBar({ machineState, errorMessage }) {
  /**
   * Determine current status based on state machine
   * 
   * machineState.matches() checks if we're in a specific state
   * This is how we read the state machine from XState
   */
  const getStatusInfo = () => {
    // Check each possible state and return appropriate info
    if (machineState.matches('generating')) {
      return {
        label: 'Generating',
        color: 'yellow',
        icon: <UpdateIcon className="spinning" />,
        description: 'AI is writing...',
      };
    }
    
    if (machineState.matches('review')) {
      return {
        label: 'Review',
        color: 'blue',
        icon: <EyeOpenIcon />,
        description: 'AI content ready - accept or discard',
      };
    }
    
    if (machineState.matches('error')) {
      return {
        label: 'Error',
        color: 'red',
        icon: <ExclamationTriangleIcon />,
        description: errorMessage || 'Something went wrong',
      };
    }
    
    // Default: idle state
    return {
      label: 'Ready',
      color: 'green',
      icon: <CheckCircledIcon />,
      description: 'Ready to write',
    };
  };
  
  const status = getStatusInfo();
  
  return (
    <Flex 
      direction="row" 
      gap="3" 
      align="center"
      style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      {/* 
        STATUS BADGE
        
        Radix Badge component shows status with color coding:
        - green: Ready
        - yellow: Processing
        - blue: Review
        - red: Error
      */}
      <Badge 
        color={status.color} 
        variant="soft"
        size="2"
      >
        <Flex align="center" gap="1">
          {status.icon}
          {status.label}
        </Flex>
      </Badge>
      
      {/* 
        STATUS DESCRIPTION
        
        Provides more context about the current state
      */}
      <Text size="2" color="gray">
        {status.description}
      </Text>
      
      {/* 
        WORD COUNT (Optional Enhancement)
        
        Shows how many words are in the document
      */}
      {machineState.context?.editorState && (
        <Text 
          size="1" 
          color="gray" 
          style={{ marginLeft: 'auto' }}
        >
          {getWordCount(machineState.context.editorState)} words
        </Text>
      )}
    </Flex>
  );
}

/**
 * Helper function to count words in the document
 * 
 * @param {EditorState} editorState - ProseMirror editor state
 * @returns {number} Word count
 */
function getWordCount(editorState) {
  if (!editorState?.doc) return 0;
  
  // Get all text from the document
  const text = editorState.doc.textContent;
  
  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  
  return words.length;
}

/**
 * COMPONENT EXPLANATION:
 * 
 * 1. STATE MACHINE INTEGRATION:
 *    - machineState.matches('stateName') checks current state
 *    - machineState.context accesses stored data
 *    - This creates a reactive UI that updates with state changes
 * 
 * 2. CONDITIONAL RENDERING:
 *    - getStatusInfo() returns different data based on state
 *    - We use this pattern to avoid complex JSX conditionals
 *    - Makes the code more readable and maintainable
 * 
 * 3. VISUAL FEEDBACK:
 *    - Color coding: green=good, yellow=working, red=error, blue=action needed
 *    - Icons provide quick visual recognition
 *    - Text descriptions give detailed context
 * 
 * 4. OPTIONAL FEATURES:
 *    - Word count is an enhancement
 *    - Uses optional chaining (?.) to safely access nested properties
 *    - Only shows if editorState is available
 */
