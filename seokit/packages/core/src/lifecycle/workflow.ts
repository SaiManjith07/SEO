import { LifecycleState } from './types';
import { QueueItem } from './queue';

export class WorkflowManager {
  
  public transition(item: QueueItem, nextState: LifecycleState): QueueItem {
    const validTransitions: Record<LifecycleState, LifecycleState[]> = {
      'DETECTED': ['QUEUED'],
      'QUEUED': ['DRAFTING'],
      'DRAFTING': ['REVIEW'],
      'REVIEW': ['APPROVED', 'DRAFTING'], // can go back to drafting if rejected
      'APPROVED': ['PUBLISHED'],
      'PUBLISHED': ['MEASURING'],
      'MEASURING': ['EVALUATED'],
      'EVALUATED': []
    };

    const allowed = validTransitions[item.state];
    if (!allowed || !allowed.includes(nextState)) {
      throw new Error(`Invalid transition from ${item.state} to ${nextState}`);
    }

    return {
      ...item,
      state: nextState
    };
  }
}
