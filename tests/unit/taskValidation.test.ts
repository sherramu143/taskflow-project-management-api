import { createTaskSchema, assignTaskSchema } from '../../src/utils/validators';

describe('Unit Test: Task Assignment and Input Validation', () => {
  it('should validate task creation input with Zod', () => {
    const valid = {
      title: 'Valid Task Title',
      status: 'in_progress',
      priority: 'high',
    };

    const parsed = createTaskSchema.parse(valid);
    expect(parsed.title).toBe('Valid Task Title');
    expect(parsed.status).toBe('in_progress');
    expect(parsed.priority).toBe('high');
  });

  it('should fail task creation if title is empty', () => {
    const invalid = {
      title: '',
    };

    const result = createTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should validate assign task payload UUID format', () => {
    const validAssign = { userId: '11111111-1111-1111-1111-111111111111' };
    expect(assignTaskSchema.safeParse(validAssign).success).toBe(true);

    const invalidAssign = { userId: 'not-a-uuid' };
    expect(assignTaskSchema.safeParse(invalidAssign).success).toBe(false);
  });
});
