import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import { editorMachine } from '../editorMachine';

// Mock the AI service
vi.mock('../../services/aiService', () => ({
  generateAIContent: vi.fn()
}));

import { generateAIContent } from '../../services/aiService';

describe('Editor State Machine', () => {
  let actor;

  beforeEach(() => {
    // Create a fresh actor for each test
    actor = createActor(editorMachine);
    actor.start();
    vi.clearAllMocks();
  });

  afterEach(() => {
    actor.stop();
  });

  describe('Initial State', () => {
    it('should start in idle state', () => {
      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should have initial context values', () => {
      const snapshot = actor.getSnapshot();
      expect(snapshot.context).toEqual({
        editorState: null,
        generatedContent: '',
        errorMessage: '',
        cursorPosition: 0,
      });
    });
  });

  describe('CONTINUE_CLICK Event', () => {
    it('should transition from idle to generating', () => {
      // Send the event
      actor.send({ 
        type: 'CONTINUE_CLICK', 
        cursorPosition: 100 
      });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('generating');
      expect(snapshot.context.cursorPosition).toBe(100);
    });

    it('should store cursor position in context', () => {
      actor.send({ 
        type: 'CONTINUE_CLICK', 
        cursorPosition: 250 
      });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.cursorPosition).toBe(250);
    });
  });

  describe('AI Generation Flow', () => {
    it('should transition to review on successful generation', async () => {
      // Mock successful AI response
      generateAIContent.mockResolvedValue('Generated AI content');

      // Start generation
      actor.send({ 
        type: 'CONTINUE_CLICK', 
        cursorPosition: 100 
      });

      // Wait for the async operation to complete
      await new Promise(resolve => {
        const subscription = actor.subscribe(state => {
          if (state.value === 'review') {
            subscription.unsubscribe();
            resolve();
          }
        });
      });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('review');
      expect(snapshot.context.generatedContent).toBe('Generated AI content');
    });

    it('should transition to error on failed generation', async () => {
      // Mock AI service failure
      generateAIContent.mockRejectedValue(new Error('API Error'));

      // Start generation
      actor.send({ 
        type: 'CONTINUE_CLICK', 
        cursorPosition: 100 
      });

      // Wait for error state
      await new Promise(resolve => {
        const subscription = actor.subscribe(state => {
          if (state.value === 'error') {
            subscription.unsubscribe();
            resolve();
          }
        });
      });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('error');
      expect(snapshot.context.errorMessage).toBe('API Error');
    });
  });

  describe('Review State Actions', () => {
    beforeEach(async () => {
      // Set up machine in review state
      generateAIContent.mockResolvedValue('Test content');
      
      actor.send({ 
        type: 'CONTINUE_CLICK', 
        cursorPosition: 100 
      });

      // Wait for review state
      await new Promise(resolve => {
        const subscription = actor.subscribe(state => {
          if (state.value === 'review') {
            subscription.unsubscribe();
            resolve();
          }
        });
      });
    });

    it('should return to idle on USER_ACCEPT', () => {
      actor.send({ type: 'USER_ACCEPT' });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.generatedContent).toBe('');
    });

    it('should return to idle on USER_CLEAR', () => {
      actor.send({ type: 'USER_CLEAR' });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.generatedContent).toBe('');
    });

    it('should return to idle on USER_DISCARD', () => {
      actor.send({ type: 'USER_DISCARD' });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.generatedContent).toBe('');
    });
  });

  describe('Error State', () => {
    beforeEach(async () => {
      // Set up machine in error state
      generateAIContent.mockRejectedValue(new Error('Test error'));
      
      actor.send({ 
        type: 'CONTINUE_CLICK', 
        cursorPosition: 100 
      });

      // Wait for error state
      await new Promise(resolve => {
        const subscription = actor.subscribe(state => {
          if (state.value === 'error') {
            subscription.unsubscribe();
            resolve();
          }
        });
      });
    });

    it('should retry generation on RETRY', () => {
      actor.send({ type: 'RETRY' });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('generating');
    });

    it('should return to idle on DISMISS', () => {
      actor.send({ type: 'DISMISS' });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
    });
  });
});
